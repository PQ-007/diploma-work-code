
"use client";

import { MdxEditor } from "./MonacoEditor";
import { MdxPreview } from "./PreviewRenderer";

interface SplitViewProps {
  mdx: string;
  setMdx: (value: string) => void;
  viewMode: "split" | "editor" | "preview";
}

export default function SplitView({ mdx, setMdx, viewMode }: SplitViewProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm min-h-[600px] h-[calc(100vh-300px)] flex flex-col md:flex-row">
      {/* Editor Pane */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${
          viewMode === "preview" ? "hidden" : ""
        }`}
      >
        
        {/* Editor Content */}
        <div className="flex-1 overflow-auto bg-card">
          <MdxEditor value={mdx} onChange={setMdx} />
        </div>
      </div>

      {/* Divider */}
      {viewMode === "split" && (
        <div className="w-px bg-border flex-shrink-0 hidden md:block" />
      )}
      {viewMode === "split" && (
        <div className="h-px bg-border flex-shrink-0 md:hidden" />
      )}

      {/* Preview Pane */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${
          viewMode === "editor" ? "hidden" : ""
        }`}
      >
        
        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto bg-card px-8 py-8">
          <MdxPreview source={mdx} />
        </div>
      </div>
    </div>
  );
}