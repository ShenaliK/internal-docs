export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}
