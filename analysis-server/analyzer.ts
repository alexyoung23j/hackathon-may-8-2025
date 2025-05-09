// Load environment variables first
import { config } from "dotenv";
config();

import { Pool } from "pg";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  MessageContentComplex,
  MessageContentText,
} from "@langchain/core/messages";
import { randomUUID } from "crypto";

// Define types
type Message = {
  role: string;
  content: string;
};

type StepRecord = {
  step_record_id: string;
  preferredAnswer: string | null;
  transcript: string | Message[];
  question_pair_id: string;
  questionText: string;
  answerA: string;
  answerB: string;
};

type AnalysisResult = {
  winnerFlag: string;
  severityScore: number;
  rationaleDigest: string;
  knowledgeGaps: string[];
  promptSuggestions: string[];
};

// Main analysis function - processes a single session by ID
export async function analyzeSession(
  pool: Pool,
  sessionId: string,
): Promise<void> {
  // Initialize client as null
  let client = null;

  try {
    // Get a client from the pool and store it
    client = await pool.connect();

    // Start a transaction
    await client.query("BEGIN");

    // Get all step records for this session
    const stepRecordsResult = await client.query(
      `
      SELECT 
        sr.id as step_record_id,
        sr."preferredAnswer",
        sr.transcript,
        qp.id as question_pair_id,
        qp."questionText",
        qp."answerA",
        qp."answerB"
      FROM "StepRecord" sr
      JOIN "QuestionPair" qp ON sr."questionPairId" = qp.id
      WHERE sr."sessionId" = $1
    `,
      [sessionId],
    );

    const stepRecords = stepRecordsResult.rows as StepRecord[];

    if (stepRecords.length === 0) {
      console.log(`No step records found for session ${sessionId}`);
      await client.query("COMMIT");
      return;
    }

    // Process each step record and create analysis artifacts
    const analysisResults: AnalysisResult[] = [];
    for (const record of stepRecords) {
      console.log("Analyzing step record:", record);

      const analysis = await analyzeStepRecord(record);

      console.log("Analysis:", analysis);

      // Generate a UUID for the AnalysisArtifact
      const artifactId = randomUUID();

      // Insert analysis artifact
      await client.query(
        `
        INSERT INTO "AnalysisArtifact" (
          "id",
          "winnerFlag", 
          "severityScore", 
          "rationaleDigest", 
          "knowledgeGaps", 
          "promptSuggestions", 
          "sessionId", 
          "questionPairId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          artifactId,
          analysis.winnerFlag,
          analysis.severityScore,
          analysis.rationaleDigest,
          JSON.stringify(analysis.knowledgeGaps),
          JSON.stringify(analysis.promptSuggestions),
          sessionId,
          record.question_pair_id,
        ],
      );

      analysisResults.push(analysis);
    }

    // Generate a UUID for the SessionSummary
    const summaryId = randomUUID();

    // Create session summary
    const summary = await generateSessionSummary(analysisResults);

    await client.query(
      `
      INSERT INTO "SessionSummary" (
        "id",
        "aggregatedInsights",
        "overallFeedback",
        "sessionId"
      ) VALUES ($1, $2, $3, $4)
      `,
      [
        summaryId,
        JSON.stringify(summary.aggregatedInsights),
        summary.overallFeedback,
        sessionId,
      ],
    );

    // Mark session as processed
    await client.query(
      `
      UPDATE "InterviewSession" 
      SET processed = true
      WHERE id = $1
      `,
      [sessionId],
    );

    // Commit transaction
    await client.query("COMMIT");
  } catch (error) {
    console.error(`Error processing session ${sessionId}:`, error);

    // Attempt to rollback if we have a client and haven't released it
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }

    throw error;
  } finally {
    // Make sure to release the client back to the pool
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error("Error releasing client:", releaseError);
      }
    }
  }
}

// Analyze a single step record using LangChain.js
async function analyzeStepRecord(record: StepRecord): Promise<AnalysisResult> {
  // Extract data from record
  const { preferredAnswer, transcript, questionText, answerA, answerB } =
    record;

  // Parse the transcript JSON if it's a string
  let messages: Message[] = [];
  if (typeof transcript === "string") {
    try {
      // Try to parse as JSON first
      messages = JSON.parse(transcript) as Message[];
    } catch (e) {
      // If it's not JSON, it might be a plaintext transcript
      console.log("Transcript is not valid JSON, treating as plaintext");
      // Split by newlines and create message objects
      const lines = transcript.split("\n");
      messages = lines.map((line) => {
        const parts = line.split(": ");
        if (parts.length >= 2) {
          return {
            role: parts[0].trim(),
            content: parts.slice(1).join(": ").trim(),
          };
        }
        return { role: "system", content: line.trim() };
      });
    }
  } else {
    messages = transcript;
  }

  // Create a conversation string from the transcript
  const conversationText = messages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  console.log("Using LangChain with GPT-4 for structured analysis");

  try {
    // Define the output schema using Zod
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        WINNER_FLAG: z.enum(["A", "B", "TIED"]),
        SEVERITY_SCORE: z.number().min(0).max(1),
        RATIONALE_DIGEST: z.string(),
        KNOWLEDGE_GAPS: z.array(z.string()),
        PROMPT_SUGGESTIONS: z.array(z.string()),
      }),
    );

    const formatInstructions = parser.getFormatInstructions();

    // Build our prompt manually instead of using the PromptTemplate
    const promptContent = `
You are an expert AI system analysis tool that evaluates interview responses.

Analyze this expert interview transcript where an expert evaluates two answers to a technical question.

QUESTION: ${questionText}

ANSWER A: ${answerA}

ANSWER B: ${answerB}

EXPERT'S CHOICE: ${preferredAnswer ?? "None selected yet"}

INTERVIEW TRANSCRIPT:
${conversationText}

Analyze this expert feedback and determine:

1. WINNER_FLAG: Simply output the expert's selection (A or B) based on their explicit choice.

2. SEVERITY_SCORE: On a scale from 0.0 to 1.0, how much better is the chosen answer? 
   - 0.0 means both answers are equally valid
   - 1.0 means the chosen answer is significantly better and the other answer contains critical errors

3. RATIONALE_DIGEST: Summarize the expert's reasoning for their preference in 1-2 sentences.

4. KNOWLEDGE_GAPS: Identify 2-3 specific knowledge areas where improvement would lead to better answers.

5. PROMPT_SUGGESTIONS: Instead of specific facts, provide 2-3 general principles or approaches for improving prompts related to this type of question. Focus on structural or methodological improvements rather than adding specific domain knowledge.

${formatInstructions}
`;

    // Initialize the model
    const model = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0,
    });

    // Call the model directly with the prompt as a system message
    const response = await model.invoke([
      { role: "system", content: promptContent },
    ]);

    // Get the content as a string, handling different content types
    let responseText: string;
    const content = response.content;

    if (typeof content === "string") {
      responseText = content;
    } else if (Array.isArray(content)) {
      // Handle array of content parts
      responseText = content
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && "text" in part)
            return (part as { text: string }).text;
          return JSON.stringify(part);
        })
        .join("");
    } else if (content && typeof content === "object") {
      // Handle object type content
      responseText = JSON.stringify(content);
    } else {
      // Fallback
      responseText = String(content || "");
    }

    // Parse the response
    const parsed = await parser.parse(responseText);

    return {
      winnerFlag: parsed.WINNER_FLAG,
      severityScore: parsed.SEVERITY_SCORE,
      rationaleDigest: parsed.RATIONALE_DIGEST,
      knowledgeGaps: parsed.KNOWLEDGE_GAPS,
      promptSuggestions: parsed.PROMPT_SUGGESTIONS,
    };
  } catch (error) {
    console.error("Error analyzing step record:", error);
    // Return default values on error
    return {
      winnerFlag: preferredAnswer ?? "TIED",
      severityScore: 0.5,
      rationaleDigest: "Analysis failed due to an error.",
      knowledgeGaps: ["Analysis error"],
      promptSuggestions: ["Retry analysis"],
    };
  }
}

// Generate a session-level summary using LLM
async function generateSessionSummary(
  analysisResults: AnalysisResult[],
): Promise<{
  aggregatedInsights: {
    questionCount: number;
    averageSeverityScore: number;
    topKnowledgeGaps: { gap: string; count: number }[];
    topPromptSuggestions: { suggestion: string; count: number }[];
  };
  overallFeedback: string;
}> {
  try {
    // Calculate basic statistics without LLM
    const questionCount = analysisResults.length;
    const averageSeverityScore =
      analysisResults.reduce((sum, result) => sum + result.severityScore, 0) /
      analysisResults.length;

    // Collect all knowledge gaps and prompt suggestions
    const allKnowledgeGaps = analysisResults.flatMap((r) => r.knowledgeGaps);
    const allPromptSuggestions = analysisResults.flatMap(
      (r) => r.promptSuggestions,
    );

    // If there are no results, return default values
    if (analysisResults.length === 0) {
      return {
        aggregatedInsights: {
          questionCount: 0,
          averageSeverityScore: 0,
          topKnowledgeGaps: [],
          topPromptSuggestions: [],
        },
        overallFeedback: "No analysis results available.",
      };
    }

    // Use LLM to generate insights across all questions
    try {
      // Initialize the model
      const model = new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0,
      });

      // Create a parser for structured output
      const parser = StructuredOutputParser.fromZodSchema(
        z.object({
          TOP_KNOWLEDGE_GAPS: z
            .array(z.string())
            .describe(
              "The top 3-5 knowledge gaps identified across all questions",
            ),
          CROSS_QUESTION_PROMPT_SUGGESTIONS: z
            .array(z.string())
            .describe(
              "General prompt improvement suggestions that apply across all questions",
            ),
          SUMMARY: z
            .string()
            .describe("A brief overall assessment of the interview session"),
        }),
      );

      const formatInstructions = parser.getFormatInstructions();

      // Prepare input data for the model
      const analysisInput = analysisResults
        .map((result, index) => {
          return `
Question ${index + 1}:
Winner: ${result.winnerFlag}
Severity: ${result.severityScore}
Rationale: ${result.rationaleDigest}
Knowledge Gaps: ${result.knowledgeGaps.join(", ")}
Prompt Suggestions: ${result.promptSuggestions.join(", ")}
`;
        })
        .join("\n");

      // Build prompt for cross-question analysis
      const promptContent = `
You are an AI analysis tool that evaluates patterns across multiple interview questions.

Review the following analysis results from ${analysisResults.length} questions in an expert interview session:

${analysisInput}

Based on these analyses, identify:

1. TOP_KNOWLEDGE_GAPS: Identify 3-5 key knowledge areas that appear as gaps across multiple questions or represent the most critical gaps.

2. CROSS_QUESTION_PROMPT_SUGGESTIONS: Create 3-5 general prompt improvement suggestions that would apply across all questions, not just individual ones. Focus on structural improvements, methodological approaches, or general principles rather than specific facts.

3. SUMMARY: Provide a brief overall assessment of this interview session (2-3 sentences).

${formatInstructions}
`;

      console.log("Summary analysis prompt:", promptContent);

      // Call the model
      const response = await model.invoke([
        { role: "system", content: promptContent },
      ]);

      console.log("Summary analysis raw response:", response.content);

      // Parse the response
      let responseText: string;
      const content = response.content;

      if (typeof content === "string") {
        responseText = content;
      } else if (Array.isArray(content)) {
        responseText = content
          .map((part) => {
            if (typeof part === "string") return part;
            if (part && typeof part === "object" && "text" in part)
              return (part as { text: string }).text;
            return JSON.stringify(part);
          })
          .join("");
      } else if (content && typeof content === "object") {
        responseText = JSON.stringify(content);
      } else {
        responseText = String(content || "");
      }

      const parsed = await parser.parse(responseText);

      console.log("Summary analysis parsed output:", parsed);

      // Count frequencies of knowledge gaps for statistical purposes
      const knowledgeGapFrequency: Record<string, number> = {};
      allKnowledgeGaps.forEach((gap) => {
        knowledgeGapFrequency[gap] = (knowledgeGapFrequency[gap] ?? 0) + 1;
      });

      // Sort knowledge gaps by frequency
      const sortedKnowledgeGaps = Object.entries(knowledgeGapFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([gap, count]) => ({ gap, count }));

      // Return combined insights from basic statistics and LLM analysis
      return {
        aggregatedInsights: {
          questionCount,
          averageSeverityScore,
          topKnowledgeGaps: parsed.TOP_KNOWLEDGE_GAPS.map((gap) => ({
            gap,
            count: 1,
          })),
          topPromptSuggestions: parsed.CROSS_QUESTION_PROMPT_SUGGESTIONS.map(
            (suggestion) => ({ suggestion, count: 1 }),
          ),
        },
        overallFeedback: parsed.SUMMARY,
      };
    } catch (llmError) {
      console.error("LLM error in session summary generation:", llmError);

      // Fall back to statistical approach if LLM fails
      // Count frequencies
      const knowledgeGapFrequency: Record<string, number> = {};
      const promptSuggestionFrequency: Record<string, number> = {};

      allKnowledgeGaps.forEach((gap) => {
        knowledgeGapFrequency[gap] = (knowledgeGapFrequency[gap] ?? 0) + 1;
      });

      allPromptSuggestions.forEach((suggestion) => {
        promptSuggestionFrequency[suggestion] =
          (promptSuggestionFrequency[suggestion] ?? 0) + 1;
      });

      // Sort by frequency
      const sortedKnowledgeGaps = Object.entries(knowledgeGapFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([gap, count]) => ({ gap, count }));

      const sortedPromptSuggestions = Object.entries(promptSuggestionFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([suggestion, count]) => ({ suggestion, count }));

      // Generate fallback summary text
      const fallbackSummary = `
Interview session analysis summary (statistical aggregation):
- Total questions analyzed: ${questionCount}
- Average severity score: ${averageSeverityScore.toFixed(2)}
- Top knowledge gaps identified across questions
- Top prompt improvement suggestions identified across questions
`;

      return {
        aggregatedInsights: {
          questionCount,
          averageSeverityScore,
          topKnowledgeGaps: sortedKnowledgeGaps.slice(0, 5),
          topPromptSuggestions: sortedPromptSuggestions.slice(0, 5),
        },
        overallFeedback: fallbackSummary,
      };
    }
  } catch (error) {
    console.error("Error generating session summary:", error);
    // Return default values on error
    return {
      aggregatedInsights: {
        questionCount: analysisResults.length,
        averageSeverityScore: 0,
        topKnowledgeGaps: [],
        topPromptSuggestions: [],
      },
      overallFeedback: "Error generating summary.",
    };
  }
}
