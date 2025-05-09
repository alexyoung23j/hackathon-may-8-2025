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
      // First, we need to get the questionPairId using the questionId
      const questionPair = await ctx.db.questionPair.findFirst({
        where: {
          projectId: input.projectId,
          questionId: input.questionId,
        },
      });

      if (!questionPair) {
        throw new Error(`Question with ID ${input.questionId} not found`);
      }

      // Create the step record with the correct fields according to the schema
      const stepRecord = await ctx.db.stepRecord.create({
        data: {
          projectId: input.projectId,
          sessionId: input.sessionId,
          questionPairId: questionPair.id,
          preferredAnswer: input.preferredAnswer,
          transcript: input.transcript, // This will be automatically converted to JSON
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
});
