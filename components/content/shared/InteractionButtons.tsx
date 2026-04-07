import { Button } from "@/components/ui/button";
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  ArrowBigUp,
  ArrowBigDown,
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
 * - Articles: View and like counts, Bookmark
 * - Discussions: Upvote, Downvote, Comment, Bookmark
 * - Projects: View and like counts, Bookmark
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
            className={`h-8 gap-1 px-2 hover:bg-transparent ${
              interactions.userVote === "up"
                ? "text-primary"
                : "text-muted-foreground "
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

        <div className="flex items-center gap-1">
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
      </div>
    );
  }

  // Articles and projects use view/bookmark pattern
  return (
    <div className="flex items-center gap-2 justify-end pt-1">
      {/* Stats (optional) */}
      {showStats && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {stats.views}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {stats.likes}
          </span>
        </div>
      )}

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
    </div>
  );
}
