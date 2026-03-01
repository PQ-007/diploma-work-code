import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   POST /api/discussions/vote
   Toggle vote on a discussion
   Body: { discussionId, vote: "up" | "down" }
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

    const { discussionId, vote } = (await req.json()) as {
      discussionId: string;
      vote: "up" | "down";
    };

    if (!discussionId || !["up", "down"].includes(vote)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Check existing vote
    const { data: existing } = await supabase
      .from("discussion_votes")
      .select("vote")
      .eq("discussion_id", discussionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      if (existing.vote === vote) {
        // Same vote → remove (toggle off)
        await supabase
          .from("discussion_votes")
          .delete()
          .eq("discussion_id", discussionId)
          .eq("user_id", user.id);
        return NextResponse.json({ userVote: null });
      } else {
        // Different vote → update
        await supabase
          .from("discussion_votes")
          .update({ vote })
          .eq("discussion_id", discussionId)
          .eq("user_id", user.id);
        return NextResponse.json({ userVote: vote });
      }
    } else {
      // No existing → insert
      await supabase
        .from("discussion_votes")
        .insert({ discussion_id: discussionId, user_id: user.id, vote });
      return NextResponse.json({ userVote: vote });
    }
  } catch (error) {
    console.error("Error voting", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
