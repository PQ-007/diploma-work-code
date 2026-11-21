"use client";

import { CalendarClock, Flag } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CompetitionSummary } from "@/lib/types/competition";
import { relativeTime } from "@/lib/utils/relativeTime";
import { cn } from "@/lib/utils";

const future = (iso: string | null) => Boolean(iso && new Date(iso).getTime() > Date.now());

/**
 * The one or two dates that matter right now: when sign-up opens/closes, and when the competition
 * happens (or ended). Relative ("in 12 days") with the exact date on hover.
 */
export function KeyDates({
  competition: c,
  className,
}: {
  competition: Pick<CompetitionSummary, "status" | "signup_opens_at" | "signup_closes_at" | "starts_at" | "ends_at">;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const lines: { icon: typeof Flag; text: string; iso: string }[] = [];

  if (c.status === "upcoming" || c.status === "open") {
    if (future(c.signup_opens_at)) {
      lines.push({ icon: CalendarClock, text: t("competition.signupOpens", { when: relativeTime(c.signup_opens_at, i18n.language) }), iso: c.signup_opens_at! });
    } else if (future(c.signup_closes_at)) {
      lines.push({ icon: CalendarClock, text: t("competition.signupCloses", { when: relativeTime(c.signup_closes_at, i18n.language) }), iso: c.signup_closes_at! });
    }
  }
  const end = c.ends_at ?? c.starts_at;
  if (c.status === "finished" && end) {
    lines.push({ icon: Flag, text: t("competition.endedAt", { when: relativeTime(end, i18n.language) }), iso: end });
  } else if (c.starts_at) {
    lines.push({ icon: Flag, text: t("competition.startsAt", { when: relativeTime(c.starts_at, i18n.language) }), iso: c.starts_at });
  }

  if (lines.length === 0) return null;
  return (
    <ul className={cn("space-y-1 text-sm text-muted-foreground", className)}>
      {lines.map(({ icon: Icon, text, iso }) => (
        <li key={text} className="flex items-center gap-1.5">
          <Icon className="size-4 shrink-0" aria-hidden />
          <time dateTime={iso} title={new Date(iso).toLocaleString(i18n.language)}>
            {text}
          </time>
        </li>
      ))}
    </ul>
  );
}
