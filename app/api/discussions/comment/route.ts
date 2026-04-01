import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   POST /api/discussions/comment
   Add a comment to a discussion
   Body: { discussionId, body, parentCommentId? }
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

    const { discussionId, body, parentCommentId } = (await req.json()) as {
      discussionId: string;
      body: string;
      parentCommentId?: string;
    };

    if (!discussionId || !body?.trim()) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { data: comment, error } = await supabase
      .from("discussion_comments")
      .insert({
        discussion_id: discussionId,
        author_id: user.id,
        body: body.trim(),
        parent_comment_id: parentCommentId || null,
      })
      .select("id, body, created_at")
      .single();

    if (error || !comment) {
      return NextResponse.json(
        { error: error?.message || "Failed to add comment" },
        { status: 500 },
      );
    }

    // Fetch the commenter profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_name, display_name, avatar_url")
      .eq("id", user.id)
      .single();

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          body: comment.body,
          parent_comment_id: parentCommentId || null,
          created_at: comment.created_at,
          author: {
            id: user.id,
            display_name:
              profile?.display_name || profile?.user_name || "Anonymous",
            user_name: profile?.user_name || "user",
            avatar_url: profile?.avatar_url || "",
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding comment", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
