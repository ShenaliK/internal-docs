import type { ReactNode } from "react";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ProjectSidebar from "@/components/layout/ProjectSidebar";

import type { NavigationSection } from "@/features/navigation/navigation-types";
import type { ProjectNavigation } from "@/server/services/navigation-service";

interface DocsLayoutProps {
  children: ReactNode;
  navigation?: NavigationSection[];
  projects?: ProjectNavigation[];
}

export default function DocsLayout({
  children,
  navigation = [],
  projects,
}: DocsLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-1">
        {projects ? (
          <ProjectSidebar projects={projects} />
        ) : (
          <Sidebar sections={navigation} />
        )}

        <main className="min-w-0 flex-1 px-6 py-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
