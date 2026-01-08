"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";

type Props = {
  likes: number;
  sidebar?: boolean;
};

export default function FloatingActionBar({ likes, sidebar = false }: Props) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (sidebar) {
    return (
      <div className="flex flex-col gap-6 items-center">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full hover:bg-muted ${isLiked ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-muted-foreground"}`}
          onClick={() => setIsLiked(!isLiked)}
        >
          <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
        </Button>
        <span className="text-sm font-medium text-muted-foreground -mt-3">
          {likes + (isLiked ? 1 : 0)}
        </span>

        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-muted">
          <MessageCircle className="h-6 w-6" />
        </Button>

        <Separator className="w-8" />

        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-muted">
          <Share2 className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-md border shadow-2xl rounded-full ring-1 ring-black/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsLiked(!isLiked)}
          className={`rounded-full hover:bg-red-50 hover:text-red-500 transition-colors ${isLiked ? "text-red-500 bg-red-50" : "text-muted-foreground"}`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors ${isBookmarked ? "text-blue-500" : "text-muted-foreground"}`}
        >
          <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}