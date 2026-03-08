import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // ─── 1. Profile row ───
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, user_name, display_name, avatar_url, bio, email, role, ranking_point, created_at",
      )
      .eq("user_name", slug)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const userId = profile.id;

    // ─── 2. Articles by this user ───
    const { data: articles } = await supabase
      .from("articles")
      .select("id, status, created_at, edited_at")
      .eq("author_id", userId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    const articleIds = (articles || []).map((a) => a.id);

    // ─── 3. Article translations (titles, views) ───
    let articleTranslations: {
      article_id: string;
      title: string;
      sub_title: string | null;
      language_code: string;
      published_at: string | null;
      views: number | null;
    }[] = [];

    if (articleIds.length) {
      const { data } = await supabase
        .from("article_translations")
        .select(
          "article_id, title, sub_title, language_code, published_at, views",
        )
        .in("article_id", articleIds);
      articleTranslations = data || [];
    }

    // ─── 4. Article tags ───
    let articleTagsMap: Record<string, string[]> = {};
    if (articleIds.length) {
      const { data: tagLinks } = await supabase
        .from("article_tags")
        .select("article_id, tag_id")
        .in("article_id", articleIds);

      const tagIds = [
        ...new Set((tagLinks || []).map((t) => String(t.tag_id))),
      ];

      if (tagIds.length) {
        const { data: tagRows } = await supabase
          .from("tags")
          .select("id, name")
          .in("id", tagIds);

        const tagNameById = new Map<string, string>();
        (tagRows || []).forEach((t) => tagNameById.set(String(t.id), t.name));

        (tagLinks || []).forEach((link) => {
          const name = tagNameById.get(String(link.tag_id));
          if (!name) return;
          if (!articleTagsMap[link.article_id])
            articleTagsMap[link.article_id] = [];
          articleTagsMap[link.article_id].push(name);
        });
      }
    }

    // Build articles array with latest translation per article
    const latestTranslation = new Map<
      string,
      (typeof articleTranslations)[0]
    >();
    articleTranslations.forEach((t) => {
      if (!latestTranslation.has(t.article_id)) {
        latestTranslation.set(t.article_id, t);
      }
    });

    const userArticles = (articles || [])
      .filter((a) => latestTranslation.has(a.id))
      .map((a) => {
        const t = latestTranslation.get(a.id)!;
        return {
          id: a.id,
          title: t.title,
          sub_title: t.sub_title,
          language_code: t.language_code,
          published_at: t.published_at,
          views: t.views ?? 0,
          tags: articleTagsMap[a.id] || [],
        };
      });

    // ─── 5. Reactions count (total reactions received on user's articles) ───
    let totalReactions = 0;
    if (articleIds.length) {
      const { count } = await supabase
        .from("article_reactions")
        .select("*", { count: "exact", head: true })
        .in("article_id", articleIds);
      totalReactions = count ?? 0;
    }

    // ─── 6. Comments count (total comments on user's articles) ───
    let totalComments = 0;
    if (articleIds.length) {
      const { count } = await supabase
        .from("article_comments")
        .select("*", { count: "exact", head: true })
        .in("article_id", articleIds);
      totalComments = count ?? 0;
    }

    // ─── 7. Bookmarked count (how many times user's articles were bookmarked) ───
    let totalBookmarks = 0;
    if (articleIds.length) {
      const { count } = await supabase
        .from("bookmarked_articles")
        .select("*", { count: "exact", head: true })
        .in("article_id", articleIds);
      totalBookmarks = count ?? 0;
    }

    // ─── 8. Total views across all articles ───
    const totalViews = articleTranslations.reduce(
      (sum, t) => sum + (t.views ?? 0),
      0,
    );

    // ─── 9. Followers / Following ───
    const { count: followersCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    const { count: followingCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    // ─── 10. Recent activity (last comments by user) ───
    const { data: recentComments } = await supabase
      .from("article_comments")
      .select("id, article_id, body, created_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch titles for recent commented articles
    const commentArticleIds = [
      ...new Set((recentComments || []).map((c) => c.article_id)),
    ];
    let commentArticleTitles: Record<string, string> = {};
    if (commentArticleIds.length) {
      const { data: commentTranslations } = await supabase
        .from("article_translations")
        .select("article_id, title")
        .in("article_id", commentArticleIds);
      const seen = new Set<string>();
      (commentTranslations || []).forEach((t) => {
        if (!seen.has(t.article_id)) {
          commentArticleTitles[t.article_id] = t.title;
          seen.add(t.article_id);
        }
      });
    }

    const recentActivity = (recentComments || []).map((c) => ({
      type: "comment" as const,
      articleTitle: commentArticleTitles[c.article_id] || "an article",
      body: c.body?.slice(0, 80) || "",
      created_at: c.created_at,
    }));

    // ─── 11. Check if current user follows this profile ───
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let isFollowing = false;
    if (currentUser && currentUser.id !== userId) {
      const { data: followRow } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", userId)
        .maybeSingle();
      isFollowing = !!followRow;
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        user_name: profile.user_name,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        email: profile.email,
        role: profile.role,
        ranking_point: profile.ranking_point ?? 0,
        created_at: profile.created_at,
      },
      stats: {
        articles: userArticles.length,
        totalViews,
        totalReactions,
        totalComments,
        totalBookmarks,
        rankingPoint: profile.ranking_point ?? 0,
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
      },
      articles: userArticles,
      recentActivity,
      isFollowing,
      isOwner: currentUser?.id === userId,
    });
  } catch (err) {
    console.error("Profile API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
