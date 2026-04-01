// src/components/feed/SidebarReadingList.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface ReadingListProps {
  readingListCount: number;
}

export default function ReadingList({
  readingListCount,
}: ReadingListProps) {
  if (readingListCount === 0) return null;

  return (
    <Card className="border-border/40">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Reading List
          </h3>
          <Badge variant="secondary" className="text-xs">
            {readingListCount}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {readingListCount} item{readingListCount !== 1 ? "s" : ""} saved
        </p>
        <Button variant="outline" size="sm" className="w-full text-xs">
          View All
        </Button>
      </CardContent>
    </Card>
  );
}