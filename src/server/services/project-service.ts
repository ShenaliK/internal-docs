import { randomUUID } from "node:crypto";
import {
  getAllProjects,
  saveProject,
} from "@/server/repositories/project-repository";
import type {
  CreateProjectInput,
  Project,
} from "@/types/project";

export async function listProjects(): Promise<Project[]> {
  return getAllProjects();
}

export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  const name = input.name?.trim();
  const description = input.description?.trim() ?? "";

  if (!name) {
    throw new Error("Project name is required");
  }

  if (name.length > 100) {
    throw new Error("Project name must be 100 characters or fewer");
  }

  if (description.length > 1000) {
    throw new Error("Description must be 1000 characters or fewer");
  }

  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    throw new Error("Project name must contain letters or numbers");
  }

  const existingProjects = await getAllProjects();

  if (existingProjects.some((project) => project.slug === slug)) {
    throw new Error("A project with this name already exists");
  }

  const project: Project = {
    id: randomUUID(),
    name,
    slug,
    description,
    createdAt: new Date().toISOString(),
  };

  return saveProject(project);
}
