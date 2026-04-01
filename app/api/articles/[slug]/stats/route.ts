import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/articles/[slug]/stats
 * Fetch live statistics for an article (views, likes, comments, bookmarks)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const articleId = slug;

    // Fetch article with author check
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id, author_id")
      .eq("id", articleId)
      .single();

    if (articleError) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check if user is the author (for edit context)
    const isAuthor = article.author_id === user.id;

    // Fetch article translation for view count
    const { data: translation } = await supabase
      .from("article_translations")
      .select("views")
      .eq("article_id", articleId)
      .single();

    // Fetch likes count
    const { count: likesCount } = await supabase
      .from("article_reactions")
      .select("*", { count: "exact" })
      .eq("article_id", articleId)
      .eq("reaction_type", "like");

    // Fetch comments count
    const { count: commentsCount } = await supabase
      .from("article_comments")
      .select("*", { count: "exact" })
      .eq("article_id", articleId);

    // Fetch bookmarks count
    const { count: bookmarksCount } = await supabase
      .from("article_bookmarks")
      .select("*", { count: "exact" })
      .eq("article_id", articleId);

    const stats = {
      views: translation?.views || 0,
      likes: likesCount || 0,
      comments: commentsCount || 0,
      bookmarks: bookmarksCount || 0,
      isAuthor,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching article stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch article statistics" },
      { status: 500 },
    );
  }
}
