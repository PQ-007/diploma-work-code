# P0-01 Untrack local Claude files

## Goal
Two personal, machine-local paths are committed: `.claude/settings.local.json` and `.claude/worktrees/crazy-ptolemy-2d3d0b`
(a gitlink pointing at an old Claude worktree). Stop tracking them.

## Do
- Add `.claude/settings.local.json` and `.claude/worktrees/` to `.gitignore` (misc section).
- `git rm --cached .claude/settings.local.json` (keep the file on disk).
- `git rm --cached .claude/worktrees/crazy-ptolemy-2d3d0b` (keep whatever is on disk).
- `.gitignore` lists only `.env.local` for env files. Add `.env` and `.env*.local` if missing. Do not delete any env file.
- Keep `.claude/settings.json` tracked (shared project settings).

## Don't
- Don't change any other file.

## Done when
- `git status` shows both paths removed from the index and still present on disk.
- `git ls-files | grep -E "settings.local|worktrees|\.env"` prints nothing.
