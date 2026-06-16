import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ContentType, ContentItem } from "@/lib/types/content";

const applyDiscussionVote = (
  likes: number,
  currentVote: "up" | "down" | null | undefined,
  nextVote: "up" | "down",
) => {
  const normalizedCurrent = currentVote || null;
  const previousDelta =
    normalizedCurrent === "up" ? 1 : normalizedCurrent === "down" ? -1 : 0;
  const willToggleOff = normalizedCurrent === nextVote;
  const nextUserVote = willToggleOff ? null : nextVote;
  const nextDelta =
    nextUserVote === "up" ? 1 : nextUserVote === "down" ? -1 : 0;

  return {
    likes: likes - previousDelta + nextDelta,
    userVote: nextUserVote,
  };
};

const applyBookmarkToggle = (isBookmarked: boolean | undefined) =>
  !Boolean(isBookmarked);

/**
 * Hook for liking/unliking content (articles, discussions, projects).
 * Automatically invalidates relevant queries to trigger refetch.
 *
 * @param contentId - ID of the content to like
 * @param contentType - Type of content ('article', 'discussion', or 'project')
 * @returns Mutation object with mutate function
 *
 * @example
 * const likeMutation = useContentLike(articleId, 'article');
 * likeMutation.mutate(); // Toggle like
 */
export function useContentLike(contentId: string, contentType: ContentType) {
  const queryClient = useQueryClient();

  // Map content types to their API endpoints
  const endpoints = {
    article: "/api/articles/reactions",
    discussion: "/api/discussions/vote",
    project: "/api/projects/like",
  };

  return useMutation({
    mutationFn: async () => {
      const endpoint = endpoints[contentType];
      const body =
        contentType === "article"
          ? { articleId: contentId, reaction: "like" }
          : contentType === "discussion"
            ? { discussionId: contentId, direction: "up" }
            : { projectId: contentId };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to toggle like");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: [contentType + "s"] });
      queryClient.invalidateQueries({ queryKey: [contentType, contentId] });
    },
  });
}

/**
 * Hook for bookmarking/unbookmarking content.
 * Automatically invalidates relevant queries to trigger refetch.
 *
 * @param contentId - ID of the content to bookmark
 * @param contentType - Type of content
 * @returns Mutation object with mutate function
 *
 * @example
 * const bookmarkMutation = useContentBookmark(articleId, 'article');
 * bookmarkMutation.mutate(); // Toggle bookmark
 */
export function useContentBookmark(
  contentId: string,
  contentType: ContentType,
) {
  const queryClient = useQueryClient();

  const endpoints = {
    article: "/api/articles/bookmarks",
    discussion: "/api/discussions/bookmark",
    project: "/api/projects/bookmark",
  };

  return useMutation({
    mutationFn: async () => {
      const endpoint = endpoints[contentType];
      const body =
        contentType === "article"
          ? { articleId: contentId }
          : contentType === "discussion"
            ? { discussionId: contentId }
            : { projectId: contentId };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to toggle bookmark");
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [contentType + "s"] });
      await queryClient.cancelQueries({ queryKey: [contentType, contentId] });

      const previousLists = queryClient.getQueriesData<any>({
        queryKey: [contentType + "s"],
      });
      const previousDetail = queryClient.getQueryData<any>([
        contentType,
        contentId,
      ]);

      previousLists.forEach(([key, data]) => {
        if (!Array.isArray(data)) return;

        queryClient.setQueryData(
          key,
          data.map((entry: ContentItem) => {
            if (entry?.content?.id !== contentId) return entry;
            return {
              ...entry,
              interactions: {
                ...entry.interactions,
                isBookmarked: applyBookmarkToggle(
                  entry?.interactions?.isBookmarked,
                ),
              },
            };
          }),
        );
      });

      if (previousDetail) {
        if (previousDetail?.interactions) {
          queryClient.setQueryData([contentType, contentId], {
            ...previousDetail,
            interactions: {
              ...previousDetail.interactions,
              isBookmarked: applyBookmarkToggle(
                previousDetail.interactions?.isBookmarked,
              ),
            },
          });
        } else if (previousDetail?.discussion) {
          queryClient.setQueryData([contentType, contentId], {
            ...previousDetail,
            discussion: {
              ...previousDetail.discussion,
              bookmarked: applyBookmarkToggle(
                previousDetail.discussion?.bookmarked,
              ),
            },
          });
        }
      }

      return { previousLists, previousDetail };
    },
    onError: (_error, _variables, context) => {
      context?.previousLists?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });

      if (context?.previousDetail) {
        queryClient.setQueryData(
          [contentType, contentId],
          context.previousDetail,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [contentType + "s"] });
      queryClient.invalidateQueries({ queryKey: [contentType, contentId] });
    },
  });
}

/**
 * Hook for voting on discussions (upvote/downvote).
 * Only applicable to discussions.
 *
 * @param discussionId - ID of the discussion to vote on
 * @returns Mutation object with mutate function that accepts vote direction
 *
 * @example
 * const voteMutation = useDiscussionVote(discussionId);
 * voteMutation.mutate('up'); // Upvote
 * voteMutation.mutate('down'); // Downvote
 */
export function useDiscussionVote(discussionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vote: "up" | "down") => {
      const res = await fetch("/api/discussions/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discussionId, vote }),
      });

      if (!res.ok) throw new Error("Failed to vote");
      return res.json();
    },
    onMutate: async (vote) => {
      await queryClient.cancelQueries({ queryKey: ["discussions"] });
      await queryClient.cancelQueries({
        queryKey: ["discussion", discussionId],
      });

      const previousDiscussionLists = queryClient.getQueriesData<any>({
        queryKey: ["discussions"],
      });
      const previousDiscussionDetail = queryClient.getQueryData<any>([
        "discussion",
        discussionId,
      ]);

      previousDiscussionLists.forEach(([key, data]) => {
        if (!Array.isArray(data)) return;

        queryClient.setQueryData(
          key,
          data.map((entry: ContentItem) => {
            if (entry?.content?.id !== discussionId) return entry;
            const next = applyDiscussionVote(
              Number(entry?.stats?.likes || 0),
              entry?.interactions?.userVote,
              vote,
            );

            return {
              ...entry,
              stats: {
                ...entry.stats,
                likes: next.likes,
              },
              interactions: {
                ...entry.interactions,
                userVote: next.userVote,
                isLiked: next.userVote !== null,
              },
            };
          }),
        );
      });

      if (previousDiscussionDetail?.discussion) {
        const next = applyDiscussionVote(
          Number(previousDiscussionDetail.discussion?.votes || 0),
          previousDiscussionDetail.discussion?.userVote,
          vote,
        );

        queryClient.setQueryData(["discussion", discussionId], {
          ...previousDiscussionDetail,
          discussion: {
            ...previousDiscussionDetail.discussion,
            votes: next.likes,
            userVote: next.userVote,
          },
        });
      }

      return { previousDiscussionLists, previousDiscussionDetail };
    },
    onError: (_error, _vote, context) => {
      context?.previousDiscussionLists?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });

      if (context?.previousDiscussionDetail) {
        queryClient.setQueryData(
          ["discussion", discussionId],
          context.previousDiscussionDetail,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
      queryClient.invalidateQueries({ queryKey: ["discussion", discussionId] });
    },
  });
}

/**
 * Combined hook for all content interactions.
 * Provides like, bookmark, and vote mutations in a single hook.
 *
 * @param contentId - ID of the content
 * @param contentType - Type of content
 * @returns Object containing all interaction mutations
 *
 * @example
 * const { like, bookmark, vote } = useContentInteractions(id, 'discussion');
 * like.mutate();         // Toggle like
 * bookmark.mutate();     // Toggle bookmark
 * vote.mutate('up');     // Upvote (discussions only)
 */
export function useContentInteractions(
  contentId: string,
  contentType: ContentType,
) {
  const like = useContentLike(contentId, contentType);
  const bookmark = useContentBookmark(contentId, contentType);
  const vote =
    contentType === "discussion"
      ? useDiscussionVote(contentId)
      : { mutate: () => {}, isPending: false, error: null };

  return {
    like,
    bookmark,
    vote,
  };
}
