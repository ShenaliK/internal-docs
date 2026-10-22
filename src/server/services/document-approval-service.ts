import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  rename,
  writeFile,
  open,
} from "node:fs/promises";
import path from "node:path";

interface DocumentProposal {
  id: string;
  projectSlug: string;
  createdAt: string;
  status: "pending" | "approved";
  existingMarkdown: string;
  proposedMarkdown: string;
}

export class ApprovalError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ApprovalError";
  }
}

export async function approveDocumentProposal(
  projectSlug: string,
  proposalId: string
) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug)) {
    throw new ApprovalError("Invalid project slug", 400);
  }

  if (!/^[0-9a-f-]{36}$/i.test(proposalId)) {
    throw new ApprovalError("Invalid proposal ID", 400);
  }

  const projectDirectory = path.join(
    process.cwd(),
    "content",
    projectSlug
  );

  const documentPath = path.join(
    projectDirectory,
    "documentation.md"
  );

  const proposalPath = path.join(
    projectDirectory,
    "proposals",
    `${proposalId}.json`
  );

  const lockPath = path.join(
    projectDirectory,
    ".approval.lock"
  );

  // Prevent two approval requests from running simultaneously.
  let lock: Awaited<ReturnType<typeof open>>;

  try {
    lock = await open(lockPath, "wx");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      throw new ApprovalError(
        "Another documentation update is in progress. Please try again.",
        409
      );
    }
    throw error;
  }

  try {
    let proposal: DocumentProposal;

    try {
      proposal = JSON.parse(
        await readFile(proposalPath, "utf-8")
      ) as DocumentProposal;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        throw new ApprovalError("Proposal not found", 404);
      }
      throw error;
    }

    if (
      proposal.id !== proposalId ||
      proposal.projectSlug !== projectSlug
    ) {
      throw new ApprovalError("Invalid proposal data", 400);
    }

    if (proposal.status !== "pending") {
      throw new ApprovalError(
        "This proposal has already been processed.",
        409
      );
    }

    const currentMarkdown = await readFile(
      documentPath,
      "utf-8"
    );

    // Reject an outdated proposal.
    if (currentMarkdown !== proposal.existingMarkdown) {
      throw new ApprovalError(
        "Documentation has changed since this proposal was created. Please upload the latest version again.",
        409
      );
    }

    // Create a backup before applying the new version.
    const versionsDirectory = path.join(
      projectDirectory,
      "versions"
    );

    await mkdir(versionsDirectory, { recursive: true });

    const versionId = randomUUID();
    const backupPath = path.join(
      versionsDirectory,
      `${versionId}.md`
    );

    await writeFile(backupPath, currentMarkdown, {
      encoding: "utf-8",
      flag: "wx",
    });

    // Write the approved document to a temporary file first.
    const temporaryPath = path.join(
      projectDirectory,
      `${randomUUID()}.tmp`
    );

    await writeFile(
      temporaryPath,
      proposal.proposedMarkdown,
      {
        encoding: "utf-8",
        flag: "wx",
      }
    );

    // Replace the current document with the approved version.
    await rename(temporaryPath, documentPath);

    // Mark the proposal as approved.
    proposal.status = "approved";

    await writeFile(
      proposalPath,
      JSON.stringify(proposal, null, 2),
      "utf-8"
    );

    return {
      projectSlug,
      proposalId,
      versionId,
      status: "approved" as const,
      message: "Documentation updated successfully.",
    };
  } finally {
    await lock.close();
    const { unlink } = await import("node:fs/promises");
    await unlink(lockPath);
  }
}
