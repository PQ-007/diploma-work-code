import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ContentItem,
  DiscussionContent,
  ProjectContent,
} from "@/lib/types/content";
import { AuthorRow } from "./shared/AuthorRow";
import { InteractionButtons } from "./shared/InteractionButtons";
import { Pin, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface ContentCardProps {
  item: ContentItem;
  onLike?: () => void;
  onBookmark?: () => void;
  onVote?: (direction: "up" | "down") => void;
  onClick?: () => void;
  onComment?: () => void;
  disabled?: boolean;
  showAuthor?: boolean;
  className?: string;
}

/**
 * Unified content card component for articles, discussions, and projects.
 * Provides a consistent, standardized design across all content types.
 *
 * @param item - ContentItem with content, stats, and interactions
 * @param onLike - Handler for like/unlike action
 * @param onBookmark - Handler for bookmark/unbookmark action
 * @param onVote - Handler for vote action (discussions only)
 * @param onClick - Handler for card click (optional, overrides default navigation)
 * @param onComment - Handler for comment action
 * @param disabled - Disable all interactions
 * @param showAuthor - Whether to show author row (default: true)
 * @param className - Additional CSS classes
 *
 * @example
 * // With React Query hooks
 * const likeMutation = useContentLike(item.content.id, item.content.type);
 * const bookmarkMutation = useContentBookmark(item.content.id, item.content.type);
 *
 * <ContentCard
 *   item={articleItem}
 *   onLike={() => likeMutation.mutate()}
 *   onBookmark={() => bookmarkMutation.mutate()}
 * />
 */
export function ContentCard({
  item,
  onLike,
  onBookmark,
  onVote,
  onClick,
  onComment,
  disabled = false,
  showAuthor = true,
  className = "",
}: ContentCardProps) {
  const { content, stats, interactions } = item;

  // Build navigation link based on content type
  const href =
    content.type === "article"
      ? `/article/${content.id}`
      : content.type === "discussion"
        ? `/discussions#${content.id}`
        : `/project/${(content as ProjectContent).slug}`;

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const timestamp = formatTimestamp(content.createdAt);

  // Check for special states
  const isPinned =
    content.type === "discussion" && (content as DiscussionContent).pinned;
  const isAnswered =
    content.type === "discussion" && (content as DiscussionContent).answered;
  const isDiscussion = content.type === "discussion";

  return (
    <article className={`group relative ${className}`}>
      <Card
        className={`relative border-border/40 p-4 transition-all duration-300 hover:shadow-md ${
          isPinned ? "border-foreground/20 bg-muted/20" : ""
        } ${isDiscussion && onClick ? "cursor-pointer" : ""}`}
        onClick={() => {
          if (isDiscussion && onClick) onClick();
        }}
      >
        <div className="space-y-3">
          {/* Badges for special states */}
          {(isPinned || isAnswered) && (
            <div className="flex items-center gap-2">
              {isPinned && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Pin className="h-3 w-3" />
                  <span>Pinned</span>
                </div>
              )}
              {isAnswered && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-normal border border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                  Answered
                </Badge>
              )}
            </div>
          )}

          {/* Author row */}
          {showAuthor && (
            <AuthorRow author={content.author} timestamp={timestamp} />
          )}

          {/* Content */}
          <Link
            href={href}
            className="block space-y-1.5"
            onClick={(e) => {
              if (onClick) {
                e.preventDefault();
                e.stopPropagation();
                onClick();
              }
            }}
          >
            <h2 className="text-lg font-semibold tracking-tight leading-snug group-hover:text-foreground/90 transition-colors line-clamp-2">
              {content.title}
            </h2>
            {content.description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {content.description}
              </p>
            )}
            {/* For discussions, show body if no description */}
            {content.type === "discussion" &&
              !content.description &&
              (content as DiscussionContent).body && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {(content as DiscussionContent).body}
                </p>
              )}
          </Link>

          {isDiscussion ? (
            <>
              {/* Tags */}
              {content.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {content.tags.slice(0, 4).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-2 py-0.5 text-xs font-normal border border-border/40"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {content.tags.length > 4 && (
                    <Badge
                      variant="secondary"
                      className="px-2 py-0.5 text-xs font-normal border border-border/40 text-muted-foreground"
                    >
                      +{content.tags.length - 4} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Interactions */}
              <InteractionButtons
                contentType={content.type}
                stats={stats}
                interactions={interactions}
                onLike={onLike}
                onBookmark={onBookmark}
                onVote={onVote}
                onComment={onComment}
                disabled={disabled}
              />
            </>
          ) : (
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="min-w-0 flex items-center gap-2 overflow-hidden">
                {content.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {content.tags.slice(0, 4).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="px-2 py-0.5 text-xs font-normal border border-border/40 shrink-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {content.tags.length > 4 && (
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 text-xs font-normal border border-border/40 text-muted-foreground shrink-0"
                      >
                        +{content.tags.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <InteractionButtons
                contentType={content.type}
                stats={stats}
                interactions={interactions}
                onLike={onLike}
                onBookmark={onBookmark}
                onVote={onVote}
                onComment={onComment}
                disabled={disabled}
                showStats
              />
            </div>
          )}
        </div>
      </Card>
    </article>
  );
}
