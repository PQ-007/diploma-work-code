# Database

The schema lives in `supabase/migrations/`. It is the single source of truth: every change is a new migration file
(see CLAUDE.md → Rules). Old schema files are kept for history only in `docs/legacy-schema/`.

Baseline: `20261120164346_baseline.sql`, a `supabase db dump --remote --schema public` of the live project
(Postgres 17) taken on 2026-11-20, kept exactly as dumped. It already includes the old hand-applied
`001_articles_project_id`, `002_security_and_counters` and `003_drop_flashcards`.
`20261120164345_extensions.sql` runs first and creates `pg_trgm`, which the baseline needs.

Later migrations:

| Migration | What it does |
|---|---|
| `20261120165214_enable_rls_unprotected_tables` | P0-10: RLS on `project_updates` and `tag_similarities` |
| `20261120170002_auth_new_user_trigger` | the `auth.users` sign-up trigger the public-only baseline missed |
| `20261120173211_drop_dictionary` | P0-05: drops the 7 Dictionary tables, their 6 functions and `dictionary_status` |
| `20261120175759_project_type_cleanup` | P0-09: `project_type` values `intership` → `internship`, `private` → `personal` |
| `20261120184549_competitions` | P1-01: `competitions`, `competition_entries`, the `competition_results_public` view, staff helper |

Projects: **live** = "Diploma work" (`jzmuodzerajihkrsxpol`), **dev** = "futurehub-dev" (`stfddhjszoguvyvmgnvv`).
`npx supabase migration list --remote` shows which migrations the linked project has.

## Tables (30)

"Code" = which part of the app reads or writes it (`.from("…")`). RLS is enabled on all 30 tables
(`project_updates` and `tag_similarities` since P0-10, with no policies yet — see "Oddities").

### Users
| Table | What it is for | Code |
|---|---|---|
| `profiles` | One row per user (`auth.users.id`): names, avatar, bio, role (`user_type`), `ranking_point`, skills, pinned articles/projects | everywhere: auth, setup, settings, profile, leaderboard, authors on all content |
| `user_follows` | Who follows whom | profile |
| `language_skills` | A user's languages and levels, shown on the profile | profile |

### Articles
| Table | What it is for | Code |
|---|---|---|
| `articles` | An article: author, status (`article_status`), base language, optional `project_id` | articles, profile, projects, leaderboard |
| `article_translations` | Title, subtitle and body per language; per-language view counter | articles, profile, projects |
| `article_translation_sources` | Where a translated article came from: another article or an outside source (URL, title, author) | articles |
| `translation_requests` | Requests to translate an article into another language | articles |
| `article_tags` | Article ↔ tag | articles, profile |
| `article_comments` | Comments on an article | articles, profile |
| `article_reactions` | Likes/reactions on an article | articles, profile |
| `bookmarked_articles` | A user's saved articles | articles, profile |

### Discussions
| Table | What it is for | Code |
|---|---|---|
| `discussions` | A discussion thread | discussions |
| `discussion_comments` | Replies in a thread | discussions |
| `discussion_votes` | Up/down votes (`vote_type`) | discussions |
| `discussion_tags` | Discussion ↔ tag | discussions |
| `discussion_bookmarks` | A user's saved discussions | discussions |
| `polls` | A standalone poll: author, question, end date | **not used** — Polls UI removed in Oct 2026 |
| `poll_options` | Options of a poll | **not used** |
| `poll_votes` | A user's vote in a poll | **not used** |

### Projects
| Table | What it is for | Code |
|---|---|---|
| `projects` | A project: owner, type (`project_type`), status, category, difficulty, `is_public`, likes count | projects, profile |
| `project_members` | Team members and their role (`project_member_role`) | projects |
| `project_files` | Files and links attached to a project | projects |
| `project_likes` | Likes on a project (trigger keeps `projects.likes_count` in sync) | projects |
| `project_comments` | Comments on a project | projects |
| `project_tags` | Project ↔ tag | projects |
| `project_updates` | Devlog entries | **not used** — no code reads it today, although the plan keeps "updates" |

### Shared
| Table | What it is for | Code |
|---|---|---|
| `tags` | The one tag list used by articles, discussions and projects | tags, articles, discussions, projects, profile |
| `tag_similarities` | Pairs of related tags with a score | **not used** — candidate for the rebuilt knowledge tree, or drop |

### Competitions (P1-01)
| Table | What it is for | Code |
|---|---|---|
| `competitions` | A competition: `slug`, `kind`, `status`, `title`/`summary`/`rules` as jsonb `{mn,en,ja}` (mn required), `categories`, `max_team_size`, sign-up and event dates, `results_published` | P1-02 (not yet) |
| `competition_entries` | A contest project entered in one category: `status` (`registered`/`withdrawn`/`disqualified`), `score`, `tiebreak`, `judge_score`, `public_score`, `rank`, `note` | P1-02 (not yet) |

View `competition_results_public`: the entries with their six result columns, returned only when the competition's
`results_published` is true or the caller is staff (otherwise NULL).

Rules:
- **Staff** = `profiles.role` `teacher`, `admin` or `super_admin` (`rls_is_staff`). Staff can do everything, including on `draft` competitions.
- **Anyone** reads non-`draft` competitions and their entries.
- **A project's owner** can enter it, withdraw (`status` → `withdrawn`), re-register and delete the entry, but only while
  the competition is `open` and inside the sign-up window (`rls_competition_signup_open`). The project must be `type = 'contest'`,
  and the category one of the competition's `categories` (trigger `validate_competition_entry`).
- **Results can't be written by students:** the trigger `guard_competition_entry` clears the result columns on their inserts
  and, on their updates, keeps everything except a `registered` ↔ `withdrawn` status change.
- **Results can't be read before publishing:** RLS can't hide columns, and the anon key is public, so `anon` and
  `authenticated` have no SELECT on the six result columns of `competition_entries` itself (column privileges). Read
  results through the view. In API code, select entry columns explicitly (no `*`) and don't `.update().select()` result columns.

### Removed
- **Dictionary** (P0-05, `20261120173211_drop_dictionary`): `dictionary_entries`, `_translations`, `_examples`,
  `_entry_tags`, `_revisions`, `_moderation_actions`, `_saves`. The Dictionary is now a standalone project.
- **Flashcards** (Oct 2026, `docs/legacy-schema/003_drop_flashcards.sql`): `decks`, `flashcards`, `flashcard_reviews`.

## Functions (22)

| Function | Used by |
|---|---|
| `increment_article_view`, `increment_project_view` | the app, via `.rpc()` (view counters that work under RLS) |
| `rls_project_owner`, `rls_project_is_public`, `rls_is_project_member`, `rls_is_project_contributor` | RLS policies on the project tables |
| `guard_profile_privileged_columns` | trigger on `profiles`: users can't change their own role/privileged columns |
| `guard_project_owner` | trigger on `projects`: only the owner can change ownership fields |
| `sync_project_likes` | trigger on `project_likes` → `projects.likes_count` |
| `set_updated_at`, `update_translation_request_timestamp` | `updated_at` triggers on projects, project_comments, discussions, translation_requests |
| `handle_new_user` | trigger `on_auth_user_created` on `auth.users`: creates a `profiles` row for each new user |
| `rls_is_staff`, `rls_competition_visible`, `rls_competition_signup_open` | RLS on the competition tables and the results view |
| `guard_competition_entry`, `validate_competition_entry` | triggers on `competition_entries` (see Competitions) |
| `projects_search_vector_update`, `search_projects`, `recalc_project_progress`, `update_project_likes_count`, `update_updated_at_column` | **nothing** — no trigger, policy or code calls them |

Enums: `article_status`, `project_category`, `project_difficulty`, `project_member_role`,
`project_status`, `project_type` (`diploma`, `contest`, `internship`, `personal`), `user_type` (`admin`, `user`, `teacher`,
`super_admin`), `vote_type`, `competition_kind` (`bot`, `jam`, `other`), `competition_status` (`draft`, `upcoming`, `open`,
`running`, `judging`, `finished`), `competition_entry_status` (`registered`, `withdrawn`, `disqualified`).

Projects: `type` is only the *kind* of project. Who can see a project is decided by `is_public` alone: the API
routes and RLS (`rls_project_is_public`) never look at `type`. The default type is `personal`.

## Not in the baseline (a public-only dump can't see these)

- **The auth trigger that calls `handle_new_user`.** It sits on `auth.users`, outside `public`. Added as its own
  migration, `20261120170002_auth_new_user_trigger.sql` (copied from the live auth schema).
- **Extensions.** Only `pg_trgm` is needed (`idx_projects_title_trgm`, `search_projects`), and
  `20261120164345_extensions.sql` covers it.
- **Storage buckets and policies.** None are needed: the app stores images on Cloudinary.
- **Auth settings** (providers, email templates, redirect URLs) live in the dashboard, not in SQL.

## Oddities noticed (not fixed)

- **`project_updates` and `tag_similarities` had RLS disabled and `GRANT ALL … TO anon`**, so anyone holding the
  public anon key could read and change them. Fixed by `20261120165214_enable_rls_unprotected_tables.sql` (P0-10):
  RLS on, no policies (deny-all), because nothing uses them. Add policies when the project devlog is built.

- `translation_requests` has two `updated_at` triggers doing the same job
  (`trg_translation_request_updated` and `trg_translation_requests_updated_at`).
- `projects.search_vector` has an update function but no trigger, so it is never filled.
- `article_status` spells `archieved` (sic).

## Applying migrations

Install: the CLI is a dev dependency, so use `npx supabase …`. `supabase db dump` also needs Docker or Podman.

**The existing (live) project** already has everything in the two baseline-day migrations. Mark them as applied
once, so `db push` never tries to re-run them:

```bash
npx supabase link --project-ref <live project ref>
npx supabase migration repair --remote --status applied 20261120164345 20261120164346
```

**A new project (e.g. dev):**

```bash
npx supabase link --project-ref <dev project ref>
npx supabase db push --remote   # applies every migration in order
```

Then point `.env.local` at the dev project (keep the live values in `.env.live.local`) and, for testing,
turn off "Confirm email" under Authentication → Sign In / Providers → Email.

**Every later change:** `npx supabase migration new <short_name>`, write the SQL (new tables get RLS + policies in
the same file), test with `npx supabase db push --remote` while linked to dev, then link the live project and push there.
