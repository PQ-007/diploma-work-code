import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/articles/comments?articleId=<id>
   Fetch all comments for an article
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const articleId = req.nextUrl.searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json(
        { error: "articleId is required" },
        { status: 400 },
      );
    }

    const { data: comments, error } = await supabase
      .from("article_comments")
      .select("id, body, parent_comment_id, created_at, author_id")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Gather unique author ids
    const authorIds = [
      ...new Set((comments || []).map((c) => c.author_id).filter(Boolean)),
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

      (profiles || []).forEach((p) => {
        profilesById.set(p.id, {
          user_name: p.user_name,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        });
      });
    }

    const items = (comments || []).map((c) => {
      const profile = profilesById.get(c.author_id);
      return {
        id: c.id,
        body: c.body,
        parent_comment_id: c.parent_comment_id,
        created_at: c.created_at,
        author: {
          id: c.author_id,
          display_name:
            profile?.display_name || profile?.user_name || "Anonymous",
          user_name: profile?.user_name || "user",
          avatar_url: profile?.avatar_url || "",
        },
      };
    });

    return NextResponse.json({ comments: items }, { status: 200 });
  } catch (error) {
    console.error("Error fetching article comments", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   POST /api/articles/comments
   Add a comment to an article
   Body: { articleId, body, parentCommentId? }
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

    const { articleId, body, parentCommentId } = (await req.json()) as {
      articleId: number;
      body: string;
      parentCommentId?: number;
    };

    if (!articleId || !body?.trim()) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { data: comment, error } = await supabase
      .from("article_comments")
      .insert({
        article_id: articleId,
        author_id: user.id,
        body: body.trim(),
        parent_comment_id: parentCommentId || null,
      })
      .select("id, body, parent_comment_id, created_at")
      .single();

    if (error || !comment) {
      return NextResponse.json(
        { error: error?.message || "Failed to add comment" },
        { status: 500 },
      );
    }

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
          parent_comment_id: comment.parent_comment_id,
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
    console.error("Error adding article comment", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   DELETE /api/articles/comments
   Delete own comment
   Body: { commentId }
   ═══════════════════════════════════════════ */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = (await req.json()) as { commentId: number };

    if (!commentId) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Only allow deleting own comments
    const { data: comment } = await supabase
      .from("article_comments")
      .select("author_id")
      .eq("id", commentId)
      .single();

    if (!comment || comment.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("article_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting article comment", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
