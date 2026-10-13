# FutureHub design system

One page of rules so every screen looks and behaves the same. Components live in
`components/ui/` (primitives) and `components/common/` (composed pieces).
Colors are tokens from `app/globals.css`; never hardcode hex or `bg-white`.

## Principles

1. **Calm, not flashy.** Color marks meaning (action, status), not decoration.
2. **One primary action per view.** Everything else is secondary, outline or ghost.
3. **Content first.** Reading width ~70ch; metadata is small and muted.
4. **Touch friendly.** Default controls are 40px tall; nothing tappable under 32px.
5. **Same thing, same look.** A status, a tag or a language always renders the same way.

## Color roles

| Token | Use |
|---|---|
| `primary` (brand blue) | The main action, selected state, links |
| `accent` (light blue tint) | Secondary actions, hover/selected backgrounds |
| `brand-sky` | Focus rings, highlights |
| `brand-red` / `destructive` | Delete, errors, "contest" type. Use sparingly |
| `muted` / `muted-foreground` | Metadata, placeholders, disabled |
| success / warning (green / amber) | Status only (approved, pending) |

## Buttons — `components/ui/button.tsx`

| Variant | Looks | Use for | Examples |
|---|---|---|---|
| `default` | Solid blue | The one main action | Publish, Create project, Sign in, Submit for review |
| `secondary` | Light blue tint | Supporting actions | Save draft, Follow, Add translation |
| `outline` | Border, no fill | Neutral alternatives | Share, Edit, Load more |
| `ghost` | No border/fill | Toolbars, icon buttons, Cancel | Refresh, Back, menu triggers |
| `destructive` | Solid red | Final confirm of a delete (inside the dialog) | Delete article |
| `destructive-soft` | Red tint | Starting a delete (opens the confirm) | Delete… |
| `link` | Text | Inline actions in text | "View all" |

| Size | Height | Use |
|---|---|---|
| `xs` | 28px | Inside dense rows (comment actions) |
| `sm` | 32px | Card actions, toolbars, filters |
| `default` | 40px | Forms, page actions |
| `lg` | 44px | Auth / hero call-to-action, form submit on phones |
| `icon` / `icon-sm` | 40 / 32px square | Icon-only (always give an `aria-label`) |

Shape: `rounded-lg`. Icon 16px, text 14px (13px for `sm`/`xs`).

## Labels

- **Badge** (`components/ui/badge.tsx`) — static, non-clickable, rounded-full, 20–22px tall.
  Variants: `neutral`, `brand`, `sky`, `success`, `warning`, `danger`, `outline`.
- **StatusBadge** (`common/StatusBadge`) — the only way to show a status:
  draft → neutral · pending review → warning · published/approved/completed → success ·
  rejected → danger · in progress → brand · archived → neutral.
  Difficulty: beginner → success, intermediate → warning, advanced → danger.
  Project type: diploma → brand, contest → danger, internship → sky, private → neutral.
- **LanguageBadge** — `MN` / `JA` / `EN`, mono, outline, 20px.
- **Tag** (`common/Tag`) — content tags, `#name`, rounded-md, secondary tint; links to search.
- **Chip** (`common/Chip`) — filters you toggle; rounded-full, 32px; selected = solid blue.

## Inputs

40px tall, `rounded-lg`, `bg-card`, 1px `input` border, sky focus ring. Labels above the
field (14px, medium), help text below (12px muted), errors below in `destructive`.
`SearchInput` adds a leading icon and a clear button.

## Surfaces

- **Card**: `rounded-xl`, 1px border, `bg-card`, `shadow-xs`. Clickable cards lift the
  border to `primary/30` on hover — no scale/translate animations.
- Padding: 16px on phones, 20px from `sm`.
- Page: `PageHeader` (title 24px semibold, subtitle 14px muted, actions right).
  Section titles 16–18px semibold.

## Tabs

- **Segmented** (default `TabsList`): switch between views of the same data (Grid/List, filters).
- **Underline** (`variant="underline"`): sections of a detail page (Definition / Examples / History).

## States

- **Loading**: skeletons shaped like the content, never a lone spinner for a whole page.
- **Empty**: `EmptyState` — icon, one-line title, short hint, optional action.
- **Error**: `ErrorState` — what failed + Retry button.

## Content → component

| Content | List component | Detail layout |
|---|---|---|
| Article | `ArticleCard`: title, subtitle, author, date, read time, tags, stats | Reading column (≤72ch), TOC on the right (desktop), action rail left (desktop) / bottom bar (phone) |
| Project | `ProjectCard`: 16:9 cover, type + status badges, title, 2-line description, tags, author, likes | Media gallery, then description; facts sidebar (type, category, difficulty, progress, links, team) |
| Dictionary term | `TermCard`: term + reading, language badge, translations, 3-line definition | Term header, definition per language, examples as quotes, revision timeline |
| Discussion | `DiscussionRow`: vote count column, title, excerpt, answered badge, comments, author | Thread dialog with replies |
| Person | `UserChip` (avatar + name) | Profile header with stats, tabs for content |

## Avatars

20px in metadata, 32px in lists, 40px in comments/team, 96px on profiles. Always a
fallback initial.
