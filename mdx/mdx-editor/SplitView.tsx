"use client";

import { useMemo } from "react";
import { MdxEditor } from "./MonacoEditor";
import { MdxPreview } from "./PreviewRenderer";

interface SplitViewProps {
  mdx: string;
  setMdx: (value: string) => void;
  viewMode: "split" | "editor" | "preview";
}

export default function SplitView({ mdx, setMdx, viewMode }: SplitViewProps) {
  const editorHeight = useMemo(() => {
    const lineHeight = 24;
    const padding = 48; // top+bottom from Monaco padding
    const minHeight = 560;
    const maxHeight = 1600;

    const logicalLines = mdx.split("\n").reduce((total, line) => {
      const visualLines = Math.max(1, Math.ceil(line.length / 90));
      return total + visualLines;
    }, 0);

    const estimated = logicalLines * lineHeight + padding;
    return Math.min(maxHeight, Math.max(minHeight, estimated));
  }, [mdx]);

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col md:flex-row md:divide-x md:divide-border">
      <div
        className={`flex-1 flex flex-col ${viewMode === "preview" ? "hidden" : ""}`}
        style={{ minHeight: editorHeight }}
      >
        <MdxEditor value={mdx} onChange={setMdx} height={editorHeight} />
      </div>

      {viewMode === "split" && <div className="md:hidden h-px bg-border" />}

      <div
        className={`flex-1 flex flex-col ${viewMode === "editor" ? "hidden" : ""}`}
        style={{ minHeight: editorHeight }}
      >
        <div className="bg-card px-8 pt-4 pb-8">
          <MdxPreview source={mdx} />
        </div>
      </div>
    </div>
  );
}
