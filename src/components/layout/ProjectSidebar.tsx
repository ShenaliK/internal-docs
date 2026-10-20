"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, FolderOpen } from "lucide-react";

import { useSidebarStore } from "@/stores/sidebar-store";
import type { ProjectNavigation } from "@/server/services/navigation-service";

interface ProjectSidebarProps {
  projects: ProjectNavigation[];
}

export default function ProjectSidebar({
  projects,
}: ProjectSidebarProps) {
  const pathname = usePathname();

  const expandedProjectSlug = useSidebarStore(
    (state) => state.expandedProjectSlug
  );

  const toggleProject = useSidebarStore(
    (state) => state.toggleProject
  );

  const expandProject = useSidebarStore(
    (state) => state.expandProject
  );

  useEffect(() => {
    const activeProject = projects.find(
      (project) =>
        pathname === `/projects/${project.slug}` ||
        pathname.startsWith(`/docs/${project.slug}/`)
    );

    if (activeProject) {
      expandProject(activeProject.slug);
    }
  }, [pathname, projects, expandProject]);

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Projects
        </p>

        <nav aria-label="Project documentation">
          <div className="space-y-1">
            {projects.map((project) => {
              const isExpanded =
                expandedProjectSlug === project.slug;

              return (
                <div key={project.slug}>
                  <button
                    type="button"
                    onClick={() => toggleProject(project.slug)}
                    aria-expanded={isExpanded}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-accent"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4 shrink-0" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0" />
                    )}

                    <FolderOpen className="size-4 shrink-0 text-muted-foreground" />

                    <span className="truncate">{project.name}</span>
                  </button>

                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1 border-l pl-3">
                      {project.pages.length === 0 ? (
                        <p className="px-2 py-2 text-xs text-muted-foreground">
                          No documentation uploaded
                        </p>
                      ) : (
                        project.pages.map((page) => {
                          const href =
                            `/docs/${project.slug}/${page.slug}`;

                          const isActive = pathname === href;

                          return (
                            <Link
                              key={page.slug}
                              href={href}
                              aria-current={
                                isActive ? "page" : undefined
                              }
                              className={`block rounded-md px-2 py-2 text-sm transition-colors ${
                                isActive
                                  ? "bg-accent font-medium text-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              }`}
                            >
                              {page.title}
                            </Link>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
