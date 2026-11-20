import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { LANG_COOKIE, isLanguage, resolveLanguage, type Language } from "@/lib/language";
import {
  COMPETITION_ENTRY_STATUSES,
  COMPETITION_KINDS,
  COMPETITION_STATUSES,
  type CompetitionEntry,
  type CompetitionEntryStatus,
  type CompetitionSummary,
  type LocalizedText,
  type TeamMember,
} from "@/lib/types/competition";

/*
 * Server helpers for /api/competitions (P1-02).
 *
 * Results (score, tiebreak, judge_score, public_score, rank, note) can't be selected on
 * competition_entries by anon/authenticated (P1-01 column privileges). Read them from the view
 * competition_results_public, which returns them only when results are published or the caller
 * is staff. Never select `*` on competition_entries and never .update().select() result columns.
 */

/** Entry columns anon/authenticated may select on the table itself. */
export const ENTRY_COLUMNS = "id, competition_id, project_id, category, status, created_at";
/** Columns of the competition_results_public view. */
export const RESULT_VIEW_COLUMNS =
  "id, competition_id, project_id, category, status, results_published, score, tiebreak, judge_score, public_score, rank, note, created_at";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORY_RE = /^[a-z0-9_-]+$/;

/* ---------------------------------------------------------------- language */

/** `?lang=` when valid, else the site's `lang` cookie / Accept-Language (same rule as app/layout.tsx). */
export function getLanguage(req: NextRequest): Language {
  const explicit = req.nextUrl.searchParams.get("lang");
  if (isLanguage(explicit)) return explicit;
  return resolveLanguage(req.cookies.get(LANG_COOKIE)?.value, req.headers.get("accept-language"));
}

/** Requested language, then mn → en → ja. */
export function localize(text: unknown, lang: Language): string {
  if (!text || typeof text !== "object") return "";
  const t = text as LocalizedText;
  for (const code of [lang, "mn", "en", "ja"] as const) {
    const value = t[code];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

/* ---------------------------------------------------------------- auth */

/** Same rule as the database (teacher / admin / super_admin). */
export async function isStaff(supabase: SupabaseClient, userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase.rpc("rls_is_staff", { p_user_id: userId });
  return !error && data === true;
}

export async function isSignupOpen(supabase: SupabaseClient, competitionId: number): Promise<boolean> {
  const { data, error } = await supabase.rpc("rls_competition_signup_open", { p_competition_id: competitionId });
  return !error && data === true;
}

/** Postgres error → HTTP status for writes. */
export function dbErrorStatus(code: string | undefined): number {
  if (code === "23505") return 409; // unique violation
  if (code === "23514" || code === "23503" || code === "22P02" || code === "22007") return 400; // check / FK / bad value
  if (code === "42501") return 403; // RLS / privilege
  return 500;
}

/* ---------------------------------------------------------------- input */

type Fields = Record<string, unknown>;

function localizedOrError(value: unknown, field: string, requireMn: boolean): LocalizedText | string {
  if (value === null && !requireMn) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return `${field} must be an object like {"mn": "...", "en": "...", "ja": "..."}`;
  const out: LocalizedText = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (!["mn", "en", "ja"].includes(k)) return `${field}: unknown language "${k}"`;
    if (typeof v !== "string") return `${field}.${k} must be a string`;
    if (v.trim()) out[k as "mn" | "en" | "ja"] = v;
  }
  if (requireMn && !out.mn) return `${field}.mn is required`;
  return out;
}

function dateOrError(value: unknown, field: string): string | null | { error: string } {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return { error: `${field} must be an ISO date` };
  return new Date(value).toISOString();
}

/**
 * Validates a create (all required fields) or partial update body for `competitions`.
 * Returns the row to write, or an error message.
 */
export function parseCompetitionInput(
  body: unknown,
  mode: "create" | "update",
): { row: Fields } | { error: string } {
  if (!body || typeof body !== "object") return { error: "Body must be a JSON object" };
  const b = body as Fields;
  const row: Fields = {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(b, k);

  if (mode === "create" || has("slug")) {
    if (typeof b.slug !== "string" || !SLUG_RE.test(b.slug) || b.slug.length > 80)
      return { error: "slug must be lowercase letters, digits and dashes (max 80)" };
    row.slug = b.slug;
  }
  if (mode === "create" || has("kind")) {
    if (!COMPETITION_KINDS.includes(b.kind as never)) return { error: `kind must be one of ${COMPETITION_KINDS.join(", ")}` };
    row.kind = b.kind;
  }
  if (mode === "update" && has("status")) {
    if (!COMPETITION_STATUSES.includes(b.status as never)) return { error: `status must be one of ${COMPETITION_STATUSES.join(", ")}` };
    row.status = b.status;
  }
  if (mode === "create" || has("title")) {
    const t = localizedOrError(b.title, "title", true);
    if (typeof t === "string") return { error: t };
    row.title = t;
  }
  for (const field of ["summary", "rules"] as const) {
    if (has(field)) {
      const t = localizedOrError(b[field], field, false);
      if (typeof t === "string") return { error: t };
      row[field] = t;
    }
  }
  if (has("cover_url")) {
    if (b.cover_url !== null && typeof b.cover_url !== "string") return { error: "cover_url must be a string" };
    row.cover_url = typeof b.cover_url === "string" && b.cover_url.trim() ? b.cover_url.trim() : null;
  }
  if (has("categories")) {
    if (!Array.isArray(b.categories) || !b.categories.every((c) => typeof c === "string" && CATEGORY_RE.test(c.trim())))
      return { error: "categories must be a list like [\"bot\", \"human_vs_bot\"] (lowercase, digits, _ and -)" };
    row.categories = [...new Set((b.categories as string[]).map((c) => c.trim()))];
  }
  if (has("max_team_size")) {
    if (!Number.isInteger(b.max_team_size) || (b.max_team_size as number) < 1 || (b.max_team_size as number) > 50)
      return { error: "max_team_size must be a whole number from 1 to 50" };
    row.max_team_size = b.max_team_size;
  }
  for (const field of ["signup_opens_at", "signup_closes_at", "starts_at", "ends_at"] as const) {
    if (has(field)) {
      const d = dateOrError(b[field], field);
      if (d && typeof d === "object") return { error: d.error };
      row[field] = d;
    }
  }
  if (mode === "update" && has("results_published")) {
    if (typeof b.results_published !== "boolean") return { error: "results_published must be true or false" };
    row.results_published = b.results_published;
  }
  if (mode === "update" && Object.keys(row).length === 0) return { error: "Nothing to update" };
  return { row };
}

/* ---------------------------------------------------------------- shaping */

// Supabase clients are untyped in this project (see the ssr typing note), so rows are loose records.
type Row = Record<string, unknown>;

export function toSummary(c: Row, lang: Language, entryCount: number): CompetitionSummary {
  return {
    id: c.id as number,
    slug: c.slug as string,
    kind: c.kind as CompetitionSummary["kind"],
    status: c.status as CompetitionSummary["status"],
    title: localize(c.title, lang),
    summary: localize(c.summary, lang),
    cover_url: (c.cover_url as string | null) ?? null,
    categories: (c.categories as string[]) ?? [],
    max_team_size: c.max_team_size as number,
    signup_opens_at: (c.signup_opens_at as string | null) ?? null,
    signup_closes_at: (c.signup_closes_at as string | null) ?? null,
    starts_at: (c.starts_at as string | null) ?? null,
    ends_at: (c.ends_at as string | null) ?? null,
    results_published: Boolean(c.results_published),
    entry_count: entryCount,
  };
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Entries of one competition from the results view, with each project's public info and team. */
export async function loadEntries(supabase: SupabaseClient, competitionId: number): Promise<CompetitionEntry[]> {
  const { data: rows, error } = await supabase
    .from("competition_results_public")
    .select(RESULT_VIEW_COLUMNS)
    .eq("competition_id", competitionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const entries = (rows ?? []) as Row[];
  const projectIds = [...new Set(entries.map((e) => e.project_id as number))];

  const projects = new Map<number, Row>();
  const members = new Map<number, TeamMember[]>();
  if (projectIds.length) {
    const [{ data: projectRows }, { data: memberRows }] = await Promise.all([
      supabase.from("projects").select("id, title, slug, thumbnail_url, is_public").in("id", projectIds),
      supabase
        .from("project_members")
        .select("project_id, user_id, role, profiles(user_name, display_name, avatar_url)")
        .in("project_id", projectIds),
    ]);
    for (const p of (projectRows ?? []) as Row[]) projects.set(p.id as number, p);
    for (const m of (memberRows ?? []) as Row[]) {
      const profile = (m.profiles ?? {}) as Row;
      const list = members.get(m.project_id as number) ?? [];
      list.push({
        user_id: m.user_id as string,
        role: m.role as string,
        user_name: (profile.user_name as string | null) ?? null,
        display_name: (profile.display_name as string | null) ?? null,
        avatar_url: (profile.avatar_url as string | null) ?? null,
      });
      members.set(m.project_id as number, list);
    }
  }

  return entries.map((e) => {
    const p = projects.get(e.project_id as number);
    return {
      id: e.id as number,
      category: e.category as string,
      status: e.status as CompetitionEntryStatus,
      score: num(e.score),
      tiebreak: num(e.tiebreak),
      judge_score: num(e.judge_score),
      public_score: num(e.public_score),
      rank: num(e.rank),
      note: (e.note as string | null) ?? null,
      created_at: e.created_at as string,
      project: p
        ? {
            id: p.id as number,
            title: p.title as string,
            slug: p.slug as string,
            thumbnail_url: (p.thumbnail_url as string | null) ?? null,
            is_public: Boolean(p.is_public),
          }
        : null,
      members: members.get(e.project_id as number) ?? [],
    };
  });
}

/* ---------------------------------------------------------------- ranks */

export interface RankInput {
  id: number;
  category: string;
  status: string;
  score: number | null;
  tiebreak: number | null;
}

/**
 * Rank per category: registered entries with a score, by score desc then tiebreak asc (no tiebreak last).
 * Equal score + tiebreak share a rank (1, 1, 3). Everything else (withdrawn, disqualified, no score) → null.
 */
export function computeRanks(entries: RankInput[]): Map<number, number | null> {
  const ranks = new Map<number, number | null>();
  const byCategory = new Map<string, RankInput[]>();
  for (const e of entries) {
    if (e.status === "registered" && e.score !== null) {
      byCategory.set(e.category, [...(byCategory.get(e.category) ?? []), e]);
    } else {
      ranks.set(e.id, null);
    }
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => {
      if (b.score! !== a.score!) return b.score! - a.score!;
      const ta = a.tiebreak ?? Number.POSITIVE_INFINITY;
      const tb = b.tiebreak ?? Number.POSITIVE_INFINITY;
      return ta - tb;
    });
    list.forEach((e, i) => {
      const prev = list[i - 1];
      const tied = prev && prev.score === e.score && (prev.tiebreak ?? null) === (e.tiebreak ?? null);
      ranks.set(e.id, tied ? (ranks.get(prev.id) as number) : i + 1);
    });
  }
  return ranks;
}

export const isEntryStatus = (v: unknown): v is CompetitionEntryStatus =>
  COMPETITION_ENTRY_STATUSES.includes(v as never);
