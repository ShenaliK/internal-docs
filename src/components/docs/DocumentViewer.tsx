import React from "react";
import Markdoc, {type Node as MarkdocNode, type Config as MarkdocConfig,} from "@markdoc/markdoc";
import type { DocumentationPage } from "@/types/documentation";

interface DocumentViewerProps {
  page: DocumentationPage;
}

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function DocumentViewer({
  page,
}: DocumentViewerProps) {
  const ast = Markdoc.parse(page.markdown);

  const headingCounts = new Map<string, number>();

  const config = {
    nodes: {
      heading: {
        ...Markdoc.nodes.heading,
        transform(node: MarkdocNode, config: MarkdocConfig) {
          const children = node.transformChildren(config);
          const text = node.children
            .map((child) => {
              if (child.type === "text") {
                return String(child.attributes.content ?? "");
              }
              return "";
            })
            .join("");

          const base = createSlug(text) || "section";
          const count = (headingCounts.get(base) ?? 0) + 1;
          headingCounts.set(base, count);

          const id = count === 1 ? base : `${base}-${count}`;

          return new Markdoc.Tag(
            `h${node.attributes.level}`,
            { id },
            children
          );
        },
      },
    },
  };

  const content = Markdoc.transform(ast, config);

  return (
    <article className="min-w-0 max-w-3xl">
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {Markdoc.renderers.react(content, React)}
      </div>
    </article>
  );
}
