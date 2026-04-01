import { useQuery } from "@tanstack/react-query";
import { ContentItem, ArticleContent } from "@/lib/types/content";
import { Author } from "@/lib/types/author";

/**
 * API response type from /api/articles
 */
interface ArticleAPIResponse {
  article_id: string;
  title: string;
  sub_title: string | null;
  body: string;
  language_code: string;
  published_at: string | null;
  created_at: string | null;
  edited_at: string | null;
  views: number;
  reactions: number;
  comments: number;
  bookmarks: number;
  author_id: string | null;
  author: {
    user_name: string;
    display_name: string;
    avatar_url: string | null;
    ranking_point: number | null;
  } | null;
  tags: string[];
}

/**
 * Transforms API response to ContentItem<ArticleContent>
 */
function transformArticle(
  apiData: ArticleAPIResponse,
): ContentItem<ArticleContent> {
  // Transform author data if present
  const author: Author = apiData.author
    ? {
        id: apiData.author_id || "",
        username: apiData.author.user_name || "user",
        displayName:
          apiData.author.display_name ||
          apiData.author.user_name ||
          "Anonymous",
        avatarUrl: apiData.author.avatar_url,
        rankingPoint: apiData.author.ranking_point ?? 0,
      }
    : {
        id: "",
        username: "user",
        displayName: "Anonymous",
        avatarUrl: null,
        rankingPoint: 0,
      };

  return {
    content: {
      id: apiData.article_id,
      type: "article",
      title: apiData.title,
      description: apiData.sub_title,
      author,
      createdAt: apiData.created_at || new Date().toISOString(),
      tags: apiData.tags,
      subtitle: apiData.sub_title,
      publishedAt: apiData.published_at,
      languageCode: apiData.language_code,
    },
    stats: {
      views: apiData.views,
      likes: apiData.reactions,
      comments: apiData.comments,
      bookmarks: apiData.bookmarks,
    },
    interactions: {
      isLiked: false, // Will be fetched separately if user is logged in
      isBookmarked: false,
    },
  };
}

/**
 * Fetch articles with optional status filter.
 * Uses React Query for automatic caching and background refetching.
 *
 * @param status - Article status filter ('published' or 'draft')
 * @returns Query result with articles data
 *
 * @example
 * const { data: articles, isLoading, error } = useArticles('published');
 */
export function useArticles(status: string = "published") {
  return useQuery({
    queryKey: ["articles", status],
    queryFn: async () => {
      const res = await fetch(`/api/articles?status=${status}`);
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data = await res.json();
      return (data.items as ArticleAPIResponse[]).map(transformArticle);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single article by ID.
 *
 * @param articleId - The article ID
 * @param enabled - Whether the query should run (useful for conditional fetching)
 * @returns Query result with article data
 *
 * @example
 * const { data: article, isLoading } = useArticle(articleId);
 */
export function useArticle(articleId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ["article", articleId],
    queryFn: async () => {
      if (!articleId) throw new Error("Article ID is required");
      const res = await fetch(`/api/articles/${articleId}`);
      if (!res.ok) throw new Error("Failed to fetch article");
      return res.json();
    },
    enabled: enabled && !!articleId,
    staleTime: 1000 * 60 * 10, // 10 minutes - individual articles change less frequently
  });
}
