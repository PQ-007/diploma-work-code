// components/ArticleCreateHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CheckCircle2, Loader2, Clock, SaveIcon, Check, X } from "lucide-react";
import { useArticleEditor } from "@/app/article/create/ArticleEditorContext";
import { useLanguage } from "@/contexts/LanguageContext";

const formatRelativeTime = (date: Date, language: "en" | "mn" | "ja") => {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) {
    if (language === "mn") return "1 минут хүрэхгүйн";
    if (language === "ja") return "1分未満";
    return "less than a minute";
  }

  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  const formatUnit = (
    value: number,
    unit: "minute" | "hour" | "day" | "month" | "year",
  ) => {
    if (language === "mn") {
      const units = {
        minute: "минутын",
        hour: "цагийн",
        day: "өдрийн",
        month: "сарын",
        year: "жилийн",
      };
      return `${value} ${units[unit]}`;
    }

    if (language === "ja") {
      const units = {
        minute: "分",
        hour: "時間",
        day: "日",
        month: "か月",
        year: "年",
      };
      return `${value}${units[unit]}`;
    }

    const base = {
      minute: "minute",
      hour: "hour",
      day: "day",
      month: "month",
      year: "year",
    }[unit];
    return `${value} ${base}${value === 1 ? "" : "s"}`;
  };

  if (seconds < hour) return formatUnit(Math.floor(seconds / minute), "minute");
  if (seconds < day) return formatUnit(Math.floor(seconds / hour), "hour");
  if (seconds < month) return formatUnit(Math.floor(seconds / day), "day");
  if (seconds < year) return formatUnit(Math.floor(seconds / month), "month");
  return formatUnit(Math.floor(seconds / year), "year");
};

// --- ArticleCreateHeader Main Component ---

export function ArticleCreateHeader() {
  const { t, language } = useLanguage();
  const {
    title,
    setTitle,
    isSaving,
    isPublishing,
    justSaved,
    status,
    isEditMode,
    articleId,
    handleSaveDraft,
    handlePublish,
    handleUnpublish,
    // Auto-save state
    isAutoSaving,
    lastAutoSave,
    autoSaveEnabled,
    hasUnsavedChanges,
  } = useArticleEditor();

  const saveLabel = justSaved
    ? t("articles.create.saved")
    : isEditMode
      ? t("articles.create.saveChanges")
      : t("articles.create.saveDraft");

  const publishLabel = isPublishing
    ? t("articles.create.publishing")
    : t("articles.create.publish");

  const unpublishLabel = isPublishing
    ? t("articles.create.unpublishing")
    : t("articles.create.unpublish");

  const autoSave = (() => {
    if (!autoSaveEnabled) return null;
    if (isAutoSaving) return { icon: <Loader2 className="size-3.5 animate-spin" />, text: t("articles.create.autoSaving"), tone: "text-primary" };
    if (lastAutoSave) return { icon: <CheckCircle2 className="size-3.5" />, text: t("articles.create.autoSaved", { time: formatRelativeTime(lastAutoSave, language) }), tone: "text-success" };
    if (hasUnsavedChanges) return { icon: <Clock className="size-3.5" />, text: t("articles.create.unsavedChanges"), tone: "text-warning" };
    return { icon: <CheckCircle2 className="size-3.5" />, text: t("articles.create.autoSaveEnabled"), tone: "text-muted-foreground" };
  })();

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b bg-background/85 backdrop-blur-md">
      {/* One row from md; on phones the title drops to its own full-width row */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4 md:h-[var(--header-h)] md:flex-nowrap md:py-0">
        <SidebarTrigger className="size-9 text-muted-foreground" />

        <div className="order-last w-full md:order-none md:w-auto md:min-w-0 md:flex-1">
          <input
            autoFocus
            type="text"
            className="h-10 w-full rounded-lg border border-transparent bg-transparent px-3 text-base font-semibold outline-none transition-colors placeholder:text-muted-foreground hover:border-input focus:border-ring md:text-lg"
            placeholder={t("articles.create.titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label={t("articles.create.titlePlaceholder")}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <StatusBadge kind="article" value={status} />

          {autoSave && (
            <span className={`hidden items-center gap-1.5 text-xs font-medium sm:inline-flex ${autoSave.tone}`} title={autoSave.text}>
              {autoSave.icon}
              <span className="hidden lg:inline">{autoSave.text}</span>
            </span>
          )}

          <Button variant="secondary" size="sm" onClick={handleSaveDraft} disabled={isSaving || isPublishing} aria-label={saveLabel}>
            {isSaving ? <Loader2 className="animate-spin" /> : <SaveIcon />}
            <span className="hidden sm:inline">{saveLabel}</span>
          </Button>

          {status === "published" ? (
            <Button variant="outline" size="sm" onClick={handleUnpublish} disabled={isPublishing || isSaving || !articleId}>
              {isPublishing ? <Loader2 className="animate-spin" /> : <X />}
              {unpublishLabel}
            </Button>
          ) : (
            <Button size="sm" onClick={handlePublish} disabled={isPublishing || isSaving || !articleId}>
              {isPublishing ? <Loader2 className="animate-spin" /> : <Check />}
              {publishLabel}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
