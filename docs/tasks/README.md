# Task files

One task = one branch = one fresh Claude Code session.

```
/plan Do docs/tasks/<file>.md. Follow CLAUDE.md.
```

Review the plan → approve → review the diff → test in the browser → commit → merge.

**Branches:** cut every task branch from `relaunch` and merge it back into `relaunch`.
Nothing goes into `main` until the site is declared usable.

## Before you start (you, not Claude)

1. **Wake the Supabase project.** On 2026-11-20 its hostname (`jzmu….supabase.co`) no longer resolved, so it is
   probably paused again (free projects pause after about a week idle). Supabase dashboard → the project → Restore.
   Every DB task (P0-02, P0-05, P0-09) is blocked until this is done.
2. **Dev project.** There is only one Supabase project today, and the live site uses it. P0-02 only *reads* from it
   (a schema dump). After P0-02 is merged, create a second free project as **dev**, apply the baseline migration to it
   (this also proves the baseline works), and point `.env.local` at dev. P0-05 and P0-09 run against dev only.
3. The non-code Phase 0 items (department meeting, consent rule, translators, content) are in `docs/PLAN.md`.

## Phase 0 order

| # | Task | Touches DB? | Order / parallel |
|---|------|-------------|------------------|
| P0-01 | Untrack local Claude files | No | anything |
| P0-02 | Migrations baseline | **Yes — you run the dump** | first DB task |
| P0-04 | Remove Dictionary (code) | No | parallel with P0-01, P0-02 |
| P0-05 | Drop Dictionary tables | **Yes** | after P0-02 and P0-04 |
| P0-08 | Navigation cleanup | No | after P0-04 (both edit `components/navigation/nav.ts`) |
| P0-09 | Project type + visibility cleanup | **Yes** | last — after P0-02 and P0-08 (also edits `nav.ts`) |
| P0-10 | Enable RLS on unprotected tables (security fix) | **Yes — pushed to live** | right after P0-02, before linking to dev |

DB tasks run one at a time, against the **dev** Supabase project, never production.
Parallel tasks: use separate git worktrees (`git worktree add ../fh-p0-04 -b p0-04 relaunch`).

## Already done on `relaunch` (checked against the code on 2026-11-20)

These were done during the October relaunch, so they have no task file:

- **P0-03 Bookmark table mismatch** — `article_bookmarks` appears nowhere; the stats route reads `bookmarked_articles`.
- **P0-06 Learn hub** — `app/learn/` and `lib/data/courses.ts` are deleted; no `/learn` links remain.
- **P0-07 Project-management tools** — Kanban, Gantt, Section editor and Milestones are deleted; no code reads
  `project_sections` or `project_milestones`.
- **Flashcards** (the first half of the old P0-04 and P0-05) — all flashcard code is deleted, and
  `003_drop_flashcards.sql` (now in `docs/legacy-schema/`) has dropped `decks`, `flashcards` and `flashcard_reviews`.
- **Placeholder-project fallback** (listed in Phase 1 of the plan) — `/project/[slug]` now shows "not found".
- **Store** shows a "Coming soon" page; **Knowledge tree** is a "Coming soon" page too (the hand-made graph is gone).

The state before all of these cuts is kept in the git tag `archive/full-platform`.
