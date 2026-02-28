// src/components/feed/SidebarLeaderboard.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  change: number;
}

interface LeaderboardProps {
  leaderboard: LeaderboardUser[];
  t: (key: string) => string;
  isStudent: boolean;
}

export default function Leaderboard({
  leaderboard,
  t,
  isStudent,
}: LeaderboardProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4" />
        {isStudent ? t("ranking.topRated") : t("ranking.topContributors")}
      </h3>
      <Card className="border-border/40">
        <CardContent className="p-0">
          {leaderboard.map((user) => (
            <div
              key={user.rank}
              className="flex items-center justify-between px-3 py-2.5 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-bold text-muted-foreground/60 w-6">
                  {user.rank}.
                </span>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {user.name}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      - {user.points.toLocaleString()} points
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
