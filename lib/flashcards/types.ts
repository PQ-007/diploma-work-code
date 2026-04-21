// ── Structured content types ──────────────────────────────────────────────────

export interface FlashcardFront {
  term: string;
  reading?: string;
  language: "mn" | "ja" | "en";
  partsOfSpeech?: string[];
}

export interface FlashcardBack {
  definition: string;
  translations: Array<{
    language: "mn" | "ja" | "en";
    term: string;
    explanation?: string;
  }>;
  examples?: Array<{
    text: string;
    language: "mn" | "ja" | "en";
  }>;
}

export interface ResolvedCard {
  front: FlashcardFront;
  back: FlashcardBack;
  entrySlug?: string;
  isCustomized: boolean;
}

// ── Deck types ────────────────────────────────────────────────────────────────

export interface Deck {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  cloned_from_deck_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeckWithCount extends Deck {
  card_count: number;
}

export interface DeckPreview extends DeckWithCount {
  previews: { id: number; front: FlashcardFront; back: FlashcardBack }[];
  owner: {
    id: string;
    display_name: string;
    user_name: string;
    avatar_url: string | null;
  } | null;
  already_cloned: boolean;
}

// ── Flashcard type ────────────────────────────────────────────────────────────

export interface Flashcard {
  id: number;
  deck_id: number;
  /** Structured front content (JSONB). */
  front: FlashcardFront;
  /** Structured back content (JSONB). */
  back: FlashcardBack;
  /** User override for front — takes precedence over front when set. */
  custom_front?: FlashcardFront | null;
  /** User override for back — takes precedence over back when set. */
  custom_back?: FlashcardBack | null;
  source_type: string | null;
  source_id: number | null;
  // SM-2 scheduling
  sm2_interval: number;
  sm2_repetition: number;
  sm2_ease: number;
  sm2_due_at: string;
  created_at: string;
}

// ── SM-2 review result ────────────────────────────────────────────────────────

export interface ReviewResult {
  sm2_interval: number;
  sm2_repetition: number;
  sm2_ease: number;
  sm2_due_at: string;
}

// ── Helper functions ──────────────────────────────────────────────────────────

/**
 * Safely parse a FlashcardFront from any shape the DB may return.
 *
 * Handles all these cases:
 *  1. Already a proper FlashcardFront object → return as-is
 *  2. A JSON string → parse and recurse
 *  3. Migration legacy shape { text: "<json-string>" } → parse text and recurse
 *  4. Double-encoded: term field itself is a JSON string → parse and recurse
 */
export function parseFront(raw: unknown): FlashcardFront | null {
  if (!raw) return null;

  // ① JSON string → parse and recurse
  if (typeof raw === "string") {
    try { return parseFront(JSON.parse(raw)); } catch { return null; }
  }

  if (typeof raw === "object") {
    const f = raw as Record<string, unknown>;

    // ② Migration shape: { text: "<json-string-or-term>" }
    if (!f.term && typeof f.text === "string") {
      const inner = parseFront(f.text);
      if (inner) return inner;
      // plain-text front stored before structured schema
      return { term: f.text, language: "en" };
    }

    // ③ Double-encoded: term is itself a JSON string of the full front
    if (typeof f.term === "string") {
      try {
        const inner = JSON.parse(f.term);
        if (inner && typeof inner === "object" && typeof (inner as Record<string,unknown>).term === "string") {
          return parseFront(inner);
        }
      } catch { /* not JSON — use term as-is */ }
      return raw as FlashcardFront;
    }
  }

  return null;
}

/**
 * Safely parse a FlashcardBack from any shape the DB may return.
 *
 * Handles all these cases:
 *  1. Already a proper FlashcardBack object → return as-is
 *  2. A JSON string → parse and recurse
 *  3. Migration legacy shape { text: "<json-string>" } → parse text and recurse
 *  4. Double-encoded: definition field itself is a JSON string → parse and recurse
 */
export function parseBack(raw: unknown): FlashcardBack | null {
  if (!raw) return null;

  // ① JSON string → parse and recurse
  if (typeof raw === "string") {
    try { return parseBack(JSON.parse(raw)); } catch { return null; }
  }

  if (typeof raw === "object") {
    const b = raw as Record<string, unknown>;

    // ② Migration shape: { text: "<json-string-or-definition>" }
    if (!b.definition && typeof b.text === "string") {
      const inner = parseBack(b.text);
      if (inner) return inner;
      return { definition: b.text, translations: [] };
    }

    // ③ Double-encoded: definition is itself a JSON string of the full back
    if (typeof b.definition === "string") {
      try {
        const inner = JSON.parse(b.definition);
        if (inner && typeof inner === "object" && typeof (inner as Record<string,unknown>).definition === "string") {
          return parseBack(inner);
        }
      } catch { /* not JSON — use definition as-is */ }
      return raw as FlashcardBack;
    }
  }

  return null;
}

/** Returns the effective front, applying custom override if present. Handles text-column strings. */
export function effectiveFront(card: Flashcard): FlashcardFront {
  const raw = card.custom_front ?? card.front;
  return (
    parseFront(raw) ?? { term: termText(raw), language: "en" as const }
  );
}

/** Returns the effective back, applying custom override if present. Handles text-column strings. */
export function effectiveBack(card: Flashcard): FlashcardBack {
  const raw = card.custom_back ?? card.back;
  return parseBack(raw) ?? { definition: definitionText(raw), translations: [] };
}

/** Extract display term — delegates to parseFront for full unwrapping. */
export function termText(front: FlashcardFront | string | unknown): string {
  const parsed = parseFront(front);
  if (parsed) return parsed.term;
  // Absolute fallback: strip any JSON wrapping from a plain string
  if (typeof front === "string") return front;
  return "";
}

/** Extract display definition — delegates to parseBack for full unwrapping. */
export function definitionText(back: FlashcardBack | string | unknown): string {
  const parsed = parseBack(back);
  if (parsed) return parsed.definition;
  if (typeof back === "string") return back;
  return "";
}

/** Build a minimal FlashcardFront from plain text (for quick cards). */
export function makeFront(
  term: string,
  language: "mn" | "ja" | "en" = "en",
  opts?: { reading?: string; partsOfSpeech?: string[] },
): FlashcardFront {
  return { term, language, ...opts };
}

/** Build a minimal FlashcardBack from plain text (for quick cards). */
export function makeBack(
  definition: string,
  translations: FlashcardBack["translations"] = [],
): FlashcardBack {
  return { definition, translations };
}
