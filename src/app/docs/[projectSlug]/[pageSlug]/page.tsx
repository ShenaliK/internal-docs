import { notFound } from "next/navigation";
import Link from "next/link";

import DocsLayout from "@/components/layout/DocsLayout";
import DocumentViewer from "@/components/docs/DocumentViewer";
import TableOfContents from "@/components/docs/TableOfContents";

import { getProjectNavigation } from "@/server/services/navigation-service";
import { getProjectDocumentation } from "@/server/services/document-reader-service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    projectSlug: string;
    pageSlug: string;
  }>;
}

export default async function DocumentationPage({
  params,
}: PageProps) {
  const { projectSlug, pageSlug } = await params;

  const projects = await getProjectNavigation();
  const project = projects.find(
    (item) => item.slug === projectSlug
  );

  if (!project) {
    notFound();
  }

  const documentation =
    await getProjectDocumentation(projectSlug);

  const page = documentation?.pages.find(
    (item) => item.slug === pageSlug
  );

  if (!page) {
    notFound();
  }

  return (
    <DocsLayout projects={projects}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Documentation
          </Link>
          {" / "}
          {project.name}
          {" / "}
          {page.title}
        </div>

        <div className="flex items-stretch gap-8">
          <div className="min-w-0 flex-1">
            <DocumentViewer page={page} />
          </div>

          <TableOfContents sections={page.sections} />
        </div>
      </div>
    </DocsLayout>
  );
}
