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

    const items: LibraryItem[] = [];

    // ── Articles (drafts) ──
    if (type === "all" || type === "articles") {
      const { data: articles } = await supabase
        .from("articles")
        .select("id, author_id, status, created_at")
        .eq("author_id", user.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false });

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
      // Verify ownership
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
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting library item", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── Helpers ──

interface LibraryItem {
  id: string;
  type: "article" | "question" | "project" | "flashcard";
  title: string;
  body: string;
  preview: string;
  tags: string[];
  createdAt: string;
  editUrl: string;
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
