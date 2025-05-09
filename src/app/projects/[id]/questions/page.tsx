import { notFound } from "next/navigation";
import Link from "next/link";
import { api, HydrateClient } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface QuestionsPageProps {
  params: {
    id: string;
  };
}

export default async function QuestionsPage({ params }: QuestionsPageProps) {
  const id = params.id;

  const project = await api.project.getProjectById({ id });

  if (!project) {
    notFound();
  }

  // Get the active CSV file
  const activeCsvFile = project.csvFiles?.[0];

  if (!activeCsvFile) {
    // Redirect back to project page if no CSV file exists
    return (
      <HydrateClient>
        <main className="container mx-auto px-4 py-10">
          <div className="mb-8">
            <Button asChild variant="ghost" className="mb-4">
              <Link
                href={`/projects/${id}`}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Back to project
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">No CSV File</h1>
            <p className="text-muted-foreground mt-2">
              Please upload a CSV file on the project page first.
            </p>
          </div>
        </main>
      </HydrateClient>
    );
  }

  // Get all questions for this CSV file
  const questionPairs = await api.project.getQuestionPairsByCSVFile({
    csvFileId: activeCsvFile.id,
  });

  return (
    <HydrateClient>
      <main className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href={`/projects/${id}`} className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to project
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{project.name}: Questions</h1>
              <p className="text-muted-foreground mt-1">
                {activeCsvFile.filename} • {questionPairs.length} questions
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {questionPairs.map((question, index) => (
            <div key={question.id} className="rounded-lg border p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium">
                  {index + 1}
                </div>
                <h3 className="text-lg font-medium">{question.questionText}</h3>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="bg-secondary/30 rounded-md p-4">
                  <div className="mb-2 text-sm font-medium">Answer A</div>
                  <div>{question.answerA}</div>
                </div>
                <div className="bg-secondary/30 rounded-md p-4">
                  <div className="mb-2 text-sm font-medium">Answer B</div>
                  <div>{question.answerB}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </HydrateClient>
  );
}
