import { notFound } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import CsvUploader from "~/app/_components/projects/CsvUploader";

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
            <h2 className="text-xl font-semibold">Upload CSV</h2>
            <p className="text-muted-foreground">
              Upload a CSV file with questions and candidate answers to
              evaluate.
            </p>
            <CsvUploader projectId={id} />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Interview Links</h2>
            <p className="text-muted-foreground">
              Create and manage links for expert interviews.
            </p>
            {/* Interview link management will be added in Step 3 */}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
