# P0-09 Project type and visibility cleanup

## Requires
P0-02 and P0-08 merged. Run alone, on the dev project.

## Goal
Three overlapping fields decide visibility today (`is_public`, `status = draft`, `type = private`),
and the enum has a typo (`intership`). Make each field mean one thing:
- `is_public` + `status` → who can see it
- `type` → what kind of project it is: `diploma | contest | internship | personal`

## Do
- Migration `supabase/migrations/<YYYYMMDDHHMMSS>_project_type_cleanup.sql`:
  - for rows with `type = 'private'`, set `is_public = false` first, so nothing private becomes visible
  - rename enum value `intership` → `internship` and `private` → `personal` (`ALTER TYPE … RENAME VALUE`)
  - keep the column default valid (`'personal'`)
  - check the baseline's RLS policies and functions (`rls_project_is_public` etc.) for any reference to
    `'private'` or `'intership'` and update them in the same migration
- Code (known on 2026-11-20 — verify with grep):
  - `app/api/projects/route.ts` — the type list (lines 9–10) and the `"private"` defaults (~lines 170, 203)
  - `app/project/page.tsx:25-26` — the filter options
  - `app/project/create/useProjectForm.ts` — the default type (~lines 73, 143)
  - `app/project/create/sections/ProjectInfoSidebar.tsx:20` — the type options
  - `components/common/StatusBadge.tsx` — the `projectType` map (~lines 32–37)
  - `components/navigation/nav.ts:31,35` — the comment and the `/project?type=intership` link
  - `lib/types/database.ts:1559` — the `project_type` enum (edit by hand; don't regenerate the whole file)
  - any API filter that checks `type = 'private'` for visibility — visibility checks must use `is_public` / `status` only
- Locale keys (flat keys inside `project`, all three locales):
  `typeValue.intership` → `typeValue.internship`, `typeValue.private` → `typeValue.personal`.

## Done when
- `grep -rn "intership\|'private'\|\"private\"" app lib components` returns nothing project-related.
- A non-public project is invisible when logged out; a public one is visible; creating each type works.
- The migration applies cleanly on dev; lint + build pass.
