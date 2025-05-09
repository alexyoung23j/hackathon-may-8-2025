import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const sessionRouter = createTRPCRouter({
  getSessionsByLinkId: publicProcedure
    .input(
      z.object({
        linkId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.interviewSession.findMany({
        where: {
          interviewLinkId: input.linkId,
        },
        orderBy: {
          startedAt: "desc",
        },
      });

      return sessions;
    }),

  getFirstSessionByLinkId: publicProcedure
    .input(
      z.object({
        linkId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.interviewSession.findFirst({
        where: {
          interviewLinkId: input.linkId,
          status: "COMPLETED",
        },
        orderBy: {
          completedAt: "desc",
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No completed sessions found for this interview link",
        });
      }

      return session;
    }),

  getSessionDetail: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get the session
      const session = await ctx.db.interviewSession.findUnique({
        where: {
          id: input.sessionId,
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      // Get the session summary if it exists
      const sessionSummary = await ctx.db.sessionSummary.findUnique({
        where: {
          sessionId: input.sessionId,
        },
      });

      // Get all step records for this session with their question pairs and analysis artifacts
      const stepRecords = await ctx.db.stepRecord.findMany({
        where: {
          sessionId: input.sessionId,
        },
        include: {
          questionPair: true,
        },
        orderBy: {
          questionPair: {
            order: "asc",
          },
        },
      });

      // Get all analysis artifacts for this session
      const analysisArtifacts = await ctx.db.analysisArtifact.findMany({
        where: {
          sessionId: input.sessionId,
        },
      });

      // Match analysis artifacts to step records
      const stepRecordsWithArtifacts = stepRecords.map((record) => {
        const artifact = analysisArtifacts.find(
          (a) => a.questionPairId === record.questionPairId,
        );
        return {
          ...record,
          analysisArtifact: artifact ?? null,
        };
      });

      // Format and parse the summary if it exists
      let formattedSummary = null;
      if (sessionSummary) {
        formattedSummary = {
          ...sessionSummary,
          aggregatedInsights: sessionSummary.aggregatedInsights as {
            questionCount: number;
            averageSeverityScore: number;
            topKnowledgeGaps: { gap: string; count: number }[];
            topPromptSuggestions: { suggestion: string; count: number }[];
          },
        };
      }

      return {
        session,
        summary: formattedSummary,
        stepRecords: stepRecordsWithArtifacts,
      };
    }),
});
