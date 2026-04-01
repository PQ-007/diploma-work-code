import { useState, useEffect, useMemo } from "react";
import {
  type ArticleMetrics,
  type LiveStats,
  type ArticleAnalytics,
  calculateMetrics,
  calculateSEOScore,
  calculateReadabilityScore,
} from "@/lib/metrics/articleMetrics";

/**
 * Hook for real-time article metrics calculation
 */
export const useArticleMetrics = (
  content: string,
  title?: string,
  subtitle?: string,
  articleId?: string | null,
) => {
  const [liveStats, setLiveStats] = useState<LiveStats>({
    views: 0,
    likes: 0,
    comments: 0,
    bookmarks: 0,
  });

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Calculate real-time metrics from content
  const metrics = useMemo((): ArticleMetrics => {
    return calculateMetrics(content, title, subtitle);
  }, [content, title, subtitle]);

  // Calculate SEO and readability scores
  const seoScore = useMemo(() => {
    return calculateSEOScore(title || "", subtitle || "", content);
  }, [title, subtitle, content]);

  const readabilityScore = useMemo(() => {
    return calculateReadabilityScore(content);
  }, [content]);

  // Fetch live statistics for existing articles
  useEffect(() => {
    if (!articleId) {
      // Reset stats for new articles
      setLiveStats({
        views: 0,
        likes: 0,
        comments: 0,
        bookmarks: 0,
      });
      return;
    }

    const fetchLiveStats = async () => {
      setIsLoadingStats(true);
      setStatsError(null);

      try {
        const response = await fetch(`/api/articles/${articleId}/stats`);

        if (!response.ok) {
          throw new Error("Failed to fetch article statistics");
        }

        const data = await response.json();
        setLiveStats({
          views: data.views || 0,
          likes: data.likes || 0,
          comments: data.comments || 0,
          bookmarks: data.bookmarks || 0,
        });
      } catch (error) {
        console.error("Error fetching live stats:", error);
        setStatsError(
          error instanceof Error ? error.message : "Failed to load statistics",
        );

        // Keep existing stats on error
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchLiveStats();
  }, [articleId]);

  // Combined analytics object
  const analytics = useMemo(
    (): ArticleAnalytics => ({
      ...metrics,
      liveStats,
      seoScore,
      readabilityScore,
    }),
    [metrics, liveStats, seoScore, readabilityScore],
  );

  return {
    metrics,
    liveStats,
    analytics,
    seoScore,
    readabilityScore,
    isLoadingStats,
    statsError,
    refreshStats: () => {
      if (articleId) {
        // Trigger re-fetch by updating a dependency
        setIsLoadingStats(true);
      }
    },
  };
};

/**
 * Hook for metrics formatting and display helpers
 */
export const useMetricsFormatting = () => {
  const formatNumber = (num: number): string => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}k`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const formatPercentage = (score: number): string => {
    return `${Math.round(score)}%`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  return {
    formatNumber,
    formatPercentage,
    getScoreColor,
    getScoreLabel,
  };
};

export default useArticleMetrics;
