import { Author } from "./author";

/**
 * Content type discriminator
 */
export type ContentType = "article" | "discussion" | "project";

/**
 * Content status
 */
export type ContentStatus = "draft" | "published" | "archived";

/**
 * Base interface for all content types.
 * Provides common fields across articles, discussions, and projects.
 */
export interface BaseContent {
  id: string;
  type: ContentType;
  title: string;
  description: string | null;
  author: Author;
  createdAt: string;
  tags: string[];
}

/**
 * Stats common to all content types
 */
export interface ContentStats {
  views: number;
  likes: number; // reactions for articles, votes for discussions, likes for projects
  comments: number;
  bookmarks?: number;
}

/**
 * User's interaction state with content
 */
export interface UserInteractions {
  isLiked: boolean;
  isBookmarked: boolean;
  userVote?: "up" | "down" | null; // For discussions only
}

/**
 * Article-specific fields
 */
export interface ArticleContent extends BaseContent {
  type: "article";
  subtitle: string | null;
  readTime?: string;
  publishedAt: string | null;
  languageCode: string;
  featured?: boolean;
  trending?: boolean;
}

/**
 * Discussion-specific fields
 */
export interface DiscussionContent extends BaseContent {
  type: "discussion";
  body: string;
  pinned: boolean;
  answered: boolean;
}

/**
 * Project-specific fields
 */
export interface ProjectContent extends BaseContent {
  type: "project";
  slug: string;
  thumbnailUrl?: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  projectStatus: "draft" | "in_progress" | "completed" | "archived";
  technologies: string[];
  progress: number;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
}

/**
 * Union type for all content
 */
export type Content = ArticleContent | DiscussionContent | ProjectContent;

/**
 * Complete content item with stats and user interactions.
 * This is the main data structure used by ContentCard and throughout the app.
 */
export interface ContentItem<T extends BaseContent = BaseContent> {
  content: T;
  stats: ContentStats;
  interactions: UserInteractions;
}
