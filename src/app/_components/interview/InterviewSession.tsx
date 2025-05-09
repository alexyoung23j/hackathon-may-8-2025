"use client";

import { useState } from "react";
import QuestionDisplay from "./QuestionDisplay";
import ChatInterface from "./ChatInterface";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Left side: Question display */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <QuestionDisplay
          question={currentQuestion.questionText}
          answerA={currentQuestion.answerA}
          answerB={currentQuestion.answerB}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={setSelectedAnswer}
          currentStep={currentQuestionIndex + 1}
          totalSteps={questions.length}
        />

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSubmitQuestion}
            disabled={!selectedAnswer || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit & Continue"}
          </Button>
        </div>
      </div>

      {/* Right side: Chat interface */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <ChatInterface
          question={currentQuestion.questionText}
          answerA={currentQuestion.answerA}
          answerB={currentQuestion.answerB}
          selectedAnswer={selectedAnswer}
          addToTranscript={addToTranscript}
          transcript={transcript}
        />
      </div>
    </div>
  );
}
