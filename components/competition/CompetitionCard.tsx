"use client";

import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/common/StatusBadge";
import { KeyDates } from "@/components/competition/KeyDates";
import type { CompetitionSummary } from "@/lib/types/competition";

/** Gallery card (same shape as ProjectCard): 16:9 cover → kind/status → title → summary → key dates → team count. */
export function CompetitionCard({ competition: c }: { competition: CompetitionSummary }) {
  const { t } = useTranslation();

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {c.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.cover_url} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/5 to-brand-sky/20">
            <Trophy className="size-9 text-primary/40" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <StatusBadge kind="competitionKind" value={c.kind} />
          <StatusBadge kind="competition" value={c.status} />
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
          <Link href={`/competition/${c.slug}`} className="outline-none after:absolute after:inset-0 focus-visible:underline">
            {c.title}
          </Link>
        </h3>
        {c.summary && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.summary}</p>}

        <KeyDates competition={c} className="mt-3" />

        <div className="mt-auto flex items-center gap-1.5 pt-4 text-sm text-muted-foreground">
          <Users className="size-4" aria-hidden />
          {t("competition.teams", { count: c.entry_count })}
        </div>
      </div>
    </article>
  );
}
