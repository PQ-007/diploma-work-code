# P0-01 Untrack local Claude settings

## Goal
`.claude/settings.local.json` is a personal, machine-local file but it is committed. Stop tracking it.

## Do
- Add `.claude/settings.local.json` to `.gitignore` (misc section).
- `git rm --cached .claude/settings.local.json` (keep the file on disk).
- Check that `.env*` files other than examples are ignored; `.gitignore` currently only lists `.env.local`.
  Add `.env` and `.env*.local` if missing. Do not delete any env file.
- Keep `.claude/settings.json` tracked (shared project settings).

## Don't
- Don't change any other file.

## Done when
- `git status` shows the file removed from the index and still present on disk.
- `git ls-files | grep -E "settings.local|\.env"` prints nothing sensitive.
