import DocsLayout from "@/components/layout/DocsLayout";
import CreateProjectDialog from "@/features/projects/CreateProjectDialog";
import PendingReviews from "@/features/projects/PendingReviews";
import { listProjects } from "@/server/services/project-service";
import { getProjectNavigation } from "@/server/services/navigation-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await listProjects();
  const projectNavigation = await getProjectNavigation();

  return (
    <DocsLayout projects={projectNavigation}>
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-sm font-medium text-indigo-600">
          INTERNAL DOCUMENTATION
        </p>

        <h1 className="mb-4 text-4xl font-semibold tracking-tight">
          Documentation
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
          A central place to explore projects, architecture,
          APIs, and technical documentation.
        </p>

        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            Your projects
          </h2>

          <CreateProjectDialog />
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border p-8 text-center">
            <p className="text-muted-foreground">
              No projects yet. Create your first project to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border p-6"
              >
                <h3 className="mb-2 text-lg font-semibold">
                  {project.name}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {project.description || "No description provided."}
                </p>

                <p className="mt-4 text-xs text-muted-foreground">
                  Created:{" "}
                  {new Date(project.createdAt).toLocaleDateString("en-GB")}
                </p>

                <div className="mt-5 border-t pt-4">
                  <PendingReviews
                    projectSlug={project.slug}
                    projectName={project.name}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DocsLayout>
  );
}
