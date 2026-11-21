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
| `primary` (brand blue) | Links, active icons, selected text |
| `primary-fill` | Fill of main buttons and selected chips: matte deep blue, white text (`#2846a8` light, `#3b5cc4` dark) |
| `accent` (light blue tint) | Secondary actions, hover/selected backgrounds |
| `brand-sky` | Focus rings, highlights |
| `brand-red` / `destructive` | Delete, errors, "contest" type. Use sparingly |
| `muted` / `muted-foreground` | Metadata, placeholders, disabled |
| success / warning (green / amber) | Status only (approved, pending) |

## Dark mode

Graphite, not navy: near-neutral surfaces with a faint cool cast. Depth comes from
lightness steps — page `#15171b` → card `#1b1d22` → popover `#212328` — never from
saturated colour. The brand glow is only a hint at the top corners. Blue for text and
icons is a soft `#86a2ee`; button fills stay a deeper blue so white text reads well.

## Buttons — `components/ui/button.tsx`

| Variant | Looks | Use for | Examples |
|---|---|---|---|
| `default` | Matte deep blue (`primary-fill`), white text, neutral shadow — no gloss, no coloured glow | The one main action | Publish, Create project, Sign in, Submit for review |
| `secondary` | Blue-tinted frosted glass | Supporting actions | Save draft, Follow, Add translation |
| `outline` | Clear frosted glass | Neutral alternatives | Share, Edit, Load more |
| `ghost` | No border/fill | Toolbars, icon buttons, Cancel | Refresh, Back, menu triggers |
| `destructive` | Glossy red glass | Final confirm of a delete (inside the dialog) | Delete article |
| `destructive-soft` | Red tint | Starting a delete (opens the confirm) | Delete… |
| `link` | Text | Inline actions in text | "View all" |

| Size | Height | Use |
|---|---|---|
| `xs` | 28px | Inside dense rows (comment actions) |
| `sm` | 32px | Card actions, toolbars, filters |
| `default` | 40px | Forms, page actions |
| `lg` | 44px | Auth / hero call-to-action, form submit on phones |
| `icon` / `icon-sm` | 40 / 32px square | Icon-only (always give an `aria-label`) |

Shape: capsule (`rounded-full`); icon buttons are circles. Pressing squishes to 97%.
Icon 16px, text 14px (13px for `sm`/`xs`).

## Liquid glass and the brand gradient

Utilities in `app/globals.css`:
- `glass`: frosted, translucent fill with a bright top rim. Use it for buttons, chips, segmented tracks and floating bars.
- `glass-tint`: the same glass tinted blue.
- `glass-solid` / `glass-danger`: solid blue / red under a glossy highlight (main action / delete).
- `glass-chrome`: header, sidebar and bottom nav.
- `surface-brand`: blue→red tinted card for large hero areas (home intro banner).

**Gradients are only for big areas**: the page background (`--app-glow`: blue light
top-left, red top-right, sky bottom-right, same as the sign-in art panel), hero banners
(`surface-brand`) and the default profile banner (`from-brand-blue via-brand-sky to-brand-red`).
Buttons, chips, badges and text are never gradients. Cards stay solid so text reads well.

## Labels

- **Badge** (`components/ui/badge.tsx`) — static, non-clickable, rounded-full, 20–22px tall.
  Variants: `neutral`, `brand`, `sky`, `success`, `warning`, `danger`, `outline`.
- **StatusBadge** (`common/StatusBadge`) — the only way to show a status:
  draft → neutral · pending review → warning · published/approved/completed → success ·
  rejected → danger · in progress → brand · archived → neutral.
  Difficulty: beginner → success, intermediate → warning, advanced → danger.
  Project type: diploma → brand, contest → danger, internship → sky, personal → neutral.
  Competition: draft → neutral, upcoming → sky, open → success, running → brand, judging → warning, finished → neutral.
  Competition kind: bot → brand, jam → danger, other → neutral. Entry: registered → success, withdrawn → neutral,
  disqualified → danger.
- **LanguageBadge** — `MN` / `JA` / `EN`, mono, outline, 20px.
- **Tag** (`common/Tag`) — content tags, `#name`, rounded-md, secondary tint; links to search.
- **Chip** (`common/Chip`) — filters you toggle; rounded-full, 32px; glass, selected = solid blue glass.

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

- **Loading (whole page)**: `LogoLoader` — the logo mark centered on screen, spinning with
  ease-in-out (speeds up, two turns, slows down, settles, repeats). Route transitions use it via
  `app/loading.tsx`; dialogs use `fullscreen={false}`. Still for users with reduced motion.
- **Loading (inside a list)**: skeletons shaped like the cards, so the layout doesn't jump.
- **Empty**: `EmptyState` — icon, one-line title, short hint, optional action.
- **Error**: `ErrorState` — what failed + Retry button.

## Content → component

| Content | List component | Detail layout |
|---|---|---|
| Article | `ArticleCard`: title, subtitle, author, date, read time, tags, stats | Reading column (≤72ch), TOC on the right (desktop), action rail left (desktop) / bottom bar (phone) |
| Project | `ProjectCard`: 16:9 cover, type + status badges, title, 2-line description, tags, author, likes | Media gallery, then description; facts sidebar (type, category, difficulty, progress, links, team) |
| Discussion | `DiscussionRow`: vote count column, title, excerpt, answered badge, comments, author | Thread dialog with replies |
| Person | `UserChip` (avatar + name) | Profile header with stats, tabs for content |

## Avatars

20px in metadata, 32px in lists, 40px in comments/team, 96px on profiles. Always a
fallback initial.
