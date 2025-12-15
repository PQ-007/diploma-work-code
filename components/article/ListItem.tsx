import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Heart,
  Bookmark,
  MoreHorizontal,
  Code,
  BookOpen,
  Trophy,
  Zap,
  Award,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";



interface ListItemData {
  id: string;
  day: number;
  author: {
    name: string;
    avatar: string;
    username: string;
    verified: boolean;
    reputation: number;
    contributions: number;
  };
  timestamp: string;
  readTime: string;
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
  featured: boolean;
  trending: boolean;
}

interface ListItemProps {
  item: ListItemData;
  isLiked: boolean;
  isBookmarked: boolean;
  isInReadingList: boolean;
  showQuickActions: boolean;
  toggleLike: (id: string) => void;
  toggleBookmark: (id: string) => void;
  toggleReadingList: (id: string) => void;
  handleMoreClick: (id: string) => void;
}



export default function ListItem({
  item,
  isLiked,
  isBookmarked,
  isInReadingList,
  showQuickActions,
  toggleLike,
  toggleBookmark,
  toggleReadingList,
  handleMoreClick,
}: ListItemProps) {
  return (
    <article key={item.id} className="group relative">
      <Card
        className={`transition-all duration-300 hover:shadow-md overflow-hidden border-border/40 ${
          item.featured ? "border-foreground/20 shadow-sm bg-muted/20" : ""
        } p-4`} 
      >
        <div className="flex gap-4">
          {/* Content (Title, Description, Author, Tags) */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Author and Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-border/40">
                  <AvatarImage src={item.author.avatar} />
                  <AvatarFallback className="text-xs font-medium">
                    {item.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">
                      {item.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({item.author.username})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.author.contributions} contributions</span>
                    <span>•</span>
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Title and Description */}
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight leading-snug group-hover:text-foreground/90 transition-colors line-clamp-2">
                {item.content.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {item.content.description}
              </p>
            </div>
            {/* Tags, Type, Stats and Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-wrap gap-1.5 items-center">
                {item.content.tags.slice(0, 2).map((tag) => (
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
                  <Clock className="h-3 w-3" />
                  <span>{item.readTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${
                      isLiked
                        ? "text-red-500"
                        : "text-muted-foreground hover:text-red-500"
                    }`}
                    onClick={() => toggleLike(item.id)}
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    <Heart
                      className="h-4 w-4"
                      fill={isLiked ? "currentColor" : "none"}
                    />
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
                    title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
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
                    onClick={() => handleMoreClick(item.id)}
                    title="More Actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Image on Right Side */}
          {item.content.image && (
            <div className="flex-shrink-0 w-48 h-32 overflow-hidden rounded-md border border-border/40">
              <img
                src={item.content.image}
                alt={item.content.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
        </div>
      </Card>
      {/* Quick Actions Dropdown */}
      {showQuickActions && (
        <div className="absolute top-10 right-4 bg-background border border-border/40 rounded-md shadow-lg z-10 w-48">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start rounded-t-md"
            onClick={() => toggleReadingList(item.id)}
          >
            {isInReadingList ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Remove from Reading List
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Add to Reading List
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start rounded-b-md"
            onClick={() => handleMoreClick(item.id)}
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      )}
    </article>
  );
}