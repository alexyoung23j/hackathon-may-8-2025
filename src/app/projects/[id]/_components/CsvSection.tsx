"use client";

import { useState } from "react";
import Link from "next/link";
import CsvUploader from "~/app/_components/projects/CsvUploader";
import { Button } from "~/components/ui/button";
import { FileIcon, Upload } from "lucide-react";

type CsvSectionProps = {
  projectId: string;
  activeCsvFile?: {
    id: string;
    filename: string;
    rowCount: number;
    uploadedAt: Date;
  } | null;
};

export function CsvSection({ projectId, activeCsvFile }: CsvSectionProps) {
  const [showUploader, setShowUploader] = useState(false);

  // If no CSV file exists or uploader is toggled, show the uploader
  if (!activeCsvFile || showUploader) {
    return (
      <div className={!activeCsvFile ? "mx-auto max-w-2xl" : ""}>
        <h2 className="stext-xl font-semibold">Upload CSV</h2>
        <p className="text-muted-foreground">
          Upload a CSV file with questions and candidate answers to evaluate.
        </p>
        <CsvUploader projectId={projectId} />

        {activeCsvFile && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground mt-2 flex h-auto items-center gap-1 px-0 text-sm font-normal"
            onClick={() => setShowUploader(false)}
          >
            Cancel
          </Button>
        )}
      </div>
    );
  }

  // Otherwise show CSV file summary
  return (
    <>
      <h2 className="mb-2 text-xl font-semibold">Uploaded CSV</h2>
      <div className="bg-card overflow-hidden rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            <FileIcon className="text-primary h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{activeCsvFile.filename}</p>
            <p className="text-muted-foreground text-sm">
              {activeCsvFile.rowCount} questions • Uploaded{" "}
              {new Date(activeCsvFile.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto flex items-center gap-1"
            asChild
          >
            <Link href={`/projects/${projectId}/questions`}>
              View Questions
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground flex h-auto items-center gap-1 px-0 text-sm font-normal"
          onClick={() => setShowUploader(true)}
        >
          <Upload className="h-3 w-3" />
          Upload a new CSV
        </Button>
      </div>
    </>
  );
}
