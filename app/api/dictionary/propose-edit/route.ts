import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   POST /api/dictionary/propose-edit
   Propose an edit to an existing APPROVED entry
   Creates a new pending revision without modifying the live entry
   Body: { entry_id, term?, reading?, definition?, translations?, examples?, tags?, change_summary }
   ═══════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      entry_id,
      term,
      reading,
      definition,
      language_code,
      translations,
      examples,
      tags,
      change_summary,
    } = body;

    if (!entry_id) {
      return NextResponse.json(
        { error: "entry_id is required" },
        { status: 400 },
      );
    }

    // Fetch current entry
    const { data: entry } = await supabase
      .from("dictionary_entries")
      .select("id, term, reading, language_code, definition, status")
      .eq("id", entry_id)
      .single();

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (entry.status !== "approved") {
      return NextResponse.json(
        { error: "Can only propose edits to approved entries" },
        { status: 400 },
      );
    }

    // Get next revision number
    const { data: lastRevision } = await supabase
      .from("dictionary_revisions")
      .select("revision_number")
      .eq("entry_id", entry_id)
      .order("revision_number", { ascending: false })
      .limit(1)
      .single();

    const nextRevNumber = (lastRevision?.revision_number || 0) + 1;

    // Create new pending revision
    const { data: revision, error: revError } = await supabase
      .from("dictionary_revisions")
      .insert({
        entry_id,
        revision_number: nextRevNumber,
        term: term?.trim() || entry.term,
        reading:
          reading !== undefined ? reading?.trim() || null : entry.reading,
        language_code: language_code || entry.language_code,
        definition: definition?.trim() || entry.definition,
        translations_snapshot: translations || [],
        examples_snapshot: examples || [],
        tags_snapshot: tags || [],
        change_summary: change_summary?.trim() || "Proposed edit",
        status: "pending_review",
        created_by: user.id,
      })
      .select("id, revision_number")
      .single();

    if (revError || !revision) {
      return NextResponse.json(
        { error: revError?.message || "Failed to create revision" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        revision_id: revision.id,
        revision_number: revision.revision_number,
        status: "pending_review",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error proposing edit", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
