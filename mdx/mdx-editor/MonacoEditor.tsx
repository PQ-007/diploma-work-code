"use client";

import Editor, { loader } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { monacoDark, monacoLight } from "./monaco-theme";

export function MdxEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // resolvedTheme ensures "system" is converted to "light" or "dark"
  const { resolvedTheme } = useTheme(); 

  /**
   * beforeMount runs before the editor instance is created.
   * This is the correct place to define custom themes so they 
   * are available for the initial render.
   */
  const handleEditorBeforeMount = (monaco: any) => {
    monaco.editor.defineTheme("my-dark-theme", monacoDark);
    monaco.editor.defineTheme("my-light-theme", monacoLight);
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language="markdown"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        beforeMount={handleEditorBeforeMount}
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
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: "none",
          smoothScrolling: true,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            verticalSliderSize: 8,
            horizontalSliderSize: 8,
            useShadows: false,
          },
          quickSuggestions: false,
        }}
      />
    </div>
  );
}