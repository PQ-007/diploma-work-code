"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageSquare, Share2 } from "lucide-react";

interface FloatingActionBarProps {
  liked: boolean;
  likesCount: number;
  onLike: () => void;
  onCommentClick: () => void;
  onShare: () => void;
}

export default function FloatingActionBar({
  liked,
  likesCount,
  onLike,
  onCommentClick,
  onShare,
}: FloatingActionBarProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-500 lg:hidden">
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-md border shadow-2xl rounded-full ring-1 ring-black/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLike}
          className={`rounded-full hover:bg-red-50 hover:text-red-500 transition-colors ${
            liked ? "text-red-500 bg-red-50" : "text-muted-foreground"
          }`}
          aria-label="Like"
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
        </Button>
        {likesCount > 0 && (
          <span className="text-xs font-medium text-muted-foreground pr-1">
            {likesCount}
          </span>
        )}
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Comment"
          onClick={onCommentClick}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Share"
          onClick={onShare}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
