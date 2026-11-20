# FutureHub

Official website of the Computer Science department (KOSEN). Two audiences:
- **Visitors** (incl. foreign): student work, news & events, competitions and results, diploma archive, alumni stories.
- **Students**: learn, write, share, build, compete; earn points and chess-piece ranks.

Stack: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Supabase (Postgres, Auth, SSR) ·
TanStack Query · Tailwind CSS v4 · shadcn/Radix (`components/ui`) · i18next (mn / en / ja) · Cloudinary · Resend.

The build plan is in `docs/PLAN.md`. Tasks are in `docs/tasks/`. **Only do the task you are given.**
Branches: cut from `relaunch` and merge back into `relaunch` — never into `main`.

## Commands
- `npm run dev` — dev server
- `npm run lint` — must pass before you finish
- `npm run build` — must pass before you finish

## Where things live
- API: route handlers in `app/api/**/route.ts`; Supabase clients in `utils/supabase/{server,client,admin}.ts`
- Data fetching: hooks in `lib/hooks/queries` and `lib/hooks/mutations`; query helpers in `lib/api/queries`
- Types: `lib/types`, `app/project/types.ts`
- UI primitives: `components/ui` (shadcn). Shared components: `components/common`, `components/cards`.
  Design rules: `docs/design-system.md`.
- Navigation: links are defined in `components/navigation/nav.ts`; rendered by
  `components/sidebar-collection/Left/LeftSidebar.tsx` (desktop) and `components/navigation/BottomNav.tsx` (phones)
- Translations: `public/locales/{mn,en,ja}/translation.json`. The UI language comes from the `lang` cookie
  (`lib/language.ts`, `lib/i18n.ts`); never switch a shared global i18n instance on the client (hydration mismatch).
- Database: migrations in `supabase/migrations/`; what each table is for in `docs/DATABASE.md`.
  Supabase CLI = `npx supabase …`. CLI v3 targets a *local* database by default: `db dump`, `db push` and `migration repair` need `--remote` to reach the linked project. Old schema files in
  `docs/legacy-schema/` are history only — never run them.

## Rules
- Every user-facing string goes into all three locale files (mn, en, ja). No hard-coded UI text.
- Every database change is a new SQL file in `supabase/migrations/` named `YYYYMMDDHHMMSS_short_name.sql`.
  New tables always get RLS enabled + policies in the same migration. Never edit an applied migration.
- Never use `utils/supabase/admin.ts` (service role) from client components.
- Never show fake/placeholder data when a real request fails — show an error or 404 instead.
- No new npm dependencies unless the task says so.
- Don't reformat or refactor files you weren't asked to touch.
- Removed features — never recreate: Flashcards, Dictionary, Learn hub, Kanban/Gantt/Section editor on projects.

## When you finish a task
1. Run `npm run lint` and `npm run build`; fix what you broke.
2. Report: files changed, anything you were unsure about, anything from the task's "Done when" you could not verify.
