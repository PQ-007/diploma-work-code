/* ------------------------------------------------------------------ */
/*  Project Module — TypeScript Types                                 */
/*                                                                    */
/*  Row/enum shapes are derived from the generated Supabase schema    */
/*  (`@/lib/types/database`) so they stay in sync with the database.  */
/*  View-model extensions (author, replies, etc.) are layered on top. */
/* ------------------------------------------------------------------ */

import type { Tables, Enums } from "@/lib/types/database";

export type ProjectStatus = Enums<"project_status">;
/** Maps to the project_type enum in the DB (column name: `type`) */
export type ProjectType = Enums<"project_type">;
/** Stored as free text in the `category` column (not a DB enum). */
export type ProjectCategory =
  | "creative_design"
  | "mobile_dev"
  | "game_dev"
  | "web_dev"
  | "hardware_iot"
  | "ai"
  | "other";
export type ProjectDifficulty = Enums<"project_difficulty">;
export type ProjectMemberRole = Enums<"project_member_role">;

export interface ProjectAuthor {
  id: string;
  user_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  ranking_point?: number | null;
}

export type ProjectMember = Omit<Tables<"project_members">, "project_id"> & {
  profile?: ProjectAuthor;
};

export type ProjectComment = Tables<"project_comments"> & {
  author?: ProjectAuthor;
  replies?: ProjectComment[];
};

export type ProjectFile = Tables<"project_files">;

/** An article written about a project (write-up or devlog), returned by the
 *  project detail API. `id` is the article id — link to `/article/<id>`. */
export interface ProjectLinkedArticle {
  id: string;
  title: string | null;
  status: string;
  published_at: string | null;
  language_code: string | null;
}

export interface ProjectPayload {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  type: ProjectType;
  difficulty: ProjectDifficulty;
  status: ProjectStatus;
  is_public: boolean;
  repository_url: string | null;
  demo_url: string | null;
  video_url?: string | null;
  thumbnail_url: string | null;
  progress: number;
  technologies: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  views: number;
  likes_count: number;
  tags: string[];
  author?: ProjectAuthor;
  members?: ProjectMember[];
  comments?: ProjectComment[];
  files?: ProjectFile[];
  articles?: ProjectLinkedArticle[];
  userLiked?: boolean;
  isOwner?: boolean;
  isMember?: boolean;
}

export interface CreateProjectBody {
  title: string;
  description?: string;
  category?: ProjectCategory;
  type?: ProjectType;
  difficulty?: ProjectDifficulty;
  technologies?: string[];
  repository_url?: string;
  demo_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  tags?: string[];
}

export interface UpdateProjectBody extends Partial<CreateProjectBody> {
  status?: ProjectStatus;
  is_public?: boolean;
  progress?: number;
}
