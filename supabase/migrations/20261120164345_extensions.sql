-- Extensions the baseline needs before it can apply on a fresh project.
--
-- The baseline (20261120164346_baseline.sql) was dumped with `--schema public`, which never
-- includes CREATE EXTENSION. On the live project pg_trgm lives in the public schema, and the
-- baseline references it as "public"."gin_trgm_ops" (index idx_dict_entries_term_trgm) and
-- calls similarity() in check_dictionary_duplicates.
--
-- On the existing (live) project this already exists: mark this migration as applied there
-- instead of running it (see docs/DATABASE.md → Applying migrations).

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
