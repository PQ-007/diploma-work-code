# P0-09 Project type and visibility cleanup

## Requires
P0-02 merged. Run alone, on the dev project.

## Goal
Three overlapping fields decide visibility today (`is_public`, `status = draft`, `type = private`),
and the enum has a typo (`intership`). Make each field mean one thing:
- `is_public` + `status` → who can see it
- `type` → what kind of project it is: `diploma | contest | internship | personal`

## Do
- Migration `<timestamp>_project_type_cleanup.sql`:
  - rename enum value `intership` → `internship` (`ALTER TYPE … RENAME VALUE`)
  - rename enum value `private` → `personal`
  - for rows that had `type = 'private'`, set `is_public = false` before the rename, so nothing private becomes visible
  - keep the column default valid (`'personal'`)
- Code: update `app/project/types.ts`, the type options in `app/project/page.tsx` and `app/project/create/page.tsx`,
  the label map in `app/project/[slug]/page.tsx`, and any API filter that checks `type = 'private'` for visibility —
  visibility checks must use `is_public`/`status` only.
- Locale keys: `project.typeValue.intership` → `internship`, `private` → `personal` (all three locales).
- Check RLS policies in the baseline for any reference to `type = 'private'` and update them in the same migration.

## Done when
- `grep -rn "intership\|'private'\|\"private\"" app lib` returns nothing project-related.
- A non-public project is invisible when logged out; a public one is visible; creating each type works.
- Migration applies cleanly on dev; lint + build pass.
