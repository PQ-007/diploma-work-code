"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers, MoreHorizontal, Sparkles, Clock } from "lucide-react";
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
  const isPublic = deck.is_public;

  return (
    <div
      className="flex flex-col gap-3 group transition-colors"
      style={{
        background: "color-mix(in oklab, var(--card) 60%, transparent)",
        border: "1px solid color-mix(in oklab, var(--border) 40%, transparent)",
        borderRadius: 10,
        padding: 16,
      }}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/flashcards/${encodeURIComponent(deck.slug)}`}
              className="text-[14px] font-semibold tracking-tight hover:text-primary transition-colors line-clamp-1"
            >
              {deck.name}
            </Link>
            {isPublic ? (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                style={{
                  background: "rgba(16,185,129,.16)",
                  color: "#34d399",
                  border: "1px solid rgba(16,185,129,.3)",
                }}
              >
                Public
              </span>
            ) : (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                Private
              </span>
            )}
          </div>
          {deck.description && (
            <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
              {deck.description}
            </p>
          )}
        </div>

        {(onEdit || onDelete || onToggleVisibility) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-60 hover:opacity-100 shrink-0"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
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

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-2.5 w-2.5" />
          {deck.card_count} {deck.card_count === 1 ? "card" : "cards"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {relativeTime(deck.updated_at)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-[11px]"
        >
          <Link href={`/flashcards/${encodeURIComponent(deck.slug)}`}>
            Browse
          </Link>
        </Button>
        {deck.card_count > 0 && (
          <Button
            asChild
            size="sm"
            className="flex-1 h-7 text-[11px] gap-1"
          >
            <Link href={`/flashcards/${encodeURIComponent(deck.slug)}?mode=study`}>
              <Sparkles className="h-3 w-3" />
              Study
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
