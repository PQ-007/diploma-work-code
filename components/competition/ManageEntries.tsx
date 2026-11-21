"use client";

import Link from "next/link";
import { useState } from "react";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/States";
import { FormAlert } from "@/components/common/Form";
import { StatusBadge } from "@/components/common/StatusBadge";
import { categoryLabel } from "@/components/competition/EntryList";
import { useSaveResults } from "@/lib/hooks/mutations/useCompetitionAdmin";
import type { CompetitionEntry } from "@/lib/types/competition";

/** Organizer view of every entry: team, members, category, status; disqualify (with a note) or restore. */
export function ManageEntries({ slug, entries }: { slug: string; entries: CompetitionEntry[] }) {
  const { t } = useTranslation();
  const save = useSaveResults(slug);
  const [target, setTarget] = useState<CompetitionEntry | null>(null);
  const [note, setNote] = useState("");

  if (!entries.length) return <EmptyState icon={Users} title={t("competition.manage.entries.empty")} />;

  const disqualify = () => {
    if (!target || !note.trim()) return;
    save.mutate([{ id: target.id, status: "disqualified", note: note.trim() }], { onSuccess: () => setTarget(null) });
  };

  return (
    <>
      {save.isError && !target && <FormAlert>{(save.error as Error).message}</FormAlert>}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">#</th>
              <th scope="col" className="px-4 py-2.5 font-medium">{t("competition.manage.entries.team")}</th>
              <th scope="col" className="px-4 py-2.5 font-medium">{t("competition.manage.entries.members")}</th>
              <th scope="col" className="px-4 py-2.5 font-medium">{t("competition.manage.entries.category")}</th>
              <th scope="col" className="px-4 py-2.5 font-medium">{t("competition.manage.entries.status")}</th>
              <td className="px-4 py-2.5" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{e.id}</td>
                <td className="px-4 py-2.5 font-medium">
                  {e.project ? <Link href={`/project/${e.project.slug}`} className="hover:underline">{e.project.title}</Link> : `#${e.id}`}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {e.members.map((m) => m.display_name || m.user_name).filter(Boolean).join(", ")}
                </td>
                <td className="px-4 py-2.5 capitalize">{categoryLabel(e.category)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge kind="entry" value={e.status} />
                    {e.status === "disqualified" && e.note && <span className="text-xs text-muted-foreground">{e.note}</span>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {e.status === "disqualified" ? (
                    <Button size="sm" variant="outline" disabled={save.isPending} onClick={() => save.mutate([{ id: e.id, status: "registered" }])}>
                      {t("competition.manage.entries.restore")}
                    </Button>
                  ) : e.status === "registered" ? (
                    <Button size="sm" variant="destructive-soft" onClick={() => { setTarget(e); setNote(""); save.reset(); }}>
                      {t("competition.manage.entries.disqualify")}
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("competition.manage.entries.disqualifyTitle")}</DialogTitle>
            <DialogDescription>{t("competition.manage.entries.disqualifyText")}</DialogDescription>
          </DialogHeader>
          <Input
            aria-label={t("competition.manage.entries.note")}
            placeholder={t("competition.manage.entries.notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
          {save.isError && <FormAlert>{(save.error as Error).message}</FormAlert>}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" disabled={!note.trim() || save.isPending} onClick={disqualify}>
              {t("competition.manage.entries.disqualify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
