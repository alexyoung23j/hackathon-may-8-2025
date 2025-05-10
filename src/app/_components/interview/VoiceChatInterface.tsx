"use client";

import { useState, useRef, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Mic, MicOff, Send, MessageSquare, X, Volume2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar } from "~/components/ui/avatar";
import { api } from "~/trpc/react";
import { useConversation } from "@11labs/react";
import { BeatLoader, ScaleLoader } from "react-spinners";

// Define types for ElevenLabs conversation
interface ElevenLabsMessage {
  message: string;
  source?: string;
}

interface ElevenLabsMode {
  mode: string;
}

// Define interface for ElevenLabs conversation object
interface ElevenLabsConversation {
  status?: string;
  startSession: (options: {
    agentId: string;
    dynamicVariables?: Record<string, string>;
  }) => Promise<string>;
  endSession: () => Promise<void>;
}

// Define interface for ElevenLabs error context
interface ElevenLabsErrorContext {
  code?: string;
  details?: string;
}

// Declare global window interface to include our ENV object
declare global {
  interface Window {
    ELEVENLABS_AGENT_ID?: string;
  }
}

type VoiceChatInterfaceProps = {
  question: string;
  answerA: string;
  answerB: string;
  selectedAnswer: "A" | "B" | null;
  transcript: string[];
  addToTranscript: (message: string) => void;
  showTypeButton?: boolean;
  showMessages?: boolean;
  setShowMessages?: Dispatch<SetStateAction<boolean>>;
  onInterviewEnd?: () => void;
};

type Message = {
  role: "system" | "user";
  content: string;
};

export default function VoiceChatInterface({
  question,
  answerA,
  answerB,
  selectedAnswer,
  transcript,
  addToTranscript,
  showTypeButton = true,
  showMessages: externalShowMessages,
  setShowMessages: externalSetShowMessages,
  onInterviewEnd,
}: VoiceChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAgentEnded, setIsAgentEnded] = useState(false);
  const [internalShowMessages, setInternalShowMessages] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Use either external or internal show messages state
  const showMessages = externalShowMessages ?? internalShowMessages;
  const setShowMessages = externalSetShowMessages ?? setInternalShowMessages;

  // ElevenLabs conversation integration
  const elevenlabsConversation = useConversation({
    onConnect: () => console.log("Connected to ElevenLabs"),
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      setIsRecording(false);
      setIsAgentEnded(true);

      // Call the onInterviewEnd callback when the agent ends the interview
      if (onInterviewEnd) {
        // Give a short delay to allow any final messages to be processed
        setTimeout(() => {
          onInterviewEnd();
        }, 1000);
      }
    },
    onMessage: (messageObj: ElevenLabsMessage) => {
      if (messageObj && typeof messageObj.message === "string") {
        // Add message to the UI based on source
        const message = messageObj.message;
        const isUser = messageObj.source === "user";

        setMessages((prev) => [
          ...prev,
          {
            role: isUser ? "user" : "system",
            content: message,
          },
        ]);

        // Add to transcript with proper prefix
        addToTranscript(`${isUser ? "Human Expert" : "AI"}: ${message}`);

        // Only simulate AI speaking for agent messages
        if (!isUser) {
          setIsAISpeaking(true);
          setTimeout(() => {
            setIsAISpeaking(false);
          }, message.length * 80);
        }
      }
    },
    onError: (message: string, context?: ElevenLabsErrorContext) =>
      console.error("ElevenLabs Error:", message, context),
    onModeChange: (modeObj: ElevenLabsMode) => {
      if (modeObj && typeof modeObj.mode === "string") {
        setIsAISpeaking(modeObj.mode === "speaking");
      }
    },
  }) as unknown as ElevenLabsConversation;

  // Scroll to bottom of chat whenever messages change
  useEffect(() => {
    if (chatContainerRef.current && showMessages) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, showMessages]);

  // Handle voice recording with ElevenLabs integration
  const toggleRecording = async () => {
    // Check if the conversation methods exist
    const hasStartSession =
      typeof elevenlabsConversation?.startSession === "function";
    const hasEndSession =
      typeof elevenlabsConversation?.endSession === "function";

    if (isRecording) {
      // Stop recording - end the ElevenLabs session
      setIsRecording(false);

      // Check if the conversation is connected and we can end it
      if (elevenlabsConversation?.status === "connected" && hasEndSession) {
        try {
          await elevenlabsConversation.endSession();
        } catch (error) {
          console.error("Error ending ElevenLabs conversation:", error);
        }
      }
    } else {
      // Start recording - start the ElevenLabs session
      setIsRecording(true);

      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Get the agent ID from window object
        const agentId =
          typeof window !== "undefined"
            ? (window.ELEVENLABS_AGENT_ID ?? "")
            : "";

        if (!agentId) {
          console.error("ElevenLabs Agent ID not found");
          setIsRecording(false);
          return;
        }

        // Start the conversation with dynamic variables if the method exists
        if (hasStartSession) {
          await elevenlabsConversation.startSession({
            agentId,
            dynamicVariables: {
              question: question,
              answer_a: answerA,
              answer_b: answerB,
              selected_answer: selectedAnswer ?? "",
            },
          });
        } else {
          console.error("startSession method not available");
          setIsRecording(false);
        }
      } catch (error) {
        console.error("Failed to start ElevenLabs conversation:", error);
        setIsRecording(false);
      }
    }
  };

  // Get the last message safely if it exists
  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Main content area with vertical centering */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* Full chat messages - conditionally displayed */}
        {showMessages && (
          <div className="relative mb-4 w-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setShowMessages(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div
              ref={chatContainerRef}
              className="max-h-96 space-y-4 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-4"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-4 py-2",
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-800 shadow",
                    )}
                  >
                    {message.role === "system" && (
                      <div className="mb-1 flex items-center">
                        <Avatar className="mr-2 h-6 w-6">
                          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs">
                            AI
                          </div>
                        </Avatar>
                        <span className="text-xs font-medium">
                          AI Interviewer
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ScaleLoader visualization when AI is speaking - centered */}
        {!showMessages && (isAISpeaking || isSending) && (
          <div className="flex items-center justify-center text-center">
            <div className="flex flex-col items-center">
              <ScaleLoader
                color="#3b82f6"
                height={35}
                width={4}
                radius={2}
                margin={2}
              />
              <p className="mt-3 text-sm text-gray-500">
                {isSending ? "Processing..." : "AI is speaking..."}
              </p>
            </div>
          </div>
        )}

        {/* Latest message preview when not showing all messages and not speaking - centered */}
        {!showMessages &&
          !isAISpeaking &&
          !isSending &&
          messages.length > 0 && (
            <div className="max-w-lg text-center">
              <p className="text-lg leading-relaxed text-gray-900">
                {messages.filter((msg) => msg.role === "system").slice(-1)[0]
                  ?.content ?? ""}
              </p>
            </div>
          )}

        {/* Prompt text when no messages yet and not recording - centered */}
        {!showMessages &&
          !isAISpeaking &&
          !isSending &&
          messages.length === 0 &&
          !isRecording && (
            <div className="mx-6 flex flex-col items-center justify-center">
              <p className="text-center text-gray-500">
                Share your feedback with our analysis agent. Wait a few seconds
                after starting for the conversation to begin.
              </p>
              <p className="mt-3 text-center text-gray-500">
                You can end the conversation at any time by tapping the button.
              </p>
            </div>
          )}

        {/* Temporary testing button - only shown in development */}
        {/* {process.env.NODE_ENV !== "production" && (
          <div className="mt-4 rounded border border-dashed border-red-300 p-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-red-500 hover:text-red-700"
              onClick={() => {
                // Add the hardcoded transcript messages
                const transcript = [
                  {
                    role: "system" as const,
                    content:
                      "Can you tell me more about why you chose Answer A?",
                  },
                  {
                    role: "user" as const,
                    content:
                      "Yeah, so if we choose CARV, the dilol, we're much more likely to get a good result for this kind of patient compared to bisoprolol.",
                  },
                  {
                    role: "system" as const,
                    content:
                      "What specific aspects of carvedilol's performance or characteristics make it more suitable for this patient type in your view?",
                  },
                  {
                    role: "user" as const,
                    content:
                      "I would say that it's just much more effective as a first-line therapy because bisoprolol has too many side effects or something.",
                  },
                  {
                    role: "system" as const,
                    content:
                      "Could you elaborate on which side effects of bisoprolol you find particularly concerning, and how they might impact the treatment of heart failure with reduced ejection fraction?",
                  },
                  {
                    role: "user" as const,
                    content:
                      "I mean, it can paralyze you in some rare cases, so it just feels like a risky thing to go for.",
                  },
                  {
                    role: "system" as const,
                    content: "Is there anything else you need assistance with?",
                  },
                  {
                    role: "user" as const,
                    content: "Nope. That's it.",
                  },
                  {
                    role: "system" as const,
                    content:
                      "Ending the call as the user has no further questions.",
                  },
                ];

                // Set messages and add to transcript
                setMessages(transcript);
                transcript.forEach((msg) => {
                  addToTranscript(
                    `${msg.role === "user" ? "Human Expert" : "AI"}: ${msg.content}`,
                  );
                });

                // Simulate the interview ending
                setIsRecording(false);
                setIsAgentEnded(true);

                // Call the onInterviewEnd callback
                if (onInterviewEnd) {
                  onInterviewEnd();
                }
              }}
            >
              [TEST ONLY] Simulate Interview End
            </Button>
          </div>
        )} */}
      </div>

      {/* Bottom controls - always at the bottom */}
      <div className="mt-auto">
        {/* Voice recording button (primary interaction) - hide when agent has ended the conversation */}
        {!isAgentEnded && (
          <div className="mb-4 flex flex-col items-center">
            <Button
              variant="default"
              size="lg"
              className="h-16 w-16 rounded-full"
              onClick={toggleRecording}
            >
              {isRecording ? (
                <BeatLoader color="#ffffff" size={8} />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
            <p className="mt-2 text-sm text-gray-500">
              {isRecording ? "Tap to stop recording" : "Tap to start feedback"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
