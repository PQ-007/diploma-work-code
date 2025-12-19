// src/components/feed/SidebarTrendingTopics.tsx

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Minus } from "lucide-react";

interface TrendingTopic {
  id: string;
  name: string;
  posts: number;
  trend: "up" | "down" | "stable";
}

interface TrendingTopicsProps {
  trendingTopics: TrendingTopic[];
  t: (key: string) => string; // Simple type for translation function
}

export default function TrendingTopics({
  trendingTopics,
  t,
}: TrendingTopicsProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4" />
        {t("ranking.trendingTopics")}
      </h3>
      <Card className="border-border/40">
        <CardContent className="p-0">
          {trendingTopics.map((topic, index) => (
            <div
              key={topic.id}
              className="flex items-center justify-between px-3 py-2.5 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-bold text-muted-foreground/60 w-4">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">#{topic.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {topic.posts.toLocaleString()} posts
                  </p>
                </div>
              </div>
              {topic.trend === "up" && (
                <TrendingUp className="h-3 w-3 text-green-500" />
              )}
              {topic.trend === "down" && (
                <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
              )}
              {topic.trend === "stable" && (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}