// components/ArticleCreateHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const statusChipClass =
    status === "published"
      ? "border-transparent bg-primary text-white"
      : "border-border bg-muted text-muted-foreground";

  const statusDotClass =
    status === "published" ? "bg-white/90" : "bg-muted-foreground/70";

  const autoSaveLabel = isAutoSaving
    ? t("articles.create.autoSaving")
    : lastAutoSave
      ? formatRelativeTime(lastAutoSave, language)
      : hasUnsavedChanges
        ? t("articles.create.unsavedChanges")
        : t("articles.create.autoSaveEnabled");

  const autoSaveToneClass = isAutoSaving
    ? "text-blue-600 border-blue-500/30"
    : lastAutoSave
      ? "text-green-600 border-green-500/30"
      : hasUnsavedChanges
        ? "text-orange-500 border-orange-500/30"
        : "text-muted-foreground border-border";

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

  const statusLabel =
    status === "published"
      ? t("articles.create.published")
      : t("articles.create.draft");

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b bg-background/95 px-4 transition-all ease-linear supports-[backdrop-filter]:backdrop-blur-sm -mx-4 -mt-4 md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8">
      <div className="flex w-full items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <SidebarTrigger />
          <input
            autoFocus
            type="text"
            className="h-10 w-full rounded-lg bg-background px-4 py-1.5 text-base font-semibold md:text-lg"
            placeholder={t("articles.create.titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-sm font-medium shrink-0">
          <Badge variant="default" className={`gap-1 ${statusChipClass}`}>
            <span
              className={`h-2 w-2 rounded-full ${statusDotClass}`}
              aria-hidden
            />
            {status === "published"
              ? t("articles.create.published")
              : t("articles.create.draft")}
          </Badge>

          {autoSaveEnabled && (
            <>
              <div className="h-6 w-px bg-border mx-1" aria-hidden />
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {isAutoSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                    <span className="text-blue-600">
                      {t("articles.create.autoSaving")}
                    </span>
                  </>
                ) : lastAutoSave ? (
                  <>
                    <CheckCircle2 size={14} className="text-green-600" />
                    <span className="text-green-600">
                      {t("articles.create.autoSaved", {
                        time: formatRelativeTime(lastAutoSave, language),
                      })}
                    </span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Clock size={14} className="text-orange-500" />
                    <span className="text-orange-500">
                      {t("articles.create.unsavedChanges")}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {t("articles.create.autoSaveEnabled")}
                    </span>
                  </>
                )}
              </div>
            </>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing}
            title={saveLabel}
            aria-label={saveLabel}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <SaveIcon size={16} />
            )}
          </Button>

          {status !== "published" && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={handlePublish}
              disabled={isPublishing || isSaving || !articleId}
              title={publishLabel}
              aria-label={publishLabel}
            >
              {isPublishing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
            </Button>
          )}

          {status === "published" && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={handleUnpublish}
              disabled={isPublishing || isSaving || !articleId}
              title={unpublishLabel}
              aria-label={unpublishLabel}
            >
              {isPublishing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <X size={16} />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
