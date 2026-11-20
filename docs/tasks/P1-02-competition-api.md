# P1-02 Competition API

## Requires
P1-01 applied on dev.

## Goal
Route handlers in the same style as `app/api/projects/` (Supabase server client, `auth.getUser()`, JSON errors with proper status codes).

## Do
- `GET /api/competitions?status=…` — list, newest first. `status` takes one or more non-draft statuses, comma-separated
  (`upcoming`, `open`, `running`, `judging`, `finished`; e.g. `?status=running,judging` for P1-03's "In progress" tab);
  no `status` = all non-draft. Title/summary in the visitor's language with fallback mn → en → ja: the site's language
  is the `lang` **cookie**, read with `resolveLanguage(cookies().get(LANG_COOKIE)?.value, headers().get("accept-language"))`
  from `lib/language.ts` (same as `app/layout.tsx`); an explicit `?lang=` may override it.
- `POST /api/competitions` — staff only; create (status `draft`).
- `GET /api/competitions/[slug]` — detail + categories + entries with project title/slug/thumbnail and team members
  (`project_members` → profiles: user_name, display_name, avatar_url). Scores/rank only when `results_published` or caller is staff.
- `PUT /api/competitions/[slug]` — staff only; edit fields, change status, toggle `results_published`.
- `POST /api/competitions/[slug]/entries` — sign up. Body: `{ category, projectId }` **or** `{ category, newProject: { title, description } }`.
  With `newProject`, create a `contest` project owned by the caller. The create logic is inline in `POST` of
  `app/api/projects/route.ts` (insert project, add the owner to `project_members` with role `owner`, tags): extract it into a
  helper (e.g. `lib/api/projects/createProject.ts`) used by both routes — don't duplicate it. Then create the entry.
  Reject when not open, wrong category, team > `max_team_size`, or caller isn't the project owner.
  If the same project already has a `withdrawn` entry in that category, set it back to `registered` instead of
  inserting (the unique key would reject a second row; P1-01 lets owners switch `registered` ↔ `withdrawn` while open).
  Team size = `project_members` count; the owner is already a member (role `owner`), so don't add 1.
- `DELETE /api/competitions/[slug]/entries/[id]` — withdraw (owner, while open). An **UPDATE** of `status` to `withdrawn`
  (P1-01 allows owners exactly this), not a row delete, so the history stays.
- `PUT /api/competitions/[slug]/results` — staff only; body `{ entries: [{ id, score, tiebreak, judge_score, public_score, note, status }] }`;
  then recompute `rank` per category: `score` desc, then `tiebreak` asc; disqualified/withdrawn get no rank; equal score+tiebreak share a rank.
- Types in `lib/types/competition.ts`; TanStack Query hooks in `lib/hooks/queries/useCompetitions.ts` and `lib/hooks/mutations/useCompetitionEntry.ts`.

## Done when
- Each route tested with curl or a quick script against dev, including the rejections above.
- lint + build pass.
