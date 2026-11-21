import type { CompetitionEntry } from "@/lib/types/competition";

/*
 * The bot runner (P1-06) and the website exchange two CSV files. The formats are fixed; don't change them.
 *   import  results.csv   entry_id,category,score,tiebreak_ms,note
 *   export  entries.csv   entry_id,category,team,members,repository_url
 */

export const RESULTS_HEADER = ["entry_id", "category", "score", "tiebreak_ms", "note"] as const;
export const ENTRIES_HEADER = ["entry_id", "category", "team", "members", "repository_url"] as const;

/** A problem on one line; `key` is under competition.manage.csv.* in the locale files. */
export interface CsvError {
  line: number;
  key: "header" | "columns" | "unknownId" | "wrongCategory" | "badScore" | "badTiebreak" | "duplicate" | "empty";
  params?: Record<string, string | number>;
}

export interface ImportedResult {
  line: number;
  id: number;
  category: string;
  team: string;
  score: number;
  tiebreak: number | null;
  note: string | null;
}

/** RFC-4180-style split: commas, "quoted, fields", "" for a quote inside quotes. */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const toNumber = (s: string): number | null => {
  const t = s.trim();
  if (t === "" || !/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(t)) return null;
  return Number(t);
};

/**
 * Parses the runner's results.csv against the competition's entries.
 * Every line is checked; nothing should be saved while `errors` is non-empty.
 */
export function parseResultsCsv(text: string, entries: CompetitionEntry[]): { rows: ImportedResult[]; errors: CsvError[] } {
  const all = parseCsvRows(text.replace(/^﻿/, ""));
  // Keep the real line numbers, skip blank lines.
  const lines = all.map((cells, i) => ({ cells, line: i + 1 })).filter(({ cells }) => cells.some((c) => c.trim() !== ""));
  if (lines.length === 0) return { rows: [], errors: [{ line: 0, key: "empty" }] };

  const header = lines[0].cells.map((c) => c.trim().toLowerCase());
  if (header.join(",") !== RESULTS_HEADER.join(",")) {
    return { rows: [], errors: [{ line: lines[0].line, key: "header" }] };
  }

  const byId = new Map(entries.map((e) => [e.id, e]));
  const seen = new Set<number>();
  const rows: ImportedResult[] = [];
  const errors: CsvError[] = [];

  for (const { cells, line } of lines.slice(1)) {
    if (cells.length !== RESULTS_HEADER.length) {
      errors.push({ line, key: "columns", params: { count: cells.length } });
      continue;
    }
    const [idRaw, categoryRaw, scoreRaw, tiebreakRaw, noteRaw] = cells;
    const id = toNumber(idRaw);
    const entry = id !== null && Number.isInteger(id) ? byId.get(id) : undefined;
    if (!entry || id === null) {
      errors.push({ line, key: "unknownId", params: { id: idRaw.trim() } });
      continue;
    }
    const lineErrors: CsvError[] = [];
    if (seen.has(id)) lineErrors.push({ line, key: "duplicate", params: { id } });
    seen.add(id);
    const category = categoryRaw.trim();
    if (category !== entry.category) {
      lineErrors.push({ line, key: "wrongCategory", params: { id, expected: entry.category, got: category } });
    }
    const score = toNumber(scoreRaw);
    if (score === null) lineErrors.push({ line, key: "badScore", params: { value: scoreRaw.trim() } });
    const tiebreak = tiebreakRaw.trim() === "" ? null : toNumber(tiebreakRaw);
    if (tiebreakRaw.trim() !== "" && tiebreak === null) {
      lineErrors.push({ line, key: "badTiebreak", params: { value: tiebreakRaw.trim() } });
    }
    if (lineErrors.length) {
      errors.push(...lineErrors);
      continue;
    }
    rows.push({
      line,
      id,
      category,
      team: entry.project?.title ?? `#${id}`,
      score: score!,
      tiebreak,
      note: noteRaw.trim() || null,
    });
  }
  return { rows, errors };
}

function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** entries.csv for the runner: registered entries only (withdrawn / disqualified bots don't run). */
export function entriesToCsv(entries: CompetitionEntry[]): string {
  const lines = [ENTRIES_HEADER.join(",")];
  for (const e of entries.filter((x) => x.status === "registered")) {
    const members = e.members.map((m) => m.display_name || m.user_name || "").filter(Boolean).join("; ");
    lines.push([e.id, e.category, e.project?.title ?? "", members, e.project?.repository_url ?? ""].map(csvCell).join(","));
  }
  return lines.join("\n") + "\n";
}
