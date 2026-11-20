# P0-05 Drop Flashcards and Dictionary tables

## Requires
P0-02 (migrations baseline) and P0-04 (code removed) merged.

## Before Claude starts — you do this
Export anything worth keeping for the standalone projects, e.g.:
`supabase db dump --data-only -t public.flashcards -t public.decks -t public.flashcard_reviews -f backup_flashcards.sql`
and the same for the `dictionary_*` tables. Store the backups outside the repo.

## Do
- New migration `<timestamp>_drop_flashcards_dictionary.sql` that drops, in dependency order:
  `flashcard_reviews`, `flashcards`, `decks`, and all `dictionary_*` tables
  (`dictionary_entries`, `dictionary_entry_tags`, `dictionary_examples`, `dictionary_moderation_actions`,
  `dictionary_revisions`, `dictionary_saves`, `dictionary_translations`, plus any other `dictionary_` table in the baseline).
- Also drop functions, triggers, enums and policies that only those tables used. List each in a comment.
- Check whether `tags` / `translation_requests` have foreign keys to these tables; if so, list them and ask before dropping.
- Update `docs/DATABASE.md`.

## Don't
- Don't apply the migration. You apply it to dev, test the site, then production later.

## Done when
- Migration applies cleanly to the dev project (`supabase db push` on dev).
- The site still builds and runs against dev.
