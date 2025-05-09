"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function SessionDetailsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = useState("summary");

  const {
    data: sessionDetail,
    isLoading,
    isError,
  } = api.session.getSessionDetail.useQuery(
    { sessionId },
    { enabled: !!sessionId },
  );

  // Reset to summary tab whenever a new session is loaded
  useEffect(() => {
    setActiveTab("summary");
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Link href={`/projects/${projectId}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Project
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading Session Details</CardTitle>
            <CardDescription>
              Please wait while we fetch the session information...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isError || !sessionDetail) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Link href={`/projects/${projectId}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Project
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load session details. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { session, summary, stepRecords } = sessionDetail;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Interview Session Results</h1>
        <p className="mt-1 text-gray-500">
          Session ID: {sessionId} • Started:{" "}
          {new Date(session.startedAt).toLocaleString()} • Status:{" "}
          {session.status}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-auto mb-8 w-full max-w-md">
          <TabsTrigger value="summary" className="flex-1">
            Summary
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex-1">
            Question Analysis
          </TabsTrigger>
          <TabsTrigger value="transcripts" className="flex-1">
            Transcripts
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {summary ? (
            <Card>
              <CardHeader>
                <CardTitle>Session Summary</CardTitle>
                <CardDescription>
                  Overall analysis of the interview session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Overall Feedback</h3>
                  <p className="mt-1 text-gray-700">
                    {summary.overallFeedback}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium">Key Metrics</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="text-sm text-gray-500">
                        Questions Analyzed
                      </div>
                      <div className="text-2xl font-semibold">
                        {summary.aggregatedInsights.questionCount}
                      </div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="text-sm text-gray-500">
                        Avg. Severity Score
                      </div>
                      <div className="text-2xl font-semibold">
                        {summary.aggregatedInsights.averageSeverityScore.toFixed(
                          2,
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium">Top Knowledge Gaps</h3>
                  <ul className="mt-2 space-y-1">
                    {summary.aggregatedInsights.topKnowledgeGaps.map(
                      (item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="text-gray-700">• {item.gap}</span>
                          {item.count > 1 && (
                            <Badge variant="outline" className="bg-blue-50">
                              {item.count}×
                            </Badge>
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium">
                    Prompt Improvement Suggestions
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {summary.aggregatedInsights.topPromptSuggestions.map(
                      (item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="text-gray-700">
                            • {item.suggestion}
                          </span>
                          {item.count > 1 && (
                            <Badge variant="outline" className="bg-blue-50">
                              {item.count}×
                            </Badge>
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Session Summary</CardTitle>
                <CardDescription>Analysis in progress...</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  The analysis for this session is still being processed. Please
                  check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Questions Analysis Tab */}
        <TabsContent value="questions" className="space-y-4">
          <div className="grid gap-6">
            {stepRecords.map((record, index) => {
              const artifact = record.analysisArtifact;
              return (
                <Card key={record.id}>
                  <CardHeader>
                    <CardTitle>
                      Question {index + 1}
                      {artifact?.winnerFlag && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          Answer {artifact.winnerFlag} Preferred
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {record.questionPair.questionText}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div
                        className={`rounded-md p-3 ${
                          artifact?.winnerFlag === "A"
                            ? "border border-green-200 bg-green-50"
                            : "bg-slate-50"
                        }`}
                      >
                        <h4 className="font-semibold">Answer A</h4>
                        <p className="mt-1 text-sm text-gray-700">
                          {record.questionPair.answerA}
                        </p>
                      </div>
                      <div
                        className={`rounded-md p-3 ${
                          artifact?.winnerFlag === "B"
                            ? "border border-green-200 bg-green-50"
                            : "bg-slate-50"
                        }`}
                      >
                        <h4 className="font-semibold">Answer B</h4>
                        <p className="mt-1 text-sm text-gray-700">
                          {record.questionPair.answerB}
                        </p>
                      </div>
                    </div>

                    {artifact ? (
                      <>
                        <Separator />

                        <div>
                          <h4 className="font-semibold">Analysis</h4>
                          <div className="mt-2 space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                Severity Score:
                              </span>
                              <span className="ml-2">
                                {artifact.severityScore?.toFixed(2) ?? "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                Rationale:
                              </span>
                              <p className="mt-1 text-sm text-gray-700">
                                {artifact.rationaleDigest}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                Knowledge Gaps:
                              </span>
                              <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                                {(artifact.knowledgeGaps as string[]).map(
                                  (gap, i) => (
                                    <li key={i}>{gap}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                Prompt Suggestions:
                              </span>
                              <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                                {(artifact.promptSuggestions as string[]).map(
                                  (suggestion, i) => (
                                    <li key={i}>{suggestion}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center text-gray-500">
                        Analysis not available for this question.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Transcripts Tab */}
        <TabsContent value="transcripts" className="space-y-4">
          <div className="grid gap-6">
            {stepRecords.map((record, index) => (
              <Card key={record.id}>
                <CardHeader>
                  <CardTitle>Question {index + 1}</CardTitle>
                  <CardDescription>
                    {record.questionPair.questionText}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {record.transcript ? (
                    <div className="space-y-3 rounded-md bg-slate-50 p-3">
                      {typeof record.transcript === "string" ? (
                        <pre className="text-sm whitespace-pre-wrap">
                          {record.transcript}
                        </pre>
                      ) : (
                        Array.isArray(record.transcript) && (
                          <div className="space-y-3">
                            {(
                              record.transcript as {
                                role: string;
                                content: string;
                              }[]
                            ).map((msg, i) => (
                              <div
                                key={i}
                                className={`rounded p-2 ${
                                  msg.role === "user"
                                    ? "ml-8 bg-blue-50"
                                    : "mr-8 bg-gray-100"
                                }`}
                              >
                                <div className="mb-1 text-xs text-gray-500">
                                  {msg.role === "user"
                                    ? "Expert"
                                    : "AI Interviewer"}
                                </div>
                                <div className="text-sm">{msg.content}</div>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      No transcript available for this question.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
