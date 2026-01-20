export const monacoDark = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    // Base tokens
    { token: "", foreground: "f8fafc" },
    { token: "comment", foreground: "64748b", fontStyle: "italic" },
    { token: "comment.block", foreground: "64748b", fontStyle: "italic" },
    { token: "comment.line", foreground: "64748b", fontStyle: "italic" },

    // Keywords
    { token: "keyword", foreground: "7dd3fc", fontStyle: "bold" },
    { token: "keyword.control", foreground: "7dd3fc", fontStyle: "bold" },
    { token: "keyword.operator", foreground: "38bdf8" },
    { token: "operator", foreground: "38bdf8" },

    // Strings
    { token: "string", foreground: "bef264" },
    { token: "string.quoted", foreground: "bef264" },
    { token: "string.template", foreground: "bef264" },
    { token: "string.regexp", foreground: "fbbf24" },

    // Numbers
    { token: "number", foreground: "fbbf24" },
    { token: "constant.numeric", foreground: "fbbf24" },

    // Types & Classes
    { token: "type", foreground: "f472b6" },
    { token: "type.identifier", foreground: "f472b6" },
    { token: "class", foreground: "f472b6" },
    { token: "class.name", foreground: "f472b6" },
    { token: "support.class", foreground: "f472b6" },

    // Functions
    { token: "function", foreground: "c084fc" },
    { token: "function.name", foreground: "c084fc" },
    { token: "support.function", foreground: "c084fc" },
    { token: "entity.name.function", foreground: "c084fc" },

    // Variables
    { token: "variable", foreground: "f8fafc" },
    { token: "variable.other", foreground: "f8fafc" },
    { token: "variable.parameter", foreground: "e2e8f0" },

    // Tags (HTML/JSX)
    { token: "tag", foreground: "7dd3fc" },
    { token: "tag.name", foreground: "7dd3fc" },
    { token: "meta.tag", foreground: "7dd3fc" },

    // Attributes
    { token: "attribute.name", foreground: "c084fc" },
    { token: "entity.other.attribute-name", foreground: "c084fc" },

    // Markdown specific
    { token: "markup.heading", foreground: "7dd3fc", fontStyle: "bold" },
    { token: "markup.bold", foreground: "f8fafc", fontStyle: "bold" },
    { token: "markup.italic", foreground: "f8fafc", fontStyle: "italic" },
    { token: "markup.inline.raw", foreground: "bef264" },
    { token: "markup.fenced_code", foreground: "bef264" },
    { token: "markup.quote", foreground: "64748b", fontStyle: "italic" },
    { token: "markup.list", foreground: "f8fafc" },
    { token: "markup.link", foreground: "38bdf8" },

    // Constants
    { token: "constant", foreground: "fbbf24" },
    { token: "constant.language", foreground: "fbbf24" },
    { token: "constant.boolean", foreground: "fbbf24" },

    // Storage
    { token: "storage", foreground: "7dd3fc", fontStyle: "bold" },
    { token: "storage.type", foreground: "7dd3fc", fontStyle: "bold" },

    // Punctuation
    { token: "punctuation", foreground: "cbd5e1" },
    { token: "punctuation.definition", foreground: "cbd5e1" },

    // Meta
    { token: "meta.brace", foreground: "cbd5e1" },
    { token: "meta.delimiter", foreground: "cbd5e1" },
  ],
  colors: {
    // Editor background aligned to site card
    "editor.background": "#111115",
    "editor.foreground": "#f8fafc",

    // Line highlighting
    "editor.lineHighlightBackground": "#1e293b44",
    "editor.lineHighlightBorder": "#00000000",

    // Cursor
    "editorCursor.foreground": "#7dd3fc",
    "editorCursor.background": "#111115",

    // Selection (primary blue)
    "editor.selectionBackground": "#1e40af33",
    "editor.selectionHighlightBackground": "#1e40af22",
    "editor.inactiveSelectionBackground": "#1e40af1a",

    // Line numbers
    "editorLineNumber.foreground": "#475569",
    "editorLineNumber.activeForeground": "#7dd3fc",

    // Indent guides
    "editorIndentGuide.background": "#1e293b",
    "editorIndentGuide.activeBackground": "#7dd3fc",

    // Gutter
    "editorGutter.background": "#111115",
    "editorGutter.modifiedBackground": "#fbbf24",
    "editorGutter.addedBackground": "#10b981",
    "editorGutter.deletedBackground": "#ef4444",

    // Widgets (autocomplete, hover)
    "editorWidget.background": "#111115",
    "editorWidget.border": "#1e40af",
    "editorWidget.foreground": "#f8fafc",

    // Suggest widget
    "editorSuggestWidget.background": "#0f172a",
    "editorSuggestWidget.border": "#1e293b",
    "editorSuggestWidget.foreground": "#e2e8f0",
    "editorSuggestWidget.selectedBackground": "#1e293b",
    "editorSuggestWidget.highlightForeground": "#7dd3fc",

    // Hover widget
    "editorHoverWidget.background": "#0f172a",
    "editorHoverWidget.border": "#1e293b",
    "editorHoverWidget.foreground": "#e2e8f0",

    // Scrollbar
    "scrollbar.shadow": "#00000033",
    "scrollbarSlider.background": "#1e40afcc",
    "scrollbarSlider.hoverBackground": "#1d4ed8cc",
    "scrollbarSlider.activeBackground": "#1d4ed8e6",

    // Minimap
    "minimap.background": "#111115",
    "minimap.selectionHighlight": "#1e40af33",
    "minimap.findMatchHighlight": "#fbbf2444",

    // Bracket matching
    "editorBracketMatch.background": "#1e293b66",
    "editorBracketMatch.border": "#7dd3fc",

    // Find/Replace
    "editor.findMatchBackground": "#fbbf2444",
    "editor.findMatchHighlightBackground": "#fbbf2422",
    "editor.findRangeHighlightBackground": "#1e293b44",

    // Whitespace
    "editorWhitespace.foreground": "#1e293b",
  },
};

export const monacoLight = {
  base: "vs" as const,
  inherit: true,
  rules: [
    // Base tokens
    { token: "", foreground: "2c2926" },
    { token: "comment", foreground: "78716c", fontStyle: "italic" },
    { token: "comment.block", foreground: "78716c", fontStyle: "italic" },
    { token: "comment.line", foreground: "78716c", fontStyle: "italic" },

    // Keywords
    { token: "keyword", foreground: "2563eb", fontStyle: "bold" },
    { token: "keyword.control", foreground: "2563eb", fontStyle: "bold" },
    { token: "keyword.operator", foreground: "1d4ed8" },
    { token: "operator", foreground: "1d4ed8" },

    // Strings
    { token: "string", foreground: "059669" },
    { token: "string.quoted", foreground: "059669" },
    { token: "string.template", foreground: "059669" },
    { token: "string.regexp", foreground: "c2410c" },

    // Numbers
    { token: "number", foreground: "0891b2" },
    { token: "constant.numeric", foreground: "0891b2" },

    // Types & Classes
    { token: "type", foreground: "2563eb" },
    { token: "type.identifier", foreground: "2563eb" },
    { token: "class", foreground: "2563eb" },
    { token: "class.name", foreground: "2563eb" },
    { token: "support.class", foreground: "2563eb" },

    // Functions
    { token: "function", foreground: "7c3aed" },
    { token: "function.name", foreground: "7c3aed" },
    { token: "support.function", foreground: "7c3aed" },
    { token: "entity.name.function", foreground: "7c3aed" },

    // Variables
    { token: "variable", foreground: "2c2926" },
    { token: "variable.other", foreground: "2c2926" },
    { token: "variable.parameter", foreground: "44403c" },

    // Tags (HTML/JSX)
    { token: "tag", foreground: "2563eb" },
    { token: "tag.name", foreground: "2563eb" },
    { token: "meta.tag", foreground: "2563eb" },

    // Attributes
    { token: "attribute.name", foreground: "7c3aed" },
    { token: "entity.other.attribute-name", foreground: "7c3aed" },

    // Markdown specific
    { token: "markup.heading", foreground: "2563eb", fontStyle: "bold" },
    { token: "markup.bold", foreground: "2c2926", fontStyle: "bold" },
    { token: "markup.italic", foreground: "2c2926", fontStyle: "italic" },
    { token: "markup.inline.raw", foreground: "059669" },
    { token: "markup.fenced_code", foreground: "059669" },
    { token: "markup.quote", foreground: "78716c", fontStyle: "italic" },
    { token: "markup.list", foreground: "2c2926" },
    { token: "markup.link", foreground: "0891b2" },

    // Constants
    { token: "constant", foreground: "0891b2" },
    { token: "constant.language", foreground: "0891b2" },
    { token: "constant.boolean", foreground: "0891b2" },

    // Storage
    { token: "storage", foreground: "2563eb", fontStyle: "bold" },
    { token: "storage.type", foreground: "2563eb", fontStyle: "bold" },

    // Punctuation
    { token: "punctuation", foreground: "44403c" },
    { token: "punctuation.definition", foreground: "44403c" },

    // Meta
    { token: "meta.brace", foreground: "44403c" },
    { token: "meta.delimiter", foreground: "44403c" },
  ],
  colors: {
    // Editor background aligned to site light card
    "editor.background": "#ffffff",
    "editor.foreground": "#2c2926",

    // Line highlighting
    "editor.lineHighlightBackground": "#f5f3f0",
    "editor.lineHighlightBorder": "#00000000",

    // Cursor
    "editorCursor.foreground": "#2563eb",
    "editorCursor.background": "#ffffff",

    // Selection (primary blue)
    "editor.selectionBackground": "#2563eb26",
    "editor.selectionHighlightBackground": "#2563eb1a",
    "editor.inactiveSelectionBackground": "#2563eb14",

    // Line numbers
    "editorLineNumber.foreground": "#78716c88",
    "editorLineNumber.activeForeground": "#2563eb",

    // Indent guides
    "editorIndentGuide.background": "#e7e5e4",
    "editorIndentGuide.activeBackground": "#2563eb",

    // Gutter
    "editorGutter.background": "#ffffff",
    "editorGutter.modifiedBackground": "#f59e0b",
    "editorGutter.addedBackground": "#10b981",
    "editorGutter.deletedBackground": "#ef4444",

    // Widgets (autocomplete, hover)
    "editorWidget.background": "#ffffff",
    "editorWidget.border": "#e7e5e4",
    "editorWidget.foreground": "#2c2926",

    // Suggest widget
    "editorSuggestWidget.background": "#ffffff",
    "editorSuggestWidget.border": "#e7e5e4",
    "editorSuggestWidget.foreground": "#2c2926",
    "editorSuggestWidget.selectedBackground": "#f5f3f0",
    "editorSuggestWidget.highlightForeground": "#2563eb",

    // Hover widget
    "editorHoverWidget.background": "#ffffff",
    "editorHoverWidget.border": "#e7e5e4",
    "editorHoverWidget.foreground": "#2c2926",

    // Scrollbar
    "scrollbar.shadow": "#00000011",
    "scrollbarSlider.background": "#1e40afcc",
    "scrollbarSlider.hoverBackground": "#1d4ed8cc",
    "scrollbarSlider.activeBackground": "#1d4ed8e6",

    // Minimap
    "minimap.background": "#ffffff",
    "minimap.selectionHighlight": "#2563eb26",
    "minimap.findMatchHighlight": "#f59e0b44",

    // Bracket matching
    "editorBracketMatch.background": "#2563eb22",
    "editorBracketMatch.border": "#2563eb",

    // Find/Replace
    "editor.findMatchBackground": "#f59e0b44",
    "editor.findMatchHighlightBackground": "#f59e0b22",
    "editor.findRangeHighlightBackground": "#e7e5e444",

    // Whitespace
    "editorWhitespace.foreground": "#e7e5e4",
  },
};
