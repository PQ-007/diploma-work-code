import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface ArticleRequestBody {
  title?: string;
  body?: string;
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
      .select("id, author_id, status")
      .eq("status", statusFilter)
      .order("id", { ascending: false });

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
      .select("article_id, language_code, title, body, published_at")
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

    const articleMap = new Map<
      string,
      { author_id: string | null; status: string }
    >();
    (articles || []).forEach((a) => {
      articleMap.set(a.id, {
        author_id: a.author_id || null,
        status: a.status,
      });
    });

    const latestByArticle = new Map<
      string,
      {
        article_id: string;
        language_code: string;
        title: string;
        body: string;
        published_at: string | null;
      }
    >();

    (translations || []).forEach((t) => {
      if (!latestByArticle.has(t.article_id)) {
        latestByArticle.set(t.article_id, t);
      }
    });

    const items = Array.from(latestByArticle.values()).map((t) => ({
      article_id: t.article_id,
      title: t.title,
      body: t.body,
      language_code: t.language_code,
      published_at: t.published_at,
      author_id: articleMap.get(t.article_id)?.author_id || null,
      tags: tagsByArticle.get(t.article_id) || [],
    }));

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
