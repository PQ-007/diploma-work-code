import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const SIZES = { xs: "size-5 text-[10px]", sm: "size-8 text-xs", md: "size-10 text-sm" } as const;

/** Avatar + name (+ optional secondary line). Links to the profile when `username` is given. */
export function UserChip({
  name,
  avatarUrl,
  username,
  subtitle,
  size = "xs",
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  username?: string | null;
  subtitle?: React.ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const body = (
    <>
      <Avatar className={cn("shrink-0", SIZES[size])}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className={cn("truncate font-medium text-foreground/90", size === "xs" ? "text-xs" : "text-sm")}>{name}</span>
        {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </>
  );
  const cls = cn("inline-flex min-w-0 items-center gap-2", className);
  return username ? (
    <Link href={`/profile/${username}`} className={cn(cls, "relative z-10 hover:[&>span>span:first-child]:underline")}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  );
}
