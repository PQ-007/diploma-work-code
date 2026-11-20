# P0-03 Fix bookmark table mismatch

## Goal
Article bookmarks use `bookmarked_articles` everywhere except one place, which reads a table that doesn't exist.

## Context
- Correct table: `bookmarked_articles` — used in `app/api/articles/bookmarks/route.ts`, `app/api/articles/[slug]/route.ts`,
  `app/api/profile/[slug]/route.ts`, `lib/api/queries/interactions.ts`.
- Wrong: `app/api/articles/[slug]/stats/route.ts` (~line 71) uses `article_bookmarks`.

## Do
- Change the stats route to count from `bookmarked_articles` with the same columns the other routes use.
- Grep for any other `article_bookmarks` reference and fix it the same way.

## Don't
- No schema changes. No other refactors.

## Done when
- `grep -rn article_bookmarks app lib components` returns nothing.
- Open an article you bookmarked: the bookmark count on its stats is correct.
- lint + build pass.
