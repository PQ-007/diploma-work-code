"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface UseArticleInteractionsOptions {
  articleId: number | null;
}

export function useArticleInteractions({
  articleId,
}: UseArticleInteractionsOptions) {
  const { user } = useAuth();

  // Reactions
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [reactLoading, setReactLoading] = useState(false);

  // Bookmarks
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Fetch initial state
  useEffect(() => {
    if (!articleId) return;

    const fetchReactions = async () => {
      try {
        const res = await fetch(
          `/api/articles/reactions?articleId=${articleId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setLikesCount(data.likesCount || 0);
          setIsLiked(data.userReaction === "like");
        }
      } catch {
        // ignore
      }
    };

    const fetchBookmark = async () => {
      try {
        const res = await fetch(
          `/api/articles/bookmarks?articleId=${articleId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setIsBookmarked(data.bookmarked);
        }
      } catch {
        // ignore
      }
    };

    fetchReactions();
    fetchBookmark();
  }, [articleId]);

  const toggleLike = useCallback(async () => {
    if (!articleId || !user || reactLoading) return;
    setReactLoading(true);

    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount((c) => (wasLiked ? c - 1 : c + 1));

    try {
      const res = await fetch("/api/articles/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, reaction: "like" }),
      });

      if (!res.ok) {
        // Revert on failure
        setIsLiked(wasLiked);
        setLikesCount((c) => (wasLiked ? c + 1 : c - 1));
      }
    } catch {
      setIsLiked(wasLiked);
      setLikesCount((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      setReactLoading(false);
    }
  }, [articleId, user, isLiked, reactLoading]);

  const toggleBookmark = useCallback(async () => {
    if (!articleId || !user || bookmarkLoading) return;
    setBookmarkLoading(true);

    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);

    try {
      const res = await fetch("/api/articles/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });

      if (!res.ok) {
        setIsBookmarked(wasBookmarked);
      }
    } catch {
      setIsBookmarked(wasBookmarked);
    } finally {
      setBookmarkLoading(false);
    }
  }, [articleId, user, isBookmarked, bookmarkLoading]);

  return {
    isLiked,
    likesCount,
    toggleLike,
    isBookmarked,
    toggleBookmark,
  };
}
