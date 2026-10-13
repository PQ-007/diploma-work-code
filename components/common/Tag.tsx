import Link from "next/link";
import { cn } from "@/lib/utils";

/** Content tag (#name). Pass `href` to make it a link, `onClick` to make it a filter. */
export function Tag({
  name,
  href,
  onClick,
  className,
}: {
  name: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const cls = cn(
    "inline-flex h-6 max-w-40 items-center truncate rounded-md bg-secondary px-2 text-xs text-secondary-foreground",
    (href || onClick) && "transition-colors hover:bg-accent hover:text-accent-foreground",
    className,
  );
  if (href) return <Link href={href} className={cls}>#{name}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>#{name}</button>;
  return <span className={cls}>#{name}</span>;
}

export function TagList({ tags, max = 4, className }: { tags?: string[] | null; max?: number; className?: string }) {
  if (!tags?.length) return null;
  const rest = tags.length - max;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {tags.slice(0, max).map((t) => (
        <Tag key={t} name={t} />
      ))}
      {rest > 0 && <span className="text-xs text-muted-foreground">+{rest}</span>}
    </div>
  );
}
