// Export service for generating CSV files from project data

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface ExportRow {
  // Session information
  SessionID: string;
  IntervieweeName: string;
  StartTime: string;
  CompletionTime: string | null;
  Status: string;
  Processed: boolean;

  // Question information
  QuestionID: string;
  QuestionText: string;
  AnswerA: string;
  AnswerB: string;
  PreferredAnswer: string | null;

  // Analysis information
  WinnerFlag: string | null;
  SeverityScore: number | null;
  RationaleDigest: string | null;
  KnowledgeGaps: string | null;
  PromptSuggestions: string | null;

  // Summary information
  SessionSummaryInsights: string | null;
  SessionSummaryFeedback: string | null;
}

export async function generateProjectExport(
  projectId: string,
): Promise<string> {
  // 1. Get all interview sessions for the project
  const interviewSessions = await prisma.interviewSession.findMany({
    where: {
      interviewLink: {
        projectId,
      },
    },
    include: {
      interviewLink: true,
      stepRecords: {
        include: {
          questionPair: true,
        },
      },
      analysisArtifacts: true,
      sessionSummary: true,
    },
  });

  // 2. Transform data into export rows
  const exportRows: ExportRow[] = [];

  for (const session of interviewSessions) {
    // Get session summary fields
    const summaryInsights = session.sessionSummary?.aggregatedInsights
      ? JSON.stringify(session.sessionSummary.aggregatedInsights)
      : null;

    const summaryFeedback = session.sessionSummary?.overallFeedback ?? null;

    // Process each step record (question response) in the session
    for (const stepRecord of session.stepRecords) {
      // Find the corresponding analysis artifact for this question
      const artifact = session.analysisArtifacts.find(
        (a) => a.questionPairId === stepRecord.questionPairId,
      );

      // Format knowledge gaps and prompt suggestions as strings
      const knowledgeGaps = artifact?.knowledgeGaps
        ? JSON.stringify(artifact.knowledgeGaps)
        : null;

      const promptSuggestions = artifact?.promptSuggestions
        ? JSON.stringify(artifact.promptSuggestions)
        : null;

      // Create the export row
      exportRows.push({
        // Session information
        SessionID: session.id,
        IntervieweeName: session.interviewLink.interviewName,
        StartTime: session.startedAt.toISOString(),
        CompletionTime: session.completedAt?.toISOString() ?? null,
        Status: session.status,
        Processed: session.processed,

        // Question information
        QuestionID: stepRecord.questionPair.questionId,
        QuestionText: stepRecord.questionPair.questionText,
        AnswerA: stepRecord.questionPair.answerA,
        AnswerB: stepRecord.questionPair.answerB,
        PreferredAnswer: stepRecord.preferredAnswer,

        // Analysis information
        WinnerFlag: artifact?.winnerFlag ?? null,
        SeverityScore: artifact?.severityScore ?? null,
        RationaleDigest: artifact?.rationaleDigest ?? null,
        KnowledgeGaps: knowledgeGaps,
        PromptSuggestions: promptSuggestions,

        // Summary information
        SessionSummaryInsights: summaryInsights,
        SessionSummaryFeedback: summaryFeedback,
      });
    }
  }

  // 3. Generate CSV content
  const headers = Object.keys(exportRows[0] ?? {});
  const csvRows = [
    headers.join(","), // Header row
    ...exportRows.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof ExportRow];

          // Handle null values and escape commas and quotes
          if (value === null) return "";
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(","),
    ),
  ];

  return csvRows.join("\n");
}
