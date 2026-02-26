import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  MessageSquare,
  ArrowBigUp,
  ArrowBigDown,
  Eye,
  Clock,
  CheckCircle2,
  Bookmark,
  MoreHorizontal,
  Pin,
} from "lucide-react";

export interface DiscussionItemData {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  timestamp: string;
  title: string;
  description: string;
  tags: string[];
  stats: {
    votes: number;
    replies: number;
    views: number;
  };
  answered: boolean;
  pinned: boolean;
}

interface DiscussionItemProps {
  item: DiscussionItemData;
  isBookmarked: boolean;
  userVote: "up" | "down" | null;
  toggleBookmark: (id: string) => void;
  toggleVote: (id: string, direction: "up" | "down") => void;
}

export default function DiscussionItem({
  item,
  isBookmarked,
  userVote,
  toggleBookmark,
  toggleVote,
}: DiscussionItemProps) {
  return (
    <article className="group relative">
      <Card
        className={`transition-all duration-200 hover:shadow-sm overflow-hidden border-border/40 p-4 ${
          item.pinned ? "border-foreground/20 bg-muted/20" : ""
        }`}
      >
        <div className="flex gap-4">
          {/* Vote Column */}
          <div className="flex flex-col items-center gap-0.5 pt-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${
                userVote === "up"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => toggleVote(item.id, "up")}
            >
              <ArrowBigUp
                className="h-5 w-5"
                fill={userVote === "up" ? "currentColor" : "none"}
              />
            </Button>
            <span
              className={`text-sm font-semibold tabular-nums ${
                userVote === "up"
                  ? "text-foreground"
                  : userVote === "down"
                    ? "text-muted-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {item.stats.votes +
                (userVote === "up" ? 1 : userVote === "down" ? -1 : 0)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${
                userVote === "down"
                  ? "text-muted-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => toggleVote(item.id, "down")}
            >
              <ArrowBigDown
                className="h-5 w-5"
                fill={userVote === "down" ? "currentColor" : "none"}
              />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Author Row */}
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-border/40">
                <AvatarImage src={item.author.avatar} />
                <AvatarFallback className="text-xs font-medium">
                  {item.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">
                {item.author.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ({item.author.username})
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {item.timestamp}
              </span>
              {item.pinned && <Pin className="h-3 w-3 text-muted-foreground" />}
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <Link
                href={`/discussions/${item.id}`}
                className="block space-y-1"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight leading-snug group-hover:text-foreground/90 transition-colors line-clamp-2">
                    {item.title}
                  </h2>
                  {item.answered && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-xs font-normal border border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Answered
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </Link>
            </div>

            {/* Tags + Stats */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-wrap gap-1.5 items-center">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-1.5 py-0.5 text-xs font-normal border border-border/40"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{item.stats.replies}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span>{item.stats.views}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${
                    isBookmarked
                      ? "text-blue-500"
                      : "text-muted-foreground hover:text-blue-500"
                  }`}
                  onClick={() => toggleBookmark(item.id)}
                >
                  <Bookmark
                    className="h-4 w-4"
                    fill={isBookmarked ? "currentColor" : "none"}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </article>
  );
}
