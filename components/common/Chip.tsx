import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Toggleable filter pill. Glass when idle, solid blue glass when selected. */
export function Chip({
  selected = false,
  onClick,
  children,
  count,
  className,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  count?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium outline-none transition-[color,filter,scale] duration-200 active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-3.5",
        selected
          ? "glass-solid text-primary-foreground"
          : "glass text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
      {count != null && <span className={cn("tabular-nums", selected ? "opacity-80" : "opacity-60")}>{count}</span>}
    </button>
  );
}

/** Horizontal chip row: scrolls sideways on phones, wraps from `sm`. */
export function ChipRow({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0", className)}
    >
      {children}
    </div>
  );
}
