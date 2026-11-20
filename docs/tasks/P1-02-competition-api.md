# P1-02 Competition API

## Requires
P1-01 applied on dev.

## Goal
Route handlers in the same style as `app/api/projects/` (Supabase server client, `auth.getUser()`, JSON errors with proper status codes).

## Do
- `GET /api/competitions?status=upcoming|open|running|finished` — list, newest first; title/summary in the requested `lang` with fallback mn → en → ja.
- `POST /api/competitions` — staff only; create (status `draft`).
- `GET /api/competitions/[slug]` — detail + categories + entries with project title/slug/thumbnail and team members
  (`project_members` → profiles: user_name, display_name, avatar_url). Scores/rank only when `results_published` or caller is staff.
- `PUT /api/competitions/[slug]` — staff only; edit fields, change status, toggle `results_published`.
- `POST /api/competitions/[slug]/entries` — sign up. Body: `{ category, projectId }` **or** `{ category, newProject: { title, description } }`.
  With `newProject`, create a `contest` project owned by the caller (reuse the projects create logic, don't duplicate it — extract a helper if needed),
  then the entry. Reject when not open, wrong category, team (project_members count) > `max_team_size`, or caller isn't the project owner.
- `DELETE /api/competitions/[slug]/entries/[id]` — withdraw (owner, while open) → sets status `withdrawn`.
- `PUT /api/competitions/[slug]/results` — staff only; body `{ entries: [{ id, score, tiebreak, judge_score, public_score, note, status }] }`;
  then recompute `rank` per category: `score` desc, then `tiebreak` asc; disqualified/withdrawn get no rank; equal score+tiebreak share a rank.
- Types in `lib/types/competition.ts`; TanStack Query hooks in `lib/hooks/queries/useCompetitions.ts` and `lib/hooks/mutations/useCompetitionEntry.ts`.

## Done when
- Each route tested with curl or a quick script against dev, including the rejections above.
- lint + build pass.
