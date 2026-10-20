import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import Markdoc from "@markdoc/markdoc";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function saveMarkdownDocument(
  projectSlug: string,
  file: File
) {
  if (!file.name.toLowerCase().endsWith(".md")) {
    throw new Error("Only Markdown (.md) files are allowed");
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    throw new Error("File must be between 1 byte and 5 MB");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug)) {
    throw new Error("Invalid project slug");
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

  const projectDirectory = path.join(
    process.cwd(),
    "content",
    projectSlug
  );

  await mkdir(projectDirectory, { recursive: true });

  const filePath = path.join(
    projectDirectory,
    "documentation.md"
  );

  await writeFile(filePath, content, "utf-8");

  return {
    projectSlug,
    filename: "documentation.md",
    size: file.size,
  };
}
