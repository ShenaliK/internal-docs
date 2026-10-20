export interface DocumentationSection {
  title: string;
  slug: string;
  level: number;
}

export interface DocumentationPage {
  title: string;
  slug: string;
  markdown: string;
  sections: DocumentationSection[];
}

export interface ParsedDocumentation {
  title: string;
  pages: DocumentationPage[];
}
