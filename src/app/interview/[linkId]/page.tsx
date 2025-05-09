import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { InterviewSession } from "~/app/_components/interview/InterviewSession";

interface InterviewPageProps {
  params: {
    linkId: string;
  };
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const linkId = params.linkId;

  // Validate link and initialize session
  const interviewLink = await db.interviewLink.findUnique({
    where: { id: linkId },
    include: { project: true },
  });

  if (!interviewLink || interviewLink.status === "EXPIRED") {
    return notFound();
  }

  // Create a new session if one doesn't exist
  let session = await db.interviewSession.findFirst({
    where: {
      interviewLinkId: interviewLink.id,
      status: "IN_PROGRESS",
    },
  });

  // Use nullish coalescing assignment
  session ??= await db.interviewSession.create({
    data: {
      interviewLinkId: interviewLink.id,
      startedAt: new Date(),
      status: "IN_PROGRESS",
    },
  });

  // Get questions for this interview
  const questions = await db.questionPair.findMany({
    where: { projectId: interviewLink.projectId },
    take: interviewLink.rowQuota ?? 10, // Default to 10 if not specified
  });

  if (questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold">No Questions Available</h1>
          <p>There are no questions available for this interview.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <h1 className="mb-6 text-2xl font-bold">
        Expert Interview: {interviewLink.project.name}
      </h1>

      <InterviewSession
        session={session}
        questions={questions}
        projectId={interviewLink.projectId}
      />
    </div>
  );
}
