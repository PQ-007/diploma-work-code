import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type RouteParams = { slug?: string } | Promise<{ slug?: string }>;

/* ═══════════════════════════════════════════
   PATCH /api/articles/[slug]/status
   Toggle article publish status (draft ↔ published)
   Body: { status: "draft" | "published" }
   Only the article author can change status.
   ═══════════════════════════════════════════ */
export async function PATCH(
  req: NextRequest,
  context: { params: RouteParams },
) {
  try {
    const resolvedParams =
      "then" in context.params ? await context.params : context.params;
    const articleId = resolvedParams?.slug ? String(resolvedParams.slug) : "";

    if (!articleId) {
      return NextResponse.json(
        { error: "Missing article id" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = (await req.json()) as {
      status: "draft" | "published";
    };

    if (!status || !["draft", "published"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'draft' or 'published'" },
        { status: 400 },
      );
    }

    // Verify ownership
    const { data: article, error: fetchError } = await supabase
      .from("articles")
      .select("id, author_id, status")
      .eq("id", articleId)
      .single();

    if (fetchError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update status
    const { error: updateError } = await supabase
      .from("articles")
      .update({ status })
      .eq("id", articleId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If publishing, also set published_at on the translation if it's null
    if (status === "published") {
      await supabase
        .from("article_translations")
        .update({ published_at: new Date().toISOString() })
        .eq("article_id", articleId)
        .is("published_at", null);
    }

    return NextResponse.json({ id: article.id, status }, { status: 200 });
  } catch (error) {
    console.error("Error updating article status", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
