# P1-03 Competition pages and sign-up

## Requires
P1-02.

## Goal
Public competition pages that look like the rest of the site (shadcn components, `docs/design-system.md`), in mn/en/ja.

## Do
- Nav: add `{ titleKey: "sidebar.competition", href: "/competition", icon: Trophy }` to `primaryNav` in
  `components/navigation/nav.ts` (after Projects). Check the bottom nav on phones still fits.
- `/competition` — tabs Upcoming · Open · Finished, synced with `?status=` (same pattern as the project type filter).
  Card: cover, title, kind badge (Bot / Game jam), dates, entry count, status. Empty state per tab.
- `/competition/[slug]`:
  - header: title, kind, status, key dates (sign-up closes, competition day) with relative time ("in 12 days")
  - Rules (markdown, rendered with the site's existing markdown/MDX renderer)
  - Entries: per category, team name (= project title), members' avatars, link to the project
  - Sign-up button when open: dialog → pick category → pick one of my contest projects **or** create a new one (title, short description);
    after success show "You're in" and a link to add teammates on the project page
  - My entry: withdraw button while open
  - Results (when published): table per category — rank, team, score, tiebreak, note; top 3 highlighted
- Not found / draft → the normal 404 page. Logged out → sign-up button sends to `/signin?next=…`.
- All strings in the three locale files. Page metadata (title, description, OG image = cover) for sharing.

## Done when
- Full flow on dev with two test accounts: see competition → sign up with new project → add teammate → second account sees the team → withdraw → sign up again.
- Looks right on a phone width.
- lint + build pass.
