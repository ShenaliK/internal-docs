import { NextResponse } from "next/server";
import { listProjects } from "@/server/services/project-service";
import { getProjectDocumentation } from "@/server/services/document-reader-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectSlug: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { projectSlug } = await context.params;

  try {
    const projects = await listProjects();

    const projectExists = projects.some(
      (project) => project.slug === projectSlug
    );

    if (!projectExists) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const documentation =
      await getProjectDocumentation(projectSlug);

    if (!documentation) {
      return NextResponse.json(
        { error: "Documentation not uploaded yet" },
        { status: 404 }
      );
    }

    return NextResponse.json(documentation);
  } catch (error) {
    console.error("Failed to retrieve documentation:", error);

    return NextResponse.json(
      { error: "Failed to retrieve documentation" },
      { status: 500 }
    );
  }
}
