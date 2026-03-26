import { useQuery } from "@tanstack/react-query";
import { ContentItem, DiscussionContent } from "@/lib/types/content";
import { Author } from "@/lib/types/author";

/**
 * API response type from /api/discussions
 */
interface DiscussionAPIResponse {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  answered: boolean;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    user_name: string;
    avatar_url: string;
    ranking_point: number;
  };
  tags: string[];
  votes: number;
  userVote: "up" | "down" | null;
  commentCount: number;
  bookmarked: boolean;
}

/**
 * Transforms API response to ContentItem<DiscussionContent>
 */
function transformDiscussion(
  apiData: DiscussionAPIResponse,
): ContentItem<DiscussionContent> {
  const author: Author = {
    id: apiData.author.id,
    username: apiData.author.user_name,
    displayName: apiData.author.display_name,
    avatarUrl: apiData.author.avatar_url,
    rankingPoint: apiData.author.ranking_point,
  };

  return {
    content: {
      id: apiData.id,
      type: "discussion",
      title: apiData.title,
      description: apiData.body.substring(0, 200), // First 200 chars as description
      author,
      createdAt: apiData.created_at,
      tags: apiData.tags,
      body: apiData.body,
      pinned: apiData.pinned,
      answered: apiData.answered,
    },
    stats: {
      views: 0, // Discussions don't track views in current schema
      likes: apiData.votes,
      comments: apiData.commentCount,
    },
    interactions: {
      isLiked: apiData.userVote !== null,
      isBookmarked: apiData.bookmarked,
      userVote: apiData.userVote,
    },
  };
}

/**
 * Fetch all discussions.
 * Uses React Query for automatic caching and background refetching.
 *
 * @returns Query result with discussions data
 *
 * @example
 * const { data: discussions, isLoading, error } = useDiscussions();
 */
export function useDiscussions() {
  return useQuery({
    queryKey: ["discussions"],
    queryFn: async () => {
      const res = await fetch("/api/discussions");
      if (!res.ok) throw new Error("Failed to fetch discussions");
      const data = await res.json();
      return (data.items as DiscussionAPIResponse[]).map(transformDiscussion);
    },
    staleTime: 1000 * 60 * 3, // 3 minutes - discussions update more frequently
  });
}

/**
 * Fetch a single discussion by ID.
 *
 * @param discussionId - The discussion ID
 * @param enabled - Whether the query should run
 * @returns Query result with discussion data
 *
 * @example
 * const { data: discussion, isLoading } = useDiscussion(discussionId);
 */
export function useDiscussion(
  discussionId: string | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["discussion", discussionId],
    queryFn: async () => {
      if (!discussionId) throw new Error("Discussion ID is required");
      const res = await fetch(`/api/discussions/${discussionId}`);
      if (!res.ok) throw new Error("Failed to fetch discussion");
      return res.json();
    },
    enabled: enabled && !!discussionId,
    staleTime: 1000 * 60 * 5,
  });
}
