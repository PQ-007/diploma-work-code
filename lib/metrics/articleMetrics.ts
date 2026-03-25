/**
 * Real-time article metrics calculation utilities
 */

export interface ArticleMetrics {
  wordCount: number;
  readingTime: number;
  characterCount: number;
  estimatedEngagement: number;
}

export interface LiveStats {
  views: number;
  likes: number;
  comments: number;
  bookmarks: number;
}

export interface ArticleAnalytics extends ArticleMetrics {
  liveStats: LiveStats;
  seoScore: number;
  readabilityScore: number;
}

/**
 * Calculate word count from MDX content, excluding code blocks and components
 */
export const calculateWordCount = (mdx: string): number => {
  if (!mdx || typeof mdx !== "string") return 0;

  // Remove MDX components and focus on readable content
  const cleanContent = mdx
    // Remove JSX/HTML tags
    .replace(/<[^>]*>/g, " ")
    // Remove code blocks (triple backticks)
    .replace(/```[\s\S]*?```/g, " ")
    // Remove inline code (single backticks)
    .replace(/`[^`]*`/g, " ")
    // Remove images
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    // Remove links (keep text, remove URL)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Remove markdown headers (#)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    // Remove other markdown syntax
    .replace(/^\s*[-*+]\s+/gm, "") // list items
    .replace(/^\s*\d+\.\s+/gm, "") // numbered lists
    .replace(/^>\s+/gm, "") // blockquotes
    // Clean up whitespace
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanContent) return 0;

  return cleanContent.split(/\s+/).filter((word) => word.length > 0).length;
};

/**
 * Calculate estimated reading time based on word count
 */
export const calculateReadingTime = (mdx: string): number => {
  const wordCount = calculateWordCount(mdx);
  // Average reading speed: 200 words per minute
  const readingTimeMinutes = wordCount / 200;

  // Minimum 1 minute, round up
  return Math.max(1, Math.ceil(readingTimeMinutes));
};

/**
 * Calculate character count (excluding markup)
 */
export const calculateCharacterCount = (mdx: string): number => {
  if (!mdx || typeof mdx !== "string") return 0;

  // Same cleaning as word count but count characters
  const cleanContent = mdx
    .replace(/<[^>]*>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .trim();

  return cleanContent.length;
};

/**
 * Estimate engagement based on content characteristics
 */
export const calculateEstimatedEngagement = (mdx: string): number => {
  const wordCount = calculateWordCount(mdx);
  let score = 50; // Base score

  // Optimal length (500-2000 words gets bonus)
  if (wordCount >= 500 && wordCount <= 2000) {
    score += 20;
  } else if (wordCount > 2000) {
    score += 10; // Longer is still good but not as optimal
  } else if (wordCount < 200) {
    score -= 20; // Too short
  }

  // Check for engaging elements
  if (mdx.includes("```")) score += 10; // Has code blocks
  if (mdx.includes("![")) score += 5; // Has images
  if (mdx.includes("##")) score += 5; // Well structured with headers
  if (mdx.match(/\*\*.*\*\*/g)) score += 5; // Uses emphasis

  // Check for lists
  if (mdx.match(/^\s*[-*+]\s+/gm) || mdx.match(/^\s*\d+\.\s+/gm)) {
    score += 10; // Has lists
  }

  // Cap the score
  return Math.min(100, Math.max(0, score));
};

/**
 * Calculate basic SEO score
 */
export const calculateSEOScore = (
  title: string,
  subtitle: string,
  mdx: string,
): number => {
  let score = 0;

  // Title checks (40 points max)
  if (title && title.trim()) {
    score += 20;
    if (title.length >= 30 && title.length <= 60) {
      score += 15; // Optimal title length
    } else if (title.length > 10) {
      score += 5; // At least reasonable length
    }
  }

  // Subtitle/description checks (20 points max)
  if (subtitle && subtitle.trim()) {
    score += 10;
    if (subtitle.length >= 120 && subtitle.length <= 160) {
      score += 10; // Optimal meta description length
    } else if (subtitle.length > 50) {
      score += 5;
    }
  }

  // Content structure checks (40 points max)
  const wordCount = calculateWordCount(mdx);
  if (wordCount > 300) score += 15; // Substantial content
  if (mdx.includes("##")) score += 10; // Has headers
  if (mdx.includes("![")) score += 10; // Has images
  if (mdx.match(/\[([^\]]+)\]\([^)]+\)/g)) score += 5; // Has links

  return Math.min(100, Math.max(0, score));
};

/**
 * Calculate readability score (simplified)
 */
export const calculateReadabilityScore = (mdx: string): number => {
  const wordCount = calculateWordCount(mdx);
  if (wordCount === 0) return 0;

  // Simple approximation based on sentence and word analysis
  const sentences = mdx.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWordsPerSentence =
    sentences.length > 0 ? wordCount / sentences.length : 0;

  let score = 50; // Base readability

  // Optimal sentence length (8-20 words)
  if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 20) {
    score += 25;
  } else if (avgWordsPerSentence > 20) {
    score -= 10; // Too long sentences
  } else if (avgWordsPerSentence > 0) {
    score += 10; // Short sentences are okay
  }

  // Check for structure elements that improve readability
  if (mdx.includes("##")) score += 15; // Good structure
  if (mdx.match(/^\s*[-*+]\s+/gm)) score += 10; // Has lists

  return Math.min(100, Math.max(0, score));
};

/**
 * Calculate all metrics for an article
 */
export const calculateMetrics = (
  mdx: string,
  title?: string,
  subtitle?: string,
): ArticleMetrics => {
  return {
    wordCount: calculateWordCount(mdx),
    readingTime: calculateReadingTime(mdx),
    characterCount: calculateCharacterCount(mdx),
    estimatedEngagement: calculateEstimatedEngagement(mdx),
  };
};

/**
 * Format reading time for display
 */
export const formatReadingTime = (minutes: number): string => {
  if (minutes < 1) return "< 1 min read";
  if (minutes === 1) return "1 min read";
  return `${minutes} min read`;
};

/**
 * Format word count for display
 */
export const formatWordCount = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.floor(count / 1000)}k`;
};

/**
 * Get engagement level description
 */
export const getEngagementLevel = (
  score: number,
): { level: string; color: string } => {
  if (score >= 80) return { level: "Excellent", color: "text-green-600" };
  if (score >= 60) return { level: "Good", color: "text-blue-600" };
  if (score >= 40) return { level: "Fair", color: "text-yellow-600" };
  return { level: "Needs improvement", color: "text-red-600" };
};
