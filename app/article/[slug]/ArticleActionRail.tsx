"use client";

import Link from "next/link";
import { Bookmark, Check, Heart, Languages, MessageSquare, Pencil, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { ARTICLE_LANGS, type ArticleLangCode } from "./articleLang";

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
}

/**
 * Reader actions. Desktop: sticky vertical rail beside the article.
 * Phones/tablets: compact bar floating above the bottom tab bar.
 */
export default function ArticleActionRail(props: ArticleActionRailProps) {
  const {
    isLiked, onToggleLike, isBookmarked, onToggleBookmark, likesCount, onCommentClick,
    availableTranslations, selectedLanguage, loading, onSelectLanguage, onShare, isOwnArticle, articleEditHref,
  } = props;
  const { t } = useLanguage();

  const languageMenu = (side: "right" | "top") => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("articles.detail.languageSelector")} className="rounded-full text-muted-foreground">
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="start" className="w-36">
        {ARTICLE_LANGS.map((lang) => {
          const available = availableTranslations.includes(lang.code);
          const selected = selectedLanguage === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              disabled={!available || loading}
              onClick={() => !selected && onSelectLanguage(lang.code)}
              className="justify-between"
            >
              {lang.label}
              {selected && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const like = (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleLike}
      aria-pressed={isLiked}
      aria-label={t("feed.actions.like")}
      className={cn("rounded-full", isLiked ? "bg-brand-red/10 text-brand-red hover:bg-brand-red/15" : "text-muted-foreground")}
    >
      <Heart fill={isLiked ? "currentColor" : "none"} />
    </Button>
  );
  const bookmark = (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleBookmark}
      aria-pressed={isBookmarked}
      aria-label={t("feed.actions.bookmark")}
      className={cn("rounded-full", isBookmarked ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground")}
    >
      <Bookmark fill={isBookmarked ? "currentColor" : "none"} />
    </Button>
  );
  const comment = (
    <Button variant="ghost" size="icon" onClick={onCommentClick} aria-label={t("feed.actions.comment")} className="rounded-full text-muted-foreground">
      <MessageSquare />
    </Button>
  );
  const share = (
    <Button variant="ghost" size="icon" onClick={onShare} aria-label={t("common.share")} className="rounded-full text-muted-foreground">
      <Share2 />
    </Button>
  );
  const edit = isOwnArticle && (
    <Button asChild variant="ghost" size="icon" aria-label={t("common.edit")} className="rounded-full text-muted-foreground">
      <Link href={articleEditHref}>
        <Pencil />
      </Link>
    </Button>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 flex flex-col items-center gap-1 rounded-full border bg-card p-1.5 shadow-xs">
          {like}
          <span className="pb-1 text-xs font-medium tabular-nums text-muted-foreground">{likesCount}</span>
          {bookmark}
          {comment}
          {languageMenu("right")}
          {share}
          {edit}
        </div>
      </aside>

      {/* Phone / tablet bar, above the bottom tabs */}
      <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+0.75rem)] z-30 flex justify-center px-4 md:bottom-6 lg:hidden">
        <div className="flex items-center gap-0.5 rounded-full border bg-card/95 p-1 shadow-lg backdrop-blur-md">
          {like}
          <span className="pr-1.5 text-xs font-medium tabular-nums text-muted-foreground">{likesCount}</span>
          {bookmark}
          {comment}
          {languageMenu("top")}
          {share}
          {edit}
        </div>
      </div>
    </>
  );
}
