import {
  ContentItem,
  ArticleContent,
  ProjectContent,
} from "@/lib/types/content";
import { Author } from "@/lib/types/author";

/**
 * Profile API article format (different from main articles API)
 */
export interface ProfileArticleAPI {
  id: string;
  title: string;
  sub_title: string | null;
  language_code: string;
  published_at: string | null;
  views: number;
  reactions: number;
  tags: string[];
  status?: string;
}

/**
 * Profile API project format
 */
export interface ProfileProjectAPI {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  project_type: string;
  difficulty: string;
  status: string;
  technologies: string[];
  views: number;
  likes_count: number;
  created_at: string;
}

/**
 * Profile API project response with author info from profile endpoint
 */
export interface ProfileProjectAPIWithAuthor extends ProfileProjectAPI {
  author?: {
    user_name: string;
    display_name: string;
    avatar_url: string | null;
    ranking_point: number | null;
  };
}

/**
 * Profile API response with author info from profile endpoint
 */
export interface ProfileArticleAPIWithAuthor extends ProfileArticleAPI {
  author?: {
    user_name: string;
    display_name: string;
    avatar_url: string | null;
    ranking_point: number | null;
  };
}

/**
 * Transforms profile API article to ContentItem<ArticleContent>
 */
export function transformProfileArticle(
  apiData: ProfileArticleAPIWithAuthor,
  profileAuthor?: Author,
): ContentItem<ArticleContent> {
  // Use provided author or extract from API data
  const author: Author =
    profileAuthor ||
    (apiData.author
      ? {
          id: "", // Will be filled by profile data
          username: apiData.author.user_name,
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
        });

  return {
    content: {
      id: apiData.id,
      type: "article",
      title: apiData.title,
      description: apiData.sub_title,
      author,
      createdAt: apiData.published_at || new Date().toISOString(),
      tags: apiData.tags,
      subtitle: apiData.sub_title,
      publishedAt: apiData.published_at,
      languageCode: apiData.language_code,
    },
    stats: {
      views: apiData.views,
      likes: apiData.reactions,
      comments: 0, // Not provided in profile API
      bookmarks: 0, // Not provided in profile API
    },
    interactions: {
      isLiked: false,
      isBookmarked: false,
    },
  };
}

/**
 * Transforms profile API project to ContentItem<ProjectContent>
 */
export function transformProfileProject(
  apiData: ProfileProjectAPIWithAuthor,
  profileAuthor?: Author,
): ContentItem<ProjectContent> {
  // Use provided author or extract from API data
  const author: Author =
    profileAuthor ||
    (apiData.author
      ? {
          id: "", // Will be filled by profile data
          username: apiData.author.user_name,
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
        });

  return {
    content: {
      id: String(apiData.id),
      type: "project",
      title: apiData.title,
      description: apiData.description,
      author,
      createdAt: apiData.created_at,
      tags: [], // Projects in profile don't have separate tags, but have technologies
      slug: apiData.slug,
      difficulty: apiData.difficulty as
        | "beginner"
        | "intermediate"
        | "advanced",
      projectStatus: apiData.status as
        | "draft"
        | "in_progress"
        | "completed"
        | "archived",
      technologies: apiData.technologies,
      progress:
        apiData.status === "completed"
          ? 100
          : apiData.status === "in_progress"
            ? 50
            : 0,
    },
    stats: {
      views: apiData.views,
      likes: apiData.likes_count,
      comments: 0, // Not provided in profile API
      bookmarks: 0, // Not provided in profile API
    },
    interactions: {
      isLiked: false,
      isBookmarked: false,
    },
  };
}
