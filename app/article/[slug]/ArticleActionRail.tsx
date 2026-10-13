"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bookmark,
  Check,
  Heart,
  Languages,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Share2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ARTICLE_LANGS, type ArticleLangCode } from "./articleLang";

type MoreAction = "request-translation" | "report-article" | "report-author";

interface ArticleActionRailProps {
  isLiked: boolean;
  onToggleLike: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  likesCount: number;
  onCommentClick: () => void;
  availableTranslations: ArticleLangCode[];
  selectedLanguage: ArticleLangCode;
  loading: boolean;
  onSelectLanguage: (code: ArticleLangCode) => void;
  onShare: () => void;
  isOwnArticle: boolean;
  articleEditHref: string;
  onMoreAction: (action: MoreAction) => void;
}

export default function ArticleActionRail({
  isLiked,
  onToggleLike,
  isBookmarked,
  onToggleBookmark,
  likesCount,
  onCommentClick,
  availableTranslations,
  selectedLanguage,
  loading,
  onSelectLanguage,
  onShare,
  isOwnArticle,
  articleEditHref,
  onMoreAction,
}: ArticleActionRailProps) {
  const { t } = useLanguage();
  const desktopLanguageMenuRef = useRef<HTMLDivElement | null>(null);
  const [isDesktopLanguageMenuOpen, setIsDesktopLanguageMenuOpen] =
    useState(false);

  useEffect(() => {
    if (!isDesktopLanguageMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!desktopLanguageMenuRef.current?.contains(target)) {
        setIsDesktopLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDesktopLanguageMenuOpen]);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6">
        <div className="flex">
          {/* Action stack */}
          <div className="flex flex-col items-center gap-3">
            {/* Like action */}
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full border ${
                isLiked
                  ? "text-destructive border-destructive/40 bg-destructive/10"
                  : "border-border hover:bg-muted"
              }`}
              onClick={onToggleLike}
              aria-label={t("feed.actions.like")}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            </Button>

            {/* Bookmark action */}
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full border ${
                isBookmarked
                  ? "text-primary border-primary/40 bg-primary/10 "
                  : "border-border hover:bg-muted"
              }`}
              onClick={onToggleBookmark}
              aria-label={t("feed.actions.bookmark")}
            >
              <Bookmark
                className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`}
              />
            </Button>

            {/* Comment action */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-border hover:bg-muted"
              aria-label={t("feed.actions.comment")}
              onClick={onCommentClick}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            {/* Language selector */}
            <div className="relative" ref={desktopLanguageMenuRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full border border-border hover:bg-muted"
                aria-label={t("articles.detail.languageSelector")}
                onClick={() => setIsDesktopLanguageMenuOpen((prev) => !prev)}
              >
                <Languages className="h-5 w-5" />
              </Button>

              {isDesktopLanguageMenuOpen && (
                <div className="absolute left-14 top-1/2 z-50 w-28 -translate-y-1/2 rounded-2xl border border-border/70 bg-background/95 p-2 shadow-2xl backdrop-blur-md">
                  <div className="space-y-1">
                    {ARTICLE_LANGS.map((lang) => {
                      const isAvailable = availableTranslations.includes(
                        lang.code,
                      );
                      const isSelected = selectedLanguage === lang.code;

                      return (
                        <Button
                          key={lang.code}
                          type="button"
                          variant="ghost"
                          className={`h-8 w-full justify-between rounded-lg px-3 text-sm font-semibold ${
                            isSelected
                              ? "bg-primary text-primary-foreground hover:bg-primary"
                              : "text-foreground hover:bg-muted"
                          } ${
                            !isAvailable
                              ? "opacity-50 text-muted-foreground cursor-not-allowed hover:bg-transparent"
                              : ""
                          }`}
                          disabled={!isAvailable || loading}
                          onClick={() => {
                            if (isAvailable && !loading && !isSelected) {
                              onSelectLanguage(lang.code);
                            }
                            setIsDesktopLanguageMenuOpen(false);
                          }}
                        >
                          <span>{lang.label}</span>
                          {isSelected && <Check className="h-4 w-4" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* Share action */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-border hover:bg-muted"
              aria-label={t("common.share")}
              onClick={onShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>

            {isOwnArticle && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="rounded-full border border-border hover:bg-muted"
                aria-label={t("common.edit")}
              >
                <Link href={articleEditHref}>
                  <Pencil className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* More action */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-border hover:bg-muted"
                  aria-label={t("articles.detail.moreActions")}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem
                  onClick={() => onMoreAction("request-translation")}
                >
                  {t("articles.detail.requestTranslation")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMoreAction("report-article")}
                >
                  {t("articles.detail.reportArticle")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMoreAction("report-author")}>
                  {t("articles.detail.reportAuthor")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-px w-10 bg-border my-1" />

            <div className="text-[11px] text-muted-foreground text-center">
              <div className="font-semibold text-foreground/80">
                {likesCount}
              </div>
              <div>{t("feed.stats.likes")}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
