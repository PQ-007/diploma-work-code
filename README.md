# Knowledge Platform

A multilingual learning and knowledge-sharing community built with Next.js 16, React 19, and Supabase. Users can write articles, build flashcard decks, maintain a collaborative dictionary, discuss topics, showcase projects, and follow a structured learning path — all in English, Mongolian, or Japanese.

> Diploma / capstone project.

## Features

- **Articles** — MDX-based writing with KaTeX math, syntax highlighting, comments, reactions, bookmarks, tags, and crowd-sourced translations.
- **Flashcards** — Create and edit decks, browse cards, study, and track stats. Supports TOML import.
- **Dictionary** — Collaborative entries with examples, translations, revision history, saves, and a moderation workflow.
- **Discussions** — Threaded discussions with voting, comments, bookmarks, tags, and polls.
- **Projects** — Showcase projects with files, members, updates, likes, and comments.
- **Learn** — Structured paths for algorithms, data structures, and programming languages, plus a knowledge tree and curated resources.
- **Profiles & community** — User profiles, following, language skills, ranks, leaderboard, and a personalized feed.
- **Internationalization** — Full UI translation across English (`en`), Mongolian (`mn`), and Japanese (`ja`).

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, [Radix UI](https://www.radix-ui.com/) / shadcn-style components, `lucide-react` |
| Backend | [Supabase](https://supabase.com/) (Postgres, Auth, SSR) |
| Data fetching | [TanStack Query](https://tanstack.com/query) |
| Content | MDX (`@mdx-js`, `next-mdx-remote`, `@mdxeditor/editor`), `remark`/`rehype`, KaTeX |
| Editor | Monaco (`@monaco-editor/react`) |
| i18n | `i18next` / `react-i18next` |
| Media | Cloudinary (uploads) |
| Email | Resend |
| Charts | Recharts |

## Getting Started

### Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- A [Supabase](https://supabase.com/) project
- A [Cloudinary](https://cloudinary.com/) account (image uploads)
- A [Resend](https://resend.com/) account (transactional email)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Set up the database

Apply the schema in [db.sql](db.sql) to your Supabase Postgres instance (via the Supabase SQL editor or `psql`).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint |

## Project Structure

```
app/            # Next.js App Router — pages and API routes
  api/          #   Route handlers (articles, decks, dictionary, discussions, …)
  article/      #   Article reading, creation, and components
  flashcards/   #   Decks, browse, study, stats
  dictionary/   #   Entries, creation, moderation
  discussions/  #   Threads and polls
  project/      #   Project showcase
  learn/        #   Structured learning paths
  ...
components/     # Shared UI (AppChrome, sidebars, forms, ui/ primitives)
contexts/       # React contexts (Auth, Language)
hooks/          # Reusable React hooks
lib/            # Core logic — api/, services/, hooks/, types/, validation/, i18n
mdx/            # MDX components, editor, and demo content
utils/supabase/ # Supabase client/server/admin helpers
public/locales/ # i18n translation files (en, mn, ja)
db.sql          # Database schema
```

## License

Private project — all rights reserved.
