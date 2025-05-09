// This is a server component
import { notFound } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { CsvSection } from "./_components/CsvSection";
import { InterviewLinkSection } from "./_components/InterviewLinkSection";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const id = params.id;

  const project = await api.project.getProjectById({ id });

  if (!project) {
    notFound();
  }

  // Check if project has an active CSV file
  const activeCsvFile = project.csvFiles?.[0];
  const hasQuestionPairs = !!activeCsvFile && activeCsvFile.rowCount > 0;

  return (
    <HydrateClient>
      <main className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <CsvSection projectId={id} activeCsvFile={activeCsvFile} />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Interview Links</h2>
            <p className="text-muted-foreground">
              Create and manage links for expert interviews.
            </p>
            <InterviewLinkSection
              projectId={id}
              hasQuestionPairs={hasQuestionPairs}
            />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
