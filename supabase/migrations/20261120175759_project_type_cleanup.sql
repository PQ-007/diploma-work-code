-- Clean up the project_type enum (task P0-09).
--
--   intership -> internship   (typo)
--   private   -> personal     ("private" read like a visibility setting; it is a kind of project)
--
-- RENAME VALUE only changes the label: every row keeps its value, and nothing is rewritten.
--
-- Visibility is deliberately NOT touched. It has only ever been decided by projects.is_public:
-- the API routes and RLS (rls_project_is_public checks is_public = true) never look at `type`.
-- `private` was the column default, so on live 4 of the 5 public projects (2026-11-20) are
-- type = private. Hiding "private" rows, as the task first proposed, would have hidden them.
--
-- No RLS policy or function references these enum values (search_projects filters on
-- project_category, not project_type).
--
-- DEPLOY ORDER: apply to the live project only together with deploying the code that uses
-- 'internship'/'personal'. Older code sends type 'private', which Postgres rejects once renamed.

ALTER TYPE public.project_type RENAME VALUE 'intership' TO 'internship';
ALTER TYPE public.project_type RENAME VALUE 'private' TO 'personal';

-- The default already follows the renamed value; set it explicitly so the schema reads clearly.
ALTER TABLE public.projects ALTER COLUMN type SET DEFAULT 'personal';
