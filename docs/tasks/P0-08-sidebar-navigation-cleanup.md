# P0-08 Sidebar and navigation cleanup

## Requires
P0-04 and P0-06 merged (they also edit the sidebar).

## Goal
No sidebar link may 404 or show the fake placeholder project.

## Context
`components/sidebar-collection/Left/LeftSidebar.tsx`. Today these links point at routes that don't exist:
- `/competition/ongoing`, `/competition/upcoming`, `/competition/past`
- `/article/internship`, `/article/post-grad` — caught by `/article/[slug]` → "not found"
- `/project/graduation`, `/project/contest` — caught by `/project/[slug]` → fake placeholder project

## Do
1. Projects: `/project?type=diploma` and `/project?type=contest`. In `app/project/page.tsx`, initialise
   `typeFilter` from the `type` search param (`useSearchParams`) and keep the URL in sync when the filter changes.
   Rename the sub-item label key `sidebar.graduation` → keep the key, change the text to "Diploma works" / "Дипломын ажил" / "卒業研究".
2. Competition: remove the three sub-items; keep the single `/competition` item (status tabs come in Phase 1).
3. Articles: remove the `internship` and `post-grad` sub-items for now (articles have no category column yet; they return in Phase 3).
   Rename the locale key `sidebar.post-grad` → `sidebar.alumni` in all three locales, text "Alumni stories" / "Төгсөгчдийн түүх" / "卒業生の話", ready for Phase 3.
4. Knowledge tree: remove from the sidebar (page stays reachable by URL).
5. Store: keep the item, but `/store` shows a "Coming soon" state instead of the product grid
   (translated text in all three locales; keep the product code commented out or behind a flag — don't delete it).

## Done when
- Click every sidebar item in all three languages: no 404, no placeholder project.
- `/project?type=diploma` opens with the Diploma filter selected.
- lint + build pass.
