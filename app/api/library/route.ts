import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const statusFilter = searchParams.get("status") || "draft";

    const items: LibraryItem[] = [];

    // ── Articles (drafts or all) ──
    if (type === "all" || type === "articles") {
      let articlesQuery = supabase
        .from("articles")
        .select("id, author_id, status, created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter === "draft") {
        articlesQuery = articlesQuery.eq("status", "draft");
      }

      const { data: articles } = await articlesQuery;

      if (articles?.length) {
        const articleIds = articles.map((a) => a.id);

        const { data: translations } = await supabase
          .from("article_translations")
          .select("article_id, title, sub_title, body, published_at")
          .in("article_id", articleIds);

        const { data: tagLinks } = await supabase
          .from("article_tags")
          .select("article_id, tag_id")
          .in("article_id", articleIds);

        const tagIds = (tagLinks || [])
          .map((t) => String(t.tag_id))
          .filter(Boolean);

        let tagsById = new Map<string, string>();
        if (tagIds.length) {
          const { data: tagRows } = await supabase
            .from("tags")
            .select("id, name")
            .in("id", tagIds);
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

        const translationMap = new Map<
          string,
          { title: string; sub_title: string | null; body: string }
        >();
        (translations || []).forEach((t) => {
          if (!translationMap.has(t.article_id)) {
            translationMap.set(t.article_id, {
              title: t.title,
              sub_title: t.sub_title,
              body: t.body,
            });
          }
        });

        for (const article of articles) {
          const trans = translationMap.get(article.id);
          items.push({
            id: article.id,
            type: "article",
            title: trans?.title || "",
            body: trans?.body || "",
            preview: trans?.sub_title || stripToPreview(trans?.body || ""),
            tags: tagsByArticle.get(article.id) || [],
            createdAt: article.created_at,
            editUrl: `/article/create?id=${article.id}`,
            status: article.status,
          });
        }
      }
    }

    // ── Discussions (user's own) ──
    if (type === "all" || type === "questions") {
      const { data: discussions } = await supabase
        .from("discussions")
        .select("id, title, body, created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (discussions?.length) {
        const discIds = discussions.map((d) => d.id);

        const { data: tagLinks } = await supabase
          .from("discussion_tags")
          .select("discussion_id, tag_id")
          .in("discussion_id", discIds);

        const tagIds = (tagLinks || [])
          .map((t) => String(t.tag_id))
          .filter(Boolean);

        let tagsById = new Map<string, string>();
        if (tagIds.length) {
          const { data: tagRows } = await supabase
            .from("tags")
            .select("id, name")
            .in("id", tagIds);
          (tagRows || []).forEach((t) => {
            if (t.id && t.name) tagsById.set(String(t.id), t.name);
          });
        }

        const tagsByDiscussion = new Map<string, string[]>();
        (tagLinks || []).forEach((link) => {
          const tagName = tagsById.get(String(link.tag_id));
          if (!tagName) return;
          const arr = tagsByDiscussion.get(link.discussion_id) || [];
          arr.push(tagName);
          tagsByDiscussion.set(link.discussion_id, arr);
        });

        for (const disc of discussions) {
          items.push({
            id: disc.id,
            type: "question",
            title: disc.title || "",
            body: disc.body || "",
            preview: stripToPreview(disc.body || ""),
            tags: tagsByDiscussion.get(disc.id) || [],
            createdAt: disc.created_at,
            editUrl: `/discussions?id=${disc.id}`,
          });
        }
      }
    }

    // ── Flashcard Decks (show decks, not individual cards) ──
    if (type === "all" || type === "flashcards") {
      const { data: decks } = await supabase
        .from("decks")
        .select("id, name, slug, description, is_public, cloned_from_deck_id, created_at, updated_at")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false });

      if (decks?.length) {
        // Fetch card counts per deck
        const deckIds = decks.map((d) => d.id);
        const { data: cardCounts } = await supabase
          .from("flashcards")
          .select("deck_id")
          .in("deck_id", deckIds);

        const countMap = new Map<number, number>();
        (cardCounts || []).forEach((c) => {
          countMap.set(c.deck_id, (countMap.get(c.deck_id) ?? 0) + 1);
        });

        // Fetch first 3 card fronts per deck for preview
        const { data: previewCards } = await supabase
          .from("flashcards")
          .select("deck_id, front, back")
          .in("deck_id", deckIds)
          .order("created_at", { ascending: true });

        const previewMap = new Map<number, Array<{ front: string; back: string }>>();
        (previewCards || []).forEach((c) => {
          const arr = previewMap.get(c.deck_id) ?? [];
          if (arr.length < 3) {
            arr.push({ front: c.front, back: c.back });
            previewMap.set(c.deck_id, arr);
          }
        });

        for (const deck of decks) {
          const cardCount = countMap.get(deck.id) ?? 0;
          const previews = previewMap.get(deck.id) ?? [];
          const previewText = previews.map((p) => p.front).join(" · ") || deck.description || "";

          items.push({
            id: `deck-${deck.id}`,
            type: "deck",
            title: deck.name,
            body: deck.description || "",
            preview: previewText.slice(0, 200),
            tags: [],
            createdAt: deck.updated_at,
            editUrl: `/flashcards/${encodeURIComponent(deck.slug)}`,
            status: deck.is_public ? "public" : "private",
            cardCount,
            deckSlug: deck.slug,
            cardPreviews: previews,
          });
        }
      }
    }

    // Sort all items by creation date (newest first)
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("Error fetching library items", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, type } = (await req.json()) as { id: string; type: string };
    if (!id || !type) {
      return NextResponse.json(
        { error: "Missing id or type" },
        { status: 400 },
      );
    }

    if (type === "article") {
      const { data: article } = await supabase
        .from("articles")
        .select("id, author_id")
        .eq("id", id)
        .single();

      if (!article || article.author_id !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await supabase.from("article_tags").delete().eq("article_id", id);
      await supabase.from("article_translations").delete().eq("article_id", id);
      await supabase.from("articles").delete().eq("id", id);
    } else if (type === "question") {
      const { data: disc } = await supabase
        .from("discussions")
        .select("id, author_id")
        .eq("id", id)
        .single();

      if (!disc || disc.author_id !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await supabase.from("discussion_tags").delete().eq("discussion_id", id);
      await supabase.from("discussions").delete().eq("id", id);
    } else if (type === "deck") {
      // id is in format "deck-{numericId}"
      const deckId = Number(id.replace("deck-", ""));
      if (!Number.isFinite(deckId)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }

      const { data: deck } = await supabase
        .from("decks")
        .select("id, owner_id")
        .eq("id", deckId)
        .single();

      if (!deck || deck.owner_id !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // Cards cascade via FK ON DELETE CASCADE
      await supabase.from("decks").delete().eq("id", deckId);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting library item", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── Types ──

interface LibraryItem {
  id: string;
  type: "article" | "question" | "project" | "deck";
  title: string;
  body: string;
  preview: string;
  tags: string[];
  createdAt: string;
  editUrl: string;
  status?: string;
  // deck-specific
  cardCount?: number;
  deckSlug?: string;
  cardPreviews?: Array<{ front: string; back: string }>;
}

function stripToPreview(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[>*#_\-\[\]\(\)!]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}
