import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface ArticleRequestBody {
  title?: string;
  body?: string;
  sub_title?: string;
  tags?: string[];
  language_code?: string;
  status?: string;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "published";

    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("id, author_id, status, created_at")
      .eq("status", statusFilter)
      .order("created_at", { ascending: false });

    if (articlesError) {
      return NextResponse.json(
        { error: articlesError.message },
        { status: 500 },
      );
    }

    const articleIds = (articles || []).map((a) => a.id).filter(Boolean);
    if (!articleIds.length) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const { data: translations, error: translationError } = await supabase
      .from("article_translations")
      .select("article_id, language_code, title, sub_title, body, published_at, views, created_at, edited_at")
      .in("article_id", articleIds)
      .order("published_at", { ascending: false });

    if (translationError) {
      return NextResponse.json(
        { error: translationError.message },
        { status: 500 },
      );
    }

    const { data: tagLinks, error: tagLinkError } = await supabase
      .from("article_tags")
      .select("article_id, tag_id")
      .in("article_id", articleIds);

    if (tagLinkError) {
      return NextResponse.json(
        { error: tagLinkError.message },
        { status: 500 },
      );
    }

    const tagIds = (tagLinks || [])
      .map((t) => String(t.tag_id))
      .filter(Boolean);
    let tagsById = new Map<string, string>();
    if (tagIds.length) {
      const { data: tagRows, error: tagError } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", tagIds);

      if (tagError) {
        return NextResponse.json({ error: tagError.message }, { status: 500 });
      }

      (tagRows || []).forEach((t) => {
        if (t.id && t.name) tagsById.set(String(t.id), t.name);
      });
    }

    const tagsByArticle = new Map<string, string[]>();
    (tagLinks || []).forEach((link) => {
      const tagName = tagsById.get(String(link.tag_id));
      if (!tagName) return;
      const arr = tagsByArticle.get(link.article_id) || [];
      arr.push(tagName);
      tagsByArticle.set(link.article_id, arr);
    });

    // Get reaction counts per article
    const { data: reactionRows } = await supabase
      .from("article_reactions")
      .select("article_id")
      .in("article_id", articleIds);

    const reactionsByArticle = new Map<string, number>();
    (reactionRows || []).forEach((r) => {
      reactionsByArticle.set(
        r.article_id,
        (reactionsByArticle.get(r.article_id) || 0) + 1,
      );
    });

    // Get comment counts per article
    const { data: commentRows } = await supabase
      .from("article_comments")
      .select("article_id")
      .in("article_id", articleIds);

    const commentsByArticle = new Map<string, number>();
    (commentRows || []).forEach((c) => {
      commentsByArticle.set(
        c.article_id,
        (commentsByArticle.get(c.article_id) || 0) + 1,
      );
    });

    // Get bookmark counts per article
    const { data: bookmarkRows } = await supabase
      .from("bookmarked_articles")
      .select("article_id")
      .in("article_id", articleIds);

    const bookmarksByArticle = new Map<string, number>();
    (bookmarkRows || []).forEach((b) => {
      bookmarksByArticle.set(
        b.article_id,
        (bookmarksByArticle.get(b.article_id) || 0) + 1,
      );
    });

    const articleMap = new Map<
      string,
      { author_id: string | null; status: string; created_at: string | null }
    >();
    (articles || []).forEach((a) => {
      articleMap.set(a.id, {
        author_id: a.author_id || null,
        status: a.status,
        created_at: a.created_at,
      });
    });

    const latestByArticle = new Map<
      string,
      {
        article_id: string;
        language_code: string;
        title: string;
        sub_title: string | null;
        body: string;
        published_at: string | null;
        views: number | null;
        created_at: string | null;
        edited_at: string | null;
      }
    >();

    (translations || []).forEach((t) => {
      if (!latestByArticle.has(t.article_id)) {
        latestByArticle.set(t.article_id, t);
      }
    });

    // Fetch author profiles
    const authorIds = Array.from(
      new Set(
        (articles || [])
          .map((a) => a.author_id)
          .filter((id): id is string => !!id),
      ),
    );

    const profilesById = new Map<
      string,
      {
        user_name: string | null;
        avatar_url: string | null;
        ranking_point: number | null;
      }
    >();

    if (authorIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_name, avatar_url, ranking_point")
        .in("id", authorIds);

      if (!profilesError && profiles) {
        profiles.forEach((p) => {
          profilesById.set(p.id, {
            user_name: p.user_name,
            avatar_url: p.avatar_url,
            ranking_point: p.ranking_point,
          });
        });
      }
    }

    const items = Array.from(latestByArticle.values()).map((t) => {
      const articleData = articleMap.get(t.article_id);
      const authorId = articleData?.author_id || null;
      const authorProfile = authorId ? profilesById.get(authorId) : null;

      return {
        article_id: t.article_id,
        title: t.title,
        sub_title: t.sub_title,
        body: t.body,
        language_code: t.language_code,
        published_at: t.published_at,
        created_at: articleData?.created_at || t.created_at,
        edited_at: t.edited_at,
        views: t.views ?? 0,
        reactions: reactionsByArticle.get(t.article_id) || 0,
        comments: commentsByArticle.get(t.article_id) || 0,
        bookmarks: bookmarksByArticle.get(t.article_id) || 0,
        author_id: authorId,
        author: authorProfile
          ? {
              user_name: authorProfile.user_name,
              avatar_url: authorProfile.avatar_url,
              ranking_point: authorProfile.ranking_point,
            }
          : null,
        tags: tagsByArticle.get(t.article_id) || [],
      };
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("Error listing articles", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    sub_title,
    tags = [],
    language_code = "en",
    status = "draft",
  } = (await req.json()) as ArticleRequestBody;

  if (!title || !body) {
    return NextResponse.json(
      { error: "title and body are required" },
      { status: 400 },
    );
  }

  const { data: article, error: articleError } = await supabase
    .from("articles")
    .insert({ author_id: user.id, status })
    .select("id")
    .single();

  if (articleError || !article) {
    return NextResponse.json(
      { error: articleError?.message || "Failed to create article" },
      { status: 500 },
    );
  }

  const translationPayload = {
    article_id: article.id,
    language_code,
    title,
    sub_title,
    body,
    published_at: status === "published" ? new Date().toISOString() : null,
  };

  const { error: translationError } = await supabase
    .from("article_translations")
    .insert(translationPayload);

  if (translationError) {
    return NextResponse.json(
      { error: translationError.message },
      { status: 500 },
    );
  }

  const tagNames = Array.isArray(tags)
    ? tags.map((t) => t?.trim()).filter(Boolean)
    : [];

  if (tagNames.length) {
    const { data: tagRows, error: tagError } = await supabase
      .from("tags")
      .upsert(
        tagNames.map((name) => ({ name })),
        { onConflict: "name", ignoreDuplicates: true },
      )
      .select("id, name");

    if (tagError) {
      return NextResponse.json({ error: tagError.message }, { status: 500 });
    }

    if (tagRows && tagRows.length) {
      const tagLinks = tagRows.map((tag) => ({
        article_id: article.id,
        tag_id: tag.id,
      }));

      const { error: linkError } = await supabase
        .from("article_tags")
        .insert(tagLinks);

      if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ article_id: article.id }, { status: 200 });
}
