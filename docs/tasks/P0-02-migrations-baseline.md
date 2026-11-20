# P0-02 Migrations baseline

## Goal
`db.sql` is out of date (the code uses tables it doesn't define). Make `supabase/migrations/` the single source of truth for the schema.

## Before Claude starts — you do this
1. Install the Supabase CLI, `supabase login`, `supabase link --project-ref <DEV project ref>`.
2. Dump the live schema of the **dev** project:
   `supabase db dump --schema public -f supabase/schema_dump.sql`
3. Give Claude the task.

## Do
- Create `supabase/migrations/<timestamp>_baseline.sql` from `supabase/schema_dump.sql`
  (tables, enums, functions, triggers, RLS policies, indexes). Keep it as dumped; don't "improve" it.
- Move `db.sql` and `app/profile/profile_schema.sql` to `docs/legacy-schema/` (history only).
- Write `docs/DATABASE.md`: one line per table — what it is for and which feature uses it.
  Mark tables that no code uses (`tag_similarities` is one) and tables slated for removal
  (decks, flashcards, flashcard_reviews, dictionary_*).
- Add to `README.md` a short "Database" section: how to apply migrations with the Supabase CLI.

## Don't
- Don't apply anything to any database. Don't delete `schema_dump.sql` (you will).

## Done when
- Every table the code reads with `.from("…")` exists in the baseline migration, or is listed in DATABASE.md as missing.
- `npm run build` passes.
