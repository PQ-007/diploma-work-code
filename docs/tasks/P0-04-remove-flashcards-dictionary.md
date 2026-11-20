# P0-04 Remove Flashcards and Dictionary (code)

## Goal
Flashcards and the technical-term Dictionary move to separate projects. Remove them from this site completely.
Database tables stay for now (dropped in P0-05).

## Delete
- `app/flashcards/`, `app/dictionary/`
- `app/api/flashcards/`, `app/api/decks/`, `app/api/dictionary/`
- `components/flashcards/`, `lib/flashcards/`

## Clean up references (known — verify with grep, there may be more)
- `app/article/[slug]/page.tsx`: imports and renders `FlashcardCapturePopover` (~lines 59, 946) — remove it; the article page must work the same otherwise.
- `app/profile/[slug]/page.tsx`: "Flashcards" tab (~lines 540–595) — remove the tab and its content.
- `app/library/page.tsx` + `app/api/library/route.ts`: flashcard deck items, counts, empty state, links — remove the flashcards type.
- `components/button-collection/CreateButton.tsx`: "flashcards" create action — remove.
- `components/sidebar-collection/Left/LeftSidebar.tsx`: Flashcards and Dictionary items — remove.
- `app/globals.css`: "Flashcard module utilities" block (~line 242) — remove if nothing else uses those classes.
- Locale files (mn, en, ja): remove keys used only by the removed code.
- Any dictionary-related imports elsewhere (grep `dictionary`, `jisho`, `deck`).

## Don't
- No database changes. Don't touch article translation features (`article_translations` etc. stay).

## Done when
- `grep -rni "flashcard\|dictionary\|/decks" app components lib hooks contexts` returns nothing relevant.
- Home, an article page, a profile page, Library and the Create button all work.
- lint + build pass.
