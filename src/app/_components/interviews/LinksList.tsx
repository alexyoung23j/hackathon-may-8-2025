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
import { ClipboardCopy, Check, EyeIcon } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { SessionDetailModal } from "~/app/_components/dashboard/SessionDetailModal";

interface InterviewLink {
  id: string;
  name: string;
  interviewName: string;
  url: string;
  createdAt: Date;
  expiryDate: Date | null;
  status: "unused" | "in-progress" | "COMPLETED";
}

type ToastType = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const typedToast = toast as unknown as ToastType;

// Using Record instead of index signature
const statusColors: Record<InterviewLink["status"], string> = {
  unused: "bg-blue-100 text-blue-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export function LinksList({ projectId }: { projectId: string }) {
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);
  const [isLoadingSessionFor, setIsLoadingSessionFor] = useState<string | null>(
    null,
  );

  const utils = api.useUtils();

  const {
    data: links,
    isLoading: isLoadingLinks,
    refetch,
  } = api.interviewLink.getInterviewLinksByProjectId.useQuery(
    { projectId },
    { refetchInterval: 30000 }, // Refresh every 30 seconds
  );

  const copyToClipboard = (url: string, id: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedLinkId(id);
      typedToast.success("Link copied to clipboard");
      setTimeout(() => setCopiedLinkId(null), 2000);
    });
  };

  const openSessionDetail = async (linkId: string) => {
    setIsLoadingSessionFor(linkId);
    try {
      const session = await utils.session.getFirstSessionByLinkId.fetch({
        linkId,
      });
      if (session) {
        setSelectedSessionId(session.id);
        setIsSessionDetailOpen(true);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load session details";
      typedToast.error(errorMessage);
      console.error("Error fetching session:", error);
    } finally {
      setIsLoadingSessionFor(null);
    }
  };

  if (isLoadingLinks) {
    return (
      <div className="py-4 text-center text-gray-500">
        Loading interview links...
      </div>
    );
  }

  if (!links || links.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No interview links generated yet.
      </div>
    );
  }

  // Type assertion to make TypeScript recognize our interface
  const typedLinks = links as unknown as InterviewLink[];

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Link Name</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedLinks.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-medium">{link.name}</TableCell>
                <TableCell>{link.interviewName}</TableCell>
                <TableCell>{format(new Date(link.createdAt), "PP")}</TableCell>
                <TableCell>
                  {link.expiryDate
                    ? format(new Date(link.expiryDate), "PP")
                    : "Never"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={statusColors[link.status]}
                    variant="outline"
                  >
                    {link.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {link.status === "COMPLETED" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSessionDetail(link.id)}
                      disabled={isLoadingSessionFor === link.id}
                    >
                      <EyeIcon className="mr-1 h-4 w-4" />
                      {isLoadingSessionFor === link.id
                        ? "Loading..."
                        : "See Results"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(link.url, link.id)}
                    >
                      {copiedLinkId === link.id ? (
                        <Check className="mr-1 h-4 w-4" />
                      ) : (
                        <ClipboardCopy className="mr-1 h-4 w-4" />
                      )}
                      {copiedLinkId === link.id ? "Copied" : "Copy Link"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Session Detail Modal */}
      {selectedSessionId && (
        <SessionDetailModal
          sessionId={selectedSessionId}
          isOpen={isSessionDetailOpen}
          onClose={() => {
            setIsSessionDetailOpen(false);
            setSelectedSessionId(null);
          }}
        />
      )}
    </>
  );
}
