import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Share } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRankIcon } from "@/lib/utils/rankIcons";

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
        className={`border-border/40 p-4 transition-all duration-300 hover:shadow-md ${item.featured ? "border-foreground/20 shadow-sm bg-muted/20" : ""}`}
      >
        <div className="flex gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Author row aligned with skeleton */}
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 border border-border/40 flex-shrink-0">
                <AvatarImage src={item.author.avatar} />
                <AvatarFallback className="text-xs font-medium">
                  {item.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {item.author.name}
                  </span>
                  {getRankIcon(item.author.ranking_point || 0)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.timestamp}</span>
                  {item.readTime && (
                    <>
                      <span>&middot;</span>
                      <span>{item.readTime}</span>
                    </>
                  )}
                  <span className="hidden sm:inline">
                    &middot; {item.author.ranking_point || 0}{" "}
                    {t("common.points")}
                  </span>
                </div>
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-1.5">
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

            {/* Tags + Actions row to mirror skeleton layout */}
            <div className="flex items-center justify-between pt-1">
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
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {item.stats.views} {t("common.views")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${
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
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title={t("feed.actions.comment")}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${
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
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title={t("feed.actions.share")}
                >
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </article>
  );
}
