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
  onCursorLineChange?: (line: number) => void;
  onJumpToLineRequest?: { line: number; token: number } | null;
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
  onCursorLineChange,
  onJumpToLineRequest,
}: MdxEditorProps) {
  // resolvedTheme ensures "system" is converted to "light" or "dark"
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const cursorListenerRef = useRef<{ dispose: () => void } | null>(null);
  const enterKeyListenerRef = useRef<{ dispose: () => void } | null>(null);
  const contentListenerRef = useRef<{ dispose: () => void } | null>(null);
  const pendingJumpRef = useRef<{ line: number; token: number } | null>(null);
  const lastHandledJumpTokenRef = useRef<number>(0);
  const lastUserEditAtRef = useRef<number>(0);

  const handleMarkdownListEnter = useCallback((editor: any, monaco: any) => {
    const model = editor?.getModel?.();
    const selection = editor?.getSelection?.();
    const position = editor?.getPosition?.();

    if (!model || !selection || !position || !selection.isEmpty()) {
      return false;
    }

    const lineNumber = position.lineNumber;
    const lineContent = model.getLineContent(lineNumber);

    // Keep Enter behavior default unless cursor is at end-of-line.
    if (position.column !== lineContent.length + 1) {
      return false;
    }

    const taskMatch = lineContent.match(
      /^(\s*)([-+*])\s+\[(?: |x|X)\]\s+(.*)$/,
    );
    const taskEmptyMatch = lineContent.match(
      /^(\s*)([-+*])\s+\[(?: |x|X)\]\s*$/,
    );

    const bulletMatch = lineContent.match(/^(\s*)([-+*])\s+(.*)$/);
    const bulletEmptyMatch = lineContent.match(/^(\s*)([-+*])\s*$/);

    const orderedMatch = lineContent.match(/^(\s*)(\d+)([.)])\s+(.*)$/);
    const orderedEmptyMatch = lineContent.match(/^(\s*)(\d+)([.)])\s*$/);

    const stripMarkerRange = new monaco.Range(
      lineNumber,
      1,
      lineNumber,
      lineContent.length + 1,
    );

    // If current item is already empty, pressing Enter exits the list item.
    if (taskEmptyMatch || bulletEmptyMatch || orderedEmptyMatch) {
      const indent =
        taskEmptyMatch?.[1] ||
        bulletEmptyMatch?.[1] ||
        orderedEmptyMatch?.[1] ||
        "";

      editor.executeEdits("markdown-list-exit", [
        {
          range: stripMarkerRange,
          text: indent,
        },
      ]);
      editor.setPosition({ lineNumber, column: indent.length + 1 });
      return true;
    }

    if (taskMatch) {
      const indent = taskMatch[1];
      const bullet = taskMatch[2];
      const nextText = `\n${indent}${bullet} [ ] `;

      editor.executeEdits("markdown-list-continue", [
        {
          range: new monaco.Range(
            lineNumber,
            position.column,
            lineNumber,
            position.column,
          ),
          text: nextText,
        },
      ]);
      editor.setPosition({
        lineNumber: lineNumber + 1,
        column: `${indent}${bullet} [ ] `.length + 1,
      });
      return true;
    }

    if (bulletMatch) {
      const indent = bulletMatch[1];
      const bullet = bulletMatch[2];
      const nextText = `\n${indent}${bullet} `;

      editor.executeEdits("markdown-list-continue", [
        {
          range: new monaco.Range(
            lineNumber,
            position.column,
            lineNumber,
            position.column,
          ),
          text: nextText,
        },
      ]);
      editor.setPosition({
        lineNumber: lineNumber + 1,
        column: `${indent}${bullet} `.length + 1,
      });
      return true;
    }

    if (orderedMatch) {
      const indent = orderedMatch[1];
      const currentNumber = Number(orderedMatch[2]);
      const separator = orderedMatch[3];
      const nextMarker = `${currentNumber + 1}${separator} `;
      const nextText = `\n${indent}${nextMarker}`;

      editor.executeEdits("markdown-list-continue", [
        {
          range: new monaco.Range(
            lineNumber,
            position.column,
            lineNumber,
            position.column,
          ),
          text: nextText,
        },
      ]);
      editor.setPosition({
        lineNumber: lineNumber + 1,
        column: `${indent}${nextMarker}`.length + 1,
      });
      return true;
    }

    return false;
  }, []);

  const handleMathDollarAutoPair = useCallback((editor: any, monaco: any) => {
    const model = editor?.getModel?.();
    const selection = editor?.getSelection?.();

    if (!model || !selection) {
      return false;
    }

    if (!selection.isEmpty()) {
      const selectedText = model.getValueInRange(selection);
      const startPos = selection.getStartPosition();
      const startOffset = model.getOffsetAt(startPos);

      editor.executeEdits("math-dollar-wrap", [
        {
          range: selection,
          text: `$${selectedText}$`,
        },
      ]);

      const newStart = model.getPositionAt(startOffset + 1);
      const newEnd = model.getPositionAt(startOffset + 1 + selectedText.length);
      editor.setSelection(
        new monaco.Selection(
          newStart.lineNumber,
          newStart.column,
          newEnd.lineNumber,
          newEnd.column,
        ),
      );
      return true;
    }

    const position = selection.getStartPosition();
    const lineContent = model.getLineContent(position.lineNumber);
    const cursorIndex = position.column - 1;
    const prev1 = lineContent.charAt(cursorIndex - 1);
    const prev2 = lineContent.charAt(cursorIndex - 2);
    const next1 = lineContent.charAt(cursorIndex);
    const next2 = lineContent.charAt(cursorIndex + 1);

    // If we're right before an existing closer, jump over it instead of creating extras.
    if (next1 === "$" && next2 === "$") {
      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column + 2,
      });
      return true;
    }

    if (next1 === "$") {
      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column + 1,
      });
      return true;
    }

    // Convert $|$ into $$|$$ when user types $ the second time.
    if (prev1 === "$" && next1 === "$" && prev2 !== "$" && next2 !== "$") {
      editor.executeEdits("math-dollar-double", [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column - 1,
            position.lineNumber,
            position.column + 1,
          ),
          text: "$$$$",
        },
      ]);
      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column + 1,
      });
      return true;
    }

    editor.executeEdits("math-dollar-pair", [
      {
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        ),
        text: "$$",
      },
    ]);
    editor.setPosition({
      lineNumber: position.lineNumber,
      column: position.column + 1,
    });
    return true;
  }, []);

  const handleHtmlTagAutoClose = useCallback((editor: any, monaco: any) => {
    const model = editor?.getModel?.();
    const selection = editor?.getSelection?.();

    if (!model || !selection || !selection.isEmpty()) {
      return false;
    }

    const position = selection.getStartPosition();
    const lineContent = model.getLineContent(position.lineNumber);
    const textBeforeCursor = lineContent.slice(0, position.column - 1);
    const openTagMatch = textBeforeCursor.match(
      /<([A-Za-z][\w-]*)(?:\s[^<>]*)?$/,
    );

    if (!openTagMatch) {
      return false;
    }

    if (openTagMatch[0].startsWith("</") || openTagMatch[0].endsWith("/")) {
      return false;
    }

    const tagName = openTagMatch[1];

    editor.executeEdits("html-tag-close", [
      {
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        ),
        text: `></${tagName}>`,
      },
    ]);

    // Keep cursor between opening and closing tags.
    editor.setPosition({
      lineNumber: position.lineNumber,
      column: position.column + 1,
    });
    return true;
  }, []);

  const jumpEditorToLine = useCallback((line: number) => {
    const editor = editorRef.current;
    const model = editor?.getModel?.();
    if (!editor || !model) return;

    const maxLine = Math.max(1, model.getLineCount());
    const safeLine = Math.min(maxLine, Math.max(1, line));

    editor.setPosition({ lineNumber: safeLine, column: 1 });
    // Keep the target line almost at the top so user can continue writing downward.
    if (
      typeof editor.getTopForLineNumber === "function" &&
      typeof editor.setScrollTop === "function"
    ) {
      const lineTop = editor.getTopForLineNumber(safeLine);
      const topPadding = 8;
      editor.setScrollTop(Math.max(0, lineTop - topPadding));
    } else if (typeof editor.revealLineNearTop === "function") {
      editor.revealLineNearTop(safeLine);
    } else {
      editor.revealLine(safeLine);
    }
    editor.focus();
  }, []);

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
  const wrapSelectionWith = useCallback((prefix: string, suffix?: string) => {
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
      model.getOffsetAt(startPos) + prefix.length,
    );
    const newSelectionEnd = model.getPositionAt(
      model.getOffsetAt(startPos) + prefix.length + selectedText.length,
    );

    editor.setSelection(
      new monaco.Selection(
        newSelectionStart.lineNumber,
        newSelectionStart.column,
        newSelectionEnd.lineNumber,
        newSelectionEnd.column,
      ),
    );
  }, []);

  const insertAtLineBeginning = useCallback((prefix: string) => {
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
        lineText.length + 1,
      );
      editor.executeEdits("format", [{ range, text: newText }]);
    } else {
      const range = new monaco.Range(
        position.lineNumber,
        1,
        position.lineNumber,
        1,
      );
      editor.executeEdits("format", [{ range, text: prefix }]);
    }
  }, []);

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

  useEffect(() => {
    return () => {
      cursorListenerRef.current?.dispose?.();
      enterKeyListenerRef.current?.dispose?.();
      contentListenerRef.current?.dispose?.();
    };
  }, []);

  useEffect(() => {
    if (!onJumpToLineRequest) return;

    if (onJumpToLineRequest.token <= lastHandledJumpTokenRef.current) {
      return;
    }

    const editor = editorRef.current;
    const model = editor?.getModel?.();
    if (!editor || !model) {
      pendingJumpRef.current = onJumpToLineRequest;
      return;
    }

    const typedRecently = Date.now() - lastUserEditAtRef.current < 1200;
    if (typedRecently && editor.hasTextFocus?.()) {
      // Ignore stale external jumps while the user is actively typing.
      lastHandledJumpTokenRef.current = onJumpToLineRequest.token;
      return;
    }

    jumpEditorToLine(onJumpToLineRequest.line);
    lastHandledJumpTokenRef.current = onJumpToLineRequest.token;
  }, [jumpEditorToLine, onJumpToLineRequest]);

  useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel?.();
    if (!editor || !model) return;

    const currentValue = model.getValue();
    if (currentValue === value) {
      return;
    }

    const currentPosition = editor.getPosition?.();
    const currentScrollTop = editor.getScrollTop?.() ?? 0;

    // Only overwrite the Monaco model when content changed externally
    // (language switch, hydration, etc.), not for normal local typing.
    model.setValue(value);

    if (currentPosition) {
      const maxLine = Math.max(1, model.getLineCount());
      const safeLine = Math.min(
        maxLine,
        Math.max(1, currentPosition.lineNumber),
      );
      const maxColumn = model.getLineMaxColumn(safeLine);
      const safeColumn = Math.min(
        maxColumn,
        Math.max(1, currentPosition.column),
      );
      editor.setPosition({ lineNumber: safeLine, column: safeColumn });
    }

    if (typeof editor.setScrollTop === "function") {
      editor.setScrollTop(currentScrollTop);
    }
  }, [value]);

  /**
   * Register custom keyboard shortcuts for markdown editing
   */
  const registerKeyboardShortcuts = useCallback(
    (editor: any, monaco: any) => {
      // Save document (Ctrl/Cmd + S)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave?.();
      });

      // Bold text (Ctrl/Cmd + B)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
        wrapSelectionWith("**");
        onFormatBold?.();
      });

      // Italic text (Ctrl/Cmd + I)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
        wrapSelectionWith("*");
        onFormatItalic?.();
      });

      // Insert image (Ctrl/Cmd + Shift + I)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI,
        () => {
          onInsertImage?.();
        },
      );

      // Toggle preview (Ctrl/Cmd + Shift + O)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
        () => {
          onTogglePreview?.();
        },
      );

      // Insert code block (Ctrl/Cmd + Shift + C)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC,
        () => {
          insertAtCursor("\n```\n\n```\n");
        },
      );

      // Insert inline code (Ctrl/Cmd + `)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote,
        () => {
          wrapSelectionWith("`");
        },
      );

      // Insert link (Ctrl/Cmd + K)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
        wrapSelectionWith("[", "](url)");
      });

      // Heading shortcuts
      // H1 (Ctrl/Cmd + 1)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit1, () => {
        insertAtLineBeginning("# ");
      });

      // H2 (Ctrl/Cmd + 2)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit2, () => {
        insertAtLineBeginning("## ");
      });

      // H3 (Ctrl/Cmd + 3)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit3, () => {
        insertAtLineBeginning("### ");
      });

      // Insert horizontal rule (Ctrl/Cmd + Shift + -)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Minus,
        () => {
          insertAtCursor("\n---\n");
        },
      );

      // Insert unordered list (Ctrl/Cmd + Shift + 8)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit8,
        () => {
          insertAtLineBeginning("- ");
        },
      );

      // Insert ordered list (Ctrl/Cmd + Shift + 7)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit7,
        () => {
          insertAtLineBeginning("1. ");
        },
      );

      // Insert blockquote (Ctrl/Cmd + Shift + >)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Period,
        () => {
          insertAtLineBeginning("> ");
        },
      );

      // Strikethrough text (Ctrl/Cmd + Shift + X)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyX,
        () => {
          wrapSelectionWith("~~");
        },
      );
    },
    [
      wrapSelectionWith,
      insertAtCursor,
      insertAtLineBeginning,
      onSave,
      onFormatBold,
      onFormatItalic,
      onInsertImage,
      onTogglePreview,
    ],
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
        defaultValue={value}
        onChange={(v) => onChange(v ?? "")}
        beforeMount={handleEditorBeforeMount}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;

          // Register custom keyboard shortcuts
          registerKeyboardShortcuts(editor, monaco);

          onCursorLineChange?.(editor.getPosition()?.lineNumber ?? 1);

          if (pendingJumpRef.current) {
            if (
              pendingJumpRef.current.token > lastHandledJumpTokenRef.current
            ) {
              jumpEditorToLine(pendingJumpRef.current.line);
              lastHandledJumpTokenRef.current = pendingJumpRef.current.token;
            }
            pendingJumpRef.current = null;
          }

          cursorListenerRef.current?.dispose?.();
          cursorListenerRef.current = editor.onDidChangeCursorPosition(
            (event: any) => {
              onCursorLineChange?.(event.position.lineNumber);
            },
          );

          contentListenerRef.current?.dispose?.();
          contentListenerRef.current = editor.onDidChangeModelContent(() => {
            lastUserEditAtRef.current = Date.now();
          });

          enterKeyListenerRef.current?.dispose?.();
          enterKeyListenerRef.current = editor.onKeyDown((event: any) => {
            const key = event.browserEvent?.key;

            if (
              key === "$" &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey
            ) {
              if (handleMathDollarAutoPair(editor, monaco)) {
                event.preventDefault();
                event.stopPropagation();
              }
              return;
            }

            if (
              key === ">" &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey
            ) {
              if (handleHtmlTagAutoClose(editor, monaco)) {
                event.preventDefault();
                event.stopPropagation();
              }
              return;
            }

            if (event.keyCode !== monaco.KeyCode.Enter) return;
            if (
              event.shiftKey ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey
            ) {
              return;
            }

            if (handleMarkdownListEnter(editor, monaco)) {
              event.preventDefault();
              event.stopPropagation();
            }
          });
        }}
        theme={resolvedTheme === "dark" ? "my-dark-theme" : "my-light-theme"}
        options={{
          wordWrap: "on",
          fontSize: 15,
          lineHeight: 24,
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          minimap: { enabled: false },
          glyphMargin: true,
          folding: true,
          foldingStrategy: "auto",
          showFoldingControls: "always",
          unfoldOnClickAfterEndOfLine: false,
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
