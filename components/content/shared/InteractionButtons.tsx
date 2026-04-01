import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  Bookmark,
  ArrowBigUp,
  ArrowBigDown,
  Share,
} from "lucide-react";
import {
  ContentType,
  UserInteractions,
  ContentStats,
} from "@/lib/types/content";

interface InteractionButtonsProps {
  contentType: ContentType;
  stats: ContentStats;
  interactions: UserInteractions;
  onLike?: () => void;
  onBookmark?: () => void;
  onVote?: (direction: "up" | "down") => void;
  onComment?: () => void;
  disabled?: boolean;
  showStats?: boolean;
}

/**
 * Unified interaction buttons component.
 * Renders appropriate buttons based on content type:
 * - Articles: Like, Comment, Bookmark, Share
 * - Discussions: Upvote, Downvote, Comment, Bookmark
 * - Projects: Like, Comment, Bookmark
 *
 * @example
 * <InteractionButtons
 *   contentType="article"
 *   stats={stats}
 *   interactions={interactions}
 *   onLike={() => likeMutation.mutate()}
 *   onBookmark={() => bookmarkMutation.mutate()}
 * />
 */
export function InteractionButtons({
  contentType,
  stats,
  interactions,
  onLike,
  onBookmark,
  onVote,
  onComment,
  disabled = false,
  showStats = true,
}: InteractionButtonsProps) {
  // Discussions use upvote/downvote pattern (Facebook/Reddit style)
  if (contentType === "discussion") {
    return (
      <div className="flex items-center justify-between border-t border-border/30 pt-2 mt-2">
        {/* Vote buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote?.("up")}
            disabled={disabled}
            className={`h-8 gap-1 px-2 ${
              interactions.userVote === "up"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowBigUp
              className="h-[18px] w-[18px]"
              fill={interactions.userVote === "up" ? "currentColor" : "none"}
            />
          </Button>
          <span className="text-xs font-semibold tabular-nums min-w-[2ch] text-center">
            {stats.likes}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote?.("down")}
            disabled={disabled}
            className={`h-8 gap-1 px-2 ${
              interactions.userVote === "down"
                ? "text-destructive"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowBigDown
              className="h-[18px] w-[18px]"
              fill={interactions.userVote === "down" ? "currentColor" : "none"}
            />
          </Button>
        </div>

        {/* Comment count */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onComment}
          disabled={disabled}
          className="h-8 gap-1.5 px-3 text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{stats.comments}</span>
        </Button>

        {/* Bookmark */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBookmark}
          disabled={disabled}
          className={`h-8 px-2 ${
            interactions.isBookmarked
              ? "text-blue-500"
              : "text-muted-foreground hover:text-blue-500"
          }`}
        >
          <Bookmark
            className="h-4 w-4"
            fill={interactions.isBookmarked ? "currentColor" : "none"}
          />
        </Button>
      </div>
    );
  }

  // Articles and projects use like/comment/bookmark pattern
  return (
    <div className="flex items-center gap-2 justify-end pt-1">
      {/* Views (optional) */}
      {showStats && stats.views > 0 && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {stats.views} views
        </span>
      )}

      {/* Like button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onLike}
        disabled={disabled}
        className={`h-7 w-7 ${
          interactions.isLiked
            ? "text-red-500"
            : "text-muted-foreground hover:text-red-500"
        }`}
        title={interactions.isLiked ? "Unlike" : "Like"}
      >
        <Heart
          className="h-4 w-4"
          fill={interactions.isLiked ? "currentColor" : "none"}
        />
      </Button>

      {/* Comment button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onComment}
        disabled={disabled}
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        title="Comment"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>

      {/* Bookmark button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onBookmark}
        disabled={disabled}
        className={`h-7 w-7 ${
          interactions.isBookmarked
            ? "text-blue-500"
            : "text-muted-foreground hover:text-blue-500"
        }`}
        title={interactions.isBookmarked ? "Remove bookmark" : "Bookmark"}
      >
        <Bookmark
          className="h-4 w-4"
          fill={interactions.isBookmarked ? "currentColor" : "none"}
        />
      </Button>

      {/* Share button (articles only) */}
      {contentType === "article" && (
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title="Share"
        >
          <Share className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
