# P0-04 Remove the Dictionary (code)

## Goal
The technical-term Dictionary becomes its own standalone project. Remove it from this site completely.
Database tables stay for now (dropped in P0-05). Flashcards are already gone.

## Delete
- `app/dictionary/`, `app/api/dictionary/`
- `components/cards/TermCard.tsx` (only the Dictionary and the home feed use it)

## Clean up references (known on 2026-11-20 — verify with grep, there may be more)
- `components/navigation/nav.ts:38` — the `sidebar.dictionary` item.
- `components/button-collection/CreateButton.tsx:17` — the `/dictionary/create` action.
- `components/NavUser.tsx` — the moderation link (`/dictionary/moderation`, ~line 88) and the moderator-role
  constant above it (~line 21) if nothing else uses it.
- `app/page.tsx` — the `term` feed tab (~line 39), the `/api/dictionary` query (~line 53) and the term items in the
  mixed "All" feed (~lines 42, 76). The feed must work the same for articles, projects and discussions.
- `components/common/StatusBadge.tsx` — the `term` kind (lines 15–20).
- `proxy.ts` — the `/dictionary/create` and `/dictionary/moderation` entries (~lines 11–12, 96–97).
- `app/layout.tsx:17` — the site description mentions "a shared dictionary of terms"; remove that phrase
  (all three locales if it is translated anywhere).
- Locale files (mn, en, ja): the whole `dictionary` block, `sidebar.dictionary`, `create_button.dictionary*`,
  and any other key only the removed code used.
- `README.md` — the Flashcards and Dictionary feature bullets (lines 3, 10–11) and the folder notes (~lines 96–99).

## Don't
- No database changes. Don't regenerate `lib/types/database.ts`.
- Don't touch article translation features (`article_translations` etc. stay).
- Don't touch `docs/launch/starter-content.md` (it is a draft for the user to rewrite).

## Done when
- `grep -rni "dictionary\|jisho\|TermCard" app components lib hooks contexts proxy.ts` returns nothing
  (`lib/types/database.ts` excepted).
- Home, an article page, a project page, a profile page and the Create button all work.
- lint + build pass.
