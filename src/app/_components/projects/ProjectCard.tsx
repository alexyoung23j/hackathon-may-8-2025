import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
  };
};

export default function ProjectCard({ project }: ProjectCardProps) {
  // Format date as a simple string
  const formattedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString()
    : "N/A";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{project.name}</CardTitle>
        <CardDescription>Created: {formattedDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              project.status === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {project.status}
          </span>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
          <Link href={`/projects/${project.id}`}>View Project</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
