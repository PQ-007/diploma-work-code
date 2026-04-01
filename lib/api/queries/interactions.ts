import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Interface for interaction counts
 */
export interface InteractionCounts {
  likes: number;
  comments: number;
  bookmarks: number;
}

/**
 * Fetches interaction counts (likes, comments, bookmarks) for multiple content items.
 * Supports articles, discussions, and projects by mapping to the appropriate tables.
 *
 * Eliminates duplicate counting logic across API routes.
 *
 * @param supabase - Supabase client instance
 * @param contentIds - Array of content IDs to fetch interactions for
 * @param contentType - Type of content ('article', 'discussion', or 'project')
 * @returns Map of contentId -> interaction counts
 *
 * @example
 * const interactions = await fetchInteractionCounts(supabase, articleIds, 'article');
 * const stats = interactions.get(articleId); // { likes: 42, comments: 10, bookmarks: 5 }
 */
export async function fetchInteractionCounts(
  supabase: SupabaseClient,
  contentIds: string[],
  contentType: "article" | "discussion" | "project",
): Promise<Map<string, InteractionCounts>> {
  if (!contentIds.length) return new Map();

  // Map content types to their respective database tables
  const tableMappings = {
    article: {
      reactions: "article_reactions",
      comments: "article_comments",
      bookmarks: "bookmarked_articles",
      idField: "article_id",
    },
    discussion: {
      reactions: "discussion_votes",
      comments: "discussion_comments",
      bookmarks: "bookmarked_discussions",
      idField: "discussion_id",
    },
    project: {
      reactions: "project_likes",
      comments: "project_comments",
      bookmarks: "bookmarked_projects",
      idField: "project_id",
    },
  };

  const tables = tableMappings[contentType];

  // Fetch all interaction types in parallel
  const [reactionsData, commentsData, bookmarksData] = await Promise.all([
    supabase
      .from(tables.reactions)
      .select(tables.idField)
      .in(tables.idField, contentIds),
    supabase
      .from(tables.comments)
      .select(tables.idField)
      .in(tables.idField, contentIds),
    supabase
      .from(tables.bookmarks)
      .select(tables.idField)
      .in(tables.idField, contentIds),
  ]);

  // Initialize counts map with zeros for all content IDs
  const counts = new Map<string, InteractionCounts>();
  contentIds.forEach((id) => {
    counts.set(id, { likes: 0, comments: 0, bookmarks: 0 });
  });

  // Count reactions/likes
  (reactionsData.data || []).forEach((r: any) => {
    const id = r[tables.idField] as string;
    const current = counts.get(id);
    if (current) current.likes++;
  });

  // Count comments
  (commentsData.data || []).forEach((c: any) => {
    const id = c[tables.idField] as string;
    const current = counts.get(id);
    if (current) current.comments++;
  });

  // Count bookmarks
  (bookmarksData.data || []).forEach((b: any) => {
    const id = b[tables.idField] as string;
    const current = counts.get(id);
    if (current) current.bookmarks++;
  });

  return counts;
}

/**
 * Fetches user's interaction state (liked, bookmarked, voted) for multiple content items.
 *
 * @param supabase - Supabase client instance
 * @param userId - The user's ID
 * @param contentIds - Array of content IDs to check
 * @param contentType - Type of content ('article', 'discussion', or 'project')
 * @returns Map of contentId -> user interaction state
 *
 * @example
 * const userInteractions = await fetchUserInteractions(supabase, userId, articleIds, 'article');
 * const state = userInteractions.get(articleId); // { isLiked: true, isBookmarked: false, userVote: null }
 */
export async function fetchUserInteractions(
  supabase: SupabaseClient,
  userId: string,
  contentIds: string[],
  contentType: "article" | "discussion" | "project",
): Promise<
  Map<
    string,
    { isLiked: boolean; isBookmarked: boolean; userVote?: "up" | "down" | null }
  >
> {
  if (!contentIds.length || !userId) return new Map();

  const tableMappings = {
    article: {
      reactions: "article_reactions",
      bookmarks: "bookmarked_articles",
      idField: "article_id",
    },
    discussion: {
      reactions: "discussion_votes",
      bookmarks: "bookmarked_discussions",
      idField: "discussion_id",
    },
    project: {
      reactions: "project_likes",
      bookmarks: "bookmarked_projects",
      idField: "project_id",
    },
  };

  const tables = tableMappings[contentType];

  const [likesData, bookmarksData] = await Promise.all([
    supabase
      .from(tables.reactions)
      .select(`${tables.idField}, vote_type`)
      .eq("user_id", userId)
      .in(tables.idField, contentIds),
    supabase
      .from(tables.bookmarks)
      .select(tables.idField)
      .eq("user_id", userId)
      .in(tables.idField, contentIds),
  ]);

  const interactions = new Map<
    string,
    { isLiked: boolean; isBookmarked: boolean; userVote?: "up" | "down" | null }
  >();

  // Initialize all with false
  contentIds.forEach((id) => {
    interactions.set(id, {
      isLiked: false,
      isBookmarked: false,
      userVote: null,
    });
  });

  // Mark liked items
  (likesData.data || []).forEach((item: any) => {
    const id = item[tables.idField] as string;
    const current = interactions.get(id);
    if (current) {
      current.isLiked = true;
      // For discussions, also set vote direction
      if (contentType === "discussion" && item.vote_type) {
        current.userVote = item.vote_type as "up" | "down";
      }
    }
  });

  // Mark bookmarked items
  (bookmarksData.data || []).forEach((item: any) => {
    const id = item[tables.idField] as string;
    const current = interactions.get(id);
    if (current) current.isBookmarked = true;
  });

  return interactions;
}
