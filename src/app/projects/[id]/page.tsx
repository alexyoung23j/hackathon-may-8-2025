// This is a server component
import { notFound } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { CsvSection } from "./_components/CsvSection";
import { InterviewLinkSection } from "./_components/InterviewLinkSection";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExportButton } from "~/app/_components/projects/ExportButton";
import { ProjectStats } from "~/app/_components/projects/ProjectStats";

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
        <div className="mb-4 flex items-center">
          <Link
            href="/"
            className="mr-3 inline-flex items-center rounded-md p-1 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Project Stats Section */}
        <div className="mb-6">
          <ProjectStats projectId={id} />
        </div>

        <div className="space-y-8">
          <div className="w-full">
            <CsvSection projectId={id} activeCsvFile={activeCsvFile} />
          </div>

          {hasQuestionPairs && (
            <div className="w-full">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Interviews</h2>
                  <p className="text-muted-foreground">
                    Create and manage links for expert interviews.
                  </p>
                </div>
                <ExportButton projectId={id} disabled={!hasQuestionPairs} />
              </div>
              <InterviewLinkSection
                projectId={id}
                hasQuestionPairs={hasQuestionPairs}
              />
            </div>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}
