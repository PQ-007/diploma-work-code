"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, Globe, Lock, MoreHorizontal, Play } from "lucide-react";
import type { DeckWithCount } from "@/lib/flashcards/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DeckCardProps {
  deck: DeckWithCount;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function DeckCard({
  deck,
  onEdit,
  onDelete,
  onToggleVisibility,
}: DeckCardProps) {
  return (
    <Card className="group relative border-border/60 bg-card/50 hover:bg-card transition-colors">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/flashcards/${encodeURIComponent(deck.slug)}`}
            className="flex-1 min-w-0"
          >
            <h3 className="text-base font-bold text-foreground leading-tight line-clamp-2 hover:underline">
              {deck.name}
            </h3>
          </Link>

          {(onEdit || onDelete || onToggleVisibility) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 -mt-1">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>Edit deck</DropdownMenuItem>
                )}
                {onToggleVisibility && (
                  <DropdownMenuItem onClick={onToggleVisibility}>
                    {deck.is_public ? "Make private" : "Make public"}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive"
                    >
                      Delete deck
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {deck.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {deck.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[11px] gap-1">
            <Layers className="h-3 w-3" />
            {deck.card_count} {deck.card_count === 1 ? "card" : "cards"}
          </Badge>
          <Badge
            variant="secondary"
            className={`text-[11px] gap-1 ${
              deck.is_public
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {deck.is_public ? (
              <Globe className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {deck.is_public ? "Public" : "Private"}
          </Badge>
          <span className="text-[11px] text-muted-foreground ml-auto">
            {relativeTime(deck.updated_at)}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
          >
            <Link href={`/flashcards/${encodeURIComponent(deck.slug)}`}>
              Browse
            </Link>
          </Button>
          {deck.card_count > 0 && (
            <Button
              asChild
              size="sm"
              className="flex-1 h-8 text-xs gap-1"
            >
              <Link
                href={`/flashcards/${encodeURIComponent(deck.slug)}?mode=study`}
              >
                <Play className="h-3 w-3" />
                Study
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
