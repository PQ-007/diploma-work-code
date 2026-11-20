import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ENTRY_COLUMNS, dbErrorStatus, isSignupOpen } from "@/lib/api/competitions";

/* ------------------------------------------------------------------ */
/*  DELETE /api/competitions/[slug]/entries/[id] — Withdraw            */
/*  Sets status to "withdrawn" (a status update, so history stays).    */
/* ------------------------------------------------------------------ */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params;
    const entryId = Number(id);
    if (!Number.isInteger(entryId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: competition } = await supabase
      .from("competitions")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!competition) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: entry } = await supabase
      .from("competition_entries")
      .select(ENTRY_COLUMNS)
      .eq("id", entryId)
      .eq("competition_id", competition.id)
      .maybeSingle();
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("created_by")
      .eq("id", entry.project_id)
      .maybeSingle();
    if (!project || project.created_by !== user.id) {
      return NextResponse.json({ error: "Only the team's project owner can withdraw" }, { status: 403 });
    }
    if (!(await isSignupOpen(supabase, competition.id))) {
      return NextResponse.json({ error: "Sign-up is closed; ask an organizer" }, { status: 409 });
    }
    if (entry.status === "withdrawn") {
      return NextResponse.json({ id: entry.id, status: "withdrawn" });
    }
    if (entry.status !== "registered") {
      return NextResponse.json({ error: `This entry is ${entry.status}` }, { status: 409 });
    }

    const { data: updated, error } = await supabase
      .from("competition_entries")
      .update({ status: "withdrawn" })
      .eq("id", entry.id)
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: dbErrorStatus(error.code) });
    }
    if (!updated?.length) {
      return NextResponse.json({ error: "Could not withdraw" }, { status: 403 });
    }

    return NextResponse.json({ id: entry.id, status: "withdrawn" });
  } catch (error) {
    console.error("DELETE /api/competitions/[slug]/entries/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
