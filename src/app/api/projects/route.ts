import { NextResponse } from "next/server";
import {
  createProject,
  listProjects,
} from "@/server/services/project-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await listProjects();

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to retrieve projects:", error);

    return NextResponse.json(
      { error: "Failed to retrieve projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { error: "Expected a project object" },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;

  if (
    typeof input.name !== "string" ||
    (input.description !== undefined &&
      typeof input.description !== "string")
  ) {
    return NextResponse.json(
      { error: "Invalid project name or description" },
      { status: 400 }
    );
  }

  try {
    const project = await createProject({
      name: input.name,
      description: input.description as string | undefined,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof Error &&
        (error.message.includes("required") ||
         error.message.includes("characters") ||
         error.message.includes("already exists"))) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("already exists") ? 409 : 400 }
      );
    }

    console.error("Failed to create project:", error);

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
