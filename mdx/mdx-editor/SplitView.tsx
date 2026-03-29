"use client";

import { MdxEditor } from "./MonacoEditor";
import { MdxPreview } from "./PreviewRenderer";

interface SplitViewProps {
  mdx: string;
  setMdx: (value: string) => void;
  viewMode: "split" | "editor" | "preview";
  onSave?: () => void;
  onFormatBold?: () => void;
  onFormatItalic?: () => void;
  onInsertImage?: () => void;
  onTogglePreview?: () => void;
}

export default function SplitView({
  mdx,
  setMdx,
  viewMode,
  onSave,
  onFormatBold,
  onFormatItalic,
  onInsertImage,
  onTogglePreview,
}: SplitViewProps) {
  const minHeight = 560;
  const isSplit = viewMode === "split";
  const isEditorOnly = viewMode === "editor";
  const paneHeight = "max(560px, calc(100vh - 220px))";
  const editorHeight = isEditorOnly || isSplit ? "100%" : paneHeight;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col md:flex-row md:divide-x md:divide-border min-w-0 overflow-hidden">
      {/* Editor side */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${viewMode === "preview" ? "hidden" : ""}`}
        style={{ minHeight, height: paneHeight }}
      >
        <MdxEditor
          value={mdx}
          onChange={setMdx}
          height={editorHeight}
          onSave={onSave}
          onFormatBold={onFormatBold}
          onFormatItalic={onFormatItalic}
          onInsertImage={onInsertImage}
          onTogglePreview={onTogglePreview}
        />
      </div>

      {viewMode === "split" && <div className="md:hidden h-px bg-border" />}

      {/* Preview side */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-hidden ${viewMode === "editor" ? "hidden" : ""}`}
        style={{ minHeight, height: paneHeight }}
      >
        <div className="h-full bg-card px-8 pt-4 pb-8 overflow-y-auto overflow-x-auto overscroll-contain">
          <MdxPreview source={mdx} />
        </div>
      </div>
    </div>
  );
}
