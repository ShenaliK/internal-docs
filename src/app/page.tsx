import DocsLayout from "@/components/layout/DocsLayout";
import type {
  NavigationSection,
} from "@/features/navigation/navigation-types";

const navigation: NavigationSection[] = [
  {
    title: "Documentation",
    items: [{ title: "Overview", href: "/" }],
  },
];

export default function HomePage() {
  return (
    <DocsLayout navigation={navigation}>
      <div className="mx-auto max-w-4xl">
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

        <section className="rounded-xl border p-6">
          <h2 className="mb-2 text-xl font-semibold">
            Your projects
          </h2>

          <p className="text-sm text-muted-foreground">
            No projects have been added yet.
            Once project management and document uploads
            are implemented, your projects will appear here.
          </p>
        </section>
      </div>
    </DocsLayout>
  );
}
