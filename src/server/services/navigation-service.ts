import { listProjects } from "@/server/services/project-service";
import { getProjectDocumentation } from "@/server/services/document-reader-service";

export interface ProjectNavigation {
  name: string;
  slug: string;
  pages: {
    title: string;
    slug: string;
  }[];
}

export async function getProjectNavigation(): Promise<ProjectNavigation[]> {
  const projects = await listProjects();

  return Promise.all(
    projects.map(async (project) => {
      const documentation = await getProjectDocumentation(project.slug);

      return {
        name: project.name,
        slug: project.slug,
        pages:
          documentation?.pages.map((page) => ({
            title: page.title,
            slug: page.slug,
          })) ?? [],
      };
    })
  );
}
