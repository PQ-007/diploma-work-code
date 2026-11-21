/**
 * Competition API shapes (P1-02). Mirrors the P1-01 schema (supabase/migrations/*_competitions.sql);
 * kept standalone so lib/types/database.ts doesn't need regenerating.
 */

export const COMPETITION_KINDS = ["bot", "jam", "other"] as const;
export type CompetitionKind = (typeof COMPETITION_KINDS)[number];

/** draft = staff only · upcoming = announced · open = sign-up · running = competition day · judging = scoring · finished = over */
export const COMPETITION_STATUSES = ["draft", "upcoming", "open", "running", "judging", "finished"] as const;
export type CompetitionStatus = (typeof COMPETITION_STATUSES)[number];

export const COMPETITION_ENTRY_STATUSES = ["registered", "withdrawn", "disqualified"] as const;
export type CompetitionEntryStatus = (typeof COMPETITION_ENTRY_STATUSES)[number];

/** Multilingual text as stored: {"mn": "...", "en": "...", "ja": "..."}; mn is required on titles. */
export type LocalizedText = Partial<Record<"mn" | "en" | "ja", string>>;

export interface TeamMember {
  user_id: string;
  role: string;
  user_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface CompetitionEntry {
  id: number;
  category: string;
  status: CompetitionEntryStatus;
  /** Result fields are null until results are published (or for non-staff). */
  score: number | null;
  tiebreak: number | null;
  judge_score: number | null;
  public_score: number | null;
  rank: number | null;
  note: string | null;
  created_at: string;
  /** null when the project isn't visible to the caller (non-public and not theirs). */
  project: {
    id: number;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    is_public: boolean;
    /** For the organizers' entries export (the runner needs each team's repo). */
    repository_url: string | null;
  } | null;
  members: TeamMember[];
}

/** List item from GET /api/competitions. */
export interface CompetitionSummary {
  id: number;
  slug: string;
  kind: CompetitionKind;
  status: CompetitionStatus;
  title: string;
  summary: string;
  cover_url: string | null;
  categories: string[];
  max_team_size: number;
  signup_opens_at: string | null;
  signup_closes_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  results_published: boolean;
  entry_count: number;
}

/** Detail from GET /api/competitions/[slug]. */
export interface CompetitionDetail extends CompetitionSummary {
  rules: string;
  /** Raw multilingual fields, for the organizer editor (P1-04). */
  i18n: { title: LocalizedText; summary: LocalizedText; rules: LocalizedText };
  signup_open: boolean;
  is_staff: boolean;
  entries: CompetitionEntry[];
  /** Entry ids belonging to projects the caller owns. */
  my_entry_ids: number[];
}

/** Body of POST /api/competitions/[slug]/entries. */
export type CompetitionSignUpBody =
  | { category: string; projectId: number }
  | { category: string; newProject: { title: string; description: string } };

/** One row of PUT /api/competitions/[slug]/results. Omitted fields are left unchanged. */
export interface CompetitionResultUpdate {
  id: number;
  score?: number | null;
  tiebreak?: number | null;
  judge_score?: number | null;
  public_score?: number | null;
  note?: string | null;
  status?: CompetitionEntryStatus;
}
