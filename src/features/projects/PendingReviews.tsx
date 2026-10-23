"use client";

import { useEffect, useState } from "react";
import {
  Clock3,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import UploadDocumentationDialog from "@/features/projects/UploadDocumentationDialog";

interface ProposalSummary {
  id: string;
  projectSlug: string;
  createdAt: string;
  status: "pending";
}

interface PendingReviewsProps {
  projectSlug: string;
  projectName: string;
}

async function fetchPendingProposals(
  projectSlug: string,
  signal?: AbortSignal
): Promise<ProposalSummary[]> {
  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectSlug)}/proposals`,
    {
      cache: "no-store",
      signal,
    }
  );

  if (!response.ok) {
    throw new Error("Unable to load pending reviews.");
  }

  const data: { proposals: ProposalSummary[] } =
    await response.json();

  return data.proposals;
}

export default function PendingReviews({
  projectSlug,
  projectName,
}: PendingReviewsProps) {
  const [proposals, setProposals] =
    useState<ProposalSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [listOpen, setListOpen] = useState(false);

  const [selectedProposalId, setSelectedProposalId] =
    useState<string | null>(null);

  const [confirmingId, setConfirmingId] =
    useState<string | null>(null);

  const [discardingId, setDiscardingId] =
    useState<string | null>(null);

  const [discardError, setDiscardError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  // Load pending proposals when the component mounts
  // or when the reviews list needs refreshing.
  useEffect(() => {
    const controller = new AbortController();

    fetchPendingProposals(projectSlug, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        setProposals(result);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load pending reviews."
        );

        setLoading(false);
      });

    return () => controller.abort();
  }, [projectSlug, refreshKey]);

  // Refresh the list after uploading or approving
  // documentation.
  function handleRefresh() {
    setLoading(true);
    setError("");
    setRefreshKey((value) => value + 1);
  }

  // Open the pending reviews dialog.
  function handleOpenList() {
    setListOpen(true);
    handleRefresh();
  }

  // Close the list before opening the existing
  // documentation review dialog.
  function handleReview(proposalId: string) {
    setListOpen(false);
    setSelectedProposalId(proposalId);
  }

  // Open our own confirmation dialog instead of
  // using the browser's window.confirm().
  function handleRequestDiscard(proposalId: string) {
    if (discardingId !== null) return;

    setDiscardError("");
    setListOpen(false);
    setConfirmingId(proposalId);
  }

  // Cancel discarding and return to the reviews list.
  function handleCancelDiscard() {
    if (discardingId !== null) return;

    setConfirmingId(null);
    setDiscardError("");
    setListOpen(true);
  }

  // Discard the proposal only after confirmation.
  async function handleConfirmDiscard() {
    if (!confirmingId || discardingId !== null) return;

    const proposalId = confirmingId;

    setDiscardingId(proposalId);
    setDiscardError("");

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/proposals/${encodeURIComponent(proposalId)}`,
        {
          method: "DELETE",
        }
      );

      const result: {
        status?: string;
        error?: string;
      } | null = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to discard the proposal."
        );
      }

      if (result?.status !== "discarded") {
        throw new Error("Unexpected discard response.");
      }

      // Remove the discarded proposal immediately
      // from the visible list.
      setProposals((current) =>
        current.filter(
          (proposal) => proposal.id !== proposalId
        )
      );

      // Close confirmation and return to the list.
      setConfirmingId(null);
      setListOpen(true);
    } catch (err) {
      setDiscardError(
        err instanceof Error
          ? err.message
          : "Failed to discard the proposal."
      );
    } finally {
      setDiscardingId(null);
    }
  }

  return (
    <>
      {/* Compact project card actions */}
      <div className="flex flex-wrap items-center gap-2">
        <UploadDocumentationDialog
          projectSlug={projectSlug}
          projectName={projectName}
          proposalId={selectedProposalId}
          onCloseReview={() =>
            setSelectedProposalId(null)
          }
          onApproved={handleRefresh}
        />

        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenList}
        >
          <Clock3 className="h-4 w-4" />

          Pending Reviews (
          {loading
            ? "..."
            : error
              ? "!"
              : proposals.length}
          )
        </Button>
      </div>

      {/* Pending Reviews list dialog */}
      <Dialog
        open={listOpen}
        onOpenChange={setListOpen}
      >
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Pending Reviews
            </DialogTitle>

            <DialogDescription>
              Review or discard documentation updates
              for {projectName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading pending reviews...
              </p>
            ) : error ? (
              <div className="space-y-3">
                <p
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {error}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : proposals.length === 0 ? (
              <div className="rounded-lg border p-6 text-center">
                <p className="text-sm font-medium">
                  No pending reviews
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  All documentation updates have been
                  reviewed or discarded.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {proposals.length} update
                    {proposals.length === 1 ? "" : "s"}{" "}
                    awaiting review
                  </p>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                <div className="divide-y rounded-lg border">
                  {proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          Documentation update
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(
                            proposal.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleReview(proposal.id)
                          }
                        >
                          Review Changes
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          aria-label="Discard proposal"
                          title="Discard proposal"
                          onClick={() =>
                            handleRequestDiscard(proposal.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Application-styled discard confirmation */}
      <Dialog
        open={confirmingId !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleCancelDiscard();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>

              <DialogTitle>
                Discard pending review?
              </DialogTitle>
            </div>

            <DialogDescription>
              Are you sure you want to discard this
              documentation update for {projectName}?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-sm text-muted-foreground">
              This proposal will be removed from
              Pending Reviews. Your existing
              documentation will remain unchanged.
            </p>
          </div>

          {discardError && (
            <p
              role="alert"
              className="text-sm text-destructive"
            >
              {discardError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={discardingId !== null}
              onClick={handleCancelDiscard}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={discardingId !== null}
              onClick={() =>
                void handleConfirmDiscard()
              }
            >
              <Trash2 className="h-4 w-4" />

              {discardingId !== null
                ? "Discarding..."
                : "Discard Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
