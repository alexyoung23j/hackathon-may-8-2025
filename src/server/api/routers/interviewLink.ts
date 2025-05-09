import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const interviewLinkRouter = createTRPCRouter({
  createInterviewLink: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1),
        interviewName: z.string().min(1),
        expiryDate: z.date().optional(),
        rowQuota: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if project exists
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Generate a unique URL for the interview link
      const uniqueId = Math.random().toString(36).substring(2, 12);
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const url = `${baseUrl}/interview/${uniqueId}`;

      // Directly create the interview link with all fields
      const interviewLink = await ctx.db.interviewLink.create({
        data: {
          id: uniqueId,
          name: input.name,
          interviewName: input.interviewName,
          url,
          expiryDate: input.expiryDate,
          rowQuota: input.rowQuota ?? 10,
          status: "unused",
          project: {
            connect: {
              id: input.projectId,
            },
          },
        },
      });

      return interviewLink;
    }),

  getInterviewLinksByProjectId: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const interviewLinks = await ctx.db.interviewLink.findMany({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return interviewLinks;
    }),

  getInterviewLinkByUrl: publicProcedure
    .input(
      z.object({
        linkId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const interviewLink = await ctx.db.interviewLink.findUnique({
        where: {
          id: input.linkId,
        },
        include: {
          project: true,
        },
      });

      if (!interviewLink) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Interview link not found",
        });
      }

      // Type assertion to ensure TS recognizes the correct schema
      type InterviewLinkWithExpiryDate = typeof interviewLink & {
        expiryDate?: Date | null;
      };
      const typedInterviewLink = interviewLink as InterviewLinkWithExpiryDate;

      // Check if the link has expired
      if (
        typedInterviewLink.expiryDate &&
        new Date(typedInterviewLink.expiryDate) < new Date()
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This interview link has expired",
        });
      }

      return interviewLink;
    }),
});
