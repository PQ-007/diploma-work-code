import { cn } from "@/lib/utils";

/** MN / JA / EN marker. `active` = the language currently shown. */
export function LanguageBadge({
  code,
  active = false,
  className,
}: {
  code: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-7 items-center justify-center rounded-md border px-1 font-mono text-[10px] font-semibold uppercase tracking-wide",
        active ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground",
        className,
      )}
    >
      {code === "jp" ? "ja" : code}
    </span>
  );
}
