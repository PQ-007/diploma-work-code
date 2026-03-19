"use client";

import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef } from "react";
import { useImagePasteUpload } from "../../hooks/useImagePasteUpload";
import { monacoDark, monacoLight } from "./monaco-theme";

type MdxEditorProps = {
  value: string;
  onChange: (v: string) => void;
  height?: number | string;
};

export function MdxEditor({
  value,
  onChange,
  height = "100%",
}: MdxEditorProps) {
  // resolvedTheme ensures "system" is converted to "light" or "dark"
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const insertAtCursor = useCallback(
    (markdown: string) => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const model = editor?.getModel?.();

      if (editor && monaco && model) {
        const selection = editor.getSelection?.();
        const startOffset = selection
          ? model.getOffsetAt(selection.getStartPosition())
          : model.getValueLength();
        const endOffset = selection
          ? model.getOffsetAt(selection.getEndPosition())
          : model.getValueLength();

        const next =
          value.slice(0, startOffset) + markdown + value.slice(endOffset);
        onChange(next);

        const newEnd = startOffset + markdown.length;
        const pos = model.getPositionAt(newEnd);
        const selectionRange = new monaco.Selection(
          pos.lineNumber,
          pos.column,
          pos.lineNumber,
          pos.column,
        );
        editor.setSelection(selectionRange);
        editor.focus();
      } else {
        const prefix = value.endsWith("\n") || value.length === 0 ? "" : "\n";
        onChange(`${value}${prefix}${markdown}`);
      }
    },
    [onChange, value],
  );

  const { onPaste, onDrop, onDragOver, uploading, error } = useImagePasteUpload(
    {
      value,
      onChange,
      insertAtCursor,
      maxSizeMB: 10,
    },
  );

  // Monaco renders an inner iframe/input, so React onPaste/onDrop on the wrapper
  // may not catch events. Attach capture listeners to the window to intercept
  // when the event target is inside our container.
  useEffect(() => {
    const handleNativePaste = (e: ClipboardEvent) => {
      if (!containerRef.current) return;
      const target = e.target as Node | null;
      if (target && !containerRef.current.contains(target)) return;
      const synthetic = {
        clipboardData: e.clipboardData,
        preventDefault: () => e.preventDefault(),
      } as unknown as React.ClipboardEvent<HTMLElement>;
      onPaste(synthetic);
    };

    const handleNativeDrop = (e: DragEvent) => {
      if (!containerRef.current) return;
      const target = e.target as Node | null;
      if (target && !containerRef.current.contains(target)) return;
      const synthetic = {
        dataTransfer: e.dataTransfer,
        preventDefault: () => e.preventDefault(),
      } as unknown as React.DragEvent<HTMLElement>;
      onDrop(synthetic);
    };

    const handleNativeDragOver = (e: DragEvent) => {
      if (!containerRef.current) return;
      const target = e.target as Node | null;
      if (target && !containerRef.current.contains(target)) return;
      const synthetic = {
        preventDefault: () => e.preventDefault(),
      } as unknown as React.DragEvent<HTMLElement>;
      onDragOver(synthetic);
    };

    window.addEventListener("paste", handleNativePaste, true);
    window.addEventListener("drop", handleNativeDrop, true);
    window.addEventListener("dragover", handleNativeDragOver, true);

    return () => {
      window.removeEventListener("paste", handleNativePaste, true);
      window.removeEventListener("drop", handleNativeDrop, true);
      window.removeEventListener("dragover", handleNativeDragOver, true);
    };
  }, [onDragOver, onDrop, onPaste]);

  /**
   * beforeMount runs before the editor instance is created.
   * This is the correct place to define custom themes so they
   * are available for the initial render.
   */
  const handleEditorBeforeMount = (monaco: any) => {
    monaco.editor.defineTheme("my-dark-theme", monacoDark);
    monaco.editor.defineTheme("my-light-theme", monacoLight);
  };

  const resolvedHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      ref={containerRef}
      className="w-full relative"
      style={{ height: resolvedHeight }}
      onPaste={onPaste}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <Editor
        height={resolvedHeight}
        language="markdown"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        beforeMount={handleEditorBeforeMount}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;
        }}
        theme={resolvedTheme === "dark" ? "my-dark-theme" : "my-light-theme"}
        options={{
          wordWrap: "on",
          fontSize: 15,
          lineHeight: 24,
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          minimap: { enabled: false },
          glyphMargin: false,
          folding: false,
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          padding: { top: 8, bottom: 16 },
          renderLineHighlight: "none",
          smoothScrolling: true,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            verticalSliderSize: 8,
            horizontalSliderSize: 8,
            useShadows: false,
            alwaysConsumeMouseWheel: false,
          },
          quickSuggestions: false,
        }}
      />

      {uploading && (
        <div className="absolute top-2 right-3 text-xs px-2 py-1 rounded-md bg-background/90 border border-border shadow-sm">
          Uploading…
        </div>
      )}
      {error && (
        <div className="absolute bottom-2 right-3 text-xs px-3 py-2 rounded-md bg-destructive/10 text-destructive border border-destructive/30 shadow-sm">
          Upload failed: {error}
        </div>
      )}
    </div>
  );
}
