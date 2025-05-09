import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const interviewRouter = createTRPCRouter({
  // Procedure to submit an answer to a question
  submitAnswer: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        projectId: z.string(),
        questionId: z.string(),
        questionText: z.string(),
        answerA: z.string(),
        answerB: z.string(),
        preferredAnswer: z.enum(["A", "B"]),
        transcript: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("Submit answer inputs:", {
        projectId: input.projectId,
        questionId: input.questionId,
        sessionId: input.sessionId,
      });

      // First, verify if the projectId exists
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { id: true },
      });

      if (!project) {
        throw new Error(`Project with ID ${input.projectId} not found`);
      }

      // Check if we have any question pairs at all in this project
      const questionCount = await ctx.db.questionPair.count({
        where: { projectId: input.projectId },
      });

      console.log(
        `Found ${questionCount} questions in project ${input.projectId}`,
      );

      // Find the question using the primary key ID, not the questionId field
      const questionPair = await ctx.db.questionPair.findUnique({
        where: {
          id: input.questionId,
        },
      });

      // If not found, get some details about the question we're looking for
      if (!questionPair) {
        // Log some helpful debugging info
        console.log(
          `Question lookup failed. Looking for ID: ${input.questionId}`,
        );

        // For debugging, look at some sample questions from this project
        const sampleQuestions = await ctx.db.questionPair.findMany({
          where: { projectId: input.projectId },
          take: 3,
          select: { id: true, questionId: true },
        });

        console.log("Sample questions in this project:", sampleQuestions);

        throw new Error(`Question with ID ${input.questionId} not found`);
      }

      // Create the step record
      const stepRecord = await ctx.db.stepRecord.create({
        data: {
          projectId: input.projectId,
          sessionId: input.sessionId,
          questionPairId: questionPair.id,
          preferredAnswer: input.preferredAnswer,
          transcript: input.transcript,
        },
      });

      return { success: true, stepRecord };
    }),

  // Procedure to send a message to the AI interviewer and get a response
  sendMessage: publicProcedure
    .input(
      z.object({
        question: z.string(),
        answerA: z.string(),
        answerB: z.string(),
        selectedAnswer: z.enum(["A", "B"]).nullable(),
        userMessage: z.string(),
        previousMessages: z.array(
          z.object({
            role: z.enum(["system", "user"]),
            content: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      // For now, we'll mock the AI response
      // In a real implementation, you would call an LLM API here

      // Generate a simple AI response based on the user's message and context
      let aiResponse = "";

      // Basic response logic
      if (
        input.userMessage.toLowerCase().includes("why") ||
        input.userMessage.toLowerCase().includes("reason")
      ) {
        aiResponse =
          "That's an excellent question about the reasoning. Could you elaborate on what specific aspects of the answer you found more convincing or accurate?";
      } else if (
        input.userMessage.toLowerCase().includes("better") ||
        input.userMessage.toLowerCase().includes("prefer")
      ) {
        aiResponse =
          "I see you have a preference. What specific elements of the answer made it stand out to you as an expert in this field?";
      } else if (
        input.userMessage.toLowerCase().includes("incorrect") ||
        input.userMessage.toLowerCase().includes("wrong")
      ) {
        aiResponse =
          "You've identified some inaccuracies. Could you point out exactly what's incorrect and how it should be corrected?";
      } else if (
        input.userMessage.toLowerCase().includes("thank") ||
        input.userMessage.toLowerCase().includes("done")
      ) {
        aiResponse =
          "Thank you for your insights! Your expertise is invaluable for improving these responses. Is there anything else you'd like to add before we move on?";
      } else {
        // Default response
        aiResponse =
          "Thank you for sharing your perspective. As an expert, what criteria are you using to evaluate these answers?";
      }

      // Add personalization if they've selected an answer
      if (input.selectedAnswer) {
        aiResponse += ` I notice you've selected Answer ${input.selectedAnswer}. What specific aspects of it did you find most compelling?`;
      }

      return { response: aiResponse };
    }),

  // Procedure to mark a session as completed and initiate analysis
  completeSession: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the project exists
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { id: true },
      });

      if (!project) {
        throw new Error(`Project with ID ${input.projectId} not found`);
      }

      // Update the session status to completed
      const updatedSession = await ctx.db.interviewSession.update({
        where: { id: input.sessionId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Update the interview link status to COMPLETED
      await ctx.db.interviewLink.updateMany({
        where: {
          sessions: {
            some: {
              id: input.sessionId,
            },
          },
        },
        data: {
          status: "COMPLETED",
        },
      });

      // Trigger analysis job by making a non-blocking request to the analysis server
      try {
        const analysisServerUrl =
          process.env.ANALYSIS_SERVER_URL ?? "http://localhost:3001";

        // Fire and forget - we don't need to wait for the response
        void fetch(`${analysisServerUrl}/analyze/${input.sessionId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }).catch((error) => {
          // Just log the error but don't fail the response to the client
          console.error("Error triggering analysis server:", error);
        });

        console.log(`Analysis job triggered for session ${input.sessionId}`);
      } catch (error) {
        // Just log the error but don't fail the response to the client
        console.error("Error triggering analysis:", error);
      }

      return {
        success: true,
        session: updatedSession,
        message: "Session completed and analysis queued",
      };
    }),
});
