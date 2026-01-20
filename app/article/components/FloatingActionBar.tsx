"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";

type FloatingActionBarProps = {
  isLiked: boolean;
  onLike: () => void;
  isBookmarked: boolean;
  onBookmark: () => void;
};

export default function FloatingActionBar({
  isLiked,
  onLike,
  isBookmarked,
  onBookmark,
}: FloatingActionBarProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-500 lg:hidden">
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-md border shadow-2xl rounded-full ring-1 ring-black/5">
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
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Comment"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
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
        <Separator orientation="vertical" className="h-6" />
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
