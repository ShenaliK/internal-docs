import Link from "next/link";
import type {
  NavigationSection,
} from "@/features/navigation/navigation-types";

interface SidebarProps {
  sections: NavigationSection[];
}

export default function Sidebar({ sections }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
      <nav className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6">
        {sections.map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h2>

            <div className="space-y-1">
              {section.items.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    {item.title}
                  </Link>

                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded-md py-2 pl-7 pr-3 text-sm text-muted-foreground hover:bg-sidebar-accent"
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
