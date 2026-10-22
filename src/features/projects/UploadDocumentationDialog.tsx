
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import MarkdownDiffViewer from "@/components/docs/MarkdownDiffViewer";

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

interface DocumentProposal {
  id: string;
  projectSlug: string;
  createdAt: string;
  status: string;
  existingMarkdown: string;
  proposedMarkdown: string;
}

type DialogStep = "upload" | "review";

export default function UploadDocumentationDialog({
  projectSlug,
  projectName,
}: UploadDocumentationDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<DialogStep>("upload");
  const [proposal, setProposal] = useState<DocumentProposal | null>(null);

  function resetDialog() {
    setFile(null);
    setError("");
    setStep("upload");
    setProposal(null);
  }

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to upload documentation."
        );
      }

      if (result.status === "pending_review") {
        const proposalResponse = await fetch(
          `/api/projects/${encodeURIComponent(projectSlug)}/proposals/${encodeURIComponent(result.proposalId)}`
        );

        if (!proposalResponse.ok) {
          const proposalError = await proposalResponse
            .json()
            .catch(() => null);

          throw new Error(
            proposalError?.error ||
              "Unable to load the documentation proposal."
          );
        }

        const proposalData: DocumentProposal =
          await proposalResponse.json();

        setProposal(proposalData);
        setStep("review");
        return;
      }

      if (result.status === "created") {
        setOpen(false);
        resetDialog();
        router.refresh();
        return;
      }

      throw new Error("Unexpected upload response.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleApplyUpdates() {
    if (!proposal || applying) return;

    setApplying(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/proposals/${encodeURIComponent(proposal.id)}/approve`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to apply documentation update."
        );
      }

      if (result.status !== "approved") {
        throw new Error("Unexpected approval response.");
      }

      setOpen(false);
      resetDialog();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to apply documentation update."
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (uploading || applying) return;

        setOpen(nextOpen);

        if (!nextOpen) {
          resetDialog();
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

      <DialogContent
        className={
          step === "review"
            ? "w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto"
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>
            {step === "review"
              ? "Review Documentation Update"
              : "Upload Documentation"}
          </DialogTitle>

          <DialogDescription>
            {step === "review"
              ? `Review the proposed documentation changes for ${projectName}. No changes have been applied yet.`
              : `Upload a Markdown file for ${projectName}. If documentation already exists, you will review the proposed update before applying it.`}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
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
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {proposal && (
              <MarkdownDiffViewer
                oldMarkdown={proposal.existingMarkdown}
                newMarkdown={proposal.proposedMarkdown}
              />
            )}

            {error && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" ? (
            <>
              <Button
                variant="outline"
                disabled={uploading}
                onClick={() => {
                  setOpen(false);
                  resetDialog();
                }}
              >
                Cancel
              </Button>

              <Button
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={applying}
                onClick={() => {
                  setOpen(false);
                  resetDialog();
                }}
              >
                Close Preview
              </Button>

              <Button
                disabled={!proposal || applying}
                onClick={handleApplyUpdates}
              >
                {applying ? "Applying..." : "Apply Updates"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
