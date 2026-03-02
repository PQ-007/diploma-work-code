import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/polls
   List all polls with options + vote counts + current user's vote
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: polls, error: pollsError } = await supabase
      .from("polls")
      .select("id, question, ends_at, created_at, author_id")
      .order("created_at", { ascending: false });

    if (pollsError) {
      return NextResponse.json({ error: pollsError.message }, { status: 500 });
    }

    if (!polls?.length) {
      return NextResponse.json({ polls: [] }, { status: 200 });
    }

    const pollIds = polls.map((p) => p.id);

    // Fetch options
    const { data: options, error: optError } = await supabase
      .from("poll_options")
      .select("id, poll_id, option_text, display_order")
      .in("poll_id", pollIds)
      .order("display_order", { ascending: true });

    if (optError) {
      return NextResponse.json({ error: optError.message }, { status: 500 });
    }

    // Fetch votes
    const { data: votes, error: voteError } = await supabase
      .from("poll_votes")
      .select("poll_id, option_id, user_id")
      .in("poll_id", pollIds);

    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }

    // Fetch author profiles
    const authorIds = [
      ...new Set(polls.map((p) => p.author_id).filter(Boolean)),
    ];
    const profilesById = new Map<
      string,
      {
        user_name: string | null;
        display_name: string | null;
        avatar_url: string | null;
      }
    >();

    if (authorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_name, display_name, avatar_url")
        .in("id", authorIds);

      (profiles || []).forEach((p) => profilesById.set(p.id, p));
    }

    // Current user for user vote info
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Aggregate
    const voteCountByOption = new Map<number, number>();
    const userVoteByPoll = new Map<number, number>();

    (votes || []).forEach((v) => {
      voteCountByOption.set(
        v.option_id,
        (voteCountByOption.get(v.option_id) || 0) + 1,
      );
      if (user && v.user_id === user.id) {
        userVoteByPoll.set(v.poll_id, v.option_id);
      }
    });

    const optionsByPoll = new Map<number, typeof options>();
    (options || []).forEach((o) => {
      (
        optionsByPoll.get(o.poll_id) ||
        optionsByPoll.set(o.poll_id, []).get(o.poll_id)!
      ).push(o);
    });

    const result = polls.map((p) => {
      const profile = profilesById.get(p.author_id);
      const pollOptions = (optionsByPoll.get(p.id) || []).map((o) => ({
        id: o.id,
        option_text: o.option_text,
        display_order: o.display_order,
        votes: voteCountByOption.get(o.id) || 0,
      }));
      return {
        id: p.id,
        question: p.question,
        ends_at: p.ends_at,
        created_at: p.created_at,
        author: {
          id: p.author_id,
          display_name:
            profile?.display_name || profile?.user_name || "Anonymous",
          user_name: profile?.user_name || "user",
          avatar_url: profile?.avatar_url || "",
        },
        options: pollOptions,
        totalVotes: pollOptions.reduce((sum, o) => sum + o.votes, 0),
        userVotedOptionId: userVoteByPoll.get(p.id) ?? null,
      };
    });

    return NextResponse.json({ polls: result }, { status: 200 });
  } catch (error) {
    console.error("Error fetching polls", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   POST /api/polls
   Create a poll with options
   Body: { question, options: string[], ends_at? }
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

    const { question, options, ends_at } = (await req.json()) as {
      question: string;
      options: string[];
      ends_at?: string;
    };

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 },
      );
    }

    const cleanedOptions = (options || []).map((o) => o.trim()).filter(Boolean);
    if (cleanedOptions.length < 2) {
      return NextResponse.json(
        { error: "At least 2 options are required" },
        { status: 400 },
      );
    }
    if (cleanedOptions.length > 6) {
      return NextResponse.json(
        { error: "Maximum 6 options allowed" },
        { status: 400 },
      );
    }

    // Insert poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        author_id: user.id,
        question: question.trim(),
        ends_at: ends_at || null,
      })
      .select("id")
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: pollError?.message || "Failed to create poll" },
        { status: 500 },
      );
    }

    // Insert options
    const { error: optError } = await supabase.from("poll_options").insert(
      cleanedOptions.map((text, idx) => ({
        poll_id: poll.id,
        option_text: text,
        display_order: idx,
      })),
    );

    if (optError) {
      return NextResponse.json({ error: optError.message }, { status: 500 });
    }

    return NextResponse.json({ poll_id: poll.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating poll", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
