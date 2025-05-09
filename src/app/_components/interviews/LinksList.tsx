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
import { ClipboardCopy, Check } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { api } from "~/trpc/react";

interface InterviewLink {
  id: string;
  name: string;
  interviewName: string;
  url: string;
  createdAt: Date;
  expiryDate: Date | null;
  rowQuota: number | null;
  status: "unused" | "in-progress" | "completed";
}

type ToastType = {
  success: (message: string) => void;
};

const typedToast = toast as unknown as ToastType;

// Using Record instead of index signature
const statusColors: Record<InterviewLink["status"], string> = {
  unused: "bg-blue-100 text-blue-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

export function LinksList({ projectId }: { projectId: string }) {
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const {
    data: links,
    isLoading,
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

  if (isLoading) {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Link Name</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Questions</TableHead>
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
              <TableCell>{link.rowQuota ?? "All"}</TableCell>
              <TableCell>
                <Badge className={statusColors[link.status]} variant="outline">
                  {link.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
