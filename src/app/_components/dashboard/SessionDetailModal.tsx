import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ScrollArea } from "~/components/ui/scroll-area";
import { api } from "~/trpc/react";
import { Copy, CheckCheck } from "lucide-react";
import { toast } from "sonner";

interface SessionDetailModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionDetailModal({
  sessionId,
  isOpen,
  onClose,
}: SessionDetailModalProps) {
  const [activeTab, setActiveTab] = useState("summary");
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});

  const {
    data: sessionDetail,
    isLoading,
    isError,
  } = api.session.getSessionDetail.useQuery(
    { sessionId },
    { enabled: isOpen && !!sessionId },
  );

  // Reset to summary tab whenever a new session is loaded
  useEffect(() => {
    if (isOpen) {
      setActiveTab("summary");
      setCopiedItems({});
    }
  }, [isOpen, sessionId]);

  const copyToClipboard = (text: string, itemKey: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedItems((prev) => ({ ...prev, [itemKey]: true }));
      toast.success("Copied to clipboard");
      setTimeout(() => {
        setCopiedItems((prev) => ({ ...prev, [itemKey]: false }));
      }, 2000);
    });
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-[90%] sm:max-w-[90%] md:max-w-[90%] lg:max-w-[90%]">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>
              Loading session information...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError || !sessionDetail) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-[90%] sm:max-w-[90%] md:max-w-[90%] lg:max-w-[90%]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              Failed to load session details. Please try again later.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const { session, summary, stepRecords } = sessionDetail;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[90%] sm:max-w-[90%] md:max-w-[90%] lg:max-w-[90%]">
        <DialogHeader>
          <DialogTitle>Interview Session Results</DialogTitle>
          <DialogDescription>
            Session ID: {sessionId} • Started:{" "}
            {new Date(session.startedAt).toLocaleString()} • Status:{" "}
            {session.status}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
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

          <div className="mt-4 max-h-[70vh] overflow-y-auto pr-4">
            {/* Summary Tab */}
            <TabsContent
              value="summary"
              className="mt-0 data-[state=active]:block"
            >
              {summary ? (
                <div className="space-y-6">
                  <div className="relative rounded-lg border bg-slate-50 p-4">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          summary.overallFeedback ?? "",
                          "feedback",
                        )
                      }
                      className="absolute top-2 right-2 rounded-full p-1.5 text-gray-500 hover:bg-gray-200"
                      aria-label="Copy to clipboard"
                    >
                      {copiedItems.feedback ? (
                        <CheckCheck size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <h3 className="text-lg font-medium text-gray-800">
                      Overall Feedback
                    </h3>
                    <p className="mt-2 text-gray-700">
                      {summary.overallFeedback}
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-medium text-gray-800">
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col items-center rounded-lg border bg-blue-50 p-4 text-center">
                        <span className="text-sm font-medium text-gray-600">
                          Questions Analyzed
                        </span>
                        <span className="mt-2 text-4xl font-bold text-blue-700">
                          {summary.aggregatedInsights.questionCount}
                        </span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg border bg-green-50 p-4 text-center">
                        <span className="text-sm font-medium text-gray-600">
                          Avg. Severity Score
                        </span>
                        <span className="mt-2 text-4xl font-bold text-green-700">
                          {summary.aggregatedInsights.averageSeverityScore.toFixed(
                            2,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="relative rounded-lg border p-4">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          summary.aggregatedInsights.topKnowledgeGaps
                            .map((item) => `• ${item.gap}`)
                            .join("\n"),
                          "knowledgeGaps",
                        )
                      }
                      className="absolute top-2 right-2 rounded-full p-1.5 text-gray-500 hover:bg-gray-200"
                      aria-label="Copy to clipboard"
                    >
                      {copiedItems.knowledgeGaps ? (
                        <CheckCheck size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <h3 className="text-lg font-medium text-gray-800">
                      Top Knowledge Gaps
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {summary.aggregatedInsights.topKnowledgeGaps.map(
                        (item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 rounded-md bg-red-50 p-2"
                          >
                            <span className="mt-0.5 text-red-600">•</span>
                            <div className="flex-1">
                              <span className="text-gray-800">{item.gap}</span>
                              {item.count > 1 && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-red-100 text-red-800"
                                >
                                  {item.count}×
                                </Badge>
                              )}
                            </div>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div className="relative rounded-lg border p-4">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          summary.aggregatedInsights.topPromptSuggestions
                            .map((item) => `• ${item.suggestion}`)
                            .join("\n"),
                          "promptSuggestions",
                        )
                      }
                      className="absolute top-2 right-2 rounded-full p-1.5 text-gray-500 hover:bg-gray-200"
                      aria-label="Copy to clipboard"
                    >
                      {copiedItems.promptSuggestions ? (
                        <CheckCheck size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <h3 className="text-lg font-medium text-gray-800">
                      Prompt Improvement Suggestions
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {summary.aggregatedInsights.topPromptSuggestions.map(
                        (item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 rounded-md bg-purple-50 p-2"
                          >
                            <span className="mt-0.5 text-purple-600">•</span>
                            <div className="flex-1">
                              <span className="text-gray-800">
                                {item.suggestion}
                              </span>
                              {item.count > 1 && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-purple-100 text-purple-800"
                                >
                                  {item.count}×
                                </Badge>
                              )}
                            </div>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Session Summary</h3>
                  <p className="text-sm text-gray-500">
                    Analysis in progress...
                  </p>
                  <div className="rounded-lg border p-4">
                    <p className="text-gray-500">
                      The analysis for this session is still being processed.
                      Please check back later.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Questions Analysis Tab */}
            <TabsContent
              value="questions"
              className="mt-0 data-[state=active]:block"
            >
              {stepRecords.map((record, index) => {
                const artifact = record.analysisArtifact;
                return (
                  <div key={record.id} className="mb-12 space-y-6">
                    <div>
                      <h3 className="text-xl font-medium">
                        Question {index + 1}
                        {artifact?.winnerFlag && (
                          <Badge className="ml-2 bg-green-100 text-green-800">
                            Answer {artifact.winnerFlag} Preferred
                          </Badge>
                        )}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {record.questionPair.questionText}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
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
                        <Separator className="my-6" />

                        <div>
                          <h4 className="mb-4 font-semibold">Analysis</h4>
                          <div className="mt-4 space-y-5">
                            <div className="flex items-center rounded-md bg-slate-50 p-2">
                              <span className="text-sm font-medium text-gray-500">
                                Severity Score:
                              </span>
                              <span className="ml-2 rounded bg-blue-100 px-2 py-1 font-semibold text-blue-800">
                                {artifact.severityScore?.toFixed(2) ?? "N/A"}
                              </span>
                              <span className="ml-3 text-xs text-gray-500 italic">
                                (Higher score indicates a more significant
                                quality difference between answers)
                              </span>
                            </div>

                            <div className="relative rounded-md border p-3">
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    artifact.rationaleDigest ?? "",
                                    `rationale-${record.id}`,
                                  )
                                }
                                className="absolute top-2 right-2 rounded-full p-1.5 text-gray-500 hover:bg-gray-200"
                                aria-label="Copy to clipboard"
                              >
                                {copiedItems[`rationale-${record.id}`] ? (
                                  <CheckCheck
                                    size={16}
                                    className="text-green-600"
                                  />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </button>
                              <span className="text-sm font-medium text-gray-500">
                                Rationale:
                              </span>
                              <p className="mt-1 text-sm text-gray-700">
                                {artifact.rationaleDigest}
                              </p>
                            </div>

                            <div className="relative rounded-md border bg-red-50 p-3">
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    (artifact.knowledgeGaps as string[])
                                      .map((gap) => `• ${gap}`)
                                      .join("\n"),
                                    `gaps-${record.id}`,
                                  )
                                }
                                className="absolute top-2 right-2 rounded-full p-1.5 text-gray-500 hover:bg-gray-200"
                                aria-label="Copy to clipboard"
                              >
                                {copiedItems[`gaps-${record.id}`] ? (
                                  <CheckCheck
                                    size={16}
                                    className="text-green-600"
                                  />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </button>
                              <span className="text-sm font-medium text-gray-500">
                                Knowledge Gaps:
                              </span>
                              <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                                {(artifact.knowledgeGaps as string[]).map(
                                  (gap, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="mt-0.5 text-red-600">
                                        •
                                      </span>
                                      <span>{gap}</span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>

                            <div className="relative rounded-md border bg-purple-50 p-3">
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    (artifact.promptSuggestions as string[])
                                      .map((suggestion) => `• ${suggestion}`)
                                      .join("\n"),
                                    `suggestions-${record.id}`,
                                  )
                                }
                                className="absolute top-2 right-2 rounded-full p-1.5 text-gray-500 hover:bg-gray-200"
                                aria-label="Copy to clipboard"
                              >
                                {copiedItems[`suggestions-${record.id}`] ? (
                                  <CheckCheck
                                    size={16}
                                    className="text-green-600"
                                  />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </button>
                              <span className="text-sm font-medium text-gray-500">
                                Prompt Suggestions:
                              </span>
                              <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                                {(artifact.promptSuggestions as string[]).map(
                                  (suggestion, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="mt-0.5 text-purple-600">
                                        •
                                      </span>
                                      <span>{suggestion}</span>
                                    </li>
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
                  </div>
                );
              })}
            </TabsContent>

            {/* Transcripts Tab */}
            <TabsContent
              value="transcripts"
              className="mt-0 data-[state=active]:block"
            >
              {stepRecords.map((record, index) => (
                <div key={record.id} className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Question {index + 1}
                    </h3>
                    {record.transcript && (
                      <button
                        onClick={() => {
                          const transcriptText =
                            typeof record.transcript === "string"
                              ? record.transcript
                              : Array.isArray(record.transcript)
                                ? (
                                    record.transcript as {
                                      role: string;
                                      content: string;
                                    }[]
                                  )
                                    .map(
                                      (msg) =>
                                        `${msg.role === "user" ? "Expert" : "AI"}: ${msg.content}`,
                                    )
                                    .join("\n\n")
                                : "No transcript";
                          copyToClipboard(
                            transcriptText,
                            `transcript-${record.id}`,
                          );
                        }}
                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200"
                        aria-label="Copy transcript to clipboard"
                      >
                        {copiedItems[`transcript-${record.id}`] ? (
                          <CheckCheck size={16} className="text-green-600" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="mb-3 text-sm text-gray-500">
                    {record.questionPair.questionText}
                  </p>

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
                </div>
              ))}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
