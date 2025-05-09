"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { DownloadIcon, LoaderCircle } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface ExportButtonProps {
  projectId: string;
  disabled?: boolean;
}

export function ExportButton({
  projectId,
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportMutation = api.project.exportProjectData.useMutation({
    onSuccess: (data) => {
      // Create a blob from the CSV data
      const blob = new Blob([data.csvData], { type: "text/csv" });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;

      // Append the link to the document
      document.body.appendChild(link);

      // Click the link to start the download
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Export completed successfully");
      setIsExporting(false);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
      setIsExporting(false);
    },
  });

  const handleExport = () => {
    setIsExporting(true);
    exportMutation.mutate({ projectId });
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export Results
        </>
      )}
    </Button>
  );
}
