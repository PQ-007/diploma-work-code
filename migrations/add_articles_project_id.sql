-- FutureHub — Project↔Article linking (Phase 1)
-- Adds an optional link from an article to a project. A project can have many
-- linked articles (a main write-up + devlog posts). Deleting a project unlinks
-- its articles rather than deleting them.
--
-- Run against your Supabase project (SQL editor or psql), then regenerate types:
--   npm run gen:types   (or the column is already reflected in lib/types/database.ts)

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS project_id bigint;

ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_project_id_fkey;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS articles_project_id_idx ON public.articles(project_id);
