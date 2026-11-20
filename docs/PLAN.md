# FutureHub — Site Structure & Build Plan

Nov 18, 2026 · @Bilguuntushig

## Summary

FutureHub already has 6 working sections it keeps. The next 5 months are for finishing, not adding: make 2 mock sections real, add Clubs and the public department pages, cut the static Learn hub and the project-management tools, turn ranks into a real points system (the Store opens after launch), and make it live.

The idea in one line: a multilingual (mn / en / ja) platform where CS students **learn → write and share → build and showcase → compete**. Every section should fit one of those four verbs. A section that fits none is a candidate to cut.

**Decided: this is the department's official site, with two audiences.**

- **Visitors, including foreign visitors** — see students' work, the latest news and events, competitions the department held and their results, and outside competitions our students took part in.
- **Students** — a learning and co-working space: learn, show their work, read real-world development write-ups and alumni (senpai) stories after KOSEN, and upload their diploma work so juniors (kouhai) can learn from it. Take knowledge, grow, and share skills and experience freely.

| Decision | Sections | Why |
| --- | --- | --- |
| Keep, polish only | Feed, Articles, Discussions + Polls, Profiles, Library, Auth + Setup + Settings | Real Supabase data and API routes already work |
| Finish | Projects, Competition, ranking + points (Store after launch) | Projects falls back to a fake placeholder project. Competition is hard-coded. Ranks have no earning rules and the Store has no data model yet |
| Add | Clubs (seasons, sessions, members), project ratings, Play tab for web games; public pages: About, News & Events, Alumni stories, Diploma archive | Needed for the DP club showcase and archive; gives the site its first real users. The public pages are what makes it the official site |
| Delete | Learn hub and its sub-pages + `lib/data/courses.ts`; Kanban, Gantt and Section editor on project pages | \~3,300 lines of hard-coded content to maintain by hand; project-management tools don't belong on a showcase site and need 2 missing tables |
| Hide for now | Knowledge tree | Hand-made graph. Could be rebuilt later from real article tags (`tag_similarities`) |

**Removed from this site:** Flashcards (your standalone SRS web app and browser extension already does this better) and the technical-term Dictionary (it becomes its own, bigger standalone project with human-made translations). **Later, after launch:** Articles call the Dictionary's API to show a translation or explanation when a reader hovers over a term.

## Site structure

16 sections in total: 6 are real, 1 is partial, 4 are static or mock, 5 don't exist yet. The new public sections reuse existing tables, so they're mostly pages, not new backend. Grouped by the four student verbs plus Show for visitors; status checked against the repo on 2026-11-18, and the Status column corrected against the `relaunch` branch on 2026-11-20.

| Verb | Section | Routes | Data source | Status |
| --- | --- | --- | --- | --- |
| — | Home / Feed | `/` | articles, discussions, polls via API. Visitors should see news, events and featured projects first | Real, needs a public version |
| Show | About the department | `/about` | Static MDX: programs, staff, labs, contact. Staff = profiles with role `staff` | Missing |
| Show | News & Events | `/news` `/news/[slug]` | Articles with category `news` or `event` + an event date. Covers events held here and outside competitions students joined | Missing |
| Show | Alumni stories | `/alumni` | Articles with category `alumni`, written by profiles with role `alumni` + graduation year | Missing |
| Show | Diploma archive | `/diploma` (filter by year) | Projects of kind `diploma` + graduation year + supervisor; thesis PDF in project files | Missing |
| — | Auth and onboarding | `/signin` `/signup` `/forgot-password` `/auth/reset-password` `/setup` `/settings` | Supabase Auth, profiles | Real |
| Learn | Learn hub | `/learn` `/learn/algorithm` `/learn/data-structure` `/learn/programming-lang` `/learn/resources` `/learn/[slug]` | Hard-coded arrays + `lib/data/courses.ts` | Deleted (Oct 2026) |
| Learn | Knowledge tree | `/knowledge-tree` | Hard-coded graph | "Coming soon" page; P0-08 takes it out of the sidebar |
| Share | Articles | `/article` `/article/create` `/article/[slug]` | articles + comments, reactions, tags, translations, bookmarks. Add a category: `tech` (new ideas and theories), `case-study` (real-world dev problems), `news`, `event`, `alumni` | Real |
| Share | Discussions + Polls | `/discussions` | discussions, polls + votes, comments, bookmarks | Real; Polls removed in Oct 2026 |
| Share | Library | `/library` | the user's saved items via API | Removed in Oct 2026 (code kept in tag `archive/full-platform`) |
| Build | Projects | `/project` `/project/create` `/project/[slug]` | projects + members, files, likes, comments, updates, milestones, sections | Real: milestones, sections and the placeholder fallback already removed |
| Build | Clubs | `/club/[slug]` `/club/[slug]/[season]` `/club/[slug]/[season]/report` | new tables, see Clubs module | Missing |
| Compete | Competition | `/competition` | Hard-coded array. Needs results visible to visitors | Removed in Oct 2026; rebuilt from scratch in Phase 1 |
| Compete | Profiles + Leaderboard | `/profile/[slug]` `/profile/[slug]/edit` `/profile/password` | profiles, user\_follows, language\_skills, leaderboard API; ranks come from the points ledger (see Rewards) | Real |
| — | Store | `/store` | Hard-coded products | "Coming soon" page (done) until after launch |

Navigation: visitors see Home, About, News & Events, Projects (with the Diploma archive), Competitions, Clubs, Alumni. Signed-in students also get Learn, Articles and Discussions. Library and Settings sit in the user menu. Every public page needs English and Japanese, not only Mongolian, because foreign visitors read them.

## Data map

`db.sql` is out of date: the code reads tables it doesn't define. Fix that first, so the thesis's database chapter matches the real database.

| Problem | Tables | Fix |
| --- | --- | --- |
| Used in code, missing from `db.sql` | `article_bookmarks`, `project_milestones`, `project_sections` (none of them is used in code any more, 2026-11-20) | Dump the live Supabase schema into `supabase/migrations/` and keep every later change as a migration file (P0-02) |
| Possibly duplicate | `bookmarked_articles` (in `db.sql`) vs `article_bookmarks` (in code) | Done: the code uses `bookmarked_articles` only |
| Defined, never used | `tag_similarities` | Used only by `scripts/`? If not, drop it or document it |
| Second schema file | `app/profile/profile_schema.sql` | Merge into the migrations folder |

Who owns what:

- **Users** — `profiles`, `user_follows`, `language_skills`. Everything else points to `profiles.id`.
- **Content** — `articles`, `discussions`, `polls`, each with its own comments, votes, tags and bookmarks tables.
- **Projects** — `projects` plus `project_members`, `files`, `likes`, `comments`, `updates`, `milestones`, `sections`, `tags`.
- **Shared** — `tags` is used by articles, discussions and projects. Keep it as the one tag list.
- **New (Clubs + Compete)** — listed in the next section.

Small changes for the public pages (no new tables):

- `profiles` + `role` (student / alumni / staff) and `graduation_year`.
- `articles` + `category` (tech / case-study / news / event / alumni) and `event_date` for events.
- `projects` + `kind` (normal / diploma / club), `graduation_year` and `supervisor` for diploma work.

## Clubs module

A club game is just a project with a club attached, so Clubs reuses Projects instead of building a second showcase. The DP club is the first club and the test case.

| Table | Columns that matter | Purpose |
| --- | --- | --- |
| `clubs` | slug, name, description, owner\_id | One row per club |
| `club_seasons` | club\_id, name ("2026–27"), starts\_on, ends\_on, summary | The yearly archive unit |
| `club_members` | club\_id, season\_id, user\_id, role (owner / mentor / member) | Who took part each year |
| `club_sessions` | season\_id, week\_no, date, topic, summary, slides\_url, demo\_url, attendance | The weekly archive |
| `projects` (changed) | + club\_id, + season\_id, + play\_url | Links a game to a club; `play_url` points at the web build on GitHub Pages |
| `project_ratings` | project\_id, user\_id, criterion (looks / reliability / optimization / fun), score 1–5; unique per user + project + criterion | Visitor ratings |
| `competitions` | club\_id (nullable), name, kind (jam / bot), status, starts\_at, ends\_at, categories (e.g. Bot, Human vs Bot) | Replaces the mock array |
| `competition_entries` | competition\_id, project\_id, category, judge\_score, public\_score, final\_score, rank. Every entry is a contest project, so the team is its project\_members | Results and leaderboard |

Pages:

- `/club/[slug]` — club home: what it is, current season, key numbers, join info.
- `/club/[slug]/[season]` — tabs: Curriculum (sessions), Projects, Events, Gallery. This is what next year's members and the school see.
- `/club/[slug]/[season]/report` — a print-ready summary for the school; save it as a PDF from the browser.
- `/project/[slug]` — new **Play** tab: the game in an `<iframe>`, the rating form under it.

Rules (RLS): anyone reads; a user writes only their own rating; only the club owner and mentors edit seasons, sessions and members. Rating requires login; turn on Supabase anonymous sign-in if parents and outside visitors should vote without registering.

Before publishing student names or photos, check the school's consent rules. The members are high schoolers.

## Rewards: ranking, points and store

Points reward real contributions, so the site grows from many authors instead of becoming one person's blog. Students spend points in the Store on hardware, sensors and tech books from Japan.

Keep two numbers per user, never one:

- **Rank points** — everything ever earned. Never goes down when someone buys something. Decides the rank tier and the leaderboard.
- **Balance** — earned minus spent. Only the Store uses it.

With one number, buying a sensor would drop a student's rank, so people would hoard points instead of using them.

Rank tiers stay the chess pieces already in `lib/utils/rankIcons.tsx`, read from rank points:

| Piece | Rank points | Roughly, at the starting rules |
| --- | --- | --- |
| Pawn | 0 – 1,499 | Everyone starts here |
| Bishop | 1,500 – 3,499 | \~30 checked articles |
| Knight | 3,500 – 5,999 | \~70 articles, or articles + a few competition wins |
| Rook | 6,000 – 7,999 | Long-term regular contributor |
| Queen | 8,000 – 9,999 | Top few people on the site |
| King | 10,000+ | \~200 articles' worth: a legend tier |

Show the piece next to every author name and a "next piece in N points" bar on the profile, so students can see how close the next piece is.

Starting rules (tune the numbers later; points only for work someone checked):

| Action | Points | Who confirms |
| --- | --- | --- |
| Tech or case-study article published | 50 | Staff review |
| Alumni story or internship report | 80 | Staff review |
| Article translated to English or Japanese | 30 | Translation reviewer |
| Diploma work uploaded with the thesis | 100 | Supervisor |
| Club project published | 40 | Club mentor |
| Competition 1st / 2nd / 3rd | 300 / 200 / 100 | Automatic from results |
| Discussion reaches 10 upvotes | 10 | Automatic, daily cap |

No points for views or likes alone: they're easy to farm.

Data:

| Table | Columns that matter |
| --- | --- |
| `point_rules` | action, points, needs\_approval |
| `point_transactions` | user\_id, amount (+ or −), reason, source\_type, source\_id, status (pending / approved / rejected / reversed), approved\_by, created\_at |
| `store_items` | name, description, image, price\_points, stock, sponsor |
| `store_orders` | user\_id, item\_id, status (requested / approved / shipped / delivered / cancelled), created\_at |

The ledger is the only source of truth: never edit a balance directly. Cache `rank_points` and `balance` on `profiles` with a database function that runs on each approved transaction.

Store order flow (after launch, once funding is confirmed): student requests → points are held → staff approves → shipped → delivered. A cancel returns the points. Collect shipping details offline or in a staff-only table, never on the public profile.

Abuse rules: one account per student (school email), staff can reverse any transaction, and points only land after approval. Approvers are staff plus students at Rook rank or above, so staff aren't a bottleneck.

Open question: who funds the Store — department budget, sponsor companies, alumni donations? Showing the sponsor on each item thanks them publicly.

## To-do, in order

Six phases, Nov 2026 to April 2027. Two club events set the hard deadlines: the bot competition on Jan 6 and the game jam in March, which is also the public launch. April is a buffer and handover month.

**Minimum launch list** — must work even if everything else slips: public Home, About, News & Events, Projects with the Diploma archive, Competition results, Articles, login. Everything else is a bonus.

&#91;embedded content: build roadmap · 6 phases, Nov 2026 – Apr 2027\]

### Phase 0 — Agree with the department, clean the code (Nov 18 – Nov 30)

- [ ] Meet the department: confirm the domain, hosting, who approves the launch, who runs the site after you, and who funds the Store
- [ ] Agree a consent rule for students under 18: what is public on profiles (name, photo), and whether parents must agree
- [ ] Decide who translates public content into English and Japanese; if no one can, launch public pages in fewer languages first
- [ ] Collect content: About text, staff list, past diploma works, 2–3 alumni willing to write
Code tasks for this phase are in `docs/tasks/` (see its README for order and what you do first).

- [ ] Wake the paused Supabase project; after P0-02, create a separate dev project from the baseline
- [ ] Untrack `.claude/settings.local.json` and the stray `.claude/worktrees/` entry (P0-01)
- [ ] Dump the live Supabase schema into `supabase/migrations/`; archive `db.sql`, `profile_schema.sql` and the old `migrations/` files (P0-02)
- [x] Resolve `bookmarked_articles` vs `article_bookmarks` — done; `tag_similarities` is documented in P0-02
- [x] Remove Flashcards: code deleted, tables dropped by `migrations/003_drop_flashcards.sql`
- [ ] Remove the Dictionary: `app/dictionary`, `app/api/dictionary`, nav, Create menu, home feed, translation keys (P0-04)
- [ ] Export any Dictionary data worth keeping, then drop the 7 `dictionary_*` tables in a migration (P0-05)
- [x] Delete the Learn hub pages and `lib/data/courses.ts`; delete `KanbanBoard`, `ProjectGanttChart` and `SectionEditor`
- [x] Fix the broken sidebar links — dead links removed, projects use `/project?type=…`. Article and competition filters come with Phase 3 and Phase 1
- [x] Label `/store` "Coming soon"
- [ ] Take `/knowledge-tree` out of the sidebar; sync the project filter with the URL; rename `post-grad` → `alumni` (P0-08)
- [ ] Fix the enum typo `intership` → `internship`; simplify project visibility (`is_public` + `status`, `type` only for kind) (P0-09)

### Phase 1 — Bot competition ready (December)

- [ ] Bot runner: the grid game, the one-function interface, per-move time limit, secret sequences, random starter bot. Students test it by mid-December
- [ ] Tie-break rule: average over several secret sequences; a tie goes to less total thinking time
- [x] Remove the placeholder-project fallback; show a real error or 404 (done in Oct 2026)
- [ ] Create `competitions` (with categories) and `competition_entries`; replace the mock array on `/competition`
- [ ] Competition page: rules, dates, team sign-up (an entry = a contest project; solo or team), results table; organizers enter scores
- [ ] **Deadline Dec 23:** Competition page and sign-up live

### Phase 2 — Bot competition, Play and ratings (January)

- [ ] Wed, Jan 6, 2027: run the Week 8 bot competition; publish results for both categories (Bot, Human vs Bot)
- [ ] Optional: the runner saves each game as replay JSON; the entry page plays it back
- [ ] Add `play_url` and the Play tab with the game iframe
- [ ] Create `project_ratings` with RLS, an API route and the rating form; show averages per criterion on project cards
- [ ] Publish the game jam starter template (raylib + a GitHub Action that builds with Emscripten and deploys to GitHub Pages); test it with one DP club build
- [ ] Diploma archive: add `kind`, `graduation_year`, `supervisor` to `projects`; build `/diploma` with a year filter; upload the past works

### Phase 3 — Points, ranks, public pages (February)

- [ ] Create `point_rules` and `point_transactions`; cache `rank_points` and `balance` on `profiles`
- [ ] Award points from approved articles, translations, diploma uploads, club projects and competition results; give the Jan 6 points from the saved results
- [ ] Approval queue for staff and Rook-rank students; staff can reverse any transaction
- [ ] Feed `getRankIcon` from `rank_points`; add the "next piece" bar; fix the runtime `h-${size}` class names
- [ ] Add `category` and `event_date` to `articles`; build `/news` and the public Home (latest news, upcoming events, featured projects)
- [ ] Build `/about` (static MDX) and `/alumni`; add `role` and `graduation_year` to `profiles`
- [ ] Deploy to production and point the department domain at it

### Phase 4 — Game jam = public launch (March)

- [ ] Week 13 game jam on the site: entries with a Play tab; the public rates looks, reliability, optimization and fun; judges also score effort
- [ ] Final score = judges 70% + public 30%; login, one vote per person, no rating your own game
- [ ] Hand out prizes in person; publish results and award points
- [ ] Announce the site publicly with the jam as its first showcase
- [ ] Translations on all public pages; mobile check; RLS check on all new tables

### Phase 5 — Buffer and handover (April)

- [ ] Fix only bugs found during the jam; no new features
- [ ] Write a short admin guide; give department staff admin roles so the site doesn't depend on you alone
- [ ] Clubs module (seasons, sessions, archive pages, school report) if time allows

### Later — after launch

- [ ] Store: `store_items`, `store_orders`, order flow with held points, staff approval, shipping and refunds, once funding is confirmed
- [ ] Clubs module, if not done in April
- [ ] Connect Articles to the standalone Dictionary's API: hover a term to see its translation or explanation
- [ ] Rebuild the knowledge tree from real article tags
