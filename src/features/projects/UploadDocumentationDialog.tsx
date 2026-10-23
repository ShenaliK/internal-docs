"use client";

import { useEffect, useState } from "react";
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
  proposalId?: string | null;
  onApproved?: () => void;
  onCloseReview?: () => void;
}

interface DocumentProposal {
  id: string;
  projectSlug: string;
  createdAt: string;
  status: string;
  existingMarkdown: string;
  proposedMarkdown: string;
}

type DialogStep = "upload" | "loading" | "review";

async function fetchProposal(
  projectSlug: string,
  proposalId: string,
  signal?: AbortSignal
): Promise<DocumentProposal> {
  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectSlug)}/proposals/${encodeURIComponent(proposalId)}`,
    {
      cache: "no-store",
      signal,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error || "Unable to load the saved proposal."
    );
  }

  return result as DocumentProposal;
}

export default function UploadDocumentationDialog({
  projectSlug,
  projectName,
  proposalId,
  onApproved,
  onCloseReview,
}: UploadDocumentationDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<DialogStep>("upload");

  const [proposal, setProposal] =
    useState<DocumentProposal | null>(null);

  const displayStep: DialogStep =
    proposalId && proposal?.id !== proposalId
      ? "loading"
      : step;

  useEffect(() => {
    if (!proposalId) return;

    const controller = new AbortController();

    fetchProposal(projectSlug, proposalId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        setProposal(result);
        setStep("review");
        setError("");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the saved proposal."
        );

        setStep("loading");
      });

    return () => controller.abort();
  }, [projectSlug, proposalId]);

  function resetDialog() {
    setFile(null);
    setError("");
    setStep("upload");
    setProposal(null);
  }

  function closeDialog() {
    if (uploading || applying) return;

    setOpen(false);
    resetDialog();

    if (proposalId) {
      onCloseReview?.();
    }
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
          result?.error ||
            "Failed to upload documentation."
        );
      }

      if (result.status === "pending_review") {
        setStep("loading");

        const savedProposal = await fetchProposal(
          projectSlug,
          result.proposalId
        );

        setProposal(savedProposal);
        setStep("review");

        onApproved?.();
        return;
      }

      if (result.status === "created") {
        setOpen(false);
        resetDialog();

        onApproved?.();
        router.refresh();
        return;
      }

      throw new Error("Unexpected upload response.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Upload failed."
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

      onCloseReview?.();
      onApproved?.();

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
      open={open || Boolean(proposalId)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeDialog();
        } else {
          setOpen(true);
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
          displayStep === "review"
            ? "w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto"
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>
            {displayStep === "review"
              ? "Review Documentation Update"
              : displayStep === "loading"
                ? "Loading Proposal"
                : "Upload Documentation"}
          </DialogTitle>

          <DialogDescription>
            {displayStep === "review"
              ? `Review the proposed changes for ${projectName}. Nothing has been applied yet.`
              : displayStep === "loading"
                ? `Loading the saved documentation proposal for ${projectName}.`
                : `Upload a Markdown file for ${projectName}. Existing documentation updates require approval.`}
          </DialogDescription>
        </DialogHeader>

        {displayStep === "upload" ? (
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
        ) : displayStep === "loading" ? (
          <div className="py-6">
            {error ? (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Loading saved changes...
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
          {displayStep === "upload" ? (
            <>
              <Button
                variant="outline"
                disabled={uploading}
                onClick={closeDialog}
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
          ) : displayStep === "loading" ? (
            <Button
              variant="outline"
              onClick={closeDialog}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={applying}
                onClick={closeDialog}
              >
                Close Preview
              </Button>

              <Button
                disabled={!proposal || applying}
                onClick={handleApplyUpdates}
              >
                {applying
                  ? "Applying..."
                  : "Apply Updates"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
