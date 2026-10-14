import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * FutureHub mark: blue and red code brackets around a sky-blue compass needle.
 * Colors come from the --brand-* tokens, so the mark lightens in dark mode.
 */
export function LogoMark({ className }: { className?: string }) {
  const maskId = useId();

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-8 shrink-0", className)}
      role="img"
      aria-label="FutureHub"
    >
      <defs>
        <mask id={maskId}>
          <rect width="100" height="100" fill="white" />
          <polygon points="50.00,43.00 50.84,47.17 54.38,44.82 52.03,48.36 56.20,49.20 52.03,50.04 54.38,53.58 50.84,51.23 50.00,55.40 49.16,51.23 45.62,53.58 47.97,50.04 43.80,49.20 47.97,48.36 45.62,44.82 49.16,47.17" fill="black" />
        </mask>
      </defs>
      <polyline
        points="36.4,24.8 10.6,49 36.4,72.6"
        fill="none"
        stroke="var(--brand-blue)"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="64.2,24.8 89.4,49 64.2,72.6"
        fill="none"
        stroke="var(--brand-red)"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="var(--brand-sky)" mask={`url(#${maskId})`}>
        <polygon points="50,11 52.2,49.2 50,88 47.8,49.2" />
        <circle cx="50" cy="49.2" r="8.6" />
      </g>
    </svg>
  );
}

/**
 * Mark + wordmark. "md" for the mobile header and forms; "lg" for the sidebar,
 * where the mark sits on a soft glass tile so the brand reads first.
 */
export function Logo({
  className,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "md" | "lg";
}) {
  const lg = size === "lg";
  return (
    <span className={cn("inline-flex items-center", lg ? "gap-2.5" : "gap-2", className)}>
      {lg ? (
        <span className="glass relative isolate flex size-10 shrink-0 items-center justify-center rounded-xl">
          <span
            aria-hidden
            className="absolute inset-1 -z-10 rounded-lg bg-brand-blue/25 blur-md"
          />
          <LogoMark className="size-7" />
        </span>
      ) : (
        <LogoMark />
      )}
      {showWordmark && (
        <span
          className={cn(
            "tracking-tight text-foreground",
            lg ? "font-display text-[1.35rem] font-semibold tracking-[0.01em]" : "text-[1.05rem] font-semibold",
          )}
        >
          Future<span className="text-brand-blue">Hub</span>
        </span>
      )}
    </span>
  );
}
