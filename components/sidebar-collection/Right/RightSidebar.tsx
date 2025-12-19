// components/feed/RightSidebar.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Flame,
  TrendingUp,
  Trophy,
  Users,
  Menu,
} from "lucide-react";
import { useTransition } from "react";

interface RankingUser {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  change: number;
  badge?: string;
}

interface TrendingTopic {
  id: string;
  name: string;
  posts: number;
  trend: "up" | "down" | "stable";
}

interface RightSidebarProps {
  topUsers: RankingUser[];
  trendingTopics: TrendingTopic[];
}

export function RightSidebar({ topUsers, trendingTopics }: RightSidebarProps) {
  const t = useTransition();
  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Top Contributors */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Contributors
            </h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {topUsers.slice(0, 5).map((user) => (
            <div
              key={user.rank}
              className="flex items-center justify-between group hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {user.badge && (
                    <span className="absolute -top-1 -right-1 text-xs">
                      {user.badge}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.points.toLocaleString()} pts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-muted-foreground">
                  #{user.rank}
                </span>
                {user.change !== 0 && (
                  <Badge
                    variant={user.change > 0 ? "default" : "destructive"}
                    className="text-xs px-1"
                  >
                    {user.change > 0 ? "↑" : "↓"}
                    {Math.abs(user.change)}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Weekly Leaderboard */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            This Week's Leaders
          </h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {topUsers.slice(0, 3).map((user) => (
            <div
              key={user.rank}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
            >
              <span className="text-2xl">{user.badge}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  +{Math.floor(Math.random() * 500) + 100} pts this week
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Trending Topics
          </h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {trendingTopics.map((topic, index) => (
            <div
              key={topic.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-muted-foreground w-5">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">
                    #{topic.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {topic.posts.toLocaleString()} posts
                  </p>
                </div>
              </div>
              <div>
                {topic.trend === "up" && (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                {topic.trend === "down" && (
                  <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Suggested Users */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            Suggested for You
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {topUsers.slice(5, 8).map((user) => (
            <div key={user.rank} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.points.toLocaleString()} pts
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Follow
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );


  return (
    <>
      {/* Desktop Sidebar - Always visible on large screens */}
      <div className="hidden lg:block w-[320px] sticky top-20 h-fit">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar - Sheet trigger for mobile/tablet */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            >
              <Trophy className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px] overflow-y-auto">
            <div className="py-4">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}