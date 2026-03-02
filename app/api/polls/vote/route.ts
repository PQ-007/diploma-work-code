import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   POST /api/polls/vote
   Cast or change a vote on a poll option
   Body: { pollId, optionId }
   - Voting for the same option again removes the vote (toggle)
   - Voting for a different option updates the vote
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

    const { pollId, optionId } = (await req.json()) as {
      pollId: number;
      optionId: number;
    };

    if (!pollId || !optionId) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Verify the option belongs to the poll
    const { data: option } = await supabase
      .from("poll_options")
      .select("id, poll_id")
      .eq("id", optionId)
      .eq("poll_id", pollId)
      .maybeSingle();

    if (!option) {
      return NextResponse.json(
        { error: "Option not found for this poll" },
        { status: 404 },
      );
    }

    // Check existing vote
    const { data: existing } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      if (existing.option_id === optionId) {
        // Same option → remove vote (toggle off)
        await supabase
          .from("poll_votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("user_id", user.id);

        return NextResponse.json({
          userVotedOptionId: null,
          action: "removed",
        });
      } else {
        // Different option → update vote
        await supabase
          .from("poll_votes")
          .update({ option_id: optionId })
          .eq("poll_id", pollId)
          .eq("user_id", user.id);

        return NextResponse.json({
          userVotedOptionId: optionId,
          action: "changed",
        });
      }
    } else {
      // No existing vote → insert
      await supabase
        .from("poll_votes")
        .insert({ poll_id: pollId, user_id: user.id, option_id: optionId });

      return NextResponse.json({
        userVotedOptionId: optionId,
        action: "added",
      });
    }
  } catch (error) {
    console.error("Error casting vote", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
