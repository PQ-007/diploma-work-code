"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  ChessBishop,
  ChessKing,
  ChessKnight,
  ChessQueen,
  ChessPawn,
  ChessRook,
  Plus,
  Check,
} from "lucide-react";
import Link from "next/link";

type Props = {
  author: {
    avatar: string;
    username: string;
    displayName?: string;
    ranking: number;
    bio: string;
    followersCount?: number;
  };
  
};

const getRankIcon = (rank: number) => {
  if (rank >= 2500) return <ChessKing className="h-3.5 w-3.5 text-red-500" />;
  if (rank >= 2000)
    return <ChessQueen className="h-3.5 w-3.5 text-orange-500" />;
  if (rank >= 1600)
    return <ChessRook className="h-3.5 w-3.5 text-purple-500" />;
  if (rank >= 1200)
    return <ChessBishop className="h-3.5 w-3.5 text-blue-500" />;
  if (rank >= 800)
    return <ChessKnight className="h-3.5 w-3.5 text-green-500" />;
  return <ChessPawn className="h-3.5 w-3.5 text-muted-foreground" />;
};

export default function MinimalAuthorBox({
  author,
}: Props) {
  const { user } = useAuth();
  const profileHref = `/profile/${author.username?.replace(/^@/, "")}`;
  const rankingPoints = author.ranking; // normalize missing ranking
  const [isFollowing, setIsFollowing] = useState(false);
  const currentUsername =
    typeof user?.user_metadata?.username === "string"
      ? user.user_metadata.username
      : typeof user?.user_metadata?.user_name === "string"
        ? user.user_metadata.user_name
        : "";
  const normalizedCurrentUsername = currentUsername
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const normalizedAuthorUsername = (author.username || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const isSelf =
    normalizedCurrentUsername.length > 0 &&
    normalizedCurrentUsername === normalizedAuthorUsername;

  const handleFollowToggle = () => {
    setIsFollowing((prev) => !prev);
  };

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:border-border/80 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link href={profileHref} className="relative shrink-0">
            <Avatar className="h-11 w-11 border border-border/10">
              <AvatarImage
                src={author.avatar}
                alt={author.username}
                className="object-cover"
              />
              <AvatarFallback className="bg-muted text-[10px] font-bold">
                {author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1 min-w-0">
              <Link
                href={profileHref}
                className="text-sm font-bold tracking-tight text-foreground/90 hover:text-primary transition-colors truncate"
              >
                {author.displayName || author.username}
              </Link>
              {getRankIcon(rankingPoints)}
            </div>

            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                {Intl.NumberFormat("en-US", { notation: "compact" }).format(
                  author.followersCount ?? 0,
                )}{" "}
                Followers
              </span>
            </div>
          </div>
        </div>

        {!isSelf && (
          <Button
            onClick={handleFollowToggle}
            variant={isFollowing ? "outline" : "secondary"}
            size="sm"
            className={cn(
              "h-8 rounded-full px-3 text-[11px] font-bold transition-all duration-200 active:scale-95",
              isFollowing
                ? "bg-transparent border-primary/20 text-primary hover:bg-primary/5"
                : "hover:bg-primary hover:text-primary-foreground",
            )}
          >
            {isFollowing ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span>Following</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                <span>Follow</span>
              </span>
            )}
          </Button>
        )}
      </div>

      {author.bio && (
        <p className="text-[12px] leading-[1.4] text-muted-foreground/80 line-clamp-2 italic font-serif">
          "{author.bio}"
        </p>
      )}
    </div>
  );
}
