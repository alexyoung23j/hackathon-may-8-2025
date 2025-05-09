"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpIcon, Loader2Icon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/trpc/react";

type CsvUploaderProps = {
  projectId: string;
};

export default function CsvUploader({ projectId }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  // We'll need to implement this tRPC procedure
  const uploadCsv = api.project.uploadCsv.useMutation({
    onSuccess: () => {
      setFile(null);
      router.refresh();
    },
  });

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvContent = e.target?.result as string;
      uploadCsv.mutate({
        projectId,
        csvContent,
        filename: file.name,
      });
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">CSV Upload</CardTitle>
        <CardDescription>
          Upload a CSV file with questions and answers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileUpIcon className="text-muted-foreground mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">
            {file ? file.name : "Drag & Drop CSV"}
          </h3>
          <p className="text-muted-foreground mt-2 text-sm">
            {file
              ? `${(file.size / 1024).toFixed(2)} KB`
              : "or click to browse files"}
          </p>
          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {!file && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => document.getElementById("csv-upload")?.click()}
            >
              Select File
            </Button>
          )}
        </div>
      </CardContent>
      {file && (
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={uploadCsv.isPending}
          >
            {uploadCsv.isPending ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload CSV"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
