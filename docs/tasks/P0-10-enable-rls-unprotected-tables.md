# P0-10 Enable RLS on unprotected tables

## Goal
`project_updates` and `tag_similarities` have RLS disabled and `GRANT ALL … TO anon`, so anyone with the public
anon key can read and change them through the Supabase REST API. Found while writing `docs/DATABASE.md` (P0-02).

## Do
- New migration `supabase/migrations/<YYYYMMDDHHMMSS>_enable_rls_unprotected_tables.sql`:
  `ALTER TABLE … ENABLE ROW LEVEL SECURITY` on both tables. No policies: no app code uses them, so deny-all is right.
- Update `docs/DATABASE.md` (RLS count, Oddities).

## Don't
- No policies, no grant changes, no other tables.

## After merge — you do this
This is a security fix, so it goes to the **live** project directly (it can't break anything: nothing reads these tables).
While the repo is linked to the live project: `npx supabase db push --remote`.

## Done when
- The migration is in `supabase/migrations/` and lint + build pass.
- After the push, `npx supabase migration list --remote` shows it on the live project, and a REST call with the anon key
  (`curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/project_updates?select=id" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"`)
  returns `[]` instead of rows.
