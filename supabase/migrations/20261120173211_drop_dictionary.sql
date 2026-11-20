-- Remove the Dictionary from the database (task P0-05).
--
-- The Dictionary becomes its own standalone project; its code was removed from this site in P0-04.
-- DESTRUCTIVE on the live project (681 approved entries on 2026-10-13). Before applying there, take a
-- data backup while linked to live:
--   npx supabase db dump --remote --data-only --schema public -f ~/futurehub-backup-data.sql
--
-- Dropped:
--   tables     dictionary_entries, dictionary_translations, dictionary_examples, dictionary_entry_tags,
--              dictionary_revisions, dictionary_moderation_actions, dictionary_saves
--              (with them go their 24 RLS policies, the triggers trg_dictionary_entries_updated_at and
--              trg_dictionary_saves_count, their indexes incl. idx_dict_entries_term_trgm, identity
--              sequences, grants, and their foreign keys to profiles and tags)
--   functions  check_dictionary_duplicates, increment_dictionary_view, search_dictionary,
--              suggest_dictionary_terms, sync_dictionary_saves, update_dictionary_updated_at
--              (nothing outside the Dictionary calls them)
--   enum       dictionary_status (only the two dictionary tables used it)
--
-- Kept: the pg_trgm extension — projects use it too (idx_projects_title_trgm, search_projects).
-- No kept table has a foreign key into these tables (checked against the baseline on 2026-11-20).

BEGIN;

-- One statement for all seven resolves the entries <-> revisions foreign-key cycle. No CASCADE on purpose:
-- if anything outside the Dictionary still depends on these, this fails instead of silently dropping it.
DROP TABLE IF EXISTS
  public.dictionary_moderation_actions,
  public.dictionary_saves,
  public.dictionary_entry_tags,
  public.dictionary_examples,
  public.dictionary_translations,
  public.dictionary_revisions,
  public.dictionary_entries;

DROP FUNCTION IF EXISTS public.check_dictionary_duplicates(text, text);
DROP FUNCTION IF EXISTS public.increment_dictionary_view(bigint);
DROP FUNCTION IF EXISTS public.search_dictionary(text, text, integer, integer);
DROP FUNCTION IF EXISTS public.suggest_dictionary_terms(text, integer);
DROP FUNCTION IF EXISTS public.sync_dictionary_saves();
DROP FUNCTION IF EXISTS public.update_dictionary_updated_at();

DROP TYPE IF EXISTS public.dictionary_status;

COMMIT;
