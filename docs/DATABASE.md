# Database

The schema lives in `supabase/migrations/`. It is the single source of truth: every change is a new migration file
(see CLAUDE.md → Rules). Old schema files are kept for history only in `docs/legacy-schema/`.

Baseline: `20261120164346_baseline.sql`, a `supabase db dump --remote --schema public` of the live project
(Postgres 17) taken on 2026-11-20, kept exactly as dumped. It already includes the old hand-applied
`001_articles_project_id`, `002_security_and_counters` and `003_drop_flashcards`.
`20261120164345_extensions.sql` runs first and creates `pg_trgm`, which the baseline needs.

## Tables (35)

"Code" = which part of the app reads or writes it (`.from("…")`). RLS is enabled on 33 of the 35 tables;
**`project_updates` and `tag_similarities` have no RLS** (see "Oddities").

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

### Dictionary — slated for removal (P0-05)
The Dictionary code was removed in P0-04. These tables, and everything that only they use, are dropped in P0-05.

| Table | What it is for |
|---|---|
| `dictionary_entries` | A term (uses the `dictionary_status` enum and a `pg_trgm` index) |
| `dictionary_translations` | A term's definition in another language |
| `dictionary_examples` | Example sentences for a term |
| `dictionary_entry_tags` | Term ↔ tag |
| `dictionary_revisions` | Proposed edits to a term |
| `dictionary_moderation_actions` | Moderator decisions on terms and revisions |
| `dictionary_saves` | A user's saved terms |

## Functions (23)

| Function | Used by |
|---|---|
| `increment_article_view`, `increment_project_view` | the app, via `.rpc()` (view counters that work under RLS) |
| `rls_project_owner`, `rls_project_is_public`, `rls_is_project_member`, `rls_is_project_contributor` | RLS policies on the project tables |
| `guard_profile_privileged_columns` | trigger on `profiles`: users can't change their own role/privileged columns |
| `guard_project_owner` | trigger on `projects`: only the owner can change ownership fields |
| `sync_project_likes` | trigger on `project_likes` → `projects.likes_count` |
| `set_updated_at`, `update_translation_request_timestamp` | `updated_at` triggers on projects, project_comments, discussions, translation_requests |
| `handle_new_user` | creates a `profiles` row for a new auth user — see "Not in the baseline" below |
| `check_dictionary_duplicates`, `search_dictionary`, `suggest_dictionary_terms`, `increment_dictionary_view`, `sync_dictionary_saves`, `update_dictionary_updated_at` | Dictionary only — dropped in P0-05 |
| `projects_search_vector_update`, `search_projects`, `recalc_project_progress`, `update_project_likes_count`, `update_updated_at_column` | **nothing** — no trigger, policy or code calls them |

Enums: `article_status`, `dictionary_status`, `project_category`, `project_difficulty`, `project_member_role`,
`project_status`, `project_type` (with the `intership` typo and `private`, fixed in P0-09), `user_type`, `vote_type`.

## Not in the baseline (a public-only dump can't see these)

- **The auth trigger that calls `handle_new_user`.** It sits on `auth.users`, outside `public`. Without it, a
  fresh project won't create a profile on sign-up. Check its exact name in the dashboard
  (Database → Triggers, schema `auth`) and add it to the dev project as its own migration. It is usually:
  `create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();`
- **Extensions.** Only `pg_trgm` is needed, and `20261120164345_extensions.sql` covers it.
- **Storage buckets and policies.** None are needed: the app stores images on Cloudinary.
- **Auth settings** (providers, email templates, redirect URLs) live in the dashboard, not in SQL.

## Oddities noticed (not fixed)

- **`project_updates` and `tag_similarities` have RLS disabled and `GRANT ALL … TO anon`.** No app code uses them,
  but anyone holding the public anon key (it ships in the site's JavaScript) can read, insert, update and delete
  their rows through the Supabase REST API. Fix soon with a migration that enables RLS (or drops the tables).

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

Then add the auth trigger (see above) and point `.env.local` at the dev project.

**Every later change:** `npx supabase migration new <short_name>`, write the SQL (new tables get RLS + policies in
the same file), test with `npx supabase db push --remote` while linked to dev, then link the live project and push there.
