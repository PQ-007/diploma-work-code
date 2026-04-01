import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageSquare,
  ArrowBigUp,
  ArrowBigDown,
  Bookmark,
  CheckCircle2,
  Pin,
} from "lucide-react";
import { getRankIcon } from "@/lib/utils/rankIcons";

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

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DiscussionItem({
  item,
  onVote,
  onBookmark,
  onClick,
  disabled,
}: DiscussionItemProps) {
  return (
    <Card
      className={`overflow-hidden border-border/40 transition-all duration-200 hover:shadow-sm ${
        item.pinned ? "border-foreground/20 bg-muted/20" : ""
      }`}
    >
      {/* Author header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Avatar className="h-9 w-9 border border-border/40">
          <AvatarImage src={item.author.avatar_url} />
          <AvatarFallback className="text-xs font-medium">
            {item.author.display_name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate">
              {item.author.display_name}
            </span>
            {getRankIcon(item.author.ranking_point || 0)}
            {item.pinned && (
              <Pin className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            {item.answered && (
              <Badge
                variant="secondary"
                className="shrink-0 text-[10px] font-normal border border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0"
              >
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                Answered
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{timeAgo(item.created_at)}</span>
            <span>·</span>
            <span>{item.author.ranking_point || 0} points</span>
          </div>
        </div>
      </div>

      {/* Post body — clickable to open modal */}
      <button
        className="w-full text-left px-4 pb-2 cursor-pointer focus:outline-none"
        onClick={() => onClick(item.id)}
      >
        <h2 className="text-[15px] font-semibold leading-snug mb-1">
          {item.title}
        </h2>
        {item.body && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {item.body}
          </p>
        )}
      </button>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 4).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-1.5 py-0 text-[10px] font-normal border border-border/40"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Action bar — Facebook-style */}
      <div className="border-t border-border/30 px-2 py-1 flex items-center justify-between">
        {/* Vote */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1 px-2 ${
              item.userVote === "up"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onVote(item.id, "up")}
            disabled={disabled}
          >
            <ArrowBigUp
              className="h-[18px] w-[18px]"
              fill={item.userVote === "up" ? "currentColor" : "none"}
            />
          </Button>
          <span className="text-xs font-semibold tabular-nums min-w-[2ch] text-center text-muted-foreground">
            {item.votes}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1 px-2 ${
              item.userVote === "down"
                ? "text-destructive"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onVote(item.id, "down")}
            disabled={disabled}
          >
            <ArrowBigDown
              className="h-[18px] w-[18px]"
              fill={item.userVote === "down" ? "currentColor" : "none"}
            />
          </Button>
        </div>

        {/* Comment */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-3 text-muted-foreground hover:text-foreground"
          onClick={() => onClick(item.id)}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">{item.commentCount}</span>
        </Button>

        {/* Bookmark */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 ${
            item.bookmarked
              ? "text-blue-500"
              : "text-muted-foreground hover:text-blue-500"
          }`}
          onClick={() => onBookmark(item.id)}
          disabled={disabled}
        >
          <Bookmark
            className="h-4 w-4"
            fill={item.bookmarked ? "currentColor" : "none"}
          />
        </Button>
      </div>
    </Card>
  );
}
