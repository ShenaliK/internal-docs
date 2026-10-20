import type { DocumentationSection } from "@/types/documentation";

interface TableOfContentsProps {
  sections: DocumentationSection[];
}

export default function TableOfContents({
  sections,
}: TableOfContentsProps) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <aside className="hidden w-52 shrink-0 xl:block">
      <div className="sticky top-24">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          On this page
        </p>

        <nav aria-label="On this page">
          <ul className="space-y-3 border-l pl-4">
            {sections.map((section) => (
              <li
                key={section.slug}
                className={section.level >= 4 ? "pl-3" : ""}
              >
                <a
                  href={`#${section.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
