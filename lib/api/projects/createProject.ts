import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureTagIds } from "@/lib/api/queries/tags";

export interface CreateProjectInput {
  title: string;
  description: string;
  category?: string | null;
  type: string;
  difficulty?: string;
  repository_url?: string | null;
  demo_url?: string | null;
  thumbnail_url?: string | null;
  is_public: boolean;
  status: string;
  /** Normalized tag names; may be empty (validation is the caller's job). */
  tags: string[];
}

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) +
    "-" +
    Date.now().toString(36)
  );
}

/**
 * Creates a project owned by `userId`: the row, the owner's project_members entry (role "owner")
 * and its tags. Shared by POST /api/projects and the competition sign-up (P1-02).
 * Input validation stays with the caller. Throws the Supabase error if the project insert fails.
 */
export async function createProject(
  supabase: SupabaseClient,
  userId: string,
  input: CreateProjectInput,
): Promise<{ id: number; slug: string }> {
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      title: input.title.trim(),
      slug: generateSlug(input.title),
      description: input.description,
      category: input.category?.trim() || null,
      type: input.type,
      difficulty: input.difficulty ?? "beginner",
      repository_url: input.repository_url?.trim() || null,
      demo_url: input.demo_url?.trim() || null,
      thumbnail_url: input.thumbnail_url?.trim() || null,
      created_by: userId,
      is_public: input.is_public,
      status: input.status,
      ...(input.is_public ? { published_at: new Date().toISOString() } : {}),
    })
    .select("id, slug")
    .single();

  if (error) throw error;

  await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: userId,
    role: "owner",
  });

  if (input.tags.length > 0) {
    const tagIds = await ensureTagIds(supabase, input.tags);
    const rows = [...tagIds.values()].map((tag_id) => ({ project_id: project.id, tag_id }));
    if (rows.length > 0) await supabase.from("project_tags").insert(rows);
  }

  return { id: project.id as number, slug: project.slug as string };
}
