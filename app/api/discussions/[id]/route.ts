import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/discussions/[id]
   Fetch single discussion with full comments
   ═══════════════════════════════════════════ */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Discussion row
    const { data: disc, error: discError } = await supabase
      .from("discussions")
      .select("id, author_id, title, body, pinned, answered, created_at")
      .eq("id", id)
      .single();

    if (discError || !disc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 2. Author profile
    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("id, user_name, display_name, avatar_url")
      .eq("id", disc.author_id)
      .single();

    // 3. Tags
    const { data: tagLinks } = await supabase
      .from("discussion_tags")
      .select("tag_id")
      .eq("discussion_id", id);

    const tagIds = (tagLinks || []).map((t) => String(t.tag_id));
    let tags: string[] = [];
    if (tagIds.length) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", tagIds);
      tags = (tagRows || []).map((t) => t.name).filter(Boolean);
    }

    // 4. Votes
    const { data: votes } = await supabase
      .from("discussion_votes")
      .select("user_id, vote")
      .eq("discussion_id", id);

    let voteTotal = 0;
    let userVote: "up" | "down" | null = null;
    (votes || []).forEach((v) => {
      voteTotal += v.vote === "up" ? 1 : -1;
      if (user && v.user_id === user.id) userVote = v.vote as "up" | "down";
    });

    // 5. Bookmarked?
    let bookmarked = false;
    if (user) {
      const { data: bm } = await supabase
        .from("discussion_bookmarks")
        .select("discussion_id")
        .eq("discussion_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      bookmarked = !!bm;
    }

    // 6. Comments with author profiles
    const { data: comments } = await supabase
      .from("discussion_comments")
      .select("id, author_id, body, parent_comment_id, created_at")
      .eq("discussion_id", id)
      .order("created_at", { ascending: true });

    const commentAuthorIds = [
      ...new Set((comments || []).map((c) => c.author_id).filter(Boolean)),
    ];
    const commentProfilesById = new Map<
      string,
      {
        user_name: string | null;
        display_name: string | null;
        avatar_url: string | null;
      }
    >();
    if (commentAuthorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_name, display_name, avatar_url")
        .in("id", commentAuthorIds);
      profiles?.forEach((p) =>
        commentProfilesById.set(p.id, {
          user_name: p.user_name,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        }),
      );
    }

    const commentItems = (comments || []).map((c) => {
      const author = commentProfilesById.get(c.author_id);
      return {
        id: c.id,
        body: c.body,
        parent_comment_id: c.parent_comment_id,
        created_at: c.created_at,
        author: {
          id: c.author_id,
          display_name:
            author?.display_name || author?.user_name || "Anonymous",
          user_name: author?.user_name || "user",
          avatar_url: author?.avatar_url || "",
        },
      };
    });

    return NextResponse.json({
      discussion: {
        id: disc.id,
        title: disc.title,
        body: disc.body,
        pinned: disc.pinned,
        answered: disc.answered,
        created_at: disc.created_at,
        author: {
          id: disc.author_id,
          display_name:
            authorProfile?.display_name ||
            authorProfile?.user_name ||
            "Anonymous",
          user_name: authorProfile?.user_name || "user",
          avatar_url: authorProfile?.avatar_url || "",
        },
        tags,
        votes: voteTotal,
        userVote,
        bookmarked,
      },
      comments: commentItems,
    });
  } catch (error) {
    console.error("Error fetching discussion", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
