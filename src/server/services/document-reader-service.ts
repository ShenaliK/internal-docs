import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseDocumentation } from "@/markdoc/parse-documentation";
import type { ParsedDocumentation } from "@/types/documentation";

export async function getProjectDocumentation(
  projectSlug: string
): Promise<ParsedDocumentation | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug)) {
    return null;
  }

  const filePath = path.join(
    process.cwd(),
    "content",
    projectSlug,
    "documentation.md"
  );

  let markdown: string;

  try {
    markdown = await readFile(filePath, "utf-8");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }

  return parseDocumentation(markdown);
}
