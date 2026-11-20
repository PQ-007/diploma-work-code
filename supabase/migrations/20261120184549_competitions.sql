-- Competitions and their entries (task P1-01).
--
-- An entry is a contest project (projects.type = 'contest'); the team is that project's project_members.
-- Students can sign up / withdraw their own project while sign-up is open; only staff
-- (profiles.role teacher / admin / super_admin) can set scores, ranks, notes or disqualify.
--
-- Hiding results until they are published: RLS can't hide single columns, and the anon key is public
-- (anyone can call /rest/v1/competition_entries directly, so nulling scores in our API would not protect
-- them). So the six result columns are made unreadable on the table itself (column privileges below) and
-- are only exposed through the view competition_results_public, which returns them when
-- results_published is true or the caller is staff. Consequence for API code: select entry columns
-- explicitly (no `*`), read scores from the view, and don't use .update().select() on score columns.

BEGIN;

-- 1. Staff helper ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rls_is_staff(p_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ SELECT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role IN ('teacher', 'admin', 'super_admin')); $$;

-- 2. Enums -------------------------------------------------------------------------------------
-- draft = staff only · upcoming = announced · open = sign-up · running = competition day ·
-- judging = scoring · finished = over (results shown when results_published)

CREATE TYPE public.competition_kind AS ENUM ('bot', 'jam', 'other');
CREATE TYPE public.competition_status AS ENUM ('draft', 'upcoming', 'open', 'running', 'judging', 'finished');
CREATE TYPE public.competition_entry_status AS ENUM ('registered', 'withdrawn', 'disqualified');

-- 3. competitions ------------------------------------------------------------------------------

CREATE TABLE public.competitions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    kind public.competition_kind NOT NULL,
    status public.competition_status NOT NULL DEFAULT 'draft',
    title jsonb NOT NULL,                        -- {"mn": "...", "en": "...", "ja": "..."}; mn required (fallback)
    summary jsonb,
    rules jsonb,                                 -- markdown allowed
    cover_url text,
    categories text[] NOT NULL DEFAULT '{}',     -- e.g. {bot,human_vs_bot}
    max_team_size integer NOT NULL DEFAULT 3 CHECK (max_team_size >= 1),
    signup_opens_at timestamptz,
    signup_closes_at timestamptz,
    starts_at timestamptz,
    ends_at timestamptz,
    results_published boolean NOT NULL DEFAULT false,
    created_by uuid REFERENCES public.profiles(id) DEFAULT auth.uid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT competitions_title_has_mn CHECK (title ? 'mn'),
    CONSTRAINT competitions_signup_window CHECK (signup_closes_at >= signup_opens_at),
    CONSTRAINT competitions_dates CHECK (ends_at >= starts_at)
);

CREATE TRIGGER trg_competitions_updated_at BEFORE UPDATE ON public.competitions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. competition_entries -----------------------------------------------------------------------

CREATE TABLE public.competition_entries (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    competition_id bigint NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    project_id bigint NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category text NOT NULL,
    status public.competition_entry_status NOT NULL DEFAULT 'registered',
    score numeric,
    tiebreak numeric,                            -- lower is better, e.g. total thinking ms
    judge_score numeric,
    public_score numeric,
    rank integer,
    note text,                                   -- organizer note, e.g. "crashed on seq 3"
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT competition_entries_unique UNIQUE (competition_id, project_id, category)
);

CREATE TRIGGER trg_competition_entries_updated_at BEFORE UPDATE ON public.competition_entries
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Competition helpers for RLS ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rls_competition_visible(p_competition_id bigint) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$ SELECT EXISTS (SELECT 1 FROM competitions WHERE id = p_competition_id AND status <> 'draft'); $$;

CREATE OR REPLACE FUNCTION public.rls_competition_signup_open(p_competition_id bigint) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM competitions
    WHERE id = p_competition_id
      AND status = 'open'
      AND (signup_opens_at IS NULL OR signup_opens_at <= now())
      AND (signup_closes_at IS NULL OR signup_closes_at > now())
  );
$$;

-- 6. Entry validation: category must be one of the competition's, project must be a contest project.
--    SECURITY DEFINER so it can read the competition and project regardless of the caller's RLS.

CREATE OR REPLACE FUNCTION public.validate_competition_entry() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_categories text[];
  v_type project_type;
BEGIN
  SELECT categories INTO v_categories FROM competitions WHERE id = NEW.competition_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'competition % does not exist', NEW.competition_id USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF NOT (NEW.category = ANY (v_categories)) THEN
    RAISE EXCEPTION 'category "%" is not one of this competition''s categories %', NEW.category, v_categories
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT type INTO v_type FROM projects WHERE id = NEW.project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'project % does not exist', NEW.project_id USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF v_type IS DISTINCT FROM 'contest' THEN
    RAISE EXCEPTION 'only contest projects can enter a competition (project % is %)', NEW.project_id, v_type
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Guard: non-staff callers can't write results, and may only switch registered <-> withdrawn.
--    Pattern: guard_profile_privileged_columns (silently keeps protected values).

CREATE OR REPLACE FUNCTION public.guard_competition_entry() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT public.rls_is_staff(auth.uid()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.score := NULL;
      NEW.tiebreak := NULL;
      NEW.judge_score := NULL;
      NEW.public_score := NULL;
      NEW.rank := NULL;
      NEW.note := NULL;
      NEW.status := 'registered';
    ELSE
      NEW.competition_id := OLD.competition_id;
      NEW.project_id := OLD.project_id;
      NEW.category := OLD.category;
      NEW.score := OLD.score;
      NEW.tiebreak := OLD.tiebreak;
      NEW.judge_score := OLD.judge_score;
      NEW.public_score := OLD.public_score;
      NEW.rank := OLD.rank;
      NEW.note := OLD.note;
      NEW.created_at := OLD.created_at;
      IF NOT (OLD.status IN ('registered', 'withdrawn') AND NEW.status IN ('registered', 'withdrawn')) THEN
        NEW.status := OLD.status;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Same-timing triggers fire in name order: guard (g) runs before validate (v).
CREATE TRIGGER trg_competition_entries_guard BEFORE INSERT OR UPDATE ON public.competition_entries
    FOR EACH ROW EXECUTE FUNCTION public.guard_competition_entry();
CREATE TRIGGER trg_competition_entries_validate BEFORE INSERT OR UPDATE OF competition_id, project_id, category
    ON public.competition_entries
    FOR EACH ROW EXECUTE FUNCTION public.validate_competition_entry();

-- 8. RLS ---------------------------------------------------------------------------------------

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitions_read ON public.competitions FOR SELECT
    USING (status <> 'draft' OR public.rls_is_staff(auth.uid()));
CREATE POLICY competitions_staff_insert ON public.competitions FOR INSERT TO authenticated
    WITH CHECK (public.rls_is_staff(auth.uid()));
CREATE POLICY competitions_staff_update ON public.competitions FOR UPDATE TO authenticated
    USING (public.rls_is_staff(auth.uid())) WITH CHECK (public.rls_is_staff(auth.uid()));
CREATE POLICY competitions_staff_delete ON public.competitions FOR DELETE TO authenticated
    USING (public.rls_is_staff(auth.uid()));

CREATE POLICY competition_entries_read ON public.competition_entries FOR SELECT
    USING (public.rls_competition_visible(competition_id) OR public.rls_is_staff(auth.uid()));
CREATE POLICY competition_entries_insert ON public.competition_entries FOR INSERT TO authenticated
    WITH CHECK (
      public.rls_is_staff(auth.uid())
      OR (public.rls_project_owner(project_id) = auth.uid() AND public.rls_competition_signup_open(competition_id))
    );
CREATE POLICY competition_entries_update ON public.competition_entries FOR UPDATE TO authenticated
    USING (
      public.rls_is_staff(auth.uid())
      OR (public.rls_project_owner(project_id) = auth.uid() AND public.rls_competition_signup_open(competition_id))
    )
    WITH CHECK (
      public.rls_is_staff(auth.uid())
      OR (public.rls_project_owner(project_id) = auth.uid() AND public.rls_competition_signup_open(competition_id))
    );
CREATE POLICY competition_entries_delete ON public.competition_entries FOR DELETE TO authenticated
    USING (
      public.rls_is_staff(auth.uid())
      OR (public.rls_project_owner(project_id) = auth.uid() AND public.rls_competition_signup_open(competition_id))
    );

-- 9. Results are hidden on the table and exposed through a view --------------------------------

REVOKE SELECT ON public.competition_entries FROM anon, authenticated;
GRANT SELECT (id, competition_id, project_id, category, status, created_at, updated_at)
    ON public.competition_entries TO anon, authenticated;

-- Owned by postgres (not security_invoker), so it can read the result columns; it applies the same
-- visibility rule as the table's RLS itself. security_barrier keeps callers' filters from running first.
CREATE VIEW public.competition_results_public WITH (security_barrier = true) AS
SELECT
    e.id,
    e.competition_id,
    e.project_id,
    e.category,
    e.status,
    c.results_published,
    CASE WHEN c.results_published OR public.rls_is_staff(auth.uid()) THEN e.score END        AS score,
    CASE WHEN c.results_published OR public.rls_is_staff(auth.uid()) THEN e.tiebreak END     AS tiebreak,
    CASE WHEN c.results_published OR public.rls_is_staff(auth.uid()) THEN e.judge_score END  AS judge_score,
    CASE WHEN c.results_published OR public.rls_is_staff(auth.uid()) THEN e.public_score END AS public_score,
    CASE WHEN c.results_published OR public.rls_is_staff(auth.uid()) THEN e.rank END         AS rank,
    CASE WHEN c.results_published OR public.rls_is_staff(auth.uid()) THEN e.note END         AS note,
    e.created_at,
    e.updated_at
FROM public.competition_entries e
JOIN public.competitions c ON c.id = e.competition_id
WHERE c.status <> 'draft' OR public.rls_is_staff(auth.uid());

REVOKE ALL ON public.competition_results_public FROM anon, authenticated;
GRANT SELECT ON public.competition_results_public TO anon, authenticated;

-- 10. Indexes ----------------------------------------------------------------------------------

CREATE INDEX idx_competition_entries_competition ON public.competition_entries (competition_id);
CREATE INDEX idx_competition_entries_project ON public.competition_entries (project_id);
CREATE INDEX idx_competitions_status ON public.competitions (status);

COMMIT;
