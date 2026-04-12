"use client";

// Force dynamic rendering for pages using search params
export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SplitView from "@/mdx/mdx-editor/SplitView";
import {
  CircleQuestionMark,
  Columns2,
  Download,
  Eye,
  Image,
  ListTree,
  Loader2,
  MessageCircleMore,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import React from "react";
import Link from "next/link";
import { toast } from "sonner";
import ArticleSettingsButton from "@/components/button-collection/ArticleSettingsButton";
import { ArticleCreateHeader } from "@/components/header-collection/ArticleCreateHeader";
import { TagInputWithSuggestions } from "@/components/form/TagInputWithSuggestions";
import { useArticleEditor } from "./ArticleEditorContext";
import { TranslationToggle } from "@/components/editor/TranslationToggle";
import { useArticleMetrics } from "@/hooks/useArticleMetrics";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ArticleCreatePage() {
  const { t } = useLanguage();
  const {
    title,
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
    saveError,
    status,
    isEditMode,
    articleId,
    isDeleting,
    isEditHydrating,
    isEditAccessDenied,
    fileInputRef,
    handleDeleteArticle,
    handleExport,
    handleImageButtonClick,
    handleImageFileChange,
    handleSaveDraft,
    // Translation data
    translations,
    translationCompleteness,
    // Series and settings data
    seriesName,
    isSerial,
    handleSettingsChange,
  } = useArticleEditor();

  // Calculate real-time article metrics
  const { analytics, isLoadingStats } = useArticleMetrics(
    mdx,
    title,
    subtitle,
    articleId,
  );

  // Keyboard shortcut handlers
  const handleKeyboardSave = () => {
    handleSaveDraft();
  };

  const handleTogglePreview = () => {
    setViewMode(viewMode === "split" ? "preview" : "split");
  };

  const handleFormatBold = () => {
    return;
  };

  const handleFormatItalic = () => {
    return;
  };

  const viewIcon = {
    split: <Columns2 size={16} />,
    preview: <Eye size={16} />,
  }[viewMode as "split" | "preview"];

  React.useEffect(() => {
    if (viewMode === "editor") {
      setViewMode("split");
    }
  }, [viewMode, setViewMode]);

  const lastSaveErrorRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!saveError) {
      lastSaveErrorRef.current = null;
      return;
    }

    if (lastSaveErrorRef.current === saveError) {
      return;
    }

    toast.error(saveError, {
      description: t("articles.create.reviewFieldsError"),
    });
    lastSaveErrorRef.current = saveError;
  }, [saveError]);

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

  const [tocMenuOpen, setTocMenuOpen] = React.useState(false);
  const [jumpToLineRequest, setJumpToLineRequest] = React.useState<{
    line: number;
    token: number;
  } | null>(null);

  const tocItems = React.useMemo(() => {
    const lines = mdx.split("\n");
    const items: Array<{ line: number; level: number; text: string }> = [];
    let activeFence: { marker: "`" | "~"; size: number } | null = null;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];

      const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
      if (fenceMatch) {
        const token = fenceMatch[1];
        const marker = token[0] as "`" | "~";
        const size = token.length;

        if (!activeFence) {
          activeFence = { marker, size };
          continue;
        }

        if (activeFence.marker === marker && size >= activeFence.size) {
          activeFence = null;
          continue;
        }
      }

      // Ignore markdown headings inside fenced code blocks.
      if (activeFence) continue;

      // ATX headings: # Title, ###Title, and indented forms.
      const atxMatch = line.match(/^\s*(#{1,6})\s*(.*?)\s*#*\s*$/);
      if (atxMatch && atxMatch[2].trim()) {
        items.push({
          line: index + 1,
          level: atxMatch[1].length,
          text: atxMatch[2].trim(),
        });
        continue;
      }

      // Setext headings:
      // Title
      // ===== or -----
      const nextLine = lines[index + 1] || "";
      const setextMatch = nextLine.match(/^\s*(=+|-+)\s*$/);
      if (setextMatch && line.trim()) {
        items.push({
          line: index + 1,
          level: setextMatch[1].startsWith("=") ? 1 : 2,
          text: line.trim(),
        });
      }

      // Inline HTML heading tags: <h2>Title</h2>
      const htmlHeadingMatch = line.match(
        /^\s*<h([1-6])[^>]*>(.*?)<\/h\1>\s*$/i,
      );
      if (htmlHeadingMatch && htmlHeadingMatch[2].trim()) {
        const plainText = htmlHeadingMatch[2].replace(/<[^>]+>/g, "").trim();
        if (plainText) {
          items.push({
            line: index + 1,
            level: Number(htmlHeadingMatch[1]),
            text: plainText,
          });
        }
      }
    }

    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${item.line}:${item.level}:${item.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [mdx]);

  // Keep rail popovers mutually exclusive to prevent stacking.
  React.useEffect(() => {
    if (!viewMenuOpen) return;
    setTocMenuOpen(false);
    setLangMenuOpen(false);
  }, [viewMenuOpen, setLangMenuOpen]);

  React.useEffect(() => {
    if (!tocMenuOpen) return;
    setViewMenuOpen(false);
    setLangMenuOpen(false);
  }, [tocMenuOpen, setLangMenuOpen, setViewMenuOpen]);

  React.useEffect(() => {
    if (!langMenuOpen) return;
    setViewMenuOpen(false);
    setTocMenuOpen(false);
  }, [langMenuOpen, setViewMenuOpen]);

  if (isEditHydrating) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 size={18} className="animate-spin" />
        {t("articles.create.checkingAccess")}
      </div>
    );
  }

  if (isEditAccessDenied) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-card p-6 text-center space-y-3">
          <ShieldAlert className="h-8 w-8 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">
            {t("articles.create.accessDenied")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("articles.create.accessDeniedMessage")}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/article">{t("articles.create.backToArticles")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex flex-col">
      <ArticleCreateHeader />

      <div className="flex-1">
        <div className="p-4 md:p-6 px-4 lg:p-8">
          <div
            className={`grid grid-cols-1 gap-4 lg:gap-6 ${
              viewMode === "split"
                ? "lg:grid-cols-[minmax(0,1fr)_72px]"
                : "lg:grid-cols-[minmax(0,48rem)_72px] lg:justify-center"
            }`}
          >
            <main className="min-w-0 space-y-4">
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full px-4 py-1 bg-background border border-border rounded-full text-sm font-semibold transition-all placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder={t("articles.create.subtitlePlaceholder")}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />

                <TagInputWithSuggestions
                  tags={tags}
                  onTagsChange={setTags}
                  maxTags={5}
                  placeholder={t("articles.create.tagsPlaceholder")}
                />
              </div>

              <div className="min-w-0">
                <SplitView
                  mdx={mdx}
                  setMdx={setMdx}
                  viewMode={viewMode}
                  jumpToLineRequest={jumpToLineRequest}
                  onSave={handleKeyboardSave}
                  onFormatBold={handleFormatBold}
                  onFormatItalic={handleFormatItalic}
                  onInsertImage={handleImageButtonClick}
                  onTogglePreview={handleTogglePreview}
                />
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
                    aria-label={t("articles.create.changeView")}
                  >
                    {viewIcon}
                  </Button>

                  {viewMenuOpen && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2 z-20 rounded-full border border-border/80 bg-card/95 shadow-lg shadow-black/15 py-2 px-2 flex flex-row gap-1">
                      {(["split", "preview"] as const).map((mode) => (
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
                          aria-label={t(`articles.create.${mode}View`)}
                        >
                          {mode === "split" && <Columns2 size={16} />}
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
                    onClick={() => setTocMenuOpen((prev) => !prev)}
                    aria-label="Table of contents"
                    title="Table of contents"
                  >
                    <ListTree size={16} />
                  </Button>

                  {tocMenuOpen && (
                    <div className="absolute right-14 top-0 z-20 max-h-80 w-72 overflow-y-auto rounded-2xl border border-border/80 bg-card/95 p-2 shadow-lg shadow-black/15 backdrop-blur">
                      {tocItems.length ? (
                        <div className="space-y-1">
                          {tocItems.map((item) => (
                            <button
                              key={`${item.line}-${item.text}`}
                              type="button"
                              className="flex w-full items-start rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                              style={{
                                paddingLeft: `${8 + (item.level - 1) * 12}px`,
                              }}
                              onClick={() => {
                                const token = Date.now();
                                setJumpToLineRequest({
                                  line: item.line,
                                  token,
                                });
                                setTimeout(() => {
                                  setJumpToLineRequest((prev) =>
                                    prev?.token === token ? null : prev,
                                  );
                                }, 300);
                                setTocMenuOpen(false);
                              }}
                            >
                              <span className="line-clamp-2">{item.text}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-2 py-3 text-xs text-muted-foreground">
                          No headings found.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <TranslationToggle />

                <Separator orientation="horizontal" className="w-10" />

                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={handleImageButtonClick}
                  disabled={imageUploading}
                  aria-label={t("articles.create.insertImage")}
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

                <ArticleSettingsButton
                  title={title}
                  subTitle={subtitle}
                  status={status}
                  language={contentLang}
                  tags={tags}
                  seriesName={seriesName}
                  isSerial={isSerial}
                  wordCount={analytics.wordCount}
                  views={analytics.liveStats.views}
                  lastEdited={articleId ? new Date().toISOString() : undefined}
                  createdAt={isEditMode ? undefined : new Date().toISOString()}
                  publishedAt={
                    status === "published"
                      ? new Date().toISOString()
                      : undefined
                  }
                  likes={analytics.liveStats.likes}
                  comments={analytics.liveStats.comments}
                  translations={Object.entries(translations).map(
                    ([lang, translation]) => ({
                      lang,
                      title: translation.title,
                      subTitle: translation.subtitle,
                    }),
                  )}
                  onSaveTranslations={handleSaveDraft}
                  onSettingsChange={handleSettingsChange}
                />

                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={handleExport}
                  aria-label={t("articles.create.export")}
                >
                  <Download size={16} />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full text-destructive hover:text-destructive"
                  onClick={handleDeleteArticle}
                  disabled={!articleId || isDeleting}
                  aria-label={t("articles.create.deleteArticle")}
                  title={
                    !articleId
                      ? t("articles.create.saveArticleFirst")
                      : t("articles.create.deleteArticle")
                  }
                >
                  {isDeleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  aria-label={t("articles.create.help")}
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
