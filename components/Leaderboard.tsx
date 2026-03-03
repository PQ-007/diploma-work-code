// src/components/feed/SidebarLeaderboard.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  ChessBishop,
  ChessKing,
  ChessKnight,
  ChessQueen,
  ChessPawn,
  ChessRook,
} from "lucide-react";

interface LeaderboardUser {
  rank: number;
  name: string;
  username: string;
  avatar: string;
  points: number;
}

interface LeaderboardProps {
  /** true  → "Top Rated" ranked by ranking_point
   *  false → "Top Contributors" ranked by article count */
  isStudent: boolean;
  t: (key: string) => string;
  /** Optional: override limit (default 5) */
  limit?: number;
}

const getRankIcon = (rank: number) => {
  if (rank >= 2500)
    return <ChessKing className="h-3.5 w-3.5 shrink-0 text-red-500" />;
  if (rank >= 2000)
    return <ChessQueen className="h-3.5 w-3.5 shrink-0 text-orange-500" />;
  if (rank >= 1600)
    return <ChessRook className="h-3.5 w-3.5 shrink-0 text-purple-500" />;
  if (rank >= 1200)
    return <ChessBishop className="h-3.5 w-3.5 shrink-0 text-blue-500" />;
  if (rank >= 800)
    return <ChessKnight className="h-3.5 w-3.5 shrink-0 text-green-500" />;
  return <ChessPawn className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
};

export default function Leaderboard({
  isStudent,
  t,
  limit = 5,
}: LeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const type = isStudent ? "rated" : "contributors";
    fetch(`/api/leaderboard?type=${type}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => setUsers(data.items ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isStudent, limit]);

  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4" />
        {isStudent ? t("ranking.topRated") : t("ranking.topContributors")}
      </h3>
      <Card className="border-border/40 py-3">
        <CardContent className="p-0">
          {loading ? (
            Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2.5 border-b border-border/20 last:border-b-0"
              >
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-3 flex-1 rounded" />
              </div>
            ))
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No data yet
            </p>
          ) : (
            users.map((user) => (
              <Link
                key={user.rank}
                href={`/profile/${user.username}`}
                className="flex items-center gap-2 px-3 py-2.5 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                {/* Rank number */}
                <span className="w-4 text-[11px] font-bold text-muted-foreground/50 shrink-0 text-center">
                  {user.rank}
                </span>

                {/* Avatar with rank-colored ring for top 3 */}
                <div className="shrink-0">
                  <Avatar className="h-7 w-7 block">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Name + inline rank icon + score */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate flex items-center gap-1">
                    <span className="truncate">{user.name}</span>
                    {getRankIcon(user.points)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isStudent
                      ? `${user.points.toLocaleString()} ${t("common.points")}`
                      : `${user.points} ${t("common.contributions")}`}
                  </p>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
