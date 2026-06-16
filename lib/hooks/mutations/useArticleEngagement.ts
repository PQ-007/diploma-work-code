"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useContentBookmark,
  useContentLike,
} from "@/lib/hooks/mutations/useContentInteractions";

interface UseArticleEngagementOptions {
  articleId: number | null;
}

/**
 * Article-detail like/bookmark engagement.
 *
 * Network calls are routed through the shared `useContentLike` /
 * `useContentBookmark` mutations (single source of truth for the reaction &
 * bookmark endpoints). This hook adds the initial-state fetch and local
 * optimistic display state the article detail page needs because that page is
 * not yet on React Query.
 *
 * Replaces the former `hooks/useArticleInteractions.ts` (which duplicated the
 * reaction/bookmark fetch logic).
 */
export function useArticleEngagement({
  articleId,
}: UseArticleEngagementOptions) {
  const { user } = useAuth();
  const contentId = articleId != null ? String(articleId) : "";

  const likeMutation = useContentLike(contentId, "article");
  const bookmarkMutation = useContentBookmark(contentId, "article");

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Load current like/bookmark state on mount.
  useEffect(() => {
    if (articleId == null) return;
    let active = true;

    (async () => {
      try {
        const res = await fetch(
          `/api/articles/reactions?articleId=${articleId}`,
        );
        if (res.ok && active) {
          const data = await res.json();
          setLikesCount(data.likesCount || 0);
          setIsLiked(data.userReaction === "like");
        }
      } catch {
        // ignore
      }

      try {
        const res = await fetch(
          `/api/articles/bookmarks?articleId=${articleId}`,
        );
        if (res.ok && active) {
          const data = await res.json();
          setIsBookmarked(Boolean(data.bookmarked));
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      active = false;
    };
  }, [articleId]);

  const toggleLike = useCallback(() => {
    if (articleId == null || !user || likeMutation.isPending) return;
    const wasLiked = isLiked;
    // Optimistic update; revert on failure.
    setIsLiked(!wasLiked);
    setLikesCount((c) => (wasLiked ? c - 1 : c + 1));
    likeMutation.mutate(undefined, {
      onError: () => {
        setIsLiked(wasLiked);
        setLikesCount((c) => (wasLiked ? c + 1 : c - 1));
      },
    });
  }, [articleId, user, isLiked, likeMutation]);

  const toggleBookmark = useCallback(() => {
    if (articleId == null || !user || bookmarkMutation.isPending) return;
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);
    bookmarkMutation.mutate(undefined, {
      onError: () => setIsBookmarked(wasBookmarked),
    });
  }, [articleId, user, isBookmarked, bookmarkMutation]);

  return { isLiked, likesCount, toggleLike, isBookmarked, toggleBookmark };
}
