import { listProjects } from "@/server/services/project-service";
import { getProjectDocumentation } from "@/server/services/document-reader-service";

export interface SearchResult {
  projectName: string;
  projectSlug: string;
  pageTitle: string;
  pageSlug: string;
  snippet: string;
  url: string;
}

export async function searchDocumentation(
  query: string
): Promise<SearchResult[]> {
  const searchTerm = query.trim().toLowerCase();

  if (!searchTerm) {
    return [];
  }

  const projects = await listProjects();
  const results: SearchResult[] = [];

  for (const project of projects) {
    const documentation = await getProjectDocumentation(project.slug);

    if (!documentation) {
      continue;
    }

    for (const page of documentation.pages) {
      const searchableText = [
        project.name,
        page.title,
        page.markdown,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(searchTerm)) {
        continue;
      }

      const plainText = page.markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[#*`>|_~]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const matchIndex = plainText.toLowerCase().indexOf(searchTerm);

      const snippetStart =
        matchIndex >= 0 ? Math.max(0, matchIndex - 50) : 0;

      const snippet = plainText.slice(snippetStart, snippetStart + 160);

      results.push({
        projectName: project.name,
        projectSlug: project.slug,
        pageTitle: page.title,
        pageSlug: page.slug,
        snippet,
        url: `/docs/${project.slug}/${page.slug}`,
      });
    }
  }

  return results;
}