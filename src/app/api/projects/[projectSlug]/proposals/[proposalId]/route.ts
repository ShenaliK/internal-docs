import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { listProjects } from "@/server/services/project-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectSlug: string;
    proposalId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { projectSlug, proposalId } = await context.params;

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug) ||
    !/^[0-9a-f-]{36}$/i.test(proposalId)
  ) {
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

    const proposalPath = path.join(
      process.cwd(),
      "content",
      projectSlug,
      "proposals",
      `${proposalId}.json`
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

    const proposal = JSON.parse(content);

    if (
      proposal.id !== proposalId ||
      proposal.projectSlug !== projectSlug
    ) {
      return NextResponse.json(
        { error: "Invalid proposal data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: proposal.id,
      projectSlug: proposal.projectSlug,
      createdAt: proposal.createdAt,
      status: proposal.status,
      existingMarkdown: proposal.existingMarkdown,
      proposedMarkdown: proposal.proposedMarkdown,
    });
  } catch (error) {
    console.error("Failed to retrieve proposal:", error);

    return NextResponse.json(
      { error: "Unable to retrieve proposal" },
      { status: 500 }
    );
  }
}