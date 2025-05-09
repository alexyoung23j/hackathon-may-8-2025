"use client";

import { useState } from "react";
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
};

export function InterviewSession({
  session,
  questions,
  projectId,
}: InterviewSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

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
        setShowMessages(false);
      } else {
        setIsCompleted(true);
      }
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  // Function to add a message to the transcript
  const addToTranscript = (message: string) => {
    setTranscript((prev) => [...prev, message]);
  };

  // Function to handle final submission of the current question
  const handleSubmitQuestion = () => {
    if (!selectedAnswer) return;

    submitAnswerMutation.mutate({
      sessionId: session.id,
      projectId,
      questionId: currentQuestion.id,
      questionText: currentQuestion.questionText,
      answerA: currentQuestion.answerA,
      answerB: currentQuestion.answerB,
      preferredAnswer: selectedAnswer,
      transcript: transcript.join("\n"),
    });
  };

  // Handle session completion
  const handleComplete = async () => {
    // Navigate to thank you page or back to projects
    router.push("/");
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-xl font-bold">Interview Complete</h2>
        <p>Thank you for participating in this interview session.</p>
        <Button onClick={handleComplete}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] w-full max-w-7xl flex-col pb-8">
      {/* Progress indicator */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
        <div className="h-2 w-full max-w-md rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-500"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        <Button
          onClick={handleSubmitQuestion}
          disabled={!selectedAnswer || isSubmitting}
          className="ml-4"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : (
            <>
              Next Question <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Two-column layout that fills available height */}
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left side: Question display */}
        <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-medium">Compare Answers</h3>

          {/* Question text inside the box */}
          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 font-medium">Question:</h4>
            <p className="whitespace-pre-wrap text-gray-800">
              {currentQuestion.questionText}
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

        {/* Right side: Voice Chat Interface */}
        <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Discuss Your Selection</h3>
            {transcript.length > 0 && (
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
          <div className="flex-1">
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
