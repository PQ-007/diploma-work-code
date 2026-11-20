import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { COMPETITION_STATUSES } from "@/lib/types/competition";
import {
  dbErrorStatus,
  getLanguage,
  isStaff,
  parseCompetitionInput,
  toSummary,
} from "@/lib/api/competitions";

/* ------------------------------------------------------------------ */
/*  GET /api/competitions?status=open,running — List competitions      */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const lang = getLanguage(req);

    // One or more statuses, comma-separated. Without ?status= every non-draft competition is listed.
    // Drafts are only ever returned to staff (RLS), and only when asked for explicitly.
    const requested = (req.nextUrl.searchParams.get("status") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => (COMPETITION_STATUSES as readonly string[]).includes(s));

    let query = supabase.from("competitions").select("*");
    query = requested.length ? query.in("status", requested) : query.neq("status", "draft");
    const { data: rows, error } = await query
      .order("starts_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const competitions = rows ?? [];
    const counts = new Map<number, number>();
    if (competitions.length) {
      const { data: entries } = await supabase
        .from("competition_entries")
        .select("competition_id")
        .eq("status", "registered")
        .in("competition_id", competitions.map((c) => c.id));
      for (const e of entries ?? []) counts.set(e.competition_id, (counts.get(e.competition_id) ?? 0) + 1);
    }

    return NextResponse.json({
      items: competitions.map((c) => toSummary(c, lang, counts.get(c.id) ?? 0)),
    });
  } catch (error) {
    console.error("GET /api/competitions error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/competitions — Create a competition (staff, as draft)    */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isStaff(supabase, user.id))) {
      return NextResponse.json({ error: "Only organizers can create competitions" }, { status: 403 });
    }

    const parsed = parseCompetitionInput(await req.json().catch(() => null), "create");
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("competitions")
      .insert({ ...parsed.row, status: "draft", created_by: user.id })
      .select("slug")
      .single();

    if (error) {
      const status = dbErrorStatus(error.code);
      const message = status === 409 ? "That slug is already taken" : error.message;
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ slug: data.slug }, { status: 201 });
  } catch (error) {
    console.error("POST /api/competitions error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
