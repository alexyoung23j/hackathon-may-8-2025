"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Mic, MicOff, Send } from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar } from "~/components/ui/avatar";
import { api } from "~/trpc/react";

type ChatInterfaceProps = {
  question: string;
  answerA: string;
  answerB: string;
  selectedAnswer: "A" | "B" | null;
  transcript: string[];
  addToTranscript: (message: string) => void;
};

type Message = {
  role: "system" | "user";
  content: string;
};

export default function ChatInterface({
  question,
  answerA,
  answerB,
  selectedAnswer,
  transcript,
  addToTranscript,
}: ChatInterfaceProps) {
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
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    },
    onError: () => {
      setIsSending(false);
    },
  });

  // Scroll to bottom of chat whenever messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle submitting a message
  const handleSendMessage = () => {
    if (!inputValue.trim() || isSending) return;

    // Add user message to chat
    const userMessage = { role: "user" as const, content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    addToTranscript(`User: ${inputValue}`);

    // Clear input
    setInputValue("");

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
    // In a real implementation, you would integrate with Deepgram or browser's speech recognition API
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Interview Chat</h2>
        <p className="text-sm text-gray-500">
          Discuss your preferences with the AI interviewer
        </p>
      </div>

      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-4"
        style={{ maxHeight: "400px" }}
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
                  <span className="text-xs font-medium">AI Interviewer</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-lg bg-white px-4 py-2 shadow">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleRecording}
          className={cn(isRecording && "bg-red-100")}
        >
          {isRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>

        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          disabled={isSending}
        />

        <Button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isSending}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
