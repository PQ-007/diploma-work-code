import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type RouteParams = { slug?: string } | Promise<{ slug?: string }>;

interface ArticlePatchBody {
  title?: string;
  sub_title?: string;
  body?: string;
  tags?: string[];
  language_code?: string;
  status?: "draft" | "published";
  base_lang_code?: string | null;
  series?: string | null;
}

const ALLOWED_STATUSES = new Set(["draft", "published"]);

const normalizeLanguageCode = (raw: string | null, fallback = "") => {
  const code = (raw || "").trim().toLowerCase();
  if (code === "ja") return "jp";
  if (code === "mn" || code === "en" || code === "jp") return code;
  return fallback;
};

export async function GET(req: NextRequest, context: { params: RouteParams }) {
  const resolvedParams =
    "then" in context.params ? await context.params : context.params;
  const articleId = resolvedParams?.slug ? String(resolvedParams.slug) : "";
  const mode = req.nextUrl.searchParams.get("mode");
  const requestedLang = normalizeLanguageCode(
    req.nextUrl.searchParams.get("lang"),
    "",
  );
  const isEditMode = mode === "edit";

  if (!articleId) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  // Validate that articleId is numeric (article IDs should be numbers)
  if (!/^\d+$/.test(articleId)) {
    return NextResponse.json(
      { error: "Invalid article ID format" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id, author_id, status, created_at, base_lang_code")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      const message = articleError?.message || "Article not found";
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (isEditMode) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (article.author_id !== user.id) {
        return NextResponse.json(
          { error: "You can only edit your own article." },
          { status: 403 },
        );
      }
    }

    const { data: translations, error: translationError } = await supabase
      .from("article_translations")
      .select(
        "article_id, language_code, title, sub_title, edited_at, body, published_at, views",
      )
      .eq("article_id", articleId)
      .order("published_at", { ascending: false, nullsFirst: false });

    if (translationError || !translations || translations.length < 1) {
      const message = translationError?.message || "Article not found";
      return NextResponse.json({ error: message }, { status: 404 });
    }

    const selectedTranslation =
      (requestedLang
        ? translations.find((item) => item.language_code === requestedLang)
        : null) || translations[0];

    let nextViews = selectedTranslation?.views ?? 0;
    if (!isEditMode) {
      const incrementedViews = (selectedTranslation?.views || 0) + 1;
      const { error: incrementError } = await supabase
        .from("article_translations")
        .update({ views: incrementedViews })
        .eq("article_id", articleId)
        .eq("language_code", selectedTranslation.language_code);

      if (incrementError) {
        console.warn("Article view increment failed", incrementError.message);
      } else {
        nextViews = incrementedViews;
      }
    }

    const availableTranslations = Array.from(
      new Set(
        translations
          .map((item) => normalizeLanguageCode(item.language_code, ""))
          .filter(Boolean),
      ),
    );

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
      display_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      ranking_point?: number;
      followersCount?: number;
    } | null;

    if (article.author_id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_name, display_name, avatar_url, bio, ranking_point")
        .eq("id", article.author_id)
        .single();

      if (profileError) {
        console.warn("Author profile fetch failed", profileError.message);
      } else if (profile) {
        author = {
          id: profile.id,
          user_name: profile.user_name,
          display_name: profile.display_name,
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
        ...selectedTranslation,
        views: nextViews,
        article_id: String(selectedTranslation.article_id),
        base_lang_code: article.base_lang_code || null,
        available_translations: availableTranslations,
        tags,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching article", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: RouteParams },
) {
  const resolvedParams =
    "then" in context.params ? await context.params : context.params;
  const articleId = resolvedParams?.slug ? String(resolvedParams.slug) : "";

  if (!articleId) {
    return NextResponse.json({ error: "Missing article id" }, { status: 400 });
  }

  // Validate that articleId is numeric (article IDs should be numbers)
  if (!/^\d+$/.test(articleId)) {
    return NextResponse.json(
      { error: "Invalid article ID format" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id, author_id, status, base_lang_code, series")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = (await req.json()) as ArticlePatchBody;

    if (
      typeof payload.title === "undefined" &&
      typeof payload.sub_title === "undefined" &&
      typeof payload.body === "undefined" &&
      typeof payload.tags === "undefined" &&
      typeof payload.status === "undefined" &&
      typeof payload.base_lang_code === "undefined" &&
      typeof payload.series === "undefined" &&
      typeof payload.language_code === "undefined"
    ) {
      return NextResponse.json(
        { error: "No changes provided" },
        { status: 400 },
      );
    }

    if (payload.status && !ALLOWED_STATUSES.has(payload.status)) {
      return NextResponse.json(
        { error: "status must be 'draft' or 'published'" },
        { status: 400 },
      );
    }

    const nowIso = new Date().toISOString();
    const nextStatus = payload.status ?? article.status;

    if (nextStatus === "draft") {
      if (typeof payload.tags !== "undefined") {
        const cleanedDraftTags = Array.from(
          new Set(
            (payload.tags || []).map((tag) => tag.trim()).filter(Boolean),
          ),
        );
        if (cleanedDraftTags.length < 1) {
          return NextResponse.json(
            { error: "Draft article must contain at least one tag" },
            { status: 400 },
          );
        }
      } else {
        const { data: existingTagLinkRows, error: existingTagLinksError } =
          await supabase
            .from("article_tags")
            .select("tag_id")
            .eq("article_id", articleId)
            .limit(1);

        if (existingTagLinksError) {
          return NextResponse.json(
            { error: existingTagLinksError.message },
            { status: 500 },
          );
        }

        if (!existingTagLinkRows || existingTagLinkRows.length < 1) {
          return NextResponse.json(
            { error: "Draft article must contain at least one tag" },
            { status: 400 },
          );
        }
      }
    }

    const translationLanguage =
      payload.language_code?.trim() || article.base_lang_code || "en";

    const { data: currentTranslation } = await supabase
      .from("article_translations")
      .select("id, title, sub_title, body")
      .eq("article_id", articleId)
      .eq("language_code", translationLanguage)
      .maybeSingle();

    const nextTitle =
      typeof payload.title === "string"
        ? payload.title
        : (currentTranslation?.title ?? "Untitled article");
    const nextSubTitle =
      typeof payload.sub_title === "string"
        ? payload.sub_title
        : (currentTranslation?.sub_title ?? null);
    const nextBody =
      typeof payload.body === "string"
        ? payload.body
        : (currentTranslation?.body ?? "");

    if (currentTranslation?.id) {
      const { error: updateTranslationError } = await supabase
        .from("article_translations")
        .update({
          title: nextTitle,
          sub_title: nextSubTitle,
          body: nextBody,
          edited_at: nowIso,
          published_at: nextStatus === "published" ? nowIso : null,
        })
        .eq("id", currentTranslation.id);

      if (updateTranslationError) {
        return NextResponse.json(
          { error: updateTranslationError.message },
          { status: 500 },
        );
      }
    } else {
      const { error: insertTranslationError } = await supabase
        .from("article_translations")
        .insert({
          article_id: articleId,
          language_code: translationLanguage,
          title: nextTitle,
          sub_title: nextSubTitle,
          body: nextBody,
          edited_at: nowIso,
          published_at: nextStatus === "published" ? nowIso : null,
        });

      if (insertTranslationError) {
        return NextResponse.json(
          { error: insertTranslationError.message },
          { status: 500 },
        );
      }
    }

    const articlePatch: {
      status?: "draft" | "published";
      base_lang_code?: string | null;
      series?: string | null;
    } = {};

    if (payload.status) articlePatch.status = payload.status;
    if (typeof payload.base_lang_code !== "undefined") {
      articlePatch.base_lang_code = payload.base_lang_code;
    }
    if (typeof payload.series !== "undefined") {
      articlePatch.series = payload.series;
    }

    if (Object.keys(articlePatch).length > 0) {
      const { error: articlePatchError } = await supabase
        .from("articles")
        .update(articlePatch)
        .eq("id", articleId);

      if (articlePatchError) {
        return NextResponse.json(
          { error: articlePatchError.message },
          { status: 500 },
        );
      }
    }

    if (typeof payload.tags !== "undefined") {
      const cleanedTags = Array.from(
        new Set((payload.tags || []).map((tag) => tag.trim()).filter(Boolean)),
      );

      const { error: clearTagLinksError } = await supabase
        .from("article_tags")
        .delete()
        .eq("article_id", articleId);

      if (clearTagLinksError) {
        return NextResponse.json(
          { error: clearTagLinksError.message },
          { status: 500 },
        );
      }

      if (cleanedTags.length > 0) {
        const { error: upsertTagError } = await supabase.from("tags").upsert(
          cleanedTags.map((name) => ({ name })),
          { onConflict: "name", ignoreDuplicates: true },
        );

        if (upsertTagError) {
          return NextResponse.json(
            { error: upsertTagError.message },
            { status: 500 },
          );
        }

        const { data: tagRows, error: fetchTagsError } = await supabase
          .from("tags")
          .select("id, name")
          .in("name", cleanedTags);

        if (fetchTagsError) {
          return NextResponse.json(
            { error: fetchTagsError.message },
            { status: 500 },
          );
        }

        // Update usage count for existing tags
        if (tagRows) {
          for (const tag of tagRows) {
            // Get current usage count
            const { data: currentTag } = await supabase
              .from("tags")
              .select("usage_count")
              .eq("id", tag.id)
              .single();

            const currentCount = currentTag?.usage_count || 0;

            await supabase
              .from("tags")
              .update({
                usage_count: currentCount + 1,
                last_used_at: new Date().toISOString(),
              })
              .eq("id", tag.id);
          }
        }

        const tagLinks = (tagRows || []).map((tag) => ({
          article_id: articleId,
          tag_id: tag.id,
        }));

        if (tagLinks.length > 0) {
          const { error: linkError } = await supabase
            .from("article_tags")
            .insert(tagLinks);

          if (linkError) {
            return NextResponse.json(
              { error: linkError.message },
              { status: 500 },
            );
          }
        }
      }
    }

    const { data: latestArticleRow, error: latestArticleError } = await supabase
      .from("articles")
      .select("id, status, author_id, base_lang_code, series")
      .eq("id", articleId)
      .single();

    if (latestArticleError || !latestArticleRow) {
      return NextResponse.json(
        {
          error:
            latestArticleError?.message || "Failed to read updated article",
        },
        { status: 500 },
      );
    }

    const { data: selectedTranslation, error: selectedTranslationError } =
      await supabase
        .from("article_translations")
        .select(
          "article_id, language_code, title, sub_title, body, published_at, views, edited_at",
        )
        .eq("article_id", articleId)
        .eq("language_code", translationLanguage)
        .single();

    if (selectedTranslationError || !selectedTranslation) {
      return NextResponse.json(
        {
          error:
            selectedTranslationError?.message ||
            "Failed to read updated translation",
        },
        { status: 500 },
      );
    }

    const { data: currentTags, error: currentTagsError } = await supabase
      .from("article_tags")
      .select("tag_id")
      .eq("article_id", articleId);

    if (currentTagsError) {
      return NextResponse.json(
        { error: currentTagsError.message },
        { status: 500 },
      );
    }

    const tagIds = (currentTags || []).map((x) => x.tag_id).filter(Boolean);
    let tagNames: string[] = [];

    if (tagIds.length > 0) {
      const { data: tagRows, error: tagRowsError } = await supabase
        .from("tags")
        .select("name")
        .in("id", tagIds);

      if (tagRowsError) {
        return NextResponse.json(
          { error: tagRowsError.message },
          { status: 500 },
        );
      }

      tagNames = (tagRows || []).map((t) => t.name).filter(Boolean);
    }

    return NextResponse.json(
      {
        id: String(latestArticleRow.id),
        article_id: String(selectedTranslation.article_id),
        status: latestArticleRow.status,
        base_lang_code: latestArticleRow.base_lang_code,
        series: latestArticleRow.series,
        title: selectedTranslation.title,
        sub_title: selectedTranslation.sub_title,
        body: selectedTranslation.body,
        language_code: selectedTranslation.language_code,
        published_at: selectedTranslation.published_at,
        edited_at: selectedTranslation.edited_at,
        views: selectedTranslation.views ?? 0,
        tags: tagNames,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating article", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: RouteParams }) {
  const resolvedParams =
    "then" in context.params ? await context.params : context.params;
  const articleId = resolvedParams?.slug ? String(resolvedParams.slug) : "";

  if (!articleId) {
    return NextResponse.json({ error: "Missing article id" }, { status: 400 });
  }

  // Validate that articleId is numeric (article IDs should be numbers)
  if (!/^\d+$/.test(articleId)) {
    return NextResponse.json(
      { error: "Invalid article ID format" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id, author_id")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete dependent rows first to satisfy FK constraints.
    const cleanupResults = await Promise.all([
      supabase.from("article_comments").delete().eq("article_id", articleId),
      supabase.from("article_reactions").delete().eq("article_id", articleId),
      supabase.from("article_tags").delete().eq("article_id", articleId),
      supabase.from("bookmarked_articles").delete().eq("article_id", articleId),
      supabase
        .from("translation_requests")
        .delete()
        .eq("original_article_id", articleId),
      supabase
        .from("article_translation_sources")
        .delete()
        .eq("translation_article_id", articleId),
      supabase
        .from("article_translation_sources")
        .delete()
        .eq("source_article_id", articleId),
      supabase
        .from("article_translations")
        .delete()
        .eq("article_id", articleId),
    ]);

    const failedCleanup = cleanupResults.find(
      (result) => !!result.error,
    )?.error;

    if (failedCleanup) {
      return NextResponse.json(
        { error: failedCleanup.message },
        { status: 500 },
      );
    }

    const { error: deleteArticleError } = await supabase
      .from("articles")
      .delete()
      .eq("id", articleId)
      .eq("author_id", user.id);

    if (deleteArticleError) {
      return NextResponse.json(
        { error: deleteArticleError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ deleted: true, id: articleId }, { status: 200 });
  } catch (error) {
    console.error("Error deleting article", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
