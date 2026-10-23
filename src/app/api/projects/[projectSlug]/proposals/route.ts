import { NextResponse } from "next/server";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

interface ProposalSummary {
  id: string;
  projectSlug: string;
  createdAt: string;
  status: "pending";
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/projects/[projectSlug]/proposals">
) {
  const { projectSlug } = await context.params;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug)) {
    return NextResponse.json(
      { message: "Invalid project slug" },
      { status: 400 }
    );
  }

  const proposalsDirectory = path.join(
    process.cwd(),
    "content",
    projectSlug,
    "proposals"
  );

  try {
    const files = await readdir(proposalsDirectory);
    const proposals: ProposalSummary[] = [];

    for (const filename of files) {
      if (!/^[0-9a-f-]{36}\.json$/i.test(filename)) continue;

      try {
        const raw = await readFile(
          path.join(proposalsDirectory, filename),
          "utf-8"
        );

        const proposal: unknown = JSON.parse(raw);

        if (
          typeof proposal !== "object" ||
          proposal === null ||
          !("id" in proposal) ||
          !("projectSlug" in proposal) ||
          !("createdAt" in proposal) ||
          !("status" in proposal)
        ) {
          continue;
        }

        if (
          typeof proposal.id === "string" &&
          proposal.id === filename.replace(/\.json$/, "") &&
          proposal.projectSlug === projectSlug &&
          typeof proposal.createdAt === "string" &&
          proposal.status === "pending"
        ) {
          proposals.push({
            id: proposal.id,
            projectSlug,
            createdAt: proposal.createdAt,
            status: "pending",
          });
        }
      } catch {
        // Skip unreadable or malformed proposal files.
      }
    }

    proposals.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );

    return NextResponse.json({ proposals });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return NextResponse.json({ proposals: [] });
    }

    console.error("Failed to list proposals:", error);

    return NextResponse.json(
      { message: "Failed to load pending reviews" },
      { status: 500 }
    );
  }
}
