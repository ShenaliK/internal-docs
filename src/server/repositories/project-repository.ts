import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Project } from "@/types/project";

const filePath = path.join(
  process.cwd(),
  "data",
  "projects.json"
);

export async function getAllProjects(): Promise<Project[]> {
  const fileContent = await readFile(filePath, "utf-8");

  return JSON.parse(fileContent) as Project[];
}

export async function saveProject(
  project: Project
): Promise<Project> {
  const projects = await getAllProjects();

  projects.push(project);

  await writeFile(
    filePath,
    JSON.stringify(projects, null, 2),
    "utf-8"
  );

  return project;
}
