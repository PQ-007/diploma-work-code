import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/articles/reactions?articleId=<id>
   Fetch reaction counts + current user's reaction for an article
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

    // Count total likes
    const { count, error: countError } = await supabase
      .from("article_reactions")
      .select("*", { count: "exact", head: true })
      .eq("article_id", articleId)
      .eq("reaction", "like");

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Current user's reaction (if logged in)
    let userReaction: string | null = null;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: existing } = await supabase
        .from("article_reactions")
        .select("reaction")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle();

      userReaction = existing?.reaction || null;
    }

    return NextResponse.json(
      { likesCount: count || 0, userReaction },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching reactions", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   POST /api/articles/reactions
   Toggle a reaction on an article
   Body: { articleId, reaction } (reaction: "like")
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

    const { articleId, reaction = "like" } = (await req.json()) as {
      articleId: number;
      reaction?: string;
    };

    if (!articleId) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Check if the user already reacted
    const { data: existing } = await supabase
      .from("article_reactions")
      .select("reaction")
      .eq("article_id", articleId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Already reacted → remove (toggle off)
      await supabase
        .from("article_reactions")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", user.id);

      return NextResponse.json({ userReaction: null, toggled: "off" });
    } else {
      // No reaction → insert
      await supabase
        .from("article_reactions")
        .insert({ article_id: articleId, user_id: user.id, reaction });

      return NextResponse.json({ userReaction: reaction, toggled: "on" });
    }
  } catch (error) {
    console.error("Error toggling reaction", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
