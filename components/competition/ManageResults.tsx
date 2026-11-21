"use client";

import { useMemo, useState } from "react";
import { Download, RefreshCw, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/components/common/Form";
import { StatusBadge } from "@/components/common/StatusBadge";
import { categoryLabel } from "@/components/competition/EntryList";
import { useSaveResults } from "@/lib/hooks/mutations/useCompetitionAdmin";
import { entriesToCsv, parseResultsCsv, type CsvError } from "@/lib/competition/resultsCsv";
import type { CompetitionEntry, CompetitionResultUpdate } from "@/lib/types/competition";

type Draft = { score: string; tiebreak: string; note: string };
const toDraft = (e: CompetitionEntry): Draft => ({
  score: e.score === null ? "" : String(e.score),
  tiebreak: e.tiebreak === null ? "" : String(e.tiebreak),
  note: e.note ?? "",
});
const parseNum = (s: string): number | null | undefined => {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined; // undefined = invalid
};

/**
 * Organizer results: edit score / tiebreak / note per entry, import the runner's results.csv (with a preview),
 * export entries.csv for the runner, recompute ranks. Saving re-ranks on the server.
 * Render with `key` = the entries' state so drafts reset after every save.
 */
export function ManageResults({ slug, entries, categories }: { slug: string; entries: CompetitionEntry[]; categories: string[] }) {
  const { t, i18n } = useTranslation();
  const save = useSaveResults(slug);
  const [drafts, setDrafts] = useState<Record<number, Draft>>(() => Object.fromEntries(entries.map((e) => [e.id, toDraft(e)])));
  const [message, setMessage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const order = [...categories, ...new Set(entries.map((e) => e.category).filter((c) => !categories.includes(c)))];

  const changes = useMemo(() => {
    const out: CompetitionResultUpdate[] = [];
    let invalid = false;
    for (const e of entries) {
      const d = drafts[e.id];
      if (!d) continue;
      const score = parseNum(d.score);
      const tiebreak = parseNum(d.tiebreak);
      if (score === undefined || tiebreak === undefined) {
        invalid = true;
        continue;
      }
      const note = d.note.trim() || null;
      const u: CompetitionResultUpdate = { id: e.id };
      if (score !== e.score) u.score = score;
      if (tiebreak !== e.tiebreak) u.tiebreak = tiebreak;
      if (note !== (e.note ?? null)) u.note = note;
      if (Object.keys(u).length > 1) out.push(u);
    }
    return { updates: out, invalid };
  }, [drafts, entries]);

  const saveEdits = () => {
    setMessage(null);
    if (!changes.updates.length) {
      setMessage(t("competition.manage.results.noChanges"));
      return;
    }
    save.mutate(changes.updates);
  };

  const exportCsv = () => {
    const blob = new Blob([entriesToCsv(entries)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-entries.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportCsv}>
          <Download /> {t("competition.manage.results.export")}
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload /> {t("competition.manage.results.import")}
        </Button>
        <Button variant="outline" disabled={save.isPending} onClick={() => { setMessage(null); save.mutate([]); }}>
          <RefreshCw /> {t("competition.manage.results.recompute")}
        </Button>
      </div>

      {order.map((category) => {
        const rows = entries
          .filter((e) => e.category === category)
          .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.id - b.id);
        if (!rows.length) return null;
        return (
          <section key={category}>
            <h3 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">{categoryLabel(category)}</h3>
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[44rem] text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-14 px-3 py-2.5 font-medium">{t("competition.results.rank")}</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">{t("competition.results.team")}</th>
                    <th scope="col" className="w-32 px-3 py-2.5 font-medium">{t("competition.results.score")}</th>
                    <th scope="col" className="w-32 px-3 py-2.5 font-medium">{t("competition.results.tiebreak")}</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">{t("competition.results.note")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((e) => {
                    const d = drafts[e.id] ?? toDraft(e);
                    const set = (field: keyof Draft, value: string) => setDrafts((prev) => ({ ...prev, [e.id]: { ...d, [field]: value } }));
                    const team = e.project?.title ?? `#${e.id}`;
                    return (
                      <tr key={e.id}>
                        <td className="px-3 py-2 font-semibold tabular-nums">{e.rank ?? "—"}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{team}</span>
                            <span className="text-xs text-muted-foreground">#{e.id}</span>
                            {e.status !== "registered" && <StatusBadge kind="entry" value={e.status} />}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Input aria-label={`${t("competition.results.score")} ${team}`} inputMode="decimal" value={d.score}
                            aria-invalid={parseNum(d.score) === undefined} onChange={(ev) => set("score", ev.target.value)} className="h-8" />
                        </td>
                        <td className="px-3 py-2">
                          <Input aria-label={`${t("competition.results.tiebreak")} ${team}`} inputMode="decimal" value={d.tiebreak}
                            aria-invalid={parseNum(d.tiebreak) === undefined} onChange={(ev) => set("tiebreak", ev.target.value)} className="h-8" />
                        </td>
                        <td className="px-3 py-2">
                          <Input aria-label={`${t("competition.results.note")} ${team}`} value={d.note} onChange={(ev) => set("note", ev.target.value)} className="h-8" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {save.isError && <FormAlert>{(save.error as Error).message}</FormAlert>}
      {message && <FormAlert tone="info">{message}</FormAlert>}
      <div className="flex justify-end">
        <Button onClick={saveEdits} disabled={save.isPending || changes.invalid}>
          {save.isPending ? t("competition.manage.results.saving") : t("competition.manage.results.save")}
        </Button>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entries={entries}
        saving={save.isPending}
        error={save.isError ? (save.error as Error).message : null}
        onSave={(updates) => save.mutate(updates, { onSuccess: () => setImportOpen(false) })}
        numberLocale={i18n.language}
      />
    </div>
  );
}

function ImportDialog({
  open,
  onOpenChange,
  entries,
  saving,
  error,
  onSave,
  numberLocale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: CompetitionEntry[];
  saving: boolean;
  error: string | null;
  onSave: (updates: CompetitionResultUpdate[]) => void;
  numberLocale: string;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const parsed = useMemo(() => (text.trim() ? parseResultsCsv(text, entries) : null), [text, entries]);
  const errorText = (e: CsvError) =>
    `${e.line ? t("competition.manage.results.line", { line: e.line }) + ": " : ""}${t(`competition.manage.csv.${e.key}`, e.params)}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setText(""); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("competition.manage.results.importTitle")}</DialogTitle>
          <DialogDescription>{t("competition.manage.results.importHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            aria-label="results.csv"
            rows={6}
            className="font-mono text-xs"
            placeholder={"entry_id,category,score,tiebreak_ms,note\n12,bot,18340.5,8123,"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline">
            <Upload className="size-4" />
            {t("competition.manage.results.chooseFile")}
            <input type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setText(await file.text());
              e.target.value = "";
            }} />
          </label>
        </div>

        {parsed && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {t("competition.manage.results.preview")}: {t("competition.manage.results.matched", { count: parsed.rows.length })}
              {parsed.errors.length > 0 && <> · <span className="text-destructive">{t("competition.manage.results.errors", { count: parsed.errors.length })}</span></>}
            </p>
            {parsed.errors.length > 0 && (
              <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive" data-testid="csv-errors">
                {parsed.errors.map((e, i) => <li key={i}>{errorText(e)}</li>)}
              </ul>
            )}
            {parsed.rows.length > 0 && (
              <div className="max-h-56 overflow-auto rounded-lg border">
                <table className="w-full text-xs" data-testid="csv-preview">
                  <thead className="sticky top-0 border-b bg-card text-left uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">{t("competition.results.team")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("competition.results.score")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("competition.results.tiebreak")}</th>
                      <th className="px-3 py-2 font-medium">{t("competition.results.note")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsed.rows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{r.id}</td>
                        <td className="px-3 py-1.5 font-medium">{r.team}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{r.score.toLocaleString(numberLocale)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{r.tiebreak?.toLocaleString(numberLocale) ?? "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {parsed && parsed.errors.length > 0 && <FormAlert tone="warning">{t("competition.manage.results.fixErrors")}</FormAlert>}
        {error && <FormAlert>{error}</FormAlert>}
        <DialogFooter>
          <Button
            disabled={!parsed || parsed.errors.length > 0 || parsed.rows.length === 0 || saving}
            onClick={() => parsed && onSave(parsed.rows.map((r) => ({ id: r.id, score: r.score, tiebreak: r.tiebreak, note: r.note })))}
          >
            {saving ? t("competition.manage.results.saving") : t("competition.manage.results.saveImported")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
