# P0-02 Migrations baseline

## Goal
`db.sql` is a context-only dump: it has no RLS policies, functions or triggers, so it can't recreate the database.
Make `supabase/migrations/` the single source of truth for the schema.

## Before Claude starts — you do this
1. The Supabase project is awake (see `docs/tasks/README.md` → Before you start).
2. Install the Supabase CLI, `supabase login`, `supabase link --project-ref <project ref>`.
3. Dump the live schema (read-only, safe on the live project):
   `supabase db dump --schema public -f supabase/schema_dump.sql`
4. Give Claude the task.

## Context
- `migrations/` holds three older files, all already applied by hand in the SQL editor:
  `001_articles_project_id.sql`, `002_security_and_counters.sql`, `003_drop_flashcards.sql`.
  The dump already contains their effects.
- `app/profile/profile_schema.sql` is a second, older schema file.

## Do
- Create `supabase/migrations/<YYYYMMDDHHMMSS>_baseline.sql` from `supabase/schema_dump.sql`
  (tables, enums, functions, triggers, RLS policies, indexes). Keep it as dumped; don't "improve" it.
- Check that the dump includes what 001–003 did: `articles.project_id`, the `increment_*_view` functions and
  `guard_*` triggers from 002, and no `decks` / `flashcards` / `flashcard_reviews`. List anything missing.
- Move `db.sql`, `app/profile/profile_schema.sql` and the three files in `migrations/` to `docs/legacy-schema/`
  (history only), then delete the empty `migrations/` folder.
- Write `docs/DATABASE.md`: one line per table — what it is for and which feature uses it.
  Mark tables that no code uses (`tag_similarities` is one) and tables slated for removal (all `dictionary_*`).
- Add a short "Database" section to `README.md`: how to apply migrations with the Supabase CLI.

## Don't
- Don't apply anything to any database. Don't delete `schema_dump.sql` (you will).
- Don't regenerate `lib/types/database.ts`.

## Done when
- Every table the code reads with `.from("…")` exists in the baseline migration, or is listed in DATABASE.md as missing.
- `migrations/` no longer exists; `supabase/migrations/` holds only the baseline.
- lint + build pass.
