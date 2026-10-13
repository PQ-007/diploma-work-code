"use client";

import { Heart, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionBarProps {
  liked: boolean;
  likesCount: number;
  onLike: () => void;
  onCommentClick: () => void;
  onShare: () => void;
}

/** Phone/tablet reader actions, floating above the bottom tab bar (desktop uses the side rail). */
export default function FloatingActionBar({ liked, likesCount, onLike, onCommentClick, onShare }: FloatingActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+0.75rem)] z-30 flex justify-center px-4 md:bottom-6 lg:hidden">
      <div className="flex items-center gap-0.5 rounded-full border bg-card/95 p-1 shadow-lg backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLike}
          aria-pressed={liked}
          aria-label="Like"
          className={cn("rounded-full", liked ? "bg-brand-red/10 text-brand-red hover:bg-brand-red/15" : "text-muted-foreground")}
        >
          <Heart fill={liked ? "currentColor" : "none"} />
        </Button>
        <span className="pr-1.5 text-xs font-medium tabular-nums text-muted-foreground">{likesCount}</span>
        <Button variant="ghost" size="icon" onClick={onCommentClick} aria-label="Comment" className="rounded-full text-muted-foreground">
          <MessageSquare />
        </Button>
        <Button variant="ghost" size="icon" onClick={onShare} aria-label="Share" className="rounded-full text-muted-foreground">
          <Share2 />
        </Button>
      </div>
    </div>
  );
}
