"use client";

import { ArrowBigDown, ArrowBigUp, Bookmark, CheckCircle2, MessageSquare, Pin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagList } from "@/components/common/Tag";
import { UserChip } from "@/components/common/UserChip";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/utils/relativeTime";

export interface DiscussionItemData {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  answered: boolean;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    user_name: string;
    avatar_url: string;
    ranking_point?: number;
  };
  tags: string[];
  votes: number;
  userVote: "up" | "down" | null;
  commentCount: number;
  bookmarked: boolean;
}

interface DiscussionItemProps {
  item: DiscussionItemData;
  onVote: (id: string, direction: "up" | "down") => void;
  onBookmark: (id: string) => void;
  onClick: (id: string) => void;
  disabled?: boolean;
}

/** Q&A row: vote column on the left, question on the right. */
export default function DiscussionItem({ item, onVote, onBookmark, onClick, disabled }: DiscussionItemProps) {
  const { t, i18n } = useTranslation();
  const excerpt = item.body?.replace(/\s+/g, " ").trim();

  return (
    <article
      className={cn(
        "group relative flex gap-3 rounded-xl border bg-card p-3 shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm sm:gap-4 sm:p-4",
        item.pinned && "border-primary/30 bg-accent/30",
      )}
    >
      {/* Votes */}
      <div className="relative z-10 flex w-10 shrink-0 flex-col items-center rounded-lg bg-muted/60 py-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Upvote"
          aria-pressed={item.userVote === "up"}
          disabled={disabled}
          onClick={() => onVote(item.id, "up")}
          className={cn("size-7", item.userVote === "up" ? "text-primary" : "text-muted-foreground")}
        >
          <ArrowBigUp className="size-5" fill={item.userVote === "up" ? "currentColor" : "none"} />
        </Button>
        <span className="text-sm font-semibold tabular-nums">{item.votes}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Downvote"
          aria-pressed={item.userVote === "down"}
          disabled={disabled}
          onClick={() => onVote(item.id, "down")}
          className={cn("size-7", item.userVote === "down" ? "text-destructive" : "text-muted-foreground")}
        >
          <ArrowBigDown className="size-5" fill={item.userVote === "down" ? "currentColor" : "none"} />
        </Button>
      </div>

      {/* Question */}
      <div className="min-w-0 flex-1">
        {(item.pinned || item.answered) && (
          <div className="mb-1.5 flex gap-1.5">
            {item.pinned && <Badge variant="brand"><Pin />Pinned</Badge>}
            {item.answered && <Badge variant="success"><CheckCircle2 />{t("discussions.answered", "Answered")}</Badge>}
          </div>
        )}
        <h3 className="text-[1.02rem] font-semibold leading-snug tracking-tight">
          <button
            type="button"
            onClick={() => onClick(item.id)}
            className="text-left outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:underline"
          >
            {item.title}
          </button>
        </h3>
        {excerpt && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>}
        <TagList tags={item.tags} max={3} className="mt-2.5" />
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <UserChip name={item.author.display_name} avatarUrl={item.author.avatar_url} username={item.author.user_name} />
          <time dateTime={item.created_at}>{relativeTime(item.created_at, i18n.language)}</time>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {item.commentCount}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Bookmark"
            aria-pressed={item.bookmarked}
            disabled={disabled}
            onClick={() => onBookmark(item.id)}
            className={cn("relative z-10 ml-auto -my-1 -mr-1.5", item.bookmarked ? "text-primary" : "text-muted-foreground")}
          >
            <Bookmark fill={item.bookmarked ? "currentColor" : "none"} />
          </Button>
        </div>
      </div>
    </article>
  );
}
