import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Heart,
  Bookmark,
  MoreHorizontal,
  MessageCircle,
  Reply,
  Share,
  Clock,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const typeKeyMap: Record<string, string> = {
  project: "feed.types.project",
  blog: "feed.types.blog",
  contest: "feed.types.contest",
  achievement: "feed.types.achievement",
  flashcard: "feed.types.flashcard",
  discussion: "feed.types.discussion",
};

export interface ListItemData {
  id: string;
  day?: number;
  type: string;
  author: {
    name: string;
    avatar: string;
    username: string;
    verified?: boolean;
    reputation?: number;
    contributions: number;
    ranking_point?: number;
  };
  timestamp: string;
  readTime?: string;
  content: {
    title: string;
    description: string;
    image?: string;
    tags: string[];
  };
  stats: {
    likes: number;
    comments: number;
    views: number;
    shares?: number;
  };
  featured?: boolean;
  trending?: boolean;
}

interface ListItemProps {
  item: ListItemData;
  isLiked: boolean;
  isBookmarked: boolean;
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
}

export default function ListItem({
  item,
  isLiked,
  isBookmarked,
  toggleLike,
  toggleBookmark,
}: ListItemProps) {
  const { t } = useLanguage();
  return (
    <article key={item.id} className="group relative">
      <Card
        className={`transition-all duration-300 hover:shadow-md overflow-hidden border-border/40 ${
          item.featured ? "border-foreground/20 shadow-sm bg-muted/20" : ""
        } p-4`}
      >
        <div className="space-y-3">
          {/* Type Label + Author Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Badge
                variant="secondary"
                className="px-2 py-0.5 text-xs font-medium whitespace-nowrap"
              >
                {typeKeyMap[item.type] ? t(typeKeyMap[item.type]) : item.type}
              </Badge>
              <Avatar className="h-6 w-6 border border-border/40 flex-shrink-0">
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
              <span className="text-xs text-muted-foreground hidden sm:inline">
                - {item.author.contributions} {t("common.contributions")}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                - {item.timestamp}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Title and Description */}
          <div className="space-y-1">
            <Link
              href={`/article/${item.id}`}
              className="block space-y-1"
              prefetch
            >
              <h2 className="text-lg font-semibold tracking-tight leading-snug group-hover:text-foreground/90 transition-colors line-clamp-2">
                {item.content.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {item.content.description}
              </p>
            </Link>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {item.content.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-2 py-0.5 text-xs font-normal border border-border/40"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={t("feed.actions.reply")}
            >
              <Reply className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${
                isLiked
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              }`}
              onClick={() => toggleLike(item.id)}
              title={
                isLiked ? t("feed.actions.unlike") : t("feed.actions.like")
              }
            >
              <Heart
                className="h-4 w-4"
                fill={isLiked ? "currentColor" : "none"}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={t("feed.actions.comment")}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${
                isBookmarked
                  ? "text-blue-500"
                  : "text-muted-foreground hover:text-blue-500"
              }`}
              onClick={() => toggleBookmark(item.id)}
              title={
                isBookmarked
                  ? t("feed.actions.removeBookmark")
                  : t("feed.actions.bookmark")
              }
            >
              <Bookmark
                className="h-4 w-4"
                fill={isBookmarked ? "currentColor" : "none"}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={t("feed.actions.share")}
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </article>
  );
}
