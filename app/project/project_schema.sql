-- ============================================================================
-- PROJECTS MODULE — Complete Database Schema for Supabase (PostgreSQL)
-- ============================================================================
-- Prerequisites: pg_trgm extension for fuzzy search
-- Run once: CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- ============================================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE project_status AS ENUM (
    'draft',
    'in_progress',
    'completed',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_type AS ENUM (
    'research',
    'coding',
    'design',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_difficulty AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_member_role AS ENUM (
    'owner',
    'contributor',
    'viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. PROJECTS — Core project table
-- ============================================================================
CREATE TABLE public.projects (
  id              bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text,
  category        text,
  project_type    project_type NOT NULL DEFAULT 'coding',
  difficulty      project_difficulty NOT NULL DEFAULT 'beginner',
  status          project_status NOT NULL DEFAULT 'draft',
  is_public       boolean NOT NULL DEFAULT false,
  repository_url  text,
  demo_url        text,
  thumbnail_url   text,
  progress        int NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  technologies    text[] NOT NULL DEFAULT '{}',
  created_by      uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz,
  views           bigint NOT NULL DEFAULT 0,
  likes_count     bigint NOT NULL DEFAULT 0,

  -- Full-text search vector
  search_vector   tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(technologies, ' ')), 'C')
  ) STORED,

  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES public.profiles(id),
  -- Only completed projects can be public
  CONSTRAINT projects_public_completed_check
    CHECK (is_public = false OR status = 'completed')
);

-- Indexes
CREATE INDEX idx_projects_status ON public.projects (status);
CREATE INDEX idx_projects_created_by ON public.projects (created_by);
CREATE INDEX idx_projects_created_at ON public.projects (created_at DESC);
CREATE INDEX idx_projects_is_public ON public.projects (is_public) WHERE is_public = true;
CREATE INDEX idx_projects_slug ON public.projects (slug);
CREATE INDEX idx_projects_difficulty ON public.projects (difficulty);
CREATE INDEX idx_projects_type ON public.projects (project_type);
CREATE INDEX idx_projects_search_vector ON public.projects USING gin (search_vector);
CREATE INDEX idx_projects_title_trgm ON public.projects USING gin (title gin_trgm_ops);
CREATE INDEX idx_projects_technologies ON public.projects USING gin (technologies);

-- ============================================================================
-- 3. PROJECT_SECTIONS — Structured content blocks within a project
-- ============================================================================
CREATE TABLE public.project_sections (
  id          bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id  bigint NOT NULL,
  title       text NOT NULL,
  section_type text NOT NULL DEFAULT 'custom'
    CHECK (section_type IN (
      'overview', 'goals', 'architecture', 'implementation',
      'results', 'lessons_learned', 'custom'
    )),
  content     text,                  -- Markdown content
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_sections_pkey PRIMARY KEY (id),
  CONSTRAINT project_sections_project_fkey FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_sections_project ON public.project_sections (project_id);
CREATE INDEX idx_project_sections_order ON public.project_sections (project_id, sort_order);

-- ============================================================================
-- 4. PROJECT_MEMBERS — Team collaboration
-- ============================================================================
CREATE TABLE public.project_members (
  project_id  bigint NOT NULL,
  user_id     uuid NOT NULL,
  role        project_member_role NOT NULL DEFAULT 'viewer',
  joined_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_members_pkey PRIMARY KEY (project_id, user_id),
  CONSTRAINT project_members_project_fkey FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT project_members_user_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
);

CREATE INDEX idx_project_members_user ON public.project_members (user_id);

-- ============================================================================
-- 5. PROJECT_MILESTONES — Progress tracking
-- ============================================================================
CREATE TABLE public.project_milestones (
  id          bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id  bigint NOT NULL,
  title       text NOT NULL,
  description text,
  due_date    date,
  completed   boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT project_milestones_project_fkey FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_milestones_project ON public.project_milestones (project_id);

-- ============================================================================
-- 6. PROJECT_COMMENTS — Threaded comments & feedback
-- ============================================================================
CREATE TABLE public.project_comments (
  id          bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id  bigint NOT NULL,
  user_id     uuid NOT NULL,
  parent_id   bigint,               -- NULL = top-level, otherwise reply
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_comments_pkey PRIMARY KEY (id),
  CONSTRAINT project_comments_project_fkey FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT project_comments_user_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles(id),
  CONSTRAINT project_comments_parent_fkey FOREIGN KEY (parent_id)
    REFERENCES public.project_comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_comments_project ON public.project_comments (project_id);
CREATE INDEX idx_project_comments_parent ON public.project_comments (parent_id);
CREATE INDEX idx_project_comments_user ON public.project_comments (user_id);

-- ============================================================================
-- 7. PROJECT_FILES — Uploaded files metadata (stored in Supabase Storage)
-- ============================================================================
CREATE TABLE public.project_files (
  id           bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id   bigint NOT NULL,
  uploaded_by  uuid NOT NULL,
  file_name    text NOT NULL,
  file_url     text NOT NULL,
  file_type    text,                 -- MIME type
  file_size    bigint,               -- bytes
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_files_pkey PRIMARY KEY (id),
  CONSTRAINT project_files_project_fkey FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT project_files_uploaded_by_fkey FOREIGN KEY (uploaded_by)
    REFERENCES public.profiles(id)
);

CREATE INDEX idx_project_files_project ON public.project_files (project_id);

-- ============================================================================
-- 8. PROJECT_TAGS — Reuse existing tags table via junction
-- ============================================================================
CREATE TABLE public.project_tags (
  project_id bigint NOT NULL,
  tag_id     bigint NOT NULL,

  CONSTRAINT project_tags_pkey PRIMARY KEY (project_id, tag_id),
  CONSTRAINT project_tags_project_fkey FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT project_tags_tag_fkey FOREIGN KEY (tag_id)
    REFERENCES public.tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_tags_tag ON public.project_tags (tag_id);

-- ============================================================================
-- 9. PROJECT_LIKES — User likes/saves
-- ============================================================================
CREATE TABLE public.project_likes (
  project_id bigint NOT NULL,
  user_id    uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_likes_pkey PRIMARY KEY (project_id, user_id),
  CONSTRAINT project_likes_project_fkey FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT project_likes_user_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
);

-- ============================================================================
-- 10. TRIGGERS — Auto-update timestamps
-- ============================================================================

-- Generic updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_project_sections_updated_at
  BEFORE UPDATE ON public.project_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_project_comments_updated_at
  BEFORE UPDATE ON public.project_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 11. FUNCTION — Recalculate project progress from milestones
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recalc_project_progress()
RETURNS trigger AS $$
DECLARE
  total_count int;
  done_count  int;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE completed)
    INTO total_count, done_count
    FROM public.project_milestones
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);

  UPDATE public.projects
    SET progress = CASE WHEN total_count = 0 THEN 0
                        ELSE round((done_count::numeric / total_count) * 100)
                   END
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_milestone_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.recalc_project_progress();

-- ============================================================================
-- 12. FUNCTION — Increment/decrement likes_count on projects
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_project_likes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects SET likes_count = likes_count + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects SET likes_count = likes_count - 1 WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_project_likes_count
  AFTER INSERT OR DELETE ON public.project_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_project_likes_count();

-- ============================================================================
-- 13. FUNCTION — Full-text + trigram search for projects
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_projects(
  search_term text,
  filter_status project_status DEFAULT NULL,
  filter_difficulty project_difficulty DEFAULT NULL,
  filter_type project_type DEFAULT NULL,
  filter_category text DEFAULT NULL,
  sort_by text DEFAULT 'relevance',
  page_limit int DEFAULT 20,
  page_offset int DEFAULT 0
)
RETURNS TABLE (
  id bigint,
  title text,
  slug text,
  description text,
  category text,
  project_type project_type,
  difficulty project_difficulty,
  status project_status,
  is_public boolean,
  thumbnail_url text,
  progress int,
  technologies text[],
  created_by uuid,
  created_at timestamptz,
  views bigint,
  likes_count bigint,
  rank real
) AS $$
DECLARE
  ts_query tsquery;
BEGIN
  ts_query := plainto_tsquery('simple', coalesce(search_term, ''));

  RETURN QUERY
  SELECT
    p.id, p.title, p.slug, p.description, p.category,
    p.project_type, p.difficulty, p.status, p.is_public,
    p.thumbnail_url, p.progress, p.technologies,
    p.created_by, p.created_at, p.views, p.likes_count,
    (
      0.6 * ts_rank(p.search_vector, ts_query) +
      0.4 * similarity(p.title, coalesce(search_term, ''))
    )::real AS rank
  FROM public.projects p
  WHERE
    p.is_public = true
    AND (search_term IS NULL OR search_term = '' OR (
      p.search_vector @@ ts_query
      OR similarity(p.title, search_term) > 0.1
    ))
    AND (filter_status IS NULL OR p.status = filter_status)
    AND (filter_difficulty IS NULL OR p.difficulty = filter_difficulty)
    AND (filter_type IS NULL OR p.project_type = filter_type)
    AND (filter_category IS NULL OR p.category = filter_category)
  ORDER BY
    CASE WHEN sort_by = 'relevance' AND search_term IS NOT NULL AND search_term <> ''
         THEN 0.6 * ts_rank(p.search_vector, ts_query) + 0.4 * similarity(p.title, search_term)
         ELSE 0 END DESC,
    CASE WHEN sort_by = 'newest' THEN extract(epoch FROM p.created_at) ELSE 0 END DESC,
    CASE WHEN sort_by = 'most_liked' THEN p.likes_count ELSE 0 END DESC,
    p.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 14. SUPABASE STORAGE BUCKET (run via Supabase Dashboard or API)
-- ============================================================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'project-files',
--   'project-files',
--   false,
--   52428800, -- 50 MB
--   ARRAY['image/jpeg','image/png','image/gif','image/webp',
--         'application/pdf','text/plain','text/markdown',
--         'application/zip','application/json']
-- );
