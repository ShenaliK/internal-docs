import { NextResponse } from "next/server";
import {
  readFile,
  writeFile,
  rename,
  unlink,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { listProjects } from "@/server/services/project-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectSlug: string;
    proposalId: string;
  }>;
};

interface StoredProposal {
  id: string;
  projectSlug: string;
  createdAt: string;
  status: string;
  existingMarkdown: string;
  proposedMarkdown: string;
  [key: string]: unknown;
}

function isValidRequest(
  projectSlug: string,
  proposalId: string
): boolean {
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug) &&
    /^[0-9a-f-]{36}$/i.test(proposalId)
  );
}

function getProposalPath(
  projectSlug: string,
  proposalId: string
): string {
  return path.join(
    process.cwd(),
    "content",
    projectSlug,
    "proposals",
    `${proposalId}.json`
  );
}

function isStoredProposal(
  value: unknown,
  projectSlug: string,
  proposalId: string
): value is StoredProposal {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const proposal = value as Record<string, unknown>;

  return (
    proposal.id === proposalId &&
    proposal.projectSlug === projectSlug &&
    typeof proposal.createdAt === "string" &&
    typeof proposal.status === "string" &&
    typeof proposal.existingMarkdown === "string" &&
    typeof proposal.proposedMarkdown === "string"
  );
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { projectSlug, proposalId } = await context.params;

  if (!isValidRequest(projectSlug, proposalId)) {
    return NextResponse.json(
      { error: "Invalid proposal request" },
      { status: 400 }
    );
  }

  try {
    const projects = await listProjects();

    const project = projects.find(
      (item) => item.slug === projectSlug
    );

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const proposalPath = getProposalPath(
      projectSlug,
      proposalId
    );

    let content: string;

    try {
      content = await readFile(proposalPath, "utf-8");
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return NextResponse.json(
          { error: "Proposal not found" },
          { status: 404 }
        );
      }

      throw error;
    }

    const parsed: unknown = JSON.parse(content);

    if (
      !isStoredProposal(
        parsed,
        projectSlug,
        proposalId
      )
    ) {
      return NextResponse.json(
        { error: "Invalid proposal data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: parsed.id,
      projectSlug: parsed.projectSlug,
      createdAt: parsed.createdAt,
      status: parsed.status,
      existingMarkdown: parsed.existingMarkdown,
      proposedMarkdown: parsed.proposedMarkdown,
    });
  } catch (error) {
    console.error("Failed to retrieve proposal:", error);

    return NextResponse.json(
      { error: "Unable to retrieve proposal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const { projectSlug, proposalId } = await context.params;

  if (!isValidRequest(projectSlug, proposalId)) {
    return NextResponse.json(
      { error: "Invalid proposal request" },
      { status: 400 }
    );
  }

  try {
    const projects = await listProjects();

    const project = projects.find(
      (item) => item.slug === projectSlug
    );

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const proposalPath = getProposalPath(
      projectSlug,
      proposalId
    );

    let content: string;

    try {
      content = await readFile(proposalPath, "utf-8");
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return NextResponse.json(
          { error: "Proposal not found" },
          { status: 404 }
        );
      }

      throw error;
    }

    const parsed: unknown = JSON.parse(content);

    if (
      !isStoredProposal(
        parsed,
        projectSlug,
        proposalId
      )
    ) {
      return NextResponse.json(
        { error: "Invalid proposal data" },
        { status: 500 }
      );
    }

    if (parsed.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "Only pending proposals can be discarded.",
        },
        { status: 409 }
      );
    }

    const updatedProposal = {
      ...parsed,
      status: "discarded",
      discardedAt: new Date().toISOString(),
    };

    const temporaryPath = path.join(
      process.cwd(),
      "content",
      projectSlug,
      "proposals",
      `${proposalId}.${randomUUID()}.tmp`
    );

    try {
      await writeFile(
        temporaryPath,
        JSON.stringify(updatedProposal, null, 2),
        {
          encoding: "utf-8",
          flag: "wx",
        }
      );

      await rename(temporaryPath, proposalPath);
    } finally {
      await unlink(temporaryPath).catch(() => {
        // Temporary file may already have been renamed.
      });
    }

    return NextResponse.json({
      id: proposalId,
      status: "discarded",
      message: "Proposal discarded successfully.",
    });
  } catch (error) {
    console.error("Failed to discard proposal:", error);

    return NextResponse.json(
      { error: "Unable to discard proposal" },
      { status: 500 }
    );
  }
}
