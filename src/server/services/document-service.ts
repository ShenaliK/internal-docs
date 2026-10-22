import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Markdoc from "@markdoc/markdoc";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getProjectDirectory(projectSlug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug)) {
    throw new Error("Invalid project slug");
  }

  return path.join(process.cwd(), "content", projectSlug);
}

async function validateMarkdownFile(file: File): Promise<string> {
  if (!file.name.toLowerCase().endsWith(".md")) {
    throw new Error("Only Markdown (.md) files are allowed");
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    throw new Error("File must be between 1 byte and 5 MB");
  }

  const content = await file.text();

  if (content.includes("\0")) {
    throw new Error("Invalid Markdown file");
  }

  const ast = Markdoc.parse(content);
  const errors = Markdoc.validate(ast);

  if (errors.some((error) => error.error.level === "error")) {
    throw new Error("Markdown validation failed");
  }

  return content;
}

export async function saveMarkdownDocument(
  projectSlug: string,
  file: File
) {
  const projectDirectory = getProjectDirectory(projectSlug);
  const content = await validateMarkdownFile(file);

  await mkdir(projectDirectory, { recursive: true });

  const filePath = path.join(projectDirectory, "documentation.md");

  // Only create a new document. Never overwrite an existing one.
  try {
    await writeFile(filePath, content, { encoding: "utf-8", flag: "wx" });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      return createDocumentProposal(projectSlug, content);
    }

    throw error;
  }

  return {
    projectSlug,
    filename: "documentation.md",
    size: file.size,
    status: "created" as const,
  };
}

async function createDocumentProposal(
  projectSlug: string,
  newMarkdown: string
) {
  const projectDirectory = getProjectDirectory(projectSlug);

  const existingMarkdown = await readFile(
    path.join(projectDirectory, "documentation.md"),
    "utf-8"
  );

  const proposalDirectory = path.join(projectDirectory, "proposals");

  await mkdir(proposalDirectory, { recursive: true });

  const proposalId = crypto.randomUUID();

  const proposalPath = path.join(
    proposalDirectory,
    `${proposalId}.json`
  );

  const proposal = {
    id: proposalId,
    projectSlug,
    createdAt: new Date().toISOString(),
    status: "pending",
    existingMarkdown,
    proposedMarkdown: newMarkdown,
  };

  await writeFile(
    proposalPath,
    JSON.stringify(proposal, null, 2),
    { encoding: "utf-8", flag: "wx" }
  );

  return {
    projectSlug,
    proposalId,
    status: "pending_review" as const,
    message: "Documentation changes are awaiting review.",
  };
}