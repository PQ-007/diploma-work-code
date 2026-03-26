// components/ArticleCreateHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { useArticleEditor } from "@/app/article/create/ArticleEditorContext";
import { formatDistanceToNow } from "date-fns";

// --- ArticleCreateHeader Main Component ---

export function ArticleCreateHeader() {
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
    // Auto-save state
    isAutoSaving,
    lastAutoSave,
    autoSaveEnabled,
    hasUnsavedChanges,
    getAutoSaveStatus,
  } = useArticleEditor();

  const statusChipClass =
    status === "published"
      ? "border-transparent bg-primary text-white"
      : "border-border bg-muted text-muted-foreground";

  const statusDotClass =
    status === "published" ? "bg-white/90" : "bg-muted-foreground/70";

  return (
    <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center border-b bg-background/95 px-4 transition-all ease-linear supports-[backdrop-filter]:backdrop-blur-sm -mx-4 -mt-4 md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <SidebarTrigger />
          <input
            autoFocus
            type="text"
            className="w-full px-4 py-1.5 bg-background rounded-lg text-lg font-semibold "
            placeholder="Enter article title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-sm font-medium shrink-0">
          <Badge variant="default" className={`gap-1 ${statusChipClass}`}>
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDotClass}`}
              aria-hidden
            />
            {status === "published" ? "Published" : "Draft"}
          </Badge>

          {/* Auto-save status indicator */}
          {autoSaveEnabled && (
            <>
              <div className="h-6 w-px bg-border mx-1" aria-hidden />
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {isAutoSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                    <span className="text-blue-600">Auto-saving...</span>
                  </>
                ) : lastAutoSave ? (
                  <>
                    <CheckCircle2 size={14} className="text-green-600" />
                    <span className="text-green-600">Auto-saved {formatDistanceToNow(lastAutoSave)} ago</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Clock size={14} className="text-orange-500" />
                    <span className="text-orange-500">Unsaved changes</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Auto-save enabled</span>
                  </>
                )}
              </div>
            </>
          )}

          <div className="h-6 w-px bg-border mx-1" aria-hidden />

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span>
              {justSaved ? "Saved" : isEditMode ? "Save changes" : "Save draft"}
            </span>
          </Button>

          {status !== "published" && (
            <Button
              size="sm"
              className="gap-2"
              onClick={handlePublish}
              disabled={isPublishing || isSaving || !articleId}
            >
              {isPublishing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span>{isPublishing ? "Publishing…" : "Publish"}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
