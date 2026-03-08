import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   POST /api/discussions/bookmark
   Toggle bookmark on a discussion
   Body: { discussionId }
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

    const { discussionId } = (await req.json()) as { discussionId: string };

    if (!discussionId) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("discussion_bookmarks")
      .select("discussion_id")
      .eq("discussion_id", discussionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("discussion_bookmarks")
        .delete()
        .eq("discussion_id", discussionId)
        .eq("user_id", user.id);
      return NextResponse.json({ bookmarked: false });
    } else {
      await supabase
        .from("discussion_bookmarks")
        .insert({ discussion_id: discussionId, user_id: user.id });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Error bookmarking", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
