import Link from "next/link";
import type {
  NavigationItem,
  NavigationSection,
} from "@/features/navigation/navigation-types";

interface SidebarProps {
  sections: NavigationSection[];
}

function SidebarItem({ item }: { item: NavigationItem }) {
  return (
    <div>
      <Link
        href={item.href}
        className="block rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
      >
        {item.title}
      </Link>

      {item.children && (
        <div className="ml-3 border-l pl-2">
          {item.children.map((child) => (
            <SidebarItem key={child.href} item={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ sections }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
      <nav
        aria-label="Documentation navigation"
        className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6"
      >
        {sections.map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h2>

            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
