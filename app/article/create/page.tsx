"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SplitView from "@/mdx/mdx-editor/SplitView";
import {
  CheckCircle2,
  CircleQuestionMark,
  Columns2,
  Download,
  Eye,
  FileText,
  Image,
  Languages,
  Loader2,
  MessageCircleMore,
  X,
} from "lucide-react";
import React from "react";
import ArticleSettingsButton from "@/components/button-collection/ArticleSettingsButton";
import { ArticleCreateHeader } from "@/components/header-collection/ArticleCreateHeader";
import { useArticleEditor } from "./ArticleEditorContext";

export default function ArticleCreatePage() {
  const {
    title,
    setTitle,
    subtitle,
    setSubtitle,
    mdx,
    setMdx,
    tags,
    setTags,
    tagInput,
    setTagInput,
    contentLang,
    setContentLang,
    viewMode,
    setViewMode,
    viewMenuOpen,
    setViewMenuOpen,
    langMenuOpen,
    setLangMenuOpen,
    imageUploading,
    imageError,
    fileInputRef,
    handleExport,
    handleImageButtonClick,
    handleImageFileChange,
  } = useArticleEditor();

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

  return (
    <div className="bg-background text-foreground flex flex-col">
      <ArticleCreateHeader />

      <div className="flex-1">
        <div className="p-4 md:p-6 px-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_72px] gap-4 lg:gap-6">
            <main className="min-w-0 space-y-4">
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

              <div className="min-w-0">
                <SplitView mdx={mdx} setMdx={setMdx} viewMode={viewMode} />
              </div>
            </main>

            <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start lg:justify-self-end">
              <div className="w-16 flex flex-col items-center gap-2 rounded-full border border-border/80 bg-background/95 p-2 shadow-md shadow-black/10 backdrop-blur">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => setViewMenuOpen(!viewMenuOpen)}
                    aria-label="Change view"
                  >
                    {viewIcon}
                  </Button>

                  {viewMenuOpen && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2 z-20 rounded-full border border-border/80 bg-card/95 shadow-lg shadow-black/15 py-2 px-2 flex flex-row gap-1">
                      {(["split", "editor", "preview"] as const).map((mode) => (
                        <button
                          key={mode}
                          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                            viewMode === mode
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => {
                            setViewMode(mode);
                            setViewMenuOpen(false);
                          }}
                          aria-label={`${mode} view`}
                        >
                          {mode === "split" && <Columns2 size={16} />}
                          {mode === "editor" && <FileText size={16} />}
                          {mode === "preview" && <Eye size={16} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                    aria-label={`Switch language (current ${contentLang})`}
                  >
                    <Languages size={16} />
                  </Button>

                  {langMenuOpen && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2 z-20 w-28 rounded-lg border border-border/80 bg-card/95 shadow-lg shadow-black/15 py-2 px-2 flex flex-col gap-1">
                      {(["en", "mn", "jp"] as const).map((lang) => (
                        <button
                          key={lang}
                          className={`flex h-9 w-full items-center justify-between rounded-md px-3 text-sm transition-colors ${
                            contentLang === lang
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => {
                            setContentLang(lang);
                            setLangMenuOpen(false);
                          }}
                          aria-label={`Switch to ${lang}`}
                        >
                          <span>{lang.toUpperCase()}</span>
                          {contentLang === lang && <CheckCircle2 size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Separator orientation="horizontal" className="w-10" />

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
    </div>
  );
}
