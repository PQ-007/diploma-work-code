# P0-08 Navigation cleanup

## Requires
P0-04 merged (it also edits `components/navigation/nav.ts`).

## Context
The nav links are defined in `components/navigation/nav.ts` (`primaryNav`, `comingSoonNav`) and rendered by
`components/sidebar-collection/Left/LeftSidebar.tsx` (desktop) and `components/navigation/BottomNav.tsx` (phones).
Most of the old cleanup is already done: the broken competition / internship / post-grad / `/project/graduation`
links are gone, project sub-items already use `/project?type=…`, and `/store` and `/knowledge-tree` both render
the shared `ComingSoon` page. What is left:

## Do
1. **Project filter ↔ URL.** `app/project/page.tsx` already reads `type` from the URL (~line 78) but doesn't write it
   back. When the type filter changes, update the URL (`router.replace`, keep other params, no scroll), so the
   sidebar sub-item that matches stays highlighted and the URL can be shared.
2. **Diploma label.** Keep the key `sidebar.graduation`; change its text to "Diploma works" / "Дипломын ажил" / "卒業研究".
3. **Alumni key.** Rename the unused locale key `sidebar.post-grad` → `sidebar.alumni` in all three locales,
   text "Alumni stories" / "Төгсөгчдийн түүх" / "卒業生の話", ready for Phase 3. Don't add a nav item for it yet.
4. **Knowledge tree.** Remove it from `comingSoonNav` (the page stays reachable by URL). Keep the Store item.

## Don't
- Don't add Articles or Competition sub-items: articles have no category until Phase 3, and `/competition` is built in Phase 1.
- Don't touch the `intership` sub-item; P0-09 renames it.

## Done when
- Click every sidebar and bottom-nav item in all three languages: no 404.
- `/project?type=diploma` opens with the Diploma filter selected; changing the filter changes the URL.
- lint + build pass.
