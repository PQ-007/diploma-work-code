import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small icon + number, used for views / likes / comments. */
export function Stat({ icon: Icon, value, label, className }: { icon: LucideIcon; value: number | string; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground", className)} title={label}>
      <Icon className="size-3.5" aria-hidden />
      {value}
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
