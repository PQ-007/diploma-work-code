"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SplitView from "@/mdx/mdx-editor/SplitView";
import {
  Check,
  CircleQuestionMark,
  Columns2,
  Download,
  Eye,
  FileText,
  Image,
  Languages,
  Loader2,
  MessageCircleMore,
  Save,
  Settings2,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import ArticleSettingsButton from "@/components/button-collection/ArticleSettingsButton";

type ViewMode = "split" | "editor" | "preview";

export default function ZennMdxEditor() {
  const [mdx, setMdx] = useState(`# Hello MDX Editor

This is a **Zenn/Qiita-style** editor for technical writing.

## Code Blocks


`);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [contentLang, setContentLang] = useState<"en" | "es" | "mn" | "jp">(
    "en",
  );
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const viewIcon = {
    split: <Columns2 size={16} />,
    editor: <FileText size={16} />,
    preview: <Eye size={16} />,
  }[viewMode];

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

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body: mdx,
          tags,
          language_code: contentLang,
          status: "draft",
        }),
      });

      if (!res.ok) {
        console.error("Failed to save article", await res.text());
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving article", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const content = mdx;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "article.mdx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleLanguage = (lang: "en" | "es" | "mn" | "jp") => {
    setContentLang(lang);
    setLangMenuOpen(false);
  };

  const insertImageMarkdown = (url: string) => {
    setMdx((prev) => {
      const spacer =
        prev.trim().length === 0 ? "" : prev.endsWith("\n") ? "\n" : "\n\n";
      return `${prev}${spacer}![](${url})\n`;
    });
  };

  const buildOptimizedUrl = (secureUrl: string, publicId?: string | null) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (cloudName && publicId) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1200/${publicId}`;
    }
    return secureUrl;
  };

  const handleImageButtonClick = () => {
    setImageError(null);
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageError(null);

    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setImageError("Image must be 10MB or smaller.");
      return;
    }

    setImageUploading(true);
    try {
      const { secureUrl, publicId } = await uploadImageToCloudinary(file);
      const finalUrl = buildOptimizedUrl(secureUrl, publicId);
      insertImageMarkdown(finalUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setImageError(message);
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_92px] gap-6 items-start">
          <div className="space-y-4">
            <div className="space-y-3">
              <input
                type="text"
                className="w-full px-4 py-2 bg-background border border-border rounded-full text-lg font-semibold transition-all placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Enter article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="text"
                className="w-full px-4 py-1 bg-background border border-border rounded-full text-sm font-semibold transition-all placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Sub title / Description"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-2 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-sm"
                  >
                    {tag}
                    <button
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="flex items-center rounded-full transition-colors hover:bg-white/20 px-1 py-0.5"
                      aria-label={`Remove ${tag}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="flex-1 min-w-[220px] px-3 py-2.5 bg-background border border-border rounded-full text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Add tags (press Enter, max 5)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  disabled={tags.length >= 5}
                />
              </div>
            </div>

            <SplitView mdx={mdx} setMdx={setMdx} viewMode={viewMode} />
          </div>

          <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-10 lg:self-start">
            <div className="w-16 flex flex-col items-center gap-2 rounded-full border border-border/80 bg-background/95 p-2 shadow-md shadow-black/10 backdrop-blur">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={handleSave}
                disabled={isSaving || !title.trim() || !mdx.trim()}
                aria-label="Save draft"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : saved ? (
                  <Check size={16} />
                ) : (
                  <Save size={16} />
                )}
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => setViewMenuOpen((o) => !o)}
                  aria-label="Change view"
                >
                  {viewIcon}
                </Button>
                {viewMenuOpen && (
                  <div className="absolute top-[-9px] right-14 z-20 rounded-full border border-border/80 bg-card/95 shadow-lg shadow-black/15 py-2 px-2 flex flex-row gap-1">
                    <button
                      className={` flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                        viewMode === "split"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        setViewMode("split");
                        setViewMenuOpen(false);
                      }}
                      aria-label="Split view"
                    >
                      <Columns2 size={16} />
                    </button>
                    <button
                      className={` flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                        viewMode === "editor"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        setViewMode("editor");
                        setViewMenuOpen(false);
                      }}
                      aria-label="Editor only"
                    >
                      <FileText size={16} />
                    </button>
                    <button
                      className={` flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                        viewMode === "preview"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        setViewMode("preview");
                        setViewMenuOpen(false);
                      }}
                      aria-label="Preview only"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => setLangMenuOpen((o) => !o)}
                  aria-label={`Switch language (current ${contentLang})`}
                >
                  <Languages size={16} />
                </Button>
                {langMenuOpen && (
                  <div className="absolute top-0 right-14 z-20 w-28 rounded-lg border border-border/80 bg-card/95 shadow-lg shadow-black/15 py-2 px-2 flex flex-col gap-1">
                    <button
                      className={`flex h-9 w-full items-center justify-between rounded-md px-3 text-sm transition-colors ${
                        contentLang === "en"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleLanguage("en")}
                      aria-label="Switch to English"
                    >
                      <span>EN</span>
                      {contentLang === "en" && <Check size={14} />}
                    </button>

                    <button
                      className={`flex h-9 w-full items-center justify-between rounded-md px-3 text-sm transition-colors ${
                        contentLang === "mn"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleLanguage("mn")}
                      aria-label="Switch to Mongolian"
                    >
                      <span>MN</span>
                      {contentLang === "mn" && <Check size={14} />}
                    </button>
                    <button
                      className={`flex h-9 w-full items-center justify-between rounded-md px-3 text-sm transition-colors ${
                        contentLang === "jp"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleLanguage("jp")}
                      aria-label="Switch to Japanese"
                    >
                      <span>JP</span>
                      {contentLang === "jp" && <Check size={14} />}
                    </button>
                  </div>
                )}
              </div>

              <Separator orientation="horizontal" />

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={handleImageButtonClick}
                disabled={imageUploading}
                aria-label="Insert image"
              >
                {imageUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Image size={16} />
                )}
              </Button>
              {imageError && (
                <span className="text-xs text-destructive text-center px-1">
                  {imageError}
                </span>
              )}

              <ArticleSettingsButton />

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                aria-label="Comments"
              >
                <MessageCircleMore size={16} />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={handleExport}
                aria-label="Export"
              >
                <Download size={16} />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                aria-label="Help"
              >
                <CircleQuestionMark size={20} />
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
