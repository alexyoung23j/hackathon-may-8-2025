"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { LinksList } from "~/app/_components/interviews/LinksList";
import { NewLinkForm } from "~/app/_components/interviews/NewLinkForm";
import { api } from "~/trpc/react";

interface InterviewLinkSectionProps {
  projectId: string;
  hasQuestionPairs: boolean;
}

export function InterviewLinkSection({
  projectId,
  hasQuestionPairs,
}: InterviewLinkSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const {
    data: links,
    isLoading,
    refetch,
  } = api.interviewLink.getInterviewLinksByProjectId.useQuery({ projectId });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    void refetch();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Interview Links</CardTitle>
          <CardDescription>
            Create and share links for expert evaluations
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => setIsFormOpen(true)}
          disabled={!hasQuestionPairs}
        >
          <PlusCircle className="mr-1 h-4 w-4" />
          New Link
        </Button>
      </CardHeader>
      <CardContent>
        {!hasQuestionPairs ? (
          <div className="bg-muted rounded-md p-4 text-center">
            <p className="text-muted-foreground text-sm">
              Please upload a CSV file with questions and answers before
              creating interview links.
            </p>
          </div>
        ) : (
          <LinksList projectId={projectId} />
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Interview Link</DialogTitle>
              <DialogDescription>
                Generate a new link to share with an expert for evaluation.
              </DialogDescription>
            </DialogHeader>
            <NewLinkForm projectId={projectId} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
