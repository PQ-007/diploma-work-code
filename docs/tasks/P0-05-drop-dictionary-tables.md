# P0-05 Drop the Dictionary tables

## Requires
P0-02 (migrations baseline) and P0-04 (code removed) merged. A **dev** Supabase project with the baseline applied.

## Before Claude starts — you do this
Export anything worth keeping for the standalone Dictionary project, e.g.:
`supabase db dump --data-only -t 'public.dictionary_*' -f backup_dictionary.sql`
(on 2026-10-13 there were 681 approved entries). Store the backup outside the repo.

## Do
- New migration `supabase/migrations/<YYYYMMDDHHMMSS>_drop_dictionary.sql` that drops, in dependency order, every
  `dictionary_*` table in the baseline. Known: `dictionary_entries`, `dictionary_entry_tags`, `dictionary_examples`,
  `dictionary_moderation_actions`, `dictionary_revisions`, `dictionary_saves`, `dictionary_translations`.
- Also drop what only those tables used, and list each in a comment. Known: the `dictionary_status` enum, and from the
  old `002_security_and_counters.sql` the functions `increment_dictionary_view` and `update_dictionary_updated_at`
  (plus its trigger) and the `dict_entry_tags_*` policies. Look for dictionary search functions in the baseline too.
- Check whether `tags`, `translation_requests` or any other kept table has a foreign key to these tables;
  if so, list them and ask before dropping.
- Update `docs/DATABASE.md`.

## Don't
- Don't apply the migration. You apply it to dev, test the site, then production later.

## Done when
- The migration applies cleanly to the dev project (`supabase db push` on dev).
- The site still builds and runs against dev.
