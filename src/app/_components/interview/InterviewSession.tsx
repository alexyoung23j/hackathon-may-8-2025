"use client";

import { useState, useRef } from "react";
import QuestionDisplay from "./QuestionDisplay";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { ChevronRight, MessageSquare } from "lucide-react";
import VoiceChatInterface from "./VoiceChatInterface";

type InterviewSessionProps = {
  session: {
    id: string;
    status: string;
  };
  questions: {
    id: string;
    questionText: string;
    answerA: string;
    answerB: string;
  }[];
  projectId: string;
  interviewName?: string; // Add optional interviewee name
};

export function InterviewSession({
  session,
  questions,
  projectId,
  interviewName = "there", // Default to "there" if name not provided
}: InterviewSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const transcriptRef = useRef<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false); // Track if interview has started

  const router = useRouter();

  // Ensure there are questions
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-xl font-bold">No Questions Available</h2>
        <p>There are no questions to display for this interview.</p>
        <Button onClick={() => router.push("/")}>Return Home</Button>
      </div>
    );
  }

  // Safely get the current question
  const currentQuestion = questions[currentQuestionIndex];

  console.log("currentQuestion", questions);

  // If somehow currentQuestion is undefined, show an error
  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-xl font-bold">Error</h2>
        <p>Could not find the current question. Please try again.</p>
        <Button onClick={() => router.push("/")}>Return Home</Button>
      </div>
    );
  }

  // Define mutation for submitting answers
  const submitAnswerMutation = api.interview.submitAnswer.useMutation({
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      // Move to next question after answer is submitted
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setTranscript([]);
        transcriptRef.current = [];
        setShowMessages(false);
      } else {
        setIsCompleted(true);
        void handleComplete();
      }
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  // Define mutation for completing the session
  const completeSessionMutation = api.interview.completeSession.useMutation({
    onError: (error) => {
      console.error("Failed to complete session:", error);
    },
  });

  // Function to add a message to the transcript
  const addToTranscript = (message: string) => {
    transcriptRef.current = [...transcriptRef.current, message];
    setTranscript((prev) => [...prev, message]);
  };

  console.log({ transcript });

  // Function to handle final submission of the current question
  const handleSubmitQuestion = () => {
    if (!selectedAnswer) return;

    console.log("Submitting question:", {
      question: currentQuestion,
      transcript: transcriptRef.current,
    });

    submitAnswerMutation.mutate({
      sessionId: session.id,
      projectId,
      questionId: currentQuestion.id,
      questionText: currentQuestion.questionText,
      answerA: currentQuestion.answerA,
      answerB: currentQuestion.answerB,
      preferredAnswer: selectedAnswer,
      transcript: transcriptRef.current.join("\n"),
    });
  };

  // Handle session completion
  const handleComplete = async () => {
    // Call the new endpoint to mark the session as completed
    try {
      console.log("Completing session:", {
        sessionId: session.id,
        projectId,
      });
      await completeSessionMutation.mutateAsync({
        sessionId: session.id,
        projectId,
      });
    } catch (error) {
      console.error("Failed to complete session:", error);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-xl font-bold">Interview Complete</h2>
        <p>Thank you for participating in this interview session.</p>
      </div>
    );
  }

  // Show welcome screen if interview hasn't started
  if (!interviewStarted) {
    return (
      <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-3xl flex-col items-center justify-center">
        <div className="w-full rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
            Welcome, {interviewName}!
          </h1>

          <div className="space-y-4 text-gray-700">
            <p>
              Thank you for participating in this expert interview session. Your
              insights and expertise are valuable to us.
            </p>

            <p>
              During this interview, you&apos;ll be presented with a series of
              questions. For each question, you&apos;ll:
            </p>

            <ul className="ml-6 list-disc space-y-2">
              <li>Review two possible answers</li>
              <li>Select the answer you believe is best</li>
              <li>Explain your reasoning through a voice or text chat</li>
            </ul>

            <p>
              There are {questions.length} questions in total, and you can take
              your time with each one.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={() => setInterviewStarted(true)}
              className="px-8"
            >
              Begin Interview <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-7xl flex-col pb-4">
      {/* Progress indicator - without Next Question button */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
        <div className="ml-4 h-2 w-full max-w-md rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-500"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Two-column layout that fills available height */}
      <div
        className={`mt-4 flex flex-1 ${selectedAnswer ? "lg:flex-row" : "flex-col items-center"} gap-4 overflow-hidden`}
      >
        {/* Left side: Question display */}
        <div className="flex h-full w-full flex-col overflow-auto rounded-lg border border-gray-200 bg-white p-4 shadow-md">
          <h3 className="mb-2 text-lg font-medium">Compare Answers</h3>

          {/* Question text inside the box */}
          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 font-medium">Question:</h4>
            <p className="whitespace-pre-wrap text-gray-800">
              {currentQuestion.questionText}
            </p>
          </div>

          <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <p>
              Please select the answer you believe is best, even if the two
              options appear similar. Your expert judgment is valuable.
            </p>
          </div>

          <div className="flex-1">
            <QuestionDisplay
              question={currentQuestion.questionText}
              answerA={currentQuestion.answerA}
              answerB={currentQuestion.answerB}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={setSelectedAnswer}
              currentStep={currentQuestionIndex + 1}
              totalSteps={questions.length}
              showProgress={false}
            />
          </div>
        </div>

        {/* Right side: Voice Chat Interface - only shown after answer selection */}
        {selectedAnswer && (
          <div className="flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Discuss Your Selection</h3>
              {isSubmitting && (
                <p className="text-sm text-blue-500">
                  Submitting your answer...
                </p>
              )}
              {transcript.length > 0 && !isSubmitting && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-xs"
                  onClick={() => setShowMessages(true)}
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  View all messages
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              <VoiceChatInterface
                question={currentQuestion.questionText}
                answerA={currentQuestion.answerA}
                answerB={currentQuestion.answerB}
                selectedAnswer={selectedAnswer}
                addToTranscript={addToTranscript}
                transcript={transcript}
                showTypeButton={false}
                showMessages={showMessages}
                setShowMessages={setShowMessages}
                onInterviewEnd={() => handleSubmitQuestion()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
