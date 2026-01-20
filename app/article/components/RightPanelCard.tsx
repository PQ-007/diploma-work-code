"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type RightPanelCardProps = {
  title: string;
  children: ReactNode;
};

export default function RightPanelCard({
  title,
  children,
}: RightPanelCardProps) {
  return (
    <Card className="bg-card/50 border-border/60 shadow-sm">
      <div className="px-4 ">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-3">
          {title}
        </div>
        {children}
      </div>
    </Card>
  );
}
