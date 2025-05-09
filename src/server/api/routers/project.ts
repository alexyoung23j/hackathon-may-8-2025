import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateProjectExport } from "~/server/services/export";

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
        include: {
          csvFiles: {
            where: { isActive: true },
            orderBy: { uploadedAt: "desc" },
            take: 1,
          },
        },
      });
    }),

  getQuestionPairsByCSVFile: publicProcedure
    .input(z.object({ csvFileId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.questionPair.findMany({
        where: { csvFileId: input.csvFileId },
        orderBy: { order: "asc" },
      });
    }),

  uploadCsv: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        csvContent: z.string(),
        filename: z.string().optional().default("uploaded.csv"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, csvContent, filename } = input;

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

      try {
        // Mark any existing CSV files as inactive
        await ctx.db.cSVFile.updateMany({
          where: { projectId, isActive: true },
          data: { isActive: false },
        });

        // Create a new CSV file record
        const csvFile = await ctx.db.cSVFile.create({
          data: {
            filename,
            projectId,
            rowCount: dataRows.length,
            isActive: true,
          },
        });

        // Delete existing question pairs for this project
        await ctx.db.questionPair.deleteMany({
          where: { projectId },
        });

        // Create new question pairs linked to the CSV file
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
              csvFileId: csvFile.id, // Link to the CSV file
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
          csvFile, // Return the CSV file info
        };
      } catch (error) {
        console.error("CSV upload error:", error);

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

  exportProjectData: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { projectId } = input;

        // Verify the project exists
        const project = await ctx.db.project.findUnique({
          where: { id: projectId },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        // Generate the CSV data
        const csvData = await generateProjectExport(projectId);

        return {
          success: true,
          csvData,
          filename: `${project.name.replace(/\s+/g, "_")}_export_${new Date().toISOString().split("T")[0]}.csv`,
        };
      } catch (error) {
        console.error("Export error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export project data",
        });
      }
    }),

  getProjectStats: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;

      try {
        // Get the project to verify it exists
        const project = await ctx.db.project.findUnique({
          where: { id: projectId },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        // Get total interview links created
        const totalLinksCount = await ctx.db.interviewLink.count({
          where: { projectId },
        });

        // Get interview session statistics
        const interviewSessions = await ctx.db.interviewSession.findMany({
          where: {
            interviewLink: {
              projectId,
            },
          },
          include: {
            analysisArtifacts: true,
          },
        });

        // Calculate various metrics
        const totalSessionsCount = interviewSessions.length;
        const completedSessionsCount = interviewSessions.filter(
          (session) =>
            session.status === "COMPLETED" || session.completedAt !== null,
        ).length;
        const inProgressSessionsCount = interviewSessions.filter(
          (session) =>
            session.status === "in-progress" && session.completedAt === null,
        ).length;
        const processedSessionsCount = interviewSessions.filter(
          (session) => session.processed,
        ).length;

        // Calculate average severity score across all analyzed questions
        const allArtifacts = interviewSessions.flatMap(
          (session) => session.analysisArtifacts,
        );
        const artifactsWithScore = allArtifacts.filter(
          (artifact) => artifact.severityScore !== null,
        );
        const averageSeverityScore =
          artifactsWithScore.length > 0
            ? artifactsWithScore.reduce(
                (sum, artifact) => sum + (artifact.severityScore ?? 0),
                0,
              ) / artifactsWithScore.length
            : 0;

        // Get total questions evaluated
        const totalQuestionsEvaluated = allArtifacts.length;

        // Get distinct question IDs that have been evaluated
        const distinctQuestionIds = new Set(
          allArtifacts.map((a) => a.questionPairId),
        );
        const uniqueQuestionsEvaluated = distinctQuestionIds.size;

        // Find top performing model (Answer A or B)
        const winnerDistribution = {
          A: allArtifacts.filter((a) => a.winnerFlag === "A").length,
          B: allArtifacts.filter((a) => a.winnerFlag === "B").length,
          tie: allArtifacts.filter(
            (a) => a.winnerFlag === null || a.winnerFlag === "tie",
          ).length,
        };

        return {
          totalLinksCount,
          totalSessionsCount,
          completedSessionsCount,
          inProgressSessionsCount,
          processedSessionsCount,
          totalQuestionsEvaluated,
          uniqueQuestionsEvaluated,
          averageSeverityScore,
          winnerDistribution,
          // Add completion rate
          completionRate:
            totalSessionsCount > 0
              ? (completedSessionsCount / totalSessionsCount) * 100
              : 0,
          // Last session completed
          lastSessionDate:
            interviewSessions.length > 0
              ? interviewSessions.sort(
                  (a, b) =>
                    (b.completedAt?.getTime() ?? 0) -
                    (a.completedAt?.getTime() ?? 0),
                )[0]?.completedAt
              : null,
        };
      } catch (error) {
        console.error("Error fetching project stats:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve project statistics",
        });
      }
    }),
});
