import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/articles/bookmarks?articleId=<id>
   Check if current user bookmarked an article
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ bookmarked: false }, { status: 200 });
    }

    const { data: existing } = await supabase
      .from("bookmarked_articles")
      .select("article_id")
      .eq("article_id", articleId)
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({ bookmarked: !!existing }, { status: 200 });
  } catch (error) {
    console.error("Error checking bookmark", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   POST /api/articles/bookmarks
   Toggle bookmark on an article
   Body: { articleId }
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

    const { articleId } = (await req.json()) as { articleId: number };

    if (!articleId) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("bookmarked_articles")
      .select("article_id")
      .eq("article_id", articleId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("bookmarked_articles")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", user.id);

      return NextResponse.json({ bookmarked: false });
    } else {
      await supabase
        .from("bookmarked_articles")
        .insert({ article_id: articleId, user_id: user.id });

      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Error toggling bookmark", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
