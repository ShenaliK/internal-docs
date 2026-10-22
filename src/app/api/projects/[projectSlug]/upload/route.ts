
import { NextResponse } from "next/server";
import { listProjects } from "@/server/services/project-service";
import { saveMarkdownDocument } from "@/server/services/document-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectSlug: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  const { projectSlug } = await context.params;

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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Markdown file is required" },
        { status: 400 }
      );
    }

    const result = await saveMarkdownDocument(
      projectSlug,
      file
    );

    return NextResponse.json(result, {
      status: result.status === "pending_review" ? 202 : 201,
    });
  } catch (error) {
    if (error instanceof Error) {
      const isValidationError =
        error.message.startsWith("Only Markdown") ||
        error.message.startsWith("File must") ||
        error.message.startsWith("Invalid Markdown") ||
        error.message.startsWith("Invalid project slug") ||
        error.message.startsWith("Markdown validation");

      if (isValidationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    console.error("Document upload failed:", error);

    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
