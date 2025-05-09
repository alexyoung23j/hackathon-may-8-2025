import Link from "next/link";

import { api, HydrateClient } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import ProjectCard from "~/app/_components/projects/ProjectCard";
import NewProjectForm from "~/app/_components/projects/NewProjectForm";

export default async function Home() {
  const projects = await api.project.getProjects();

  return (
    <HydrateClient>
      <main className="container mx-auto px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Create analysis projects and manage expert interview links
            </p>
          </div>
          <NewProjectForm />
        </div>

        {projects.length === 0 ? (
          <div className="py-10 text-center">
            <h2 className="mb-2 text-xl font-semibold">No projects yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first project to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </HydrateClient>
  );
}
