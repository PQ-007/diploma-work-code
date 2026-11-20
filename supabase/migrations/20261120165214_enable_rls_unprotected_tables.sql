-- Close two tables that the public API could read and write freely (task P0-10).
--
-- In the baseline, project_updates and tag_similarities have RLS disabled while
-- `GRANT ALL ... TO anon, authenticated` is in place, so anyone holding the public anon key
-- could select, insert, update and delete their rows through the Supabase REST API.
--
-- Neither table has any policies, so enabling RLS denies all access for anon and
-- authenticated. service_role (server-side admin client) bypasses RLS and is unaffected.
-- No app code reads or writes these tables today (checked 2026-11-20).
--
-- When the project devlog (project_updates) is built, add its read/write policies in a new
-- migration, following the rls_project_* helpers used by the other project tables.

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_similarities ENABLE ROW LEVEL SECURITY;
