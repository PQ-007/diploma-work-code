/* ------------------------------------------------------------------ */
/*  Project Module — TypeScript Types                                 */
/* ------------------------------------------------------------------ */

export type ProjectStatus = "draft" | "in_progress" | "completed" | "archived";
export type ProjectType = "research" | "coding" | "design" | "other";
export type ProjectDifficulty = "beginner" | "intermediate" | "advanced";
export type ProjectMemberRole = "owner" | "contributor" | "viewer";

export interface ProjectAuthor {
  id: string;
  user_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  ranking_point?: number | null;
}

export interface ProjectSection {
  id: number;
  project_id: number;
  title: string;
  section_type: string;
  content: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  user_id: string;
  role: ProjectMemberRole;
  joined_at: string;
  profile?: ProjectAuthor;
}

export type KanbanStatus = "todo" | "in_progress" | "done";

export interface ProjectMilestone {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  kanban_status: KanbanStatus;
  sort_order: number;
  created_at: string;
}

export interface ProjectComment {
  id: number;
  project_id: number;
  user_id: string;
  parent_id: number | null;
  body: string;
  created_at: string;
  updated_at: string;
  author?: ProjectAuthor;
  replies?: ProjectComment[];
}

export interface ProjectFile {
  id: number;
  project_id: number;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export type ProjectUpdateType =
  | "regular"
  | "milestone"
  | "release"
  | "announcement";

export interface ProjectUpdate {
  id: number;
  project_id: number;
  created_by: string;
  title: string;
  body: string;
  update_type: ProjectUpdateType;
  image_url: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
  author?: ProjectAuthor | null;
}

export interface ProjectPayload {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  project_type: ProjectType;
  difficulty: ProjectDifficulty;
  status: ProjectStatus;
  is_public: boolean;
  repository_url: string | null;
  demo_url: string | null;
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
  sections?: ProjectSection[];
  milestones?: ProjectMilestone[];
  comments?: ProjectComment[];
  files?: ProjectFile[];
  updates?: ProjectUpdate[];
  userLiked?: boolean;
  isOwner?: boolean;
  isMember?: boolean;
}

export interface CreateProjectBody {
  title: string;
  description?: string;
  category?: string;
  project_type?: ProjectType;
  difficulty?: ProjectDifficulty;
  technologies?: string[];
  repository_url?: string;
  demo_url?: string;
  thumbnail_url?: string;
  tags?: string[];
}

export interface UpdateProjectBody extends Partial<CreateProjectBody> {
  status?: ProjectStatus;
  is_public?: boolean;
  progress?: number;
}
