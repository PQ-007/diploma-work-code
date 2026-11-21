"use client";

import Link from "next/link";
import { Lock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { CompetitionEntry, TeamMember } from "@/lib/types/competition";
import { cn } from "@/lib/utils";

/** "human_vs_bot" → "human vs bot" (categories are short ids chosen by the organizers). */
export const categoryLabel = (category: string) => category.replace(/[_-]+/g, " ");

const memberName = (m: TeamMember) => m.display_name || m.user_name || "—";

function MemberStack({ members }: { members: TeamMember[] }) {
  if (!members.length) return null;
  const names = members.map(memberName).join(", ");
  return (
    <div className="flex items-center -space-x-2" title={names}>
      {members.slice(0, 5).map((m) => (
        <Avatar key={m.user_id} className="size-7 border-2 border-card">
          {m.avatar_url && <AvatarImage src={m.avatar_url} alt="" />}
          <AvatarFallback className="text-[11px]">{memberName(m).slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
      ))}
      {members.length > 5 && <span className="pl-3 text-xs text-muted-foreground">+{members.length - 5}</span>}
      <span className="sr-only">{names}</span>
    </div>
  );
}

/** Teams per category: name (= project title, linked), members' avatars, and a badge when not simply registered. */
export function EntryList({ entries, categories }: { entries: CompetitionEntry[]; categories: string[] }) {
  const { t } = useTranslation();
  if (!entries.length) return <EmptyState icon={Users} title={t("competition.noTeams")} />;

  const order = [...categories, ...new Set(entries.map((e) => e.category).filter((c) => !categories.includes(c)))];
  return (
    <div className="space-y-6">
      {order.map((category) => {
        const list = entries.filter((e) => e.category === category);
        if (!list.length) return null;
        return (
          <section key={category} aria-labelledby={`cat-${category}`}>
            <h3 id={`cat-${category}`} className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
              {categoryLabel(category)} · {t("competition.teams", { count: list.filter((e) => e.status === "registered").length })}
            </h3>
            <ul className="divide-y rounded-xl border bg-card">
              {list.map((e) => (
                <li key={e.id} className={cn("flex items-center gap-3 px-4 py-3", e.status !== "registered" && "opacity-60")}>
                  <div className="min-w-0 flex-1">
                    {e.project ? (
                      <Link href={`/project/${e.project.slug}`} className="truncate font-medium hover:underline">
                        {e.project.title}
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                        <Lock className="size-3.5" aria-hidden />
                        {t("competition.privateTeam")}
                      </span>
                    )}
                  </div>
                  {e.status !== "registered" && <StatusBadge kind="entry" value={e.status} />}
                  <MemberStack members={e.members} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
