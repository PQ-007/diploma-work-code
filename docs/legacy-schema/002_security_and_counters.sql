-- FutureHub — Relaunch: close RLS holes + make counters actually count.
--
-- Run in the Supabase SQL editor after 001_articles_project_id.sql.
-- Idempotent: safe to run more than once.
--
-- Background: every API route uses the anon-key client, so writes run as the
-- `authenticated` role and are bound by RLS. That exposed two classes of bugs:
--   * policies that were too loose (privilege escalation, open tag writes);
--   * counters (views / saves / likes) written by a non-owner, which RLS
--     silently filtered to 0 rows — they never persisted.

-- ============================================================================
-- 1. profiles: users must not be able to promote themselves
-- ============================================================================
-- "Users can update own profile" only checks auth.uid() = id, so any user could
-- PATCH their own `role` to 'admin' straight through PostgREST. Pin the
-- privileged columns for API callers; the SQL editor / service role are exempt.

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'user';
      NEW.ranking_point := 0;
    ELSE
      NEW.role := OLD.role;
      NEW.ranking_point := OLD.ranking_point;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_privileged ON public.profiles;
CREATE TRIGGER trg_profiles_guard_privileged
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- ============================================================================
-- 2. projects: contributors must not be able to take ownership
-- ============================================================================
-- projects_contributor_update has no WITH CHECK, so a contributor could rewrite
-- created_by. Ownership is immutable from the API.

CREATE OR REPLACE FUNCTION public.guard_project_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    NEW.created_by := OLD.created_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_guard_owner ON public.projects;
CREATE TRIGGER trg_projects_guard_owner
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.guard_project_owner();

-- ============================================================================
-- 3. dictionary_entry_tags: only the entry's creator or a moderator
-- ============================================================================
-- Insert/delete were `true` for any authenticated user. The only writers in the
-- app are the creator (own draft) and moderators (applying a revision).

DROP POLICY IF EXISTS dict_entry_tags_insert ON public.dictionary_entry_tags;
DROP POLICY IF EXISTS dict_entry_tags_delete ON public.dictionary_entry_tags;

CREATE POLICY dict_entry_tags_insert ON public.dictionary_entry_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dictionary_entries e
      WHERE e.id = dictionary_entry_tags.entry_id AND e.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = ANY (ARRAY['teacher'::user_type, 'admin'::user_type])
    )
  );

CREATE POLICY dict_entry_tags_delete ON public.dictionary_entry_tags
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dictionary_entries e
      WHERE e.id = dictionary_entry_tags.entry_id AND e.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = ANY (ARRAY['teacher'::user_type, 'admin'::user_type])
    )
  );

-- ============================================================================
-- 4. View counters — SECURITY DEFINER RPCs (callable by anyone, incl. anon)
-- ============================================================================
-- Each only touches the counter column, and only for content that is publicly
-- visible. Returns the new count (NULL if the row isn't eligible).

CREATE OR REPLACE FUNCTION public.increment_article_view(p_article_id bigint, p_language_code text)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE article_translations t
  SET views = COALESCE(t.views, 0) + 1
  FROM articles a
  WHERE a.id = t.article_id
    AND a.status = 'published'
    AND t.article_id = p_article_id
    AND t.language_code = p_language_code
  RETURNING t.views;
$$;

CREATE OR REPLACE FUNCTION public.increment_project_view(p_project_id bigint)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE projects
  SET views = views + 1
  WHERE id = p_project_id AND is_public = true
  RETURNING views;
$$;

CREATE OR REPLACE FUNCTION public.increment_dictionary_view(p_entry_id bigint)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE dictionary_entries
  SET views = views + 1
  WHERE id = p_entry_id AND status = 'approved'
  RETURNING views;
$$;

REVOKE ALL ON FUNCTION public.increment_article_view(bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_project_view(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_dictionary_view(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_article_view(bigint, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_project_view(bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_dictionary_view(bigint) TO anon, authenticated;

-- A view/save bump is not an edit: don't move dictionary_entries.updated_at.
CREATE OR REPLACE FUNCTION public.update_dictionary_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (to_jsonb(NEW) - 'views' - 'saves' - 'updated_at')
     IS DISTINCT FROM (to_jsonb(OLD) - 'views' - 'saves' - 'updated_at') THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. Save / like counters — maintained by triggers on the join tables
-- ============================================================================
-- Incremental (not recounted) for dictionary saves: existing `saves` values
-- are seed numbers with no rows behind them, and a recount would zero them.

CREATE OR REPLACE FUNCTION public.sync_dictionary_saves()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE dictionary_entries SET saves = saves + 1 WHERE id = NEW.entry_id;
  ELSE
    UPDATE dictionary_entries SET saves = GREATEST(saves - 1, 0) WHERE id = OLD.entry_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_dictionary_saves_count ON public.dictionary_saves;
CREATE TRIGGER trg_dictionary_saves_count
  AFTER INSERT OR DELETE ON public.dictionary_saves
  FOR EACH ROW EXECUTE FUNCTION public.sync_dictionary_saves();

CREATE OR REPLACE FUNCTION public.sync_project_likes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET likes_count = likes_count + 1 WHERE id = NEW.project_id;
  ELSE
    UPDATE projects SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_likes_count ON public.project_likes;
CREATE TRIGGER trg_project_likes_count
  AFTER INSERT OR DELETE ON public.project_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_project_likes();

-- Project likes are real rows, so recount once to fix drift.
UPDATE public.projects p
SET likes_count = (SELECT count(*) FROM public.project_likes l WHERE l.project_id = p.id);
