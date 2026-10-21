"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UploadDocumentationDialogProps {
  projectSlug: string;
  projectName: string;
}

export default function UploadDocumentationDialog({
  projectSlug,
  projectName,
}: UploadDocumentationDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) {
      setError("Please select a Markdown file.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.error || "Failed to upload documentation."
        );
      }

      setOpen(false);
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (uploading) return;

        setOpen(nextOpen);

        if (!nextOpen) {
          setFile(null);
          setError("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" />
            Upload Documentation
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Documentation</DialogTitle>
          <DialogDescription>
            Upload a Markdown file for {projectName}.
            This will replace the project&apos;s existing documentation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Input
            type="file"
            accept=".md,text/markdown"
            disabled={uploading}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError("");
            }}
          />

          <p className="text-xs text-muted-foreground">
            Supported format: .md (maximum 5 MB).
          </p>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}