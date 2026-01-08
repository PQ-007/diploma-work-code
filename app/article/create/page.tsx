"use client";

import SplitView from "@/mdx/mdx-editor/SplitView";
import {
  Check,
  Columns2,
  Download,
  Eye,
  FileText,
  Save,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useState } from "react";

type ViewMode = "split" | "editor" | "preview";

export default function ZennMdxEditor() {
  const { theme } = useTheme();
  const [mdx, setMdx] = useState(`# Hello MDX Editor

This is a **Zenn/Qiita-style** editor for technical writing.

## Code Blocks

\`\`\`ts:example.ts
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Tables

| Feature | Status |
|---------|--------|
| Monaco | ✅ |
| Preview | ✅ |

## Admonitions

:::info
Info admonition
:::

:::warning
Warning admonition
:::

:::danger
Danger admonition
:::
`);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [saved, setSaved] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      tagInput.trim() &&
      tags.length < 5 &&
      !tags.includes(tagInput.trim())
    ) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const content = `---\ntitle: ${title}\ntags: ${tags.join(
      ", "
    )}\n---\n\n${mdx}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "article"}.mdx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header Card */}
        <header className="bg-card border border-border rounded-xl p-6 mb-5 shadow-sm">
          {/* View Controls and Actions */}
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-border flex-wrap gap-3">
            {/* View Mode Buttons */}
            <div className="flex gap-2 bg-muted p-1 rounded-lg">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${
                    viewMode === "split"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
                onClick={() => setViewMode("split")}
              >
                <Columns2 size={16} />
                <span>Split</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${
                    viewMode === "editor"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
                onClick={() => setViewMode("editor")}
              >
                <FileText size={16} />
                <span>Editor</span>
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${
                    viewMode === "preview"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
                onClick={() => setViewMode("preview")}
              >
                <Eye size={16} />
                <span>Preview</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap border
                  ${
                    saved
                      ? "bg-green-600 border-green-600 text-white"
                      : "bg-secondary border-border text-foreground hover:bg-accent hover:border-accent hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                onClick={handleSave}
              >
                {saved ? <Check size={16} /> : <Save size={16} />}
                <span>{saved ? "Saved!" : "Save"}</span>
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm font-medium transition-all duration-200 whitespace-nowrap hover:bg-accent hover:border-accent hover:-translate-y-0.5 hover:shadow-md"
                onClick={handleExport}
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Title Input */}
          <input
            type="text"
            className="w-full px-4 py-4 bg-background border-2 border-border rounded-xl text-foreground text-xl font-semibold mb-4 transition-all duration-200 placeholder:text-muted-foreground placeholder:font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Enter article title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Tags Container */}
          <div className="flex flex-wrap gap-2 items-center">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-sm"
              >
                {tag}
                <button
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="flex items-center p-0.5 rounded-full transition-colors hover:bg-white/20"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            <input
              type="text"
              className="flex-1 min-w-[220px] px-3.5 py-2.5 bg-background border-2 border-border rounded-lg text-foreground text-sm transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Add tags (press Enter, max 5)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              disabled={tags.length >= 5}
            />
          </div>
        </header>

        {/* Split View */}
        <SplitView mdx={mdx} setMdx={setMdx} viewMode={viewMode} />
      </div>
    </div>
  );
}