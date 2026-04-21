import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { fetchTagsForContent } from "@/lib/api/queries/tags";
import { fetchAuthorProfiles } from "@/lib/api/queries/profiles";
import { fetchInteractionCounts } from "@/lib/api/queries/interactions";

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
    const requestedLanguage =
      searchParams.get("lang")?.split("-")[0].toLowerCase() || null;

    // 1. Fetch base articles
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

    // 2. Fetch translations
    const { data: translations, error: translationError } = await supabase
      .from("article_translations")
      .select(
        "article_id, language_code, title, sub_title, body, published_at, views, created_at, edited_at",
      )
      .in("article_id", articleIds)
      .order("published_at", { ascending: false });

    if (translationError) {
      return NextResponse.json(
        { error: translationError.message },
        { status: 500 },
      );
    }

    // 3. Use shared query functions to fetch related data in parallel
    const authorIds = Array.from(
      new Set(
        (articles || [])
          .map((a) => a.author_id)
          .filter((id): id is string => !!id),
      ),
    );

    const [tagsByArticle, profilesById, interactionCounts] = await Promise.all([
      fetchTagsForContent(supabase, articleIds, "article_tags"),
      fetchAuthorProfiles(supabase, authorIds),
      fetchInteractionCounts(supabase, articleIds, "article"),
    ]);

    // 4. Build article map for quick lookup
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

    // 5. Get translation per article, preferring requested language if available.
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
    const preferredByArticle = new Map<
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

      if (
        requestedLanguage &&
        t.language_code?.toLowerCase() === requestedLanguage &&
        !preferredByArticle.has(t.article_id)
      ) {
        preferredByArticle.set(t.article_id, t);
      }
    });

    // 6. Build response items
    const items = Array.from(latestByArticle.values()).map((fallback) => {
      const t = preferredByArticle.get(fallback.article_id) || fallback;
      const articleData = articleMap.get(t.article_id);
      const authorId = articleData?.author_id || null;
      const author = authorId ? profilesById.get(authorId) : null;
      const interactions = interactionCounts.get(t.article_id);

      return {
        article_id: String(t.article_id),
        title: t.title,
        sub_title: t.sub_title,
        body: t.body,
        language_code: t.language_code,
        published_at: t.published_at,
        created_at: articleData?.created_at || t.created_at,
        edited_at: t.edited_at,
        views: t.views ?? 0,
        reactions: interactions?.likes || 0,
        comments: interactions?.comments || 0,
        bookmarks: interactions?.bookmarks || 0,
        author_id: authorId,
        author: author
          ? {
              user_name: author.username,
              display_name: author.displayName,
              avatar_url: author.avatarUrl,
              ranking_point: author.rankingPoint,
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

  if (status === "draft" && tagNames.length < 1) {
    return NextResponse.json(
      { error: "Draft article must contain at least one tag" },
      { status: 400 },
    );
  }

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
      // TODO: Re-enable usage tracking after schema migration
      // Update usage count for existing tags
      // for (const tag of tagRows) {
      //   // Get current usage count
      //   const { data: currentTag } = await supabase
      //     .from("tags")
      //     .select("usage_count")
      //     .eq("id", tag.id)
      //     .single();

      //   const currentCount = currentTag?.usage_count || 0;

      //   await supabase
      //     .from("tags")
      //     .update({
      //       usage_count: currentCount + 1,
      //       last_used_at: new Date().toISOString()
      //     })
      //     .eq("id", tag.id);
      // }

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
