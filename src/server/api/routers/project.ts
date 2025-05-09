import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Type-safe keys for column map
type ColumnKey = "questionid" | "questiontext" | "answera" | "answerb";

export const projectRouter = createTRPCRouter({
  createProject: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({
        data: {
          name: input.name,
          status: "ACTIVE",
        },
      });
    }),

  getProjects: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  getProjectById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findUnique({
        where: { id: input.id },
      });
    }),

  uploadCsv: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        csvContent: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, csvContent } = input;

      // Parse CSV content with a more robust approach that handles quoted fields
      const parseCSV = (csvText: string) => {
        const rows: string[][] = [];
        const lines = csvText.trim().split("\n");

        for (const line of lines) {
          const row: string[] = [];
          let inQuotes = false;
          let currentValue = "";
          let charIndex = 0;

          // Using a more controlled loop to handle characters one by one
          while (charIndex < line.length) {
            const char = line[charIndex];

            if (char === '"') {
              // Toggle quote state
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              // End of field
              row.push(currentValue.trim());
              currentValue = "";
            } else {
              // Add character to current field
              currentValue += char;
            }

            charIndex++;
          }

          // Push the last field
          row.push(currentValue.trim());
          rows.push(row);
        }

        return rows;
      };

      const rows = parseCSV(csvContent);

      if (rows.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "CSV file must contain a header row and at least one data row",
        });
      }

      // Validate header row
      const headerRow = rows[0]!; // Non-null assertion since we checked rows.length above
      const requiredColumns = [
        "questionId",
        "questionText",
        "answerA",
        "answerB",
      ];

      // Create a map of column names to their indices
      const columnMap: Record<string, number> = {};

      for (const [index, columnName] of headerRow.entries()) {
        if (columnName) {
          columnMap[columnName.toLowerCase()] = index;
        }
      }

      // Check if all required columns exist
      const missingColumns = requiredColumns.filter(
        (col) => columnMap[col.toLowerCase()] === undefined,
      );

      if (missingColumns.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Missing required columns: ${missingColumns.join(", ")}`,
        });
      }

      // Process data rows and create QuestionPair records
      const dataRows = rows.slice(1);

      console.log(projectId, dataRows);

      try {
        // First, delete existing question pairs outside of transaction
        await ctx.db.questionPair.deleteMany({
          where: { projectId },
        });

        // Then create new question pairs one by one
        const questionPairs = [];

        for (const [index, row] of dataRows.entries()) {
          // Safely access column indices with fallbacks to empty strings
          const questionidKey = "questionid";
          const questiontextKey = "questiontext";
          const answeraKey = "answera";
          const answerbKey = "answerb";

          const qIdIndex = columnMap[questionidKey] ?? 0;
          const qTextIndex = columnMap[questiontextKey] ?? 1;
          const ansAIndex = columnMap[answeraKey] ?? 2;
          const ansBIndex = columnMap[answerbKey] ?? 3;

          const questionId = row[qIdIndex] ?? "";
          const questionText = row[qTextIndex] ?? "";
          const answerA = row[ansAIndex] ?? "";
          const answerB = row[ansBIndex] ?? "";

          if (!questionId || !questionText || !answerA || !answerB) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Missing data in CSV row",
            });
          }

          const newPair = await ctx.db.questionPair.create({
            data: {
              projectId,
              questionId,
              questionText,
              answerA,
              answerB,
              order: index,
              metadata: {},
            },
          });

          questionPairs.push(newPair);
        }

        return {
          success: true,
          recordsCreated: questionPairs.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `CSV upload failed: ${error.message}`,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "CSV upload failed with unknown error",
        });
      }
    }),
});
