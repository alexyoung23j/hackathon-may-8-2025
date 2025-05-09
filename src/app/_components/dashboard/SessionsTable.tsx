import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { SessionDetailModal } from "./SessionDetailModal";

interface InterviewSession {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  status: string;
  processed: boolean;
}

const statusColors: Record<string, string> = {
  "in-progress": "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  abandoned: "bg-red-100 text-red-800",
};

export function SessionsTable({ linkId }: { linkId: string }) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: sessions,
    isLoading,
    refetch,
  } = api.session.getSessionsByLinkId.useQuery(
    { linkId },
    { refetchInterval: 60000 }, // Refresh every minute
  );

  const openSessionDetail = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="py-4 text-center text-gray-500">
        Loading interview sessions...
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No interview sessions found for this link.
      </div>
    );
  }

  // Type assertion
  const typedSessions = sessions as unknown as InterviewSession[];

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedSessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">
                  {session.id.substring(0, 8)}...
                </TableCell>
                <TableCell>
                  {format(new Date(session.startedAt), "PP p")}
                </TableCell>
                <TableCell>
                  {session.completedAt
                    ? format(new Date(session.completedAt), "PP p")
                    : "In progress"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={statusColors[session.status] ?? "bg-gray-100"}
                    variant="outline"
                  >
                    {session.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      session.processed
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }
                    variant="outline"
                  >
                    {session.processed ? "Processed" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSessionDetail(session.id)}
                    disabled={session.status !== "COMPLETED"}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedSessionId && (
        <SessionDetailModal
          sessionId={selectedSessionId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSessionId(null);
          }}
        />
      )}
    </>
  );
}
