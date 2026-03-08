# Projects Module — Architecture Documentation

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [RLS Policies](#3-rls-policies)
4. [API Endpoints](#4-api-endpoints)
5. [Search Strategy](#5-search-strategy)
6. [UI Structure](#6-ui-structure)
7. [Security Considerations](#7-security-considerations)
8. [Future Improvements](#8-future-improvements)

---

## 1. Architecture Overview

### System Design

```
┌────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│                                                      │
│  /project              → Tutorials + Showcase link   │
│  /project/showcase     → DB-backed project showcase  │
│  /project/create       → Create/Edit project form    │
│  /project/[slug]       → Project detail page         │
│                                                      │
│  Components:                                         │
│  ├─ ProjectCard        → Card for grid listings      │
│  ├─ SectionEditor      → Collapsible markdown editor │
│  ├─ MilestoneTracker   → Progress + milestone list   │
│  ├─ TeamManager        → Member CRUD                 │
│  └─ ProjectComments    → Threaded comment system      │
└────────────┬───────────────────────────────────────┘
             │ fetch(/api/projects/...)
             ▼
┌────────────────────────────────────────────────────┐
│                API Routes (Next.js)                  │
│                                                      │
│  /api/projects              GET (list), POST (create)│
│  /api/projects/[slug]       GET, PUT, DELETE         │
│  /api/projects/[slug]/sections     PUT               │
│  /api/projects/[slug]/members      GET, POST, DELETE │
│  /api/projects/[slug]/milestones   POST, PUT, DELETE │
│  /api/projects/[slug]/comments     POST, PUT, DELETE │
│  /api/projects/[slug]/like         POST (toggle)     │
│  /api/projects/[slug]/files        POST, DELETE      │
└────────────┬───────────────────────────────────────┘
             │ Supabase Client (server-side)
             ▼
┌────────────────────────────────────────────────────┐
│            Supabase (PostgreSQL + Auth + Storage)    │
│                                                      │
│  Tables:                                             │
│  ├─ projects            (core project data)          │
│  ├─ project_sections    (structured content blocks)  │
│  ├─ project_members     (team collaboration)         │
│  ├─ project_milestones  (progress tracking)          │
│  ├─ project_comments    (threaded feedback)          │
│  ├─ project_files       (file metadata)              │
│  ├─ project_tags        (junction to tags table)     │
│  └─ project_likes       (user likes)                 │
│                                                      │
│  Storage Bucket: project-files (50MB limit)          │
│  Auth: Supabase Auth with cookie-based SSR           │
│  RLS: Row Level Security on all tables               │
└────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Slug-Based Routing**: Projects accessed via slug for SEO-friendly URLs
- **Manual Joins in API**: Following existing codebase pattern of fetching related data separately and assembling in API routes (not relying on Supabase joins through RLS)
- **Optimistic UI**: All user interactions (likes, milestone toggles, comments) use optimistic updates with error rollback
- **Dual Page Architecture**: Static tutorials page (`/project`) coexists with DB-backed showcase (`/project/showcase`)
- **Progressive Disclosure**: Only COMPLETED projects can be published publicly
- **Auto Progress**: Progress percentage auto-calculated from milestones via database trigger

---

## 2. Database Schema

**File**: `app/project/project_schema.sql`

### Tables

| Table                | Purpose                           | Key Columns                                                                             |
| -------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| `projects`           | Core project data                 | `id, title, slug, description, status, is_public, progress, technologies[], created_by` |
| `project_sections`   | Structured content blocks         | `id, project_id, title, section_type, content (markdown), sort_order`                   |
| `project_members`    | Team collaboration                | `project_id, user_id, role (owner/contributor/viewer)`                                  |
| `project_milestones` | Progress tracking                 | `id, project_id, title, due_date, completed`                                            |
| `project_comments`   | Threaded comments                 | `id, project_id, user_id, parent_id, body`                                              |
| `project_files`      | File metadata                     | `id, project_id, file_name, file_url, file_type, file_size`                             |
| `project_tags`       | Junction table to existing `tags` | `project_id, tag_id`                                                                    |
| `project_likes`      | User likes                        | `project_id, user_id`                                                                   |

### Enums

```sql
project_status:    draft | in_progress | completed | archived
project_type:      research | coding | design | other
project_difficulty: beginner | intermediate | advanced
project_member_role: owner | contributor | viewer
```

### Key Constraints

- **`projects_public_completed_check`**: Ensures `is_public = true` only when `status = 'completed'`
- **`project_members` composite PK**: `(project_id, user_id)` prevents duplicate memberships
- **`project_likes` composite PK**: `(project_id, user_id)` prevents duplicate likes

### Triggers

| Trigger                           | Purpose                                             |
| --------------------------------- | --------------------------------------------------- |
| `trg_projects_updated_at`         | Auto-update `updated_at` on projects                |
| `trg_project_sections_updated_at` | Auto-update `updated_at` on sections                |
| `trg_project_comments_updated_at` | Auto-update `updated_at` on comments                |
| `trg_milestone_progress`          | Recalculate project progress when milestones change |
| `trg_project_likes_count`         | Increment/decrement `likes_count` on projects       |

### Indexes

- **Full-text search**: GIN index on `search_vector` (weighted: title=A, description=B, category=C, technologies=C)
- **Trigram**: GIN index on `title` using `pg_trgm` for fuzzy matching
- **Technologies**: GIN index on `technologies` array for `@>` containment queries
- **Filtered**: Partial index on `is_public WHERE is_public = true` for showcase queries

### Full-Text Search Function

```sql
search_projects(
  search_term, filter_status, filter_difficulty, filter_type,
  filter_category, sort_by, page_limit, page_offset
) → TABLE(id, title, slug, ..., rank)
```

Combines: `0.6 × ts_rank + 0.4 × similarity` for hybrid full-text + fuzzy search.

---

## 3. RLS Policies

**File**: `app/project/project_rls.sql`

### Access Matrix

| Resource              | Public (anon) | Authenticated | Owner | Contributor | Viewer | Admin |
| --------------------- | :-----------: | :-----------: | :---: | :---------: | :----: | :---: |
| Read public project   |      ✅       |      ✅       |  ✅   |     ✅      |   ✅   |  ✅   |
| Read private project  |      ❌       |      ❌       |  ✅   |     ✅      |   ✅   |  ❌   |
| Create project        |      ❌       |      ✅       |   —   |      —      |   —    |   —   |
| Edit project          |      ❌       |      ❌       |  ✅   |     ✅      |   ❌   |  ❌   |
| Delete project        |      ❌       |      ❌       |  ✅   |     ❌      |   ❌   |  ✅   |
| Manage members        |      ❌       |      ❌       |  ✅   |     ❌      |   ❌   |  ❌   |
| Manage milestones     |      ❌       |      ❌       |  ✅   |     ✅      |   ❌   |  ❌   |
| Comment (public proj) |      ❌       |      ✅       |  ✅   |     ✅      |   ✅   |  ✅   |
| Edit own comment      |      ❌       |      ✅       |   —   |      —      |   —    |   —   |
| Delete any comment    |      ❌       |      ❌       |  ❌   |     ❌      |   ❌   |  ✅   |
| Like (public proj)    |      ❌       |      ✅       |  ✅   |     ✅      |   ✅   |  ✅   |

### Policy Strategy

- **Defense in depth**: RLS policies + API-level authorization checks
- **Principle of least privilege**: Default deny, explicit allow
- **Admin moderation**: Admins checked via `profiles.role = 'admin'`

---

## 4. API Endpoints

### Projects CRUD

#### `GET /api/projects`

List projects with filtering and pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `scope` | `public\|my\|member` | `public` | Filter scope |
| `search` | string | — | Title/description search |
| `sort` | `newest\|oldest\|most_liked` | `newest` | Sort order |
| `category` | string | — | Category filter |
| `difficulty` | string | — | Difficulty filter |
| `type` | string | — | Project type filter |
| `status` | string | — | Status filter |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 50) |

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "title": "AI Dashboard",
      "slug": "ai-dashboard-m3k9",
      "description": "An AI-powered analytics dashboard",
      "status": "completed",
      "is_public": true,
      "progress": 100,
      "technologies": ["React", "Python", "TensorFlow"],
      "tags": ["ai", "web"],
      "author": {
        "id": "uuid",
        "user_name": "johndoe",
        "display_name": "John Doe",
        "avatar_url": "https://..."
      },
      "likes_count": 12,
      "views": 156,
      "userLiked": false
    }
  ]
}
```

#### `POST /api/projects`

Create a new project.

**Request:**

```json
{
  "title": "My Research Project",
  "description": "A study on...",
  "category": "Machine Learning",
  "project_type": "research",
  "difficulty": "advanced",
  "technologies": ["Python", "PyTorch"],
  "repository_url": "https://github.com/user/repo",
  "tags": ["ml", "nlp"]
}
```

**Response** (`201`):

```json
{ "id": 42, "slug": "my-research-project-m3k9" }
```

#### `GET /api/projects/[slug]`

Fetch full project detail with sections, members, milestones, comments, files.

#### `PUT /api/projects/[slug]`

Update project fields. Partial updates supported.

#### `DELETE /api/projects/[slug]`

Delete project (owner or admin only).

### Sub-Resources

| Endpoint                          | Methods             | Purpose                       |
| --------------------------------- | ------------------- | ----------------------------- |
| `/api/projects/[slug]/sections`   | `PUT`               | Batch update sections content |
| `/api/projects/[slug]/members`    | `GET, POST, DELETE` | Team management               |
| `/api/projects/[slug]/milestones` | `POST, PUT, DELETE` | Milestone CRUD                |
| `/api/projects/[slug]/comments`   | `POST, PUT, DELETE` | Threaded comments             |
| `/api/projects/[slug]/like`       | `POST`              | Toggle like                   |
| `/api/projects/[slug]/files`      | `POST, DELETE`      | File metadata management      |

---

## 5. Search Strategy

### Implementation

1. **Full-Text Search (FTS)**
   - `tsvector` column generated from `title (A)`, `description (B)`, `category (C)`, `technologies (C)`
   - Uses `plainto_tsquery('simple', ...)` for language-agnostic matching
   - Weighted ranking with `ts_rank()`

2. **Trigram Similarity**
   - `pg_trgm` extension for fuzzy matching on `title`
   - Catches typos and partial matches
   - Uses `similarity()` function with threshold > 0.1

3. **Hybrid Ranking**
   - Final score: `0.6 × ts_rank + 0.4 × trigram_similarity`
   - Balances exact keyword matches with fuzzy prefix matches

4. **Array Search**
   - Technologies stored as `text[]` with GIN index
   - Supports `@>` (contains) queries for filtering

5. **API-Level Filtering**
   - Simple `ilike` search as first pass in the API route
   - Could call the `search_projects()` RPC function for advanced queries via `supabase.rpc('search_projects', { ... })`

### Performance at Scale (~300 users)

- GIN indexes on search_vector and technologies handle this easily
- Pagination via `LIMIT/OFFSET` (sufficient at this scale)
- Partial index on `is_public` narrows public queries

---

## 6. UI Structure

### Page Map

```
/project                 → Tutorial catalog (existing static page)
                           + Banner linking to showcase
/project/showcase        → DB-backed project showcase grid
                           Tabs: Public Projects | My Projects
                           Filters: search, sort, difficulty, type
/project/create          → Create new project form
/project/create?edit=X   → Edit existing project (reuses same page)
/project/[slug]          → Full project detail page
```

### Projects List Page (`/project/showcase`)

- **Header**: Title + "New Project" button
- **Tabs**: Public Projects | My Projects
- **Filters**: Search bar, sort dropdown, difficulty filter, type filter
- **Grid**: Responsive 1-4 columns of `ProjectCard` components
- **Empty state**: Illustrated empty state with CTA

### Project Detail Page (`/project/[slug]`)

- **Header**: Title, description, meta badges (difficulty, type, category)
- **Stats**: Likes, views, progress percentage
- **Technologies**: Badge list of tech stack
- **Tags**: Hash-prefixed tag badges
- **Links**: Repository link, demo link buttons
- **Two-column layout**:
  - **Left (main)**: Section editor (collapsible, editable for owners) + Comments
  - **Right (sidebar)**: Milestone tracker + Team manager + Files list

### Create/Edit Project Page (`/project/create`)

- **Title** input (required)
- **Description** textarea
- **Thumbnail** upload (Cloudinary)
- **Type/Difficulty/Category** dropdowns
- **Status/Visibility** (edit mode only, public only if completed)
- **Technologies** tag input (Enter to add, X to remove)
- **Tags** tag input
- **Repository/Demo URL** inputs

### Component Architecture

| Component          | Location                  | Purpose                                              |
| ------------------ | ------------------------- | ---------------------------------------------------- |
| `ProjectCard`      | `app/project/components/` | Grid card with thumbnail, tech badges, author, stats |
| `SectionEditor`    | `app/project/components/` | Collapsible sections with inline markdown editing    |
| `MilestoneTracker` | `app/project/components/` | Progress bar + sortable milestone checklist          |
| `TeamManager`      | `app/project/components/` | Member list with role badges + add/remove            |
| `ProjectComments`  | `app/project/components/` | Threaded comments with reply/edit/delete             |

---

## 7. Security Considerations

### Authentication & Authorization

- **Middleware protection**: `/project/create` requires authentication
- **API-level checks**: Every mutation endpoint verifies `user` via `supabase.auth.getUser()`
- **Ownership verification**: Edit/delete operations verify `created_by === user.id`
- **Role-based access**: Members checked against `project_members` with role validation
- **Admin detection**: Admin checks via `profiles.role === 'admin'`

### Data Validation

- **Required fields**: Title required and validated in both frontend and API
- **Type checking**: Enums enforced at database level
- **Constraint enforcement**: `is_public` only allowed with `status = 'completed'`
- **Input sanitization**: All text inputs trimmed before storage
- **File validation**: MIME type restrictions on storage bucket

### RLS Defense in Depth

- API-level authorization + database-level RLS = double protection
- Even if API checks are bypassed, RLS prevents unauthorized data access

### XSS Prevention

- React's built-in HTML escaping for all rendered content
- No `dangerouslySetInnerHTML` usage
- Markdown content rendered as plain text (expandable to MDX with sanitization)

### CSRF Protection

- Cookie-based auth with `SameSite` attribute
- Next.js built-in CSRF protections for server actions

---

## 8. Future Improvements

### Short-Term

1. **MDX Rendering**: Replace plain-text section content with full MDX rendering using existing `next-mdx-remote` setup
2. **File Uploads**: Implement Supabase Storage integration for direct file uploads with progress tracking
3. **Real-time Updates**: Use Supabase Realtime for live comment feeds and milestone updates
4. **Notifications**: Notify team members of new comments, milestone changes

### Medium-Term

5. **Project Templates**: Pre-built templates for common project types (Research Paper, Web App, Mobile App)
6. **Version History**: Track changes to sections with revision diffs
7. **Export**: PDF/Markdown export of complete project documentation
8. **Drag & Drop**: Reorder milestones and sections via drag-and-drop
9. **Rich Embedding**: Support for embedded diagrams (Mermaid), code editors, and interactive widgets

### Long-Term

10. **AI Assistance**: AI-generated project summaries, technology suggestions
11. **Peer Review Workflow**: Formal review system with approval stages
12. **Portfolio Generator**: Auto-generate a portfolio page from all completed projects
13. **Analytics Dashboard**: Project view/like trends, technology popularity charts
14. **Mobile App**: React Native views for the project module
