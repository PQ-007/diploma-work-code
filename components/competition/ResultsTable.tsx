"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/common/StatusBadge";
import { categoryLabel } from "@/components/competition/EntryList";
import type { CompetitionEntry } from "@/lib/types/competition";
import { cn } from "@/lib/utils";

/** Gold / silver / bronze tint for the top three ranks. */
const PODIUM: Record<number, string> = {
  1: "bg-amber-400/15",
  2: "bg-slate-400/15",
  3: "bg-orange-600/10",
};

/** One table per category: rank, team, score, tiebreak, note. Unranked (withdrawn, disqualified, no score) last. */
export function ResultsTable({ entries, categories }: { entries: CompetitionEntry[]; categories: string[] }) {
  const { t, i18n } = useTranslation();
  const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString(i18n.language));
  const order = [...categories, ...new Set(entries.map((e) => e.category).filter((c) => !categories.includes(c)))];

  return (
    <div className="space-y-8">
      {order.map((category) => {
        const rows = entries
          .filter((e) => e.category === category)
          .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
        if (!rows.length) return null;
        return (
          <section key={category}>
            <h3 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">{categoryLabel(category)}</h3>
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[34rem] text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-16 px-4 py-2.5 font-medium">{t("competition.results.rank")}</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">{t("competition.results.team")}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">{t("competition.results.score")}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">{t("competition.results.tiebreak")}</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">{t("competition.results.note")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((e) => (
                    <tr key={e.id} className={cn(e.rank ? PODIUM[e.rank] : "text-muted-foreground")}>
                      <td className="px-4 py-2.5 font-semibold tabular-nums">{e.rank ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {e.project ? (
                            <Link href={`/project/${e.project.slug}`} className="font-medium hover:underline">
                              {e.project.title}
                            </Link>
                          ) : (
                            <span>{t("competition.privateTeam")}</span>
                          )}
                          {e.status !== "registered" && <StatusBadge kind="entry" value={e.status} />}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{fmt(e.score)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{fmt(e.tiebreak)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{e.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
