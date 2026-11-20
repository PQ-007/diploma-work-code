# Task files

One task = one branch = one fresh Claude Code session.

```
/plan Do docs/tasks/<file>.md. Follow CLAUDE.md.
```

Review the plan → approve → review the diff → test in the browser → commit → merge.

## Phase 0 order

| # | Task | Touches DB? | Can run in parallel with |
|---|------|-------------|--------------------------|
| P0-01 | Untrack local Claude settings | No | anything |
| P0-02 | Migrations baseline | **Yes — you run the dump** | nothing (do first of the DB tasks) |
| P0-03 | Fix bookmark table mismatch | No | P0-01, P0-06 |
| P0-04 | Remove Flashcards + Dictionary (code) | No | P0-06 |
| P0-05 | Drop Flashcards + Dictionary tables | **Yes** | nothing — after P0-02 and P0-04 |
| P0-06 | Delete Learn hub | No | P0-01, P0-03, P0-04 |
| P0-07 | Remove project-management tools | No (reads/writes removed in code only) | P0-01, P0-03 |
| P0-08 | Sidebar + navigation cleanup | No | after P0-04, P0-06 (same sidebar file) |
| P0-09 | Project type + visibility cleanup | **Yes** | nothing — last |

DB tasks run one at a time, against the **dev** Supabase project, never production.
Parallel tasks: use separate git worktrees (`git worktree add ../fh-p0-03 -b p0-03`).
