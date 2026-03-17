import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type RouteParams = { slug?: string } | Promise<{ slug?: string }>;

export async function GET(_req: NextRequest, context: { params: RouteParams }) {
  const resolvedParams =
    "then" in context.params ? await context.params : context.params;
  const articleId = resolvedParams?.slug ? String(resolvedParams.slug) : "";

  if (!articleId) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id, author_id, status, created_at")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      const message = articleError?.message || "Article not found";
      return NextResponse.json({ error: message }, { status: 404 });
    }

    const { data: translation, error: translationError } = await supabase
      .from("article_translations")
      .select(
        "article_id, language_code, title, sub_title, edited_at,  body, published_at, views",
      )
      .eq("article_id", articleId)
      .order("published_at", { ascending: false })
      .limit(1)
      .single();

    if (translationError || !translation) {
      const message = translationError?.message || "Article not found";
      return NextResponse.json({ error: message }, { status: 404 });
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

    let tags: string[] = [];

    if (tagLinks && tagLinks.length) {
      const tagIds = tagLinks.map((t) => t.tag_id).filter(Boolean);

      if (tagIds.length) {
        const { data: tagRows, error: tagError } = await supabase
          .from("tags")
          .select("id, name")
          .in("id", tagIds);

        if (tagError) {
          return NextResponse.json(
            { error: tagError.message },
            { status: 500 },
          );
        }

        tags = (tagRows || []).map((t) => t.name).filter(Boolean) as string[];
      }
    }

    let author = null as {
      id: string;
      user_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      ranking_point?: number;
      followersCount?: number;
    } | null;

    if (article.author_id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_name, avatar_url, bio, ranking_point")
        .eq("id", article.author_id)
        .single();

      if (profileError) {
        console.warn("Author profile fetch failed", profileError.message);
      } else if (profile) {
        author = {
          id: profile.id,
          user_name: profile.user_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          ranking_point: profile.ranking_point,
        };
      }
    }

    return NextResponse.json(
      {
        id: String(article.id),
        status: article.status,
        author,
        ...translation,
        article_id: String(translation.article_id),
        tags,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching article", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
