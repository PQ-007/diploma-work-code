import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { CompetitionResultUpdate } from "@/lib/types/competition";
import {
  ENTRY_COLUMNS,
  RESULT_VIEW_COLUMNS,
  computeRanks,
  dbErrorStatus,
  isEntryStatus,
  isStaff,
  loadEntries,
} from "@/lib/api/competitions";

const NUMBER_FIELDS = ["score", "tiebreak", "judge_score", "public_score"] as const;

function parseUpdates(body: unknown): CompetitionResultUpdate[] | string {
  const list = (body as { entries?: unknown })?.entries;
  if (!Array.isArray(list)) return "Body must be { entries: [...] } (an empty list just recomputes ranks)";
  const out: CompetitionResultUpdate[] = [];
  for (const [i, raw] of list.entries()) {
    if (!raw || typeof raw !== "object") return `entries[${i}] must be an object`;
    const r = raw as Record<string, unknown>;
    if (!Number.isInteger(r.id)) return `entries[${i}].id must be an entry id`;
    const u: CompetitionResultUpdate = { id: r.id as number };
    for (const f of NUMBER_FIELDS) {
      if (f in r) {
        if (r[f] !== null && (typeof r[f] !== "number" || !Number.isFinite(r[f]))) return `entries[${i}].${f} must be a number or null`;
        u[f] = r[f] as number | null;
      }
    }
    if ("note" in r) {
      if (r.note !== null && typeof r.note !== "string") return `entries[${i}].note must be text or null`;
      u.note = typeof r.note === "string" && r.note.trim() ? r.note.trim() : null;
    }
    if ("status" in r) {
      if (!isEntryStatus(r.status)) return `entries[${i}].status must be registered, withdrawn or disqualified`;
      u.status = r.status;
    }
    out.push(u);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  PUT /api/competitions/[slug]/results — Save results, recompute rank */
/* ------------------------------------------------------------------ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isStaff(supabase, user.id))) {
      return NextResponse.json({ error: "Only organizers can enter results" }, { status: 403 });
    }

    const updates = parseUpdates(await req.json().catch(() => null));
    if (typeof updates === "string") {
      return NextResponse.json({ error: updates }, { status: 400 });
    }

    const { data: competition } = await supabase
      .from("competitions")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!competition) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("competition_entries")
      .select(ENTRY_COLUMNS)
      .eq("competition_id", competition.id);
    const ids = new Set((existing ?? []).map((e) => e.id));
    const unknown = updates.filter((u) => !ids.has(u.id)).map((u) => u.id);
    if (unknown.length) {
      return NextResponse.json({ error: `Not entries of this competition: ${unknown.join(", ")}` }, { status: 400 });
    }

    // 1. Save the given fields. (No .select() — result columns aren't readable on the table.)
    for (const { id, ...fields } of updates) {
      if (Object.keys(fields).length === 0) continue;
      const { error } = await supabase.from("competition_entries").update(fields).eq("id", id);
      if (error) {
        return NextResponse.json({ error: `Entry ${id}: ${error.message}` }, { status: dbErrorStatus(error.code) });
      }
    }

    // 2. Recompute ranks from the view (staff see the results there).
    const { data: rows, error: viewError } = await supabase
      .from("competition_results_public")
      .select(RESULT_VIEW_COLUMNS)
      .eq("competition_id", competition.id);
    if (viewError) {
      return NextResponse.json({ error: viewError.message }, { status: 500 });
    }
    const current = (rows ?? []).map((r) => ({
      id: r.id as number,
      category: r.category as string,
      status: r.status as string,
      score: r.score === null ? null : Number(r.score),
      tiebreak: r.tiebreak === null ? null : Number(r.tiebreak),
      rank: r.rank as number | null,
    }));
    const ranks = computeRanks(current);
    for (const e of current) {
      const next = ranks.get(e.id) ?? null;
      if (next !== e.rank) {
        const { error } = await supabase.from("competition_entries").update({ rank: next }).eq("id", e.id);
        if (error) {
          return NextResponse.json({ error: `Entry ${e.id}: ${error.message}` }, { status: dbErrorStatus(error.code) });
        }
      }
    }

    return NextResponse.json({ entries: await loadEntries(supabase, competition.id) });
  } catch (error) {
    console.error("PUT /api/competitions/[slug]/results error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
