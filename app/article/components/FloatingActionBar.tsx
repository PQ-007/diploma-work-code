"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";

type ArticleLangCode = "mn" | "en" | "jp";

const ARTICLE_LANGS: Array<{ code: ArticleLangCode; label: string }> = [
  { code: "mn", label: "MN" },
  { code: "en", label: "EN" },
  { code: "jp", label: "JP" },
];

type FloatingActionBarProps = {
  isLiked: boolean;
  onLike: () => void;
  isBookmarked: boolean;
  onBookmark: () => void;
  selectedLanguage: ArticleLangCode;
  availableTranslations: ArticleLangCode[];
  onLanguageChange: (lang: ArticleLangCode) => void;
};

export default function FloatingActionBar({
  isLiked,
  onLike,
  isBookmarked,
  onBookmark,
  selectedLanguage,
  availableTranslations,
  onLanguageChange,
}: FloatingActionBarProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-500 lg:hidden">
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-md border shadow-2xl rounded-full ring-1 ring-black/5">
        {/* Like action */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onLike}
          className={`rounded-full hover:bg-red-50 hover:text-red-500 transition-colors ${
            isLiked ? "text-red-500 bg-red-50" : "text-muted-foreground"
          }`}
          aria-label="Like"
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
        </Button>

        {/* Comment action */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Comment"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>

        {/* Bookmark action */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBookmark}
          className={`rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors ${
            isBookmarked ? "text-blue-500" : "text-muted-foreground"
          }`}
          aria-label="Bookmark"
        >
          <Bookmark
            className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`}
          />
        </Button>

        {/* Language selector */}
        <div className="flex items-center">
          {ARTICLE_LANGS.map((lang) => {
            const isAvailable = availableTranslations.includes(lang.code);
            const isSelected = selectedLanguage === lang.code;

            return (
              <Button
                key={lang.code}
                type="button"
                size="icon"
                variant={isSelected ? "default" : "outline"}
                className={`h-5 w-5 rounded-full tracking-wide ${
                  !isAvailable
                    ? "opacity-50 text-muted-foreground cursor-not-allowed"
                    : ""
                }`}
                disabled={!isAvailable}
                onClick={() => {
                  if (isAvailable && !isSelected) {
                    onLanguageChange(lang.code);
                  }
                }}
              >
                {lang.label }
              </Button>
            );
          })}
        </div>

        {/* Share action */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Share"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
