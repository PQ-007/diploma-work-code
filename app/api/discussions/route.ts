import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/discussions
   Fetches all discussions with author, tags, vote counts, comment counts
   ═══════════════════════════════════════════ */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch all discussions ordered by pinned first, then newest
    const { data: discussions, error: discError } = await supabase
      .from("discussions")
      .select("id, author_id, title, body, pinned, answered, created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (discError) {
      return NextResponse.json({ error: discError.message }, { status: 500 });
    }

    if (!discussions?.length) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const discIds = discussions.map((d) => d.id);
    const authorIds = [
      ...new Set(discussions.map((d) => d.author_id).filter(Boolean)),
    ];

    // 2. Fetch author profiles
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
      profiles?.forEach((p) =>
        profilesById.set(p.id, {
          user_name: p.user_name,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        }),
      );
    }

    // 3. Fetch tags
    const { data: tagLinks } = await supabase
      .from("discussion_tags")
      .select("discussion_id, tag_id")
      .in("discussion_id", discIds);

    const tagIds = [
      ...new Set((tagLinks || []).map((t) => String(t.tag_id)).filter(Boolean)),
    ];
    const tagsById = new Map<string, string>();
    if (tagIds.length) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", tagIds);
      tagRows?.forEach((t) => {
        if (t.id && t.name) tagsById.set(String(t.id), t.name);
      });
    }

    const tagsByDisc = new Map<string, string[]>();
    (tagLinks || []).forEach((link) => {
      const name = tagsById.get(String(link.tag_id));
      if (!name) return;
      const arr = tagsByDisc.get(link.discussion_id) || [];
      arr.push(name);
      tagsByDisc.set(link.discussion_id, arr);
    });

    // 4. Fetch vote totals (up votes - down votes per discussion)
    const { data: votes } = await supabase
      .from("discussion_votes")
      .select("discussion_id, vote")
      .in("discussion_id", discIds);

    const voteMap = new Map<string, number>();
    (votes || []).forEach((v) => {
      const current = voteMap.get(v.discussion_id) || 0;
      voteMap.set(v.discussion_id, current + (v.vote === "up" ? 1 : -1));
    });

    // 5. Current user's votes
    const userVoteMap = new Map<string, "up" | "down">();
    if (user) {
      const { data: myVoteRows } = await supabase
        .from("discussion_votes")
        .select("discussion_id, vote")
        .eq("user_id", user.id)
        .in("discussion_id", discIds);
      myVoteRows?.forEach((v) =>
        userVoteMap.set(v.discussion_id, v.vote as "up" | "down"),
      );
    }

    // 6. Comment counts
    const { data: comments } = await supabase
      .from("discussion_comments")
      .select("discussion_id")
      .in("discussion_id", discIds);

    const commentCountMap = new Map<string, number>();
    (comments || []).forEach((c) => {
      commentCountMap.set(
        c.discussion_id,
        (commentCountMap.get(c.discussion_id) || 0) + 1,
      );
    });

    // 7. Current user's bookmarks
    const bookmarkSet = new Set<string>();
    if (user) {
      const { data: bookmarks } = await supabase
        .from("discussion_bookmarks")
        .select("discussion_id")
        .eq("user_id", user.id)
        .in("discussion_id", discIds);
      bookmarks?.forEach((b) => bookmarkSet.add(b.discussion_id));
    }

    // 8. Assemble items
    const items = discussions.map((d) => {
      const author = profilesById.get(d.author_id);
      return {
        id: d.id,
        title: d.title,
        body: d.body,
        pinned: d.pinned,
        answered: d.answered,
        created_at: d.created_at,
        author: {
          id: d.author_id,
          display_name:
            author?.display_name || author?.user_name || "Anonymous",
          user_name: author?.user_name || "user",
          avatar_url: author?.avatar_url || "",
        },
        tags: tagsByDisc.get(d.id) || [],
        votes: voteMap.get(d.id) || 0,
        userVote: userVoteMap.get(d.id) || null,
        commentCount: commentCountMap.get(d.id) || 0,
        bookmarked: bookmarkSet.has(d.id),
      };
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("Error listing discussions", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   POST /api/discussions
   Create a new discussion
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

    const {
      title,
      body,
      tags = [],
    } = (await req.json()) as {
      title?: string;
      body?: string;
      tags?: string[];
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Insert discussion
    const { data: disc, error: discError } = await supabase
      .from("discussions")
      .insert({
        author_id: user.id,
        title: title.trim(),
        body: (body || "").trim(),
      })
      .select("id")
      .single();

    if (discError || !disc) {
      return NextResponse.json(
        { error: discError?.message || "Failed to create discussion" },
        { status: 500 },
      );
    }

    // Upsert tags and link
    if (tags.length) {
      for (const tagName of tags) {
        const { data: tagRow } = await supabase
          .from("tags")
          .upsert({ name: tagName.trim() }, { onConflict: "name" })
          .select("id")
          .single();

        if (tagRow) {
          await supabase
            .from("discussion_tags")
            .insert({ discussion_id: disc.id, tag_id: tagRow.id });
        }
      }
    }

    return NextResponse.json({ id: disc.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating discussion", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
