import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type RouteParams = { slug?: string } | Promise<{ slug?: string }>;

export async function GET(_: Request, context: { params: RouteParams }) {
  const resolvedParams =
    "then" in context.params ? await context.params : context.params;
  const resourceId = resolvedParams?.slug ? String(resolvedParams.slug) : "";

  if (!resourceId) {
    return NextResponse.json({ error: "Missing article id" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let articleId = resourceId;

    // Some callers may accidentally pass article_translations.id in the URL.
    // Resolve that to the canonical articles.id when needed.
    let { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id, author_id, status, created_at, base_lang_code, series")
      .eq("id", articleId)
      .maybeSingle();

    if (!article && /^\d+$/.test(resourceId)) {
      const { data: translationRow, error: translationLookupError } =
        await supabase
          .from("article_translations")
          .select("article_id")
          .eq("id", resourceId)
          .maybeSingle();

      if (!translationLookupError && translationRow?.article_id) {
        articleId = String(translationRow.article_id);
        const { data: resolvedArticle, error: resolvedArticleError } =
          await supabase
            .from("articles")
            .select("id, author_id, status, created_at, base_lang_code, series")
            .eq("id", articleId)
            .maybeSingle();

        article = resolvedArticle;
        articleError = resolvedArticleError;
      }
    }

    if (articleError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.author_id !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own article." },
        { status: 403 },
      );
    }

    const { data: translations, error: translationError } = await supabase
      .from("article_translations")
      .select(
        "id, article_id, language_code, title, sub_title, body, published_at, edited_at, created_at, views",
      )
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });

    if (translationError) {
      return NextResponse.json(
        { error: translationError.message },
        { status: 500 },
      );
    }

    const { data: tagLinks, error: tagLinkError } = await supabase
      .from("article_tags")
      .select("tag_id")
      .eq("article_id", articleId);

    if (tagLinkError) {
      return NextResponse.json(
        { error: tagLinkError.message },
        { status: 500 },
      );
    }

    const tagIds = (tagLinks || []).map((x) => x.tag_id).filter(Boolean);
    let tags: string[] = [];

    if (tagIds.length > 0) {
      const { data: tagRows, error: tagError } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", tagIds);

      if (tagError) {
        return NextResponse.json({ error: tagError.message }, { status: 500 });
      }

      tags = (tagRows || []).map((x) => x.name).filter(Boolean);
    }

    const author = {
      id: article.author_id,
    };

    return NextResponse.json(
      {
        article: {
          id: String(article.id),
          status: article.status,
          author_id: article.author_id,
          created_at: article.created_at,
        },
        settings: {
          base_lang_code: article.base_lang_code,
          series: article.series,
        },
        tags,
        translations: (translations || []).map((row) => ({
          id: row.id,
          article_id: String(row.article_id),
          language_code: row.language_code,
          title: row.title,
          sub_title: row.sub_title,
          body: row.body,
          published_at: row.published_at,
          edited_at: row.edited_at,
          created_at: row.created_at,
          views: row.views ?? 0,
        })),
        author,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error loading article edit payload", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
