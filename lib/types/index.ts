/**
 * Single import surface for shared types.
 *
 * Prefer importing from `@/lib/types` rather than reaching into individual
 * modules, so the source of truth stays in one place.
 *
 * Database row/insert/update/enum shapes are derived from `database.ts`, which
 * is generated from the Supabase schema (see `npm run gen:types`).
 */

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "./database";

export type {
  Author,
} from "./author";

export type {
  ContentType,
  ContentStatus,
  BaseContent,
  ContentStats,
  UserInteractions,
  ArticleContent,
  DiscussionContent,
  ProjectContent,
  Content,
  ContentItem,
} from "./content";
