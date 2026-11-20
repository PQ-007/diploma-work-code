# Relaunch deploy

Ships the `relaunch` branch to futurehub.works and applies the one migration live doesn't have yet:
`20261120175759_project_type_cleanup` (P0-09: project types `intership` → `internship`, `private` → `personal`).

| | Project | Ref |
|---|---|---|
| Live | Diploma work | `jzmuodzerajihkrsxpol` |
| Dev | futurehub-dev | `stfddhjszoguvyvmgnvv` |

Live already has migrations up to `20261120173211_drop_dictionary`. Production (Vercel, builds `main`) still runs the
old code, whose Dictionary and Flashcards pages are already broken because their tables are gone.

## Order: deploy first, then the migration

Neither order is perfectly safe: each leaves a short window where creating a project fails. Deploy first is the
safer choice, because the migration is the step that's harder to undo, and it only runs once the new code is confirmed live.

| Window | Lasts | What breaks |
|---|---|---|
| **New code, old enum** (deploy first, recommended) | from "Ready" on Vercel until `db push` finishes, about 1 min if you're ready | Creating a project fails (it sends `personal`). The `Internship` / `Personal` filters return an error (the API filters on `type` in the database). Existing projects show a raw "private" badge. Browsing, articles, discussions, sign-in, and editing existing projects all work. |
| Old code, new enum (migration first) | the whole Vercel build, about 2–4 min | Creating a project fails (old code sends `private`), and so does changing a project's type. The `intership` / `private` filters show nothing (old code filters in the browser, so no errors). Labels for renamed types are missing. |

Keep the window short: have every command below ready, and don't create or edit projects until step 6 is done.

## Before you start

- [ ] `relaunch` is pushed: `git push origin relaunch`
- [ ] Tested locally against live data (`.env.local` = live values) and it looks right
- [ ] `npm run build` passes on `relaunch`
- [ ] Vercel → Settings → Environment Variables (Production): `NEXT_PUBLIC_SUPABASE_URL` points at `jzmuodzerajihkrsxpol`.
      `main` and `relaunch` use the same 8 variables, so nothing needs adding.

## Steps

**1. Link the CLI to live**
```bash
npx supabase link --project-ref jzmuodzerajihkrsxpol
cat supabase/.temp/project-ref          # must print jzmuodzerajihkrsxpol
```

**2. Fresh data backup** (podman socket on: `export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock`)
```bash
npx supabase db dump --remote --data-only --schema public -f ~/futurehub-backup-$(date +%Y%m%d-%H%M).sql
```

**3. Dry run: must list exactly one migration**
```bash
npx supabase db push --remote --dry-run
#   Would push these migrations:
#    • 20261120175759_project_type_cleanup.sql
```
If it lists anything else, **stop**.

**4. Merge and push `main`**
```bash
git switch main
git pull --ff-only origin main
git merge --ff-only relaunch            # fast-forward: main has nothing relaunch lacks
git push origin main
git switch relaunch
```

**5. Wait for the production deploy.** Vercel → Deployments: the new production deployment for `main` shows **Ready**.
Quick check that the new code is serving:
```bash
curl -s -o /dev/null -w '%{http_code}\n' https://futurehub.works/dictionary   # 404 = new code, 200 = still old
```

**6. Apply the migration right away**
```bash
npx supabase db push --remote           # confirm: Apply 1 migration on project Diploma work
npx supabase migration list --remote    # all 6 migrations show on remote
```

**7. Back to dev**
```bash
npx supabase link --project-ref stfddhjszoguvyvmgnvv
cp .env.dev.local .env.local            # local site back on the dev database
```

## Smoke test (live, after step 6)

Logged out:
- [ ] `/` loads; feed filters are All / Articles / Projects / Discussions (no Dictionary)
- [ ] `/dictionary`, `/flashcards`, `/learn` → 404; `/store`, `/knowledge-tree` → "Coming soon"
- [ ] `/article` and one article page
- [ ] `/project`: each type filter (Diploma works, Contest, Internship, Personal) works, the URL changes, and the sidebar sub-item highlights
- [ ] The 4 former "private" projects show the **Personal** badge
- [ ] `/discussions`
- [ ] Switch language mn / en / ja: sidebar and badges are translated

Signed in (your real account):
- [ ] Sign-in works; the profile page and settings open
- [ ] Create a test project, type **Personal**, not public → saves
- [ ] Edit it to type **Internship** → saves
- [ ] Logged out, its URL → "not found"; then delete it
- [ ] Vercel → Logs: no 500s from `/api/projects`

## Rollback

**Code problem** (the new site is broken):
1. Vercel → Deployments → the previous production deployment → **Instant Rollback**. That brings back the old `main`
   code without touching git. Vercel may then stop auto-promoting new `main` deploys; promote the fixed one by hand later.
2. If step 6 already ran, the old code needs the old enum values back:
   Supabase dashboard (Diploma work) → SQL Editor → run `docs/rollback/20261120175759_project_type_cleanup_down.sql`, then
   ```bash
   npx supabase migration repair --remote --status reverted 20261120175759
   ```
3. Fix forward on `relaunch`, then repeat this guide.

Rolling back does **not** bring back the Dictionary or Flashcards: their tables are gone on live (the data is in
`~/futurehub-backup-data.sql`, from 2026-11-20 17:40).

**Migration problem only** (code is fine): `db push` runs the migration in a transaction, so a failure leaves nothing
half-applied. Read the error, fix it on dev first, then push again.

**Data problem:** the backups from step 2 are data-only SQL (`INSERT`s). Restoring is manual and selective: load
the needed rows through the SQL Editor or `psql`. Don't replay the whole file onto a live database.
