# P1-01 Competition schema

## Goal
Tables for competitions and their entries, safe enough that a student can't edit scores.
An entry is a **contest project** (`projects.type = 'contest'`), so the team = that project's `project_members`.

## Do — one migration `<timestamp>_competitions.sql`
1. Helper `public.rls_is_staff(p_user_id uuid) returns boolean` — true when `profiles.role` is
   `teacher`, `admin` or `super_admin`. `SECURITY DEFINER`, `STABLE`, `search_path = public`, like the existing `rls_*` helpers.
   The real `user_type` enum is `admin, user, teacher, super_admin` (baseline). `lib/types/database.ts` is stale
   (`user | admin | moderator`); fix that one line by hand to match.
2. Enums: `competition_kind` (`bot`, `jam`, `other`); `competition_status` (`draft`, `upcoming`, `open`, `running`, `judging`, `finished`);
   `competition_entry_status` (`registered`, `withdrawn`, `disqualified`).
   Meaning, used by P1-02/P1-03: `draft` = staff only · `upcoming` = announced, sign-up not open yet · `open` = sign-up ·
   `running` = competition day · `judging` = scoring · `finished` = over (results shown when `results_published`).
3. `competitions`:
   `id bigint identity pk`, `slug text unique not null`, `kind`, `status default 'draft'`,
   `title jsonb not null` and `summary jsonb` and `rules jsonb` (each `{"mn": "...", "en": "...", "ja": "..."}`, markdown allowed in `rules`),
   `cover_url text`, `categories text[] not null default '{}'` (e.g. `{bot,human_vs_bot}`),
   `max_team_size int not null default 3 check (>= 1)`,
   `signup_opens_at`, `signup_closes_at`, `starts_at`, `ends_at` (timestamptz),
   `results_published boolean not null default false`, `created_by uuid → profiles`, `created_at`, `updated_at` (reuse `set_updated_at` trigger).
4. `competition_entries`:
   `id bigint identity pk`, `competition_id → competitions on delete cascade`, `project_id → projects on delete cascade`,
   `category text not null`, `status competition_entry_status default 'registered'`,
   `score numeric`, `tiebreak numeric` (lower is better, e.g. total thinking ms), `judge_score numeric`, `public_score numeric`,
   `rank int`, `note text` (organizer note, e.g. "crashed on seq 3"), `created_at`, `updated_at`;
   `unique (competition_id, project_id, category)`; check that `category = any(competition.categories)` via trigger.
5. Guard trigger on `competition_entries` (pattern: `guard_profile_privileged_columns`, which checks
   `current_user IN ('anon', 'authenticated')`): when the caller is not staff,
   - on INSERT: `score`, `tiebreak`, `judge_score`, `public_score`, `rank`, `note` are forced to null and `status` to `registered`;
   - on UPDATE: only `status` may change, and only between `registered` and `withdrawn` (withdraw, and re-register after
     withdrawing — see P1-02). Every other column keeps its old value; `disqualified` stays staff-only.
6. RLS:
   - `competitions`: anyone reads rows with `status <> 'draft'`; staff read/insert/update/delete everything.
   - `competition_entries`: anyone reads entries of non-draft competitions; scores/rank are only exposed when
     `results_published` — do this with a view `competition_results_public` or by nulling in the API (pick one, explain);
     insert, update (withdraw — the guard limits it to `status`) and delete by the owner of the project
     (`rls_project_owner(project_id) = auth.uid()` — the helper returns the owner's uuid, not a boolean) only while the
     competition is `open` and now is between `signup_opens_at` and `signup_closes_at`; staff do anything.
     Put the "open and inside the sign-up window" check in one helper, e.g. `rls_competition_signup_open(p_competition_id)`.
7. Indexes: `competition_entries(competition_id)`, `competitions(status)`.
8. Update `docs/DATABASE.md` (new "Competitions" section).

## Don't
- No points/rank logic (Phase 3). No clubs table (later). Don't touch existing tables except adding nothing to `projects`.

## Done when
- Migration applies cleanly on **dev**.
- Test in SQL editor as a normal user: can sign up own contest project while open; cannot set `score`; can withdraw
  (status → `withdrawn`) but cannot set `disqualified` or change the category; cannot sign up after `signup_closes_at`;
  cannot read a draft competition. As staff: can do all of it.
- The CLI is linked to dev (`cat supabase/.temp/project-ref` = `stfddhjszoguvyvmgnvv`) before `npx supabase db push --remote`.
