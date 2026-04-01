# Dictionary / Толь бичиг — Module Architecture

## A) Architecture Overview

The Dictionary module is a centralized, multilingual glossary (MN/JA/EN) for FutureHub's student platform. It follows the existing codebase patterns: Next.js App Router pages with `"use client"` directives, Supabase (PostgreSQL + Auth + RLS) as backend, and Shadcn/ui + Tailwind CSS for the UI layer.

**Data layer:** The core entity is `dictionary_entries` — a language-tagged term with a status workflow (DRAFT → PENDING_REVIEW → APPROVED → REJECTED). Each entry has multiple `dictionary_translations` (one per target language with translation candidates), multiple `dictionary_examples` (real usage with source/context), and links to the shared `tags` table. A `dictionary_revisions` table tracks every edit as a versioned snapshot, enabling full audit history and the "suggest edit" flow. `dictionary_moderation_actions` records approve/reject decisions by moderators.

**API layer:** REST endpoints under `/api/dictionary/` follow the same pattern as `/api/discussions/` — server-side Supabase client, `getUser()` auth check, manual relationship assembly. Search uses PostgreSQL `tsvector` full-text search combined with `pg_trgm` trigram similarity for fuzzy/prefix matching. Duplicate detection queries trigram similarity before insert.

**UI layer:** Four main surfaces: (1) Dictionary Home with search + letter/tag filters + grid/list toggle, (2) Entry Detail with tabs for definitions/translations/examples/history, (3) Create/Edit form with multi-language fields, (4) Moderation Queue for teachers/admins. All pages use `useLanguage()` for i18n and `useAuth()` for user context.

**Assumptions:**

- `profiles.role` is a `user_type` enum with values: `'user'`, `'teacher'`, `'admin'`.
- Only `teacher` and `admin` roles are moderators.
- A `flashcards` table exists (or will be created) with at minimum: `id`, `user_id`, `front`, `back`, `source_type`, `source_id`, `created_at`.
- The existing `tags` table is shared across articles, discussions, and dictionary.

---

## B) Complete Postgres DDL

See `dictionary_schema.sql` in this directory.

## C) Endpoint List with JSON Examples

See `dictionary_api_spec.md` in this directory.

## D) Key Algorithms

### Duplicate Detection

Before inserting a new entry, query existing approved/pending entries:

```sql
SELECT id, term, language_code,
       similarity(term, $1) AS sim,
       term <-> $1 AS dist
FROM dictionary_entries
WHERE language_code = $2
  AND (similarity(term, $1) > 0.3 OR term ILIKE $1 || '%')
  AND status IN ('approved', 'pending_review')
ORDER BY dist ASC
LIMIT 5;
```

If `sim > 0.7`, warn "very likely duplicate". If `sim > 0.3`, show as "possible matches".

### Search Ranking

Combined full-text + trigram scoring:

```sql
SELECT e.id, e.term, e.reading, e.language_code,
       ts_rank_cd(e.search_vector, plainto_tsquery('simple', $1)) AS ft_rank,
       similarity(e.term, $1) AS trgm_rank,
       (0.6 * ts_rank_cd(e.search_vector, plainto_tsquery('simple', $1))
        + 0.4 * similarity(e.term, $1)) AS combined_rank
FROM dictionary_entries e
WHERE e.status = 'approved'
  AND (
    e.search_vector @@ plainto_tsquery('simple', $1)
    OR similarity(e.term, $1) > 0.2
  )
ORDER BY combined_rank DESC
LIMIT 20 OFFSET $2;
```

## E) UI Wireframe Descriptions

### Dictionary Home (`/dictionary`)

```
┌─────────────────────────────────────────────────────────┐
│ Title: "Dictionary / Толь бичиг"                        │
│ Subtitle: "Мэргэжлийн нэр томьёоны тайлбар толь"      │
├─────────────────────────────────────────────────────────┤
│ [🔍 Search terms, definitions, examples...           ]  │
│                                                         │
│ Filters: [All] [MN] [JA] [EN]  Sort: [Relevance ▼]    │
│ Tags: #programming #math #database #kanji ...           │
│                                                         │
│ ┌─ Featured Term of the Day ────────────────────────┐   │
│ │ [Image] "API (Application Programming Interface)" │   │
│ │ A set of protocols for building software...        │   │
│ │ [Full Definition] [Save as Flashcard]              │   │
│ └────────────────────────────────────────────────────┘   │
│                                                         │
│ Browse Glossary    [Grid] [List]  [+ New Entry]         │
│ [A][B][C][D]...[Z][#]                                   │
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │ Term     │ │ Term     │ │ Term     │                 │
│ │ Reading  │ │ Reading  │ │ Reading  │                 │
│ │ Desc...  │ │ Desc...  │ │ Desc...  │                 │
│ │ [MN][JA] │ │ [EN]     │ │ [JA]     │                 │
│ │ ✅APPROVED│ │ ✅APPROVED│ │ ⏳PENDING │                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
│                                                         │
│ [← Prev] Page 1 of 12 [Next →]                         │
└─────────────────────────────────────────────────────────┘
```

Right sidebar:

- Popular Topics (tag cloud)
- Recent Contributions (latest approved entries)
- Your Drafts (if logged in)

### Entry Detail (`/dictionary/[slug]`)

```
┌─────────────────────────────────────────────────────────┐
│ ← Dictionary / "API"                                    │
│                                                         │
│ API (Application Programming Interface)  ✅ APPROVED    │
│ Reading: エーピーアイ (ja)                                │
│ Language: EN | Contributor: @bilguun · Updated 3d ago   │
│                                                         │
│ [✏️ Suggest Edit] [📤 Share] [🔖 Save] [📇 Flashcard]    │
│                                                         │
│ Tags: #programming #web-development #backend            │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ [Definitions] [Translations] [Examples] [History]       │
│                                                         │
│ TAB: Definitions                                        │
│ ▎ A set of definitions and protocols for building and   │
│ ▎ integrating application software.                     │
│ ▎ Key points:                                           │
│ ▎ • Enables communication between software components   │
│ ▎ • REST, GraphQL, gRPC are common styles               │
│                                                         │
│ TAB: Translations                                       │
│ ┌── MN ──────────────────────────────────────────────┐  │
│ │ "Программ хангамжийн интерфейс" — Программ хоорон- │  │
│ │ дын харилцааны протокол                             │  │
│ │ Candidate 2: "Хэрэглээний програмын интерфэйс"     │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌── JA ──────────────────────────────────────────────┐  │
│ │ "アプリケーション・プログラミング・インタフェース"      │  │
│ │ ソフトウェア間の通信を可能にする仕組み                 │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ TAB: Examples                                           │
│ ┌─ Example 1 ────────────────────────────────────────┐  │
│ │ "REST API нь HTTP протокол дээр суурилдаг"         │  │
│ │ Source: FutureHub Article "Backend Basics"          │  │
│ │ Context: Used in web development lecture, Chapter 3 │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ TAB: History                                            │
│ v3 (current) — @bilguun — Mar 5, 2026 — APPROVED      │
│ v2 — @teacher1 — Mar 3, 2026 — approved edit          │
│ v1 — @bilguun — Mar 1, 2026 — initial submission      │
└─────────────────────────────────────────────────────────┘
```

Right sidebar: Related Articles, Related Terms, Resources

### Create/Edit Entry (`/dictionary/create`)

```
┌─────────────────────────────────────────────────────────┐
│ Create Dictionary Entry                                 │
│                                                         │
│ Term *          [________________________]              │
│ Reading (kana)  [________________________]              │
│ Language *      [MN ▼]                                  │
│ Slug            [auto-generated-from-term]              │
│                                                         │
│ Definition *                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Rich text editor...                                │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ ── Translations ──                                      │
│ [+ Add Translation]                                     │
│ ┌─ Translation 1 ────────────────────────────────────┐  │
│ │ Target Language: [JA ▼]                            │  │
│ │ Translated Term: [_______________]                 │  │
│ │ Explanation:     [_______________]                 │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ ── Usage Examples ──                                    │
│ [+ Add Example]                                         │
│ ┌─ Example 1 ────────────────────────────────────────┐  │
│ │ Example text: [_______________________________]    │  │
│ │ Source:       [_______________________________]    │  │
│ │ Context:      [_______________________________]    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ ── Tags ──                                              │
│ [programming] [x] [math] [x] [+ Add tag]               │
│                                                         │
│ ⚠️ Similar entries found:                               │
│ • "API Gateway" (EN) — 72% match                       │
│                                                         │
│ [Save as Draft]  [Submit for Review]                    │
└─────────────────────────────────────────────────────────┘
```

### Moderation Queue (`/dictionary/moderation`)

```
┌─────────────────────────────────────────────────────────┐
│ Dictionary Moderation Queue (Teacher/Admin only)        │
│                                                         │
│ Filters: [Pending] [New Entries] [Edit Proposals]       │
│                                                         │
│ ┌─ Revision #42 ────────────────────────────────────┐   │
│ │ Term: "データベース" (JA) — NEW ENTRY               │   │
│ │ By: @student1 · Submitted 2h ago                   │   │
│ │ Definition: データを構造化して保存する仕組み...       │   │
│ │                                                    │   │
│ │ [View Full] [✅ Approve] [❌ Reject]                │   │
│ └────────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─ Revision #41 ────────────────────────────────────┐   │
│ │ Term: "API" (EN) — EDIT PROPOSAL (v2 → v3)        │   │
│ │ By: @student2 · Submitted 5h ago                   │   │
│ │ Changes: Updated definition + added JP translation │   │
│ │ Diff: [Show changes]                               │   │
│ │                                                    │   │
│ │ [View Full] [✅ Approve] [❌ Reject with reason]    │   │
│ └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## F) Definition of Done Checklist

- [ ] **Database**: All DDL tables created in Supabase with indexes + RLS policies active
- [ ] **API**: All 8 endpoints functional (create, list, search, detail, propose-edit, approve, reject, convert-flashcard)
- [ ] **Search**: Full-text search returns relevant results; trigram fuzzy matching works for typos
- [ ] **Duplicate Detection**: Warning shown when creating entry similar to existing one
- [ ] **Status Workflow**: DRAFT → PENDING_REVIEW → APPROVED → REJECTED transitions enforced
- [ ] **Versioning**: Every edit creates a revision; history tab shows full audit trail
- [ ] **RLS**: Anonymous can read approved; authenticated can create draft; only owner edits draft; only moderator approves/rejects
- [ ] **UI - Dictionary Home**: Search, filters, grid/list toggle, pagination all functional
- [ ] **UI - Entry Detail**: All 4 tabs render correctly with real data
- [ ] **UI - Create/Edit**: Form validates, submits, shows duplicate warnings
- [ ] **UI - Moderation Queue**: Lists pending items, approve/reject with reason works
- [ ] **Flashcard Integration**: "Save as Flashcard" creates a flashcard from approved entry
- [ ] **i18n**: All user-facing strings use `t()` keys; MN/JA/EN translations in locale files
- [ ] **Mobile**: All pages responsive, usable on 375px+ screens
- [ ] **Testing**: Unit tests for validation/duplicate detection; integration tests for RLS; API contract tests pass
- [ ] **Performance**: Search returns in <500ms for 10k entries; pagination works correctly
