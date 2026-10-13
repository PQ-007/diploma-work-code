// src/components/feed/SidebarLeaderboard.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { getRankIcon } from "@/lib/utils/rankIcons";

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

  const medal = ["text-[#c99a06]", "text-[#8a94a6]", "text-[#b06a3b]"];

  return (
    <section className="rounded-xl border bg-card shadow-xs">
      <h2 className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold">
        <Trophy className="size-4 text-primary" />
        {isStudent ? t("ranking.topRated") : t("ranking.topContributors")}
      </h2>
      {loading ? (
        <div className="space-y-1 p-2">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3 flex-1 rounded" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("ranking.noData")}</p>
      ) : (
        <ol className="p-1.5">
          {users.map((user, i) => (
            <li key={user.rank}>
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-accent/60"
              >
                <span className={`w-4 shrink-0 text-center text-xs font-bold tabular-nums ${medal[i] ?? "text-muted-foreground"}`}>
                  {user.rank}
                </span>
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={user.avatar} alt="" />
                  <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <span className="truncate">{user.name}</span>
                    {getRankIcon(user.points, 3.5)}
                  </span>
                  <span className="block text-xs tabular-nums text-muted-foreground">
                    {isStudent
                      ? `${user.points.toLocaleString()} ${t("common.points")}`
                      : `${user.points} ${t("common.contributions")}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
