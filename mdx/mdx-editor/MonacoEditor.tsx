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
  onSave?: () => void;
  onFormatBold?: () => void;
  onFormatItalic?: () => void;
  onInsertImage?: () => void;
  onTogglePreview?: () => void;
};

export function MdxEditor({
  value,
  onChange,
  height = "100%",
  onSave,
  onFormatBold,
  onFormatItalic,
  onInsertImage,
  onTogglePreview,
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

  // Text formatting helpers
  const wrapSelectionWith = useCallback(
    (prefix: string, suffix?: string) => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const model = editor?.getModel?.();

      if (!editor || !monaco || !model) return;

      const selection = editor.getSelection();
      if (!selection) return;

      const selectedText = model.getValueInRange(selection);
      const wrapper = suffix || prefix;
      const newText = `${prefix}${selectedText}${wrapper}`;

      editor.executeEdits("format", [
        {
          range: selection,
          text: newText,
        },
      ]);

      // Update selection to be inside the wrapped text
      const startPos = selection.getStartPosition();
      const newSelectionStart = model.getPositionAt(
        model.getOffsetAt(startPos) + prefix.length
      );
      const newSelectionEnd = model.getPositionAt(
        model.getOffsetAt(startPos) + prefix.length + selectedText.length
      );

      editor.setSelection(
        new monaco.Selection(
          newSelectionStart.lineNumber,
          newSelectionStart.column,
          newSelectionEnd.lineNumber,
          newSelectionEnd.column
        )
      );
    },
    []
  );

  const insertAtLineBeginning = useCallback(
    (prefix: string) => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const model = editor?.getModel?.();

      if (!editor || !monaco || !model) return;

      const position = editor.getPosition();
      if (!position) return;

      const lineText = model.getLineContent(position.lineNumber);

      // Check if line already has the prefix and toggle it
      if (lineText.startsWith(prefix)) {
        const newText = lineText.substring(prefix.length);
        const range = new monaco.Range(
          position.lineNumber,
          1,
          position.lineNumber,
          lineText.length + 1
        );
        editor.executeEdits("format", [{ range, text: newText }]);
      } else {
        const range = new monaco.Range(position.lineNumber, 1, position.lineNumber, 1);
        editor.executeEdits("format", [{ range, text: prefix }]);
      }
    },
    []
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
   * Register custom keyboard shortcuts for markdown editing
   */
  const registerKeyboardShortcuts = useCallback(
    (editor: any, monaco: any) => {
      // Save document (Ctrl/Cmd + S)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          onSave?.();
        }
      );

      // Bold text (Ctrl/Cmd + B)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB,
        () => {
          wrapSelectionWith('**');
          onFormatBold?.();
        }
      );

      // Italic text (Ctrl/Cmd + I)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
        () => {
          wrapSelectionWith('*');
          onFormatItalic?.();
        }
      );

      // Insert image (Ctrl/Cmd + Shift + I)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI,
        () => {
          onInsertImage?.();
        }
      );

      // Toggle preview (Ctrl/Cmd + Shift + O)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
        () => {
          onTogglePreview?.();
        }
      );

      // Insert code block (Ctrl/Cmd + Shift + C)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC,
        () => {
          insertAtCursor('\n```\n\n```\n');
        }
      );

      // Insert inline code (Ctrl/Cmd + `)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote,
        () => {
          wrapSelectionWith('`');
        }
      );

      // Insert link (Ctrl/Cmd + K)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
        () => {
          wrapSelectionWith('[', '](url)');
        }
      );

      // Heading shortcuts
      // H1 (Ctrl/Cmd + 1)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit1,
        () => {
          insertAtLineBeginning('# ');
        }
      );

      // H2 (Ctrl/Cmd + 2)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit2,
        () => {
          insertAtLineBeginning('## ');
        }
      );

      // H3 (Ctrl/Cmd + 3)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit3,
        () => {
          insertAtLineBeginning('### ');
        }
      );

      // Insert horizontal rule (Ctrl/Cmd + Shift + -)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Minus,
        () => {
          insertAtCursor('\n---\n');
        }
      );

      // Insert unordered list (Ctrl/Cmd + Shift + 8)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit8,
        () => {
          insertAtLineBeginning('- ');
        }
      );

      // Insert ordered list (Ctrl/Cmd + Shift + 7)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit7,
        () => {
          insertAtLineBeginning('1. ');
        }
      );

      // Insert blockquote (Ctrl/Cmd + Shift + >)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Period,
        () => {
          insertAtLineBeginning('> ');
        }
      );

      // Strikethrough text (Ctrl/Cmd + Shift + X)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyX,
        () => {
          wrapSelectionWith('~~');
        }
      );
    },
    [wrapSelectionWith, insertAtCursor, insertAtLineBeginning, onSave, onFormatBold, onFormatItalic, onInsertImage, onTogglePreview]
  );

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

          // Register custom keyboard shortcuts
          registerKeyboardShortcuts(editor, monaco);
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
