import { NextResponse } from "next/server";
import { listProjects } from "@/server/services/project-service";
import {
  approveDocumentProposal,
  ApprovalError,
} from "@/server/services/document-approval-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectSlug: string;
    proposalId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext
) {
  const { projectSlug, proposalId } = await context.params;

  try {
    const projects = await listProjects();

    if (!projects.some((project) => project.slug === projectSlug)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const result = await approveDocumentProposal(
      projectSlug,
      proposalId
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApprovalError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Document approval failed:", error);

    return NextResponse.json(
      { error: "Failed to approve documentation update" },
      { status: 500 }
    );
  }
}