"use client";

import { useState, useRef, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Mic, MicOff, Send, MessageSquare, X, Volume2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar } from "~/components/ui/avatar";
import { api } from "~/trpc/react";

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
}: VoiceChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "Welcome! I'm your AI interviewer. I'll be asking you questions about these answers to understand your preferences and reasoning. What makes one answer better than the other in your expert opinion?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [internalShowMessages, setInternalShowMessages] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Use either external or internal show messages state
  const showMessages = externalShowMessages ?? internalShowMessages;
  const setShowMessages = externalSetShowMessages ?? setInternalShowMessages;

  // Define mutation for sending messages to AI
  const sendMessageMutation = api.interview.sendMessage.useMutation({
    onMutate: () => {
      setIsSending(true);
    },
    onSuccess: (data) => {
      // Add AI response to messages
      setMessages((prev) => [
        ...prev,
        { role: "system", content: data.response },
      ]);
      addToTranscript(`AI: ${data.response}`);
      setIsSending(false);

      // Simulate AI speaking
      setIsAISpeaking(true);
      setTimeout(() => {
        setIsAISpeaking(false);
      }, data.response.length * 80); // Simulate speech timing based on message length
    },
    onError: () => {
      setIsSending(false);
    },
  });

  // Scroll to bottom of chat whenever messages change
  useEffect(() => {
    if (chatContainerRef.current && showMessages) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, showMessages]);

  // Handle submitting a message
  const handleSendMessage = () => {
    if (!inputValue.trim() || isSending) return;

    // Add user message to chat
    const userMessage = { role: "user" as const, content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    addToTranscript(`User: ${inputValue}`);

    // Clear input
    setInputValue("");
    setShowTextInput(false);

    // Send message to AI
    sendMessageMutation.mutate({
      question,
      answerA,
      answerB,
      selectedAnswer,
      userMessage: inputValue,
      previousMessages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  // Handle voice recording (mock implementation)
  const toggleRecording = () => {
    setIsRecording(!isRecording);

    if (isRecording) {
      // Simulate end of recording with a mock message
      const mockMessage =
        "This is a simulated voice recording message. In a real implementation, this would be transcribed from audio.";

      // Add user message to chat
      const userMessage = { role: "user" as const, content: mockMessage };
      setMessages((prev) => [...prev, userMessage]);
      addToTranscript(`User: ${mockMessage}`);

      // Send message to AI
      sendMessageMutation.mutate({
        question,
        answerA,
        answerB,
        selectedAnswer,
        userMessage: mockMessage,
        previousMessages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
    }

    // In a real implementation, you would integrate with browser's speech recognition API
  };

  // Get the last message safely if it exists
  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Main content area */}
      <div className="mb-auto">
        {/* Full chat messages - conditionally displayed */}
        {showMessages && (
          <div className="relative mb-4">
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

        {/* Waveform visualization when AI is speaking */}
        {!showMessages && (isAISpeaking || isSending) && (
          <div className="mb-8 flex h-20 items-center justify-center rounded-lg bg-gray-50 p-4">
            <div className="flex items-center">
              <Volume2 className="mr-3 h-6 w-6 text-blue-500" />
              <div className="flex items-end space-x-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-blue-500"
                    style={{
                      height: `${12 + Math.sin(i * 0.8) * 16}px`,
                      width: "4px",
                      borderRadius: "2px",
                      animation: "pulse 1s ease-in-out infinite",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  ></div>
                ))}
              </div>
              <p className="ml-3 text-sm text-gray-500">
                {isSending ? "Processing..." : "AI is speaking..."}
              </p>
            </div>
          </div>
        )}

        {/* Latest message preview when not showing all messages and not speaking */}
        {!showMessages && !isAISpeaking && !isSending && lastMessage && (
          <div className="mb-8">
            <p className="mb-1 text-base font-medium text-gray-700">
              AI Interviewer says:
            </p>
            <p className="text-lg leading-relaxed text-gray-900">
              {lastMessage.content}
            </p>
          </div>
        )}
      </div>

      {/* Bottom controls - always at the bottom */}
      <div className="mt-auto">
        {/* Voice recording button (primary interaction) */}
        <div className="mb-4 flex flex-col items-center">
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className={cn(
              "h-16 w-16 rounded-full",
              isRecording && "animate-pulse",
            )}
            onClick={toggleRecording}
          >
            {isRecording ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
          <p className="mt-2 text-sm text-gray-500">
            {isRecording ? "Tap to stop recording" : "Tap to start recording"}
          </p>
        </div>

        {/* Input area - conditionally displayed */}
        {showTextInput ? (
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              disabled={isSending}
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        ) : // Show either a button or small text based on showTypeButton prop
        showTypeButton ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowTextInput(true)}
          >
            Or type your response
          </Button>
        ) : (
          <p
            className="cursor-pointer text-center text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setShowTextInput(true)}
          >
            Or type your response
          </p>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scaleY(0.5);
          }
          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}
