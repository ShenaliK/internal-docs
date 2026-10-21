"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SearchResult {
  projectName: string;
  projectSlug: string;
  pageTitle: string;
  pageSlug: string;
  snippet: string;
  url: string;
}

export default function DocumentationSearchDialog() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !query.trim()) {
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Search failed.");
        }

        const data = await response.json();
        setResults(data.results);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setError("Unable to search documentation.");
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, open]);

  function handleQueryChange(value: string) {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      setError("");
    } else {
      setLoading(true);
    }
  }

  function handleResultClick(url: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(url);
  }

  return (
    <Dialog 
    open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
        setQuery("");
        setResults([]);
        setLoading(false);
        setError("");
       }
     }} 
    >
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Search documentation"
          >
            <Search className="h-5 w-5" />
            <span className="hidden sm:inline">Search</span>
          </button>
        }
      />

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Search documentation</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

          <input
            autoFocus
            type="search"
            placeholder="Search projects and documentation..."
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            maxLength={200}
            className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">
              {error}
            </p>
          ) : !query.trim() ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Enter a keyword to search your documentation.
            </p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No matching documentation found.
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={`${result.projectSlug}-${result.pageSlug}`}
                  type="button"
                  onClick={() => handleResultClick(result.url)}
                  className="flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted"
                >
                  <FileText className="mt-1 h-4 w-4 shrink-0 text-indigo-600" />

                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {result.pageTitle}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.projectName}
                    </p>

                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {result.snippet}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}