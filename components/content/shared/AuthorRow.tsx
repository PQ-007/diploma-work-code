import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Author } from "@/lib/types/author";
import { getRankIcon } from "@/lib/utils/rankIcons";

interface AuthorRowProps {
  author: Author;
  timestamp: string;
  additionalInfo?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

/**
 * Reusable author display component.
 * Handles the inconsistent author field naming across the app and displays
 * author information consistently.
 *
 * @param author - Author object with normalized fields
 * @param timestamp - Display timestamp (can be formatted date string)
 * @param additionalInfo - Optional additional info to display (e.g., read time, badges)
 * @param size - Size variant for the component
 *
 * @example
 * <AuthorRow
 *   author={article.content.author}
 *   timestamp="2 hours ago"
 *   additionalInfo={<>· 5 min read</>}
 * />
 */
export function AuthorRow({
  author,
  timestamp,
  additionalInfo,
  size = "md",
}: AuthorRowProps) {
  const sizeClasses = {
    sm: {
      avatar: "h-6 w-6",
      name: "text-xs",
      timestamp: "text-[10px]",
    },
    md: {
      avatar: "h-7 w-7",
      name: "text-sm",
      timestamp: "text-xs",
    },
    lg: {
      avatar: "h-9 w-9",
      name: "text-base",
      timestamp: "text-sm",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      <Avatar
        className={`${classes.avatar} border border-border/40 flex-shrink-0`}
      >
        <AvatarImage src={author.avatarUrl || ""} alt={author.displayName} />
        <AvatarFallback className="text-xs font-medium">
          {author.displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className={`${classes.name} font-medium truncate`}>
            {author.displayName}
          </span>
          {getRankIcon(author.rankingPoint || 0)}
        </div>
        <div
          className={`${classes.timestamp} flex items-center gap-1.5 text-muted-foreground`}
        >
          <span>{timestamp}</span>
          <span>·</span>
          <span>{author.rankingPoint || 0} points</span>
          {additionalInfo}
        </div>
      </div>
    </div>
  );
}
