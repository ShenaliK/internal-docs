import type { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import type {
  NavigationSection,
} from "@/features/navigation/navigation-types";

interface DocsLayoutProps {
  children: ReactNode;
  navigation: NavigationSection[];
}

export default function DocsLayout({
  children,
  navigation,
}: DocsLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <Sidebar sections={navigation} />

        <main className="min-w-0 flex-1 px-6 py-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
