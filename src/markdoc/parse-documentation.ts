import Markdoc, { type Node as MarkdocNode } from "@markdoc/markdoc";
import type {
  DocumentationPage,
  DocumentationSection,
  ParsedDocumentation,
} from "@/types/documentation";

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueSlug(
  title: string,
  usedSlugs: Set<string>
): string {
  const base = createSlug(title) || "section";
  let slug = base;
  let counter = 2;

  while (usedSlugs.has(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  usedSlugs.add(slug);
  return slug;
}

function getHeadingTitle(node: MarkdocNode): string {
  return node.children
    .map((child) => {
      if (child.type === "text") {
        return String(child.attributes.content ?? "");
      }

      return getHeadingTitle(child);
    })
    .join("")
    .trim();
}

export function parseDocumentation(
  markdown: string
): ParsedDocumentation {
  const ast = Markdoc.parse(markdown);

  const pages: DocumentationPage[] = [];
  const usedPageSlugs = new Set<string>();

  let documentTitle = "Documentation";
  let currentPage: DocumentationPage | null = null;
  let currentPageStart = 0;

  const lines = markdown.split(/\r?\n/);

  // Markdoc heading locations are used to divide the
  // original Markdown into separate pages.
  for (const node of ast.children) {
    if (node.type !== "heading") {
      continue;
    }

    const level = Number(node.attributes.level);
    const title = getHeadingTitle(node);

    if (!title || !node.location) {
      continue;
    }

    if (level === 1) {
      documentTitle = title;
      continue;
    }

    if (level === 2) {
      const headingLine = node.location.start.line - 1;

      if (currentPage) {
        currentPage.markdown = lines
          .slice(currentPageStart, headingLine)
          .join("\n")
          .trim();
      }

      currentPage = {
        title,
        slug: uniqueSlug(title, usedPageSlugs),
        markdown: "",
        sections: [],
      };

      pages.push(currentPage);
      currentPageStart = headingLine;
      continue;
    }

    if (level >= 3 && currentPage) {
      const usedSectionSlugs = new Set(
        currentPage.sections.map((section) => section.slug)
      );

      const section: DocumentationSection = {
        title,
        slug: uniqueSlug(title, usedSectionSlugs),
        level,
      };

      currentPage.sections.push(section);
    }
  }

  if (currentPage) {
    currentPage.markdown = lines
      .slice(currentPageStart)
      .join("\n")
      .trim();
  }

  return {
    title: documentTitle,
    pages,
  };
}
