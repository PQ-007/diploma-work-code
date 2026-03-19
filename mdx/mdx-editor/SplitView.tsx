"use client";

import { useEffect, useRef, useState } from "react";
import { MdxEditor } from "./MonacoEditor";
import { MdxPreview } from "./PreviewRenderer";

interface SplitViewProps {
  mdx: string;
  setMdx: (value: string) => void;
  viewMode: "split" | "editor" | "preview";
}

export default function SplitView({ mdx, setMdx, viewMode }: SplitViewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [syncedHeight, setSyncedHeight] = useState<number>(560);
  const minHeight = 560;
  const isSplit = viewMode === "split";
  const isEditorOnly = viewMode === "editor";
  const editorPaneHeight = "max(560px, calc(100vh - 220px))";

  // Observe preview height and sync editor to match
  useEffect(() => {
    if (isEditorOnly) return;

    const previewEl = previewRef.current;
    if (!previewEl) return;

    const updateHeight = () => {
      const previewHeight = previewEl.scrollHeight;
      // Also consider content-based editor height
      const lineHeight = 24;
      const padding = 48;
      const lines = mdx.split("\n").reduce((total, line) => {
        return total + Math.max(1, Math.ceil(line.length / 90));
      }, 0);
      const editorContentHeight = lines * lineHeight + padding;

      // Use the larger of preview height or editor content height
      const maxContentHeight = Math.max(
        previewHeight,
        editorContentHeight,
        minHeight,
      );
      setSyncedHeight(maxContentHeight);
    };

    // Initial measurement
    updateHeight();

    // Use ResizeObserver to detect preview size changes
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    resizeObserver.observe(previewEl);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isEditorOnly, mdx]);

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col md:flex-row md:divide-x md:divide-border min-w-0 overflow-hidden">
      {/* Editor side */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${viewMode === "preview" ? "hidden" : ""}`}
        style={
          isEditorOnly
            ? { minHeight, height: editorPaneHeight }
            : { minHeight: syncedHeight, height: syncedHeight }
        }
      >
        <MdxEditor
          value={mdx}
          onChange={setMdx}
          height={isEditorOnly ? "100%" : syncedHeight}
        />
      </div>

      {viewMode === "split" && <div className="md:hidden h-px bg-border" />}

      {/* Preview side */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-hidden ${viewMode === "editor" ? "hidden" : ""}`}
        style={{ minHeight: syncedHeight }}
      >
        <div
          ref={previewRef}
          className="bg-card px-8 pt-4 pb-8 overflow-x-auto"
        >
          <MdxPreview source={mdx} />
        </div>
      </div>
    </div>
  );
}
