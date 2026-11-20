# P1-03 Competition pages and sign-up

## Requires
P1-02.

## Goal
Public competition pages that look like the rest of the site (shadcn components, `docs/design-system.md`), in mn/en/ja.

## Do
- Nav: add `{ titleKey: "sidebar.competitions", href: "/competition", icon: Trophy }` to `primaryNav` in
  `components/navigation/nav.ts` (after Projects). The key `sidebar.competitions` already exists in all three locales
  ("Competitions" / "Тэмцээн" / "コンペティション"). The bottom nav (`components/navigation/BottomNav.tsx`, `grid-cols-5`)
  then has exactly 5 items: check the labels still fit at 360px.
- `/competition` — tabs Upcoming · Open · In progress · Finished, synced with `?status=` (same pattern as the project type
  filter in `app/project/page.tsx`). "In progress" = `running` + `judging` (`?status=running,judging`), so every
  non-draft status shows in exactly one tab.
  Card: cover, title, kind badge (Bot / Game jam), dates, entry count, status. Empty state per tab.
- `/competition/[slug]`:
  - header: title, kind, status, key dates (sign-up closes, competition day) with relative time ("in 12 days")
  - Rules (markdown, rendered the way articles render their body: `compileMdx` from `mdx/mdx-editor/MdxCompiler`
    with `components` from `mdx/mdx-components`, see `app/article/[slug]/page.tsx`)
  - Entries: per category, team name (= project title), members' avatars, link to the project
  - Sign-up button when open: dialog → pick category → pick one of my contest projects **or** create a new one (title, short description);
    after success show "You're in" and a link to add teammates. Members are managed in the project **edit form**
    (`app/project/create/sections/ProjectMembersSection.tsx`), so link to `/project/create?edit=<slug>`, not the project page
  - My entry: withdraw button while open; after withdrawing, signing up again re-registers the same entry (P1-02)
  - Results (when published): table per category — rank, team, score, tiebreak, note; top 3 highlighted
- Not found / draft → the normal 404 page.
- Logged out → sign-up button sends to `/signin?redirect=/competition/<slug>`. **This needs new code:** today sign-in
  ignores any return parameter (`components/AuthSplitPage.tsx` always goes to `/` or `/setup`, although `proxy.ts`
  already sets `redirect=`). Make sign-in go to `redirect` after success when it is a same-site path (starts with `/`,
  not `//`); otherwise keep today's behaviour. That also fixes the existing `proxy.ts` redirects.
- All strings in the three locale files.
- Page metadata (title, description, OG image = cover) for sharing: the site's detail pages are client components
  (`"use client"`, e.g. `app/project/[slug]/page.tsx`), which can't export metadata. Add a server
  `app/competition/[slug]/layout.tsx` with `generateMetadata` that loads the competition, and keep the page itself a client component.

## Done when
- Full flow on dev with two test accounts: see competition → sign up with new project → add teammate → second account sees the team → withdraw → sign up again.
- Looks right on a phone width.
- lint + build pass.
