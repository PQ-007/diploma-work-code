-- FutureHub — Remove the flashcards feature from the database.
--
-- DESTRUCTIVE: permanently deletes every deck, card and review
-- (as of 2026-10-13: 2 decks, 197 cards, all owned by one user).
-- Export them first if you want to keep a copy:
--   Supabase dashboard → Table editor → decks / flashcards → Export to CSV.
--
-- The app no longer reads or writes these tables, so running this is optional
-- and can happen any time after deploying the relaunch.

BEGIN;

DROP TABLE IF EXISTS public.flashcard_reviews;
DROP TABLE IF EXISTS public.flashcards;
DROP TABLE IF EXISTS public.decks;

COMMIT;
