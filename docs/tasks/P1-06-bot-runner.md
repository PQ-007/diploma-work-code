# P1-06 Bot runner (club repo, not the website)

This task goes in the **DP club repo** that students fork. Copy this file there.

## Goal
A C++ harness where a student writes **one function** and the organizer runs every bot on the same secret sequences.

## Decide first (you)
- Which grid game: 2048, a Tetris-like, or a block puzzle. The harness below is game-agnostic; pick before Dec 1.
- N secret sequences (e.g. 5) and the per-move time limit (e.g. 50 ms).

## Do
- `game/` — the game rules as a pure state machine: `State`, `legal_moves(State)`, `apply(State, Move, Rng&)`, `is_over(State)`, `score(State)`.
  Randomness only through a seeded RNG, so a seed fully defines a game.
- `bot/my_bot.cpp` — the only file students edit: `Move choose_move(const State& s);` Starter version: random legal move.
- `runner/` — `runner --bots bots/ --seeds seeds.txt --time-limit-ms 50 --out results.csv`
  - loads each bot (one compiled executable per bot talking over stdin/stdout is simplest and safest — a crash can't kill the runner)
  - plays every seed, enforces the time limit (timeout = forfeit that move or end that game; write it down in the rules)
  - writes `results.csv` exactly as the website imports it: `entry_id,category,score,tiebreak_ms,note`
    (`score` = average over seeds, `tiebreak_ms` = total thinking time, `note` = timeouts/crashes); bots are named by `entry_id` from the site's export
  - optional: `--replay dir/` writes one JSON per game (seed, moves) for a future replay viewer
- `practice` mode: students run their bot on public seeds and see their score, so they can improve before the day.
- `README` in Mongolian + English: how to build (CMake), how to test, the rules.

## Done when
- Starter bot and a slightly smarter sample bot both run; the sample bot scores higher.
- Two club members build and run it on their own machines by Dec 14.
