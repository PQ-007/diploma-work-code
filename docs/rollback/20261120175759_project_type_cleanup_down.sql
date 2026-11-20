-- ROLLBACK for supabase/migrations/20261120175759_project_type_cleanup.sql (P0-09).
--
-- NOT a migration. Do not move this into supabase/migrations/. Run it by hand only if the relaunch
-- deploy is rolled back to the old `main` code, which still sends type 'private' / 'intership'.
-- See docs/DEPLOY.md → Rollback.
--
-- What the forward migration did, and what this undoes:
--   1. RENAME VALUE 'intership' -> 'internship'   => renamed back below
--   2. RENAME VALUE 'private'   -> 'personal'     => renamed back below
--   3. column default 'personal'                  => set back to 'private' below
--
-- is_public: the forward migration did NOT change is_public (decision 2026-11-20: `type` never
-- controlled visibility), so there is nothing to restore. No row data was changed either:
-- RENAME VALUE only relabels the enum, so renaming back returns every row to exactly its old value.
--
-- Safe to run at any time after the forward migration: rows created since then with 'internship' /
-- 'personal' simply become 'intership' / 'private'.
--
-- How to run it (while the CLI is linked to the project you are rolling back):
--   Supabase dashboard → SQL Editor → paste this file → Run
--   then record it in the migration history so `db push` would re-apply the forward migration later:
--   npx supabase migration repair --remote --status reverted 20261120175759

BEGIN;

ALTER TYPE public.project_type RENAME VALUE 'internship' TO 'intership';
ALTER TYPE public.project_type RENAME VALUE 'personal' TO 'private';

ALTER TABLE public.projects ALTER COLUMN type SET DEFAULT 'private';

COMMIT;
