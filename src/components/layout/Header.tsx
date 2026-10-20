import Link from "next/link";
import { BookOpen, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-6">
      <Link href="/" className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-indigo-600" />
        <span className="text-lg font-semibold tracking-tight">
          Internal Docs
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Documentation Portal
        </span>
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
    </header>
  );
}
