# Phase 1 — Bot competition ready (deadline Dec 23)

Goal: by **Dec 23** the bot competition (Week 8, **Wed Jan 6, 2027**) has a public page where teams sign up,
and after Jan 6 organizers paste the runner's results and publish them.

| # | Task | Repo | DB? | Depends on |
|---|------|------|-----|-----------|
| P1-01 | Competition schema | site | **Yes** | — |
| P1-02 | Competition API | site | No | P1-01 |
| P1-03 | Competition pages + sign-up | site | No | P1-02 |
| P1-04 | Organizer tools + results import | site | No | P1-02 (parallel with P1-03) |
| P1-05 | Bot competition launch on live | site | **Yes (data)** | P1-03, P1-04 |
| P1-06 | Bot runner | **club repo** | — | — (start now, parallel) |

The runner (P1-06) writes a `results.csv` in the exact format P1-04 imports. Agree on it once, don't change it.

Suggested dates: P1-01 → Nov 27 · P1-02 → Dec 1 · P1-03/P1-04 → Dec 12 · P1-05 → Dec 20 (3-day buffer) ·
P1-06 → students test it from Dec 14.
