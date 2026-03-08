-- ============================================================================
-- PROJECTS MODULE — Row Level Security Policies
-- ============================================================================
-- NOTE: SECURITY DEFINER helper functions are used to break circular
-- references between projects ↔ project_members policies.
-- These functions bypass RLS so they can be called inside policy expressions
-- without triggering recursive policy evaluation.
-- ============================================================================

-- Helper functions (SECURITY DEFINER — bypass RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.rls_project_is_public(p_project_id bigint)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND is_public = true
  );
$$;

CREATE OR REPLACE FUNCTION public.rls_project_owner(p_project_id bigint)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT created_by FROM projects WHERE id = p_project_id;
$$;

CREATE OR REPLACE FUNCTION public.rls_is_project_member(p_project_id bigint, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.rls_is_project_contributor(p_project_id bigint, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
      AND user_id = p_user_id
      AND role IN ('owner', 'contributor')
  );
$$;

-- Enable RLS on all project tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROJECTS
-- ============================================================================

-- Public: Anyone can read published projects
CREATE POLICY "projects_public_read"
  ON public.projects FOR SELECT
  USING (is_public = true);

-- Authenticated: Users can read their own projects (any status)
CREATE POLICY "projects_owner_read"
  ON public.projects FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Authenticated: Team members can read projects they belong to
-- Uses SECURITY DEFINER helper to avoid recursion with project_members policies
CREATE POLICY "projects_member_read"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.rls_is_project_member(id, auth.uid())
  );

-- Authenticated: Users can create projects
CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Owner: Can update their own projects
CREATE POLICY "projects_owner_update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Owner/Contributor: Team members with contributor+ role can update
-- Uses SECURITY DEFINER helper to avoid recursion with project_members policies
CREATE POLICY "projects_contributor_update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    public.rls_is_project_contributor(id, auth.uid())
  );

-- Owner: Can delete their own projects
CREATE POLICY "projects_owner_delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Admin: Can delete any project (moderation)
CREATE POLICY "projects_admin_delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- PROJECT_SECTIONS
-- ============================================================================

-- Read: Anyone can read sections of public projects
CREATE POLICY "sections_public_read"
  ON public.project_sections FOR SELECT
  USING (
    public.rls_project_is_public(project_id)
  );

-- Read: Owner/members can read sections of their projects
CREATE POLICY "sections_member_read"
  ON public.project_sections FOR SELECT
  TO authenticated
  USING (
    public.rls_project_owner(project_id) = auth.uid()
    OR public.rls_is_project_member(project_id, auth.uid())
  );

-- Insert/Update/Delete: Owner and contributors can manage sections
CREATE POLICY "sections_manage"
  ON public.project_sections FOR ALL
  TO authenticated
  USING (
    public.rls_project_owner(project_id) = auth.uid()
    OR public.rls_is_project_contributor(project_id, auth.uid())
  );

-- ============================================================================
-- PROJECT_MEMBERS
-- ============================================================================

-- Read: Public viewers, owner, and existing members can see team
-- Uses SECURITY DEFINER helpers to avoid recursion with projects policies
CREATE POLICY "members_read"
  ON public.project_members FOR SELECT
  USING (
    public.rls_project_is_public(project_id)
    OR public.rls_project_owner(project_id) = auth.uid()
    OR public.rls_is_project_member(project_id, auth.uid())
  );

-- Only project owner can add/remove members
CREATE POLICY "members_owner_manage"
  ON public.project_members FOR ALL
  TO authenticated
  USING (
    public.rls_project_owner(project_id) = auth.uid()
  );

-- ============================================================================
-- PROJECT_MILESTONES
-- ============================================================================

-- Read: Public project milestones visible to all
CREATE POLICY "milestones_public_read"
  ON public.project_milestones FOR SELECT
  USING (
    public.rls_project_is_public(project_id)
  );

-- Read: Members can read their project milestones
CREATE POLICY "milestones_member_read"
  ON public.project_milestones FOR SELECT
  TO authenticated
  USING (
    public.rls_project_owner(project_id) = auth.uid()
    OR public.rls_is_project_member(project_id, auth.uid())
  );

-- Manage: Owner and contributors can manage milestones
CREATE POLICY "milestones_manage"
  ON public.project_milestones FOR ALL
  TO authenticated
  USING (
    public.rls_project_owner(project_id) = auth.uid()
    OR public.rls_is_project_contributor(project_id, auth.uid())
  );

-- ============================================================================
-- PROJECT_COMMENTS
-- ============================================================================

-- Read: Anyone can read comments on public projects
CREATE POLICY "comments_public_read"
  ON public.project_comments FOR SELECT
  USING (
    public.rls_project_is_public(project_id)
  );

-- Read: Members can read comments on their projects
CREATE POLICY "comments_member_read"
  ON public.project_comments FOR SELECT
  TO authenticated
  USING (
    public.rls_project_owner(project_id) = auth.uid()
    OR public.rls_is_project_member(project_id, auth.uid())
  );

-- Authenticated: Can comment on public projects
CREATE POLICY "comments_insert"
  ON public.project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.rls_project_is_public(project_id)
  );

-- Users can edit their own comments
CREATE POLICY "comments_own_update"
  ON public.project_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "comments_own_delete"
  ON public.project_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin: Can delete any comment (moderation)
CREATE POLICY "comments_admin_delete"
  ON public.project_comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- PROJECT_FILES
-- ============================================================================

-- Read: Public project files visible to all
CREATE POLICY "files_public_read"
  ON public.project_files FOR SELECT
  USING (
    public.rls_project_is_public(project_id)
  );

-- Read: Members can read their project files
CREATE POLICY "files_member_read"
  ON public.project_files FOR SELECT
  TO authenticated
  USING (
    public.rls_project_owner(project_id) = auth.uid()
    OR public.rls_is_project_member(project_id, auth.uid())
  );

-- Owner/contributors can upload files
CREATE POLICY "files_manage"
  ON public.project_files FOR ALL
  TO authenticated
  USING (
    public.rls_project_owner(project_id) = auth.uid()
    OR public.rls_is_project_contributor(project_id, auth.uid())
  );

-- ============================================================================
-- PROJECT_TAGS
-- ============================================================================

-- Read: Anyone can read tags of public projects
CREATE POLICY "tags_public_read"
  ON public.project_tags FOR SELECT
  USING (
    public.rls_project_is_public(project_id)
  );

-- Read: Members can read tags of their projects
CREATE POLICY "tags_member_read"
  ON public.project_tags FOR SELECT
  TO authenticated
  USING (
    public.rls_project_owner(project_id) = auth.uid()
    OR public.rls_is_project_member(project_id, auth.uid())
  );

-- Owner can manage tags
CREATE POLICY "tags_owner_manage"
  ON public.project_tags FOR ALL
  TO authenticated
  USING (
    public.rls_project_owner(project_id) = auth.uid()
  );

-- ============================================================================
-- PROJECT_LIKES
-- ============================================================================

-- Read: Anyone can see likes on public projects
CREATE POLICY "likes_public_read"
  ON public.project_likes FOR SELECT
  USING (
    public.rls_project_is_public(project_id)
  );

-- Authenticated: Can like public projects
CREATE POLICY "likes_insert"
  ON public.project_likes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.rls_project_is_public(project_id)
  );

-- Users can unlike (delete their own like)
CREATE POLICY "likes_own_delete"
  ON public.project_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- STORAGE POLICIES for project-files bucket
-- ============================================================================

-- -- Users can upload to their own project folder
-- CREATE POLICY "project_files_upload"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     bucket_id = 'project-files'
--     AND (storage.foldername(name))[1]::bigint IN (
--       SELECT p.id FROM public.projects p
--       WHERE p.created_by = auth.uid()
--       UNION
--       SELECT pm.project_id FROM public.project_members pm
--       WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'contributor')
--     )
--   );
--
-- -- Public can read files from public projects
-- CREATE POLICY "project_files_public_read"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'project-files'
--     AND (storage.foldername(name))[1]::bigint IN (
--       SELECT p.id FROM public.projects p WHERE p.is_public = true
--     )
--   );
