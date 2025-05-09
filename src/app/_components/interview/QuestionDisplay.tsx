"use client";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { CheckCircle } from "lucide-react";

type QuestionDisplayProps = {
  question: string;
  answerA: string;
  answerB: string;
  selectedAnswer: "A" | "B" | null;
  onSelectAnswer: (answer: "A" | "B") => void;
  currentStep: number;
  totalSteps: number;
  showProgress?: boolean;
};

export default function QuestionDisplay({
  question,
  answerA,
  answerB,
  selectedAnswer,
  onSelectAnswer,
  currentStep,
  totalSteps,
  showProgress = true,
}: QuestionDisplayProps) {
  return (
    <div className="flex flex-col space-y-6">
      {/* Progress indicator - only shown if showProgress is true */}
      {showProgress && (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            Question {currentStep} of {totalSteps}
          </span>
          <div className="h-2 w-full max-w-xs rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Question text - only shown if showProgress is true (we're showing it elsewhere in the unified view) */}
      {showProgress && (
        <div className="rounded-lg bg-gray-50 p-4">
          <h2 className="text-lg font-semibold">Question:</h2>
          <p className="mt-2 whitespace-pre-wrap text-gray-800">{question}</p>
        </div>
      )}

      {/* Answer options */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Answer A */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-blue-400",
            selectedAnswer === "A" ? "border-2 border-blue-500 shadow-md" : "",
          )}
          onClick={() => onSelectAnswer("A")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md">Answer A</CardTitle>
            {selectedAnswer === "A" && (
              <CheckCircle className="h-5 w-5 text-blue-500" />
            )}
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap text-gray-600">
              {answerA}
            </p>
          </CardContent>
        </Card>

        {/* Answer B */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-blue-400",
            selectedAnswer === "B" ? "border-2 border-blue-500 shadow-md" : "",
          )}
          onClick={() => onSelectAnswer("B")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md">Answer B</CardTitle>
            {selectedAnswer === "B" && (
              <CheckCircle className="h-5 w-5 text-blue-500" />
            )}
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap text-gray-600">
              {answerB}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Selection buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          variant={selectedAnswer === "A" ? "default" : "outline"}
          className="w-32"
          onClick={() => onSelectAnswer("A")}
        >
          Select A
        </Button>
        <Button
          variant={selectedAnswer === "B" ? "default" : "outline"}
          className="w-32"
          onClick={() => onSelectAnswer("B")}
        >
          Select B
        </Button>
      </div>
    </div>
  );
}
