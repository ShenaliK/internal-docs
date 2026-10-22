
"use client";

import { diffLines } from "diff";

interface MarkdownDiffViewerProps {
  oldMarkdown: string;
  newMarkdown: string;
}

export default function MarkdownDiffViewer({
  oldMarkdown,
  newMarkdown,
}: MarkdownDiffViewerProps) {
  const changes = diffLines(oldMarkdown, newMarkdown);

  return (
    <div className="min-w-0 w-full">
      <div className="max-h-[55vh] w-full overflow-x-hidden overflow-y-auto rounded-md border font-mono text-xs">
        {changes.map((change, index) => {
          const lines = change.value
            .replace(/\n$/, "")
            .split("\n");

          return (
            <div
              key={index}
              className={
                change.added
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : change.removed
                    ? "bg-red-500/10 text-red-700 dark:text-red-400"
                    : ""
              }
            >
              {lines.map((line, lineIndex) => (
                <div
                    key={lineIndex}
                    className="flex min-w-0 gap-3 px-3 py-1"
                >
                    <span className="w-3 shrink-0 select-none text-muted-foreground">
                        {change.added ? "+" : change.removed ? "−" : " "}
                    </span>

                    <span className="min-w-0 whitespace-pre-wrap wrap-break-word">
                        {line || " "}
                    </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
