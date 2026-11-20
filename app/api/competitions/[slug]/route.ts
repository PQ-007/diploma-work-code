import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { CompetitionDetail, LocalizedText } from "@/lib/types/competition";
import {
  dbErrorStatus,
  getLanguage,
  isSignupOpen,
  isStaff,
  loadEntries,
  localize,
  parseCompetitionInput,
  toSummary,
} from "@/lib/api/competitions";

/* ------------------------------------------------------------------ */
/*  GET /api/competitions/[slug] — Detail with entries and teams       */
/* ------------------------------------------------------------------ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const lang = getLanguage(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // RLS hides drafts from everyone but staff, so a draft is simply "not found" for others.
    const { data: competition, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!competition) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [entries, staff, signupOpen] = await Promise.all([
      loadEntries(supabase, competition.id),
      isStaff(supabase, user?.id),
      isSignupOpen(supabase, competition.id),
    ]);

    // Entries whose project the caller owns (for "My entry" / withdraw).
    let myEntryIds: number[] = [];
    if (user && entries.length) {
      const { data: mine } = await supabase
        .from("projects")
        .select("id")
        .eq("created_by", user.id)
        .in("id", [...new Set(entries.map((e) => e.project?.id).filter((id): id is number => id != null))]);
      const myProjects = new Set((mine ?? []).map((p) => p.id));
      myEntryIds = entries.filter((e) => e.project && myProjects.has(e.project.id)).map((e) => e.id);
    }

    const registered = entries.filter((e) => e.status === "registered").length;
    const detail: CompetitionDetail = {
      ...toSummary(competition, lang, registered),
      rules: localize(competition.rules, lang),
      i18n: {
        title: (competition.title ?? {}) as LocalizedText,
        summary: (competition.summary ?? {}) as LocalizedText,
        rules: (competition.rules ?? {}) as LocalizedText,
      },
      signup_open: signupOpen,
      is_staff: staff,
      entries,
      my_entry_ids: myEntryIds,
    };

    return NextResponse.json(detail);
  } catch (error) {
    console.error("GET /api/competitions/[slug] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/competitions/[slug] — Edit fields / status / publish      */
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
      return NextResponse.json({ error: "Only organizers can edit competitions" }, { status: 403 });
    }

    const parsed = parseCompetitionInput(await req.json().catch(() => null), "update");
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("competitions")
      .update(parsed.row)
      .eq("slug", slug)
      .select("slug, status, results_published");

    if (error) {
      const status = dbErrorStatus(error.code);
      const message = status === 409 ? "That slug is already taken" : error.message;
      return NextResponse.json({ error: message }, { status });
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("PUT /api/competitions/[slug] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
