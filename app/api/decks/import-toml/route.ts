import { NextRequest, NextResponse } from "next/server";
import { parse as parseToml } from "smol-toml";
import { createClient } from "@/utils/supabase/server";
import { uniqueDeckSlug } from "@/lib/flashcards/slug";
import type { FlashcardFront, FlashcardBack } from "@/lib/flashcards/types";

const MAX_CARDS = 500;
const LANGS = new Set(["mn", "ja", "en"]);

type RawCard = {
  front?: unknown;
  back?: unknown;
};

type ParsedToml = {
  deck?: {
    name?: unknown;
    description?: unknown;
    is_public?: unknown;
  };
  cards?: unknown;
};

function asLang(v: unknown): "mn" | "ja" | "en" {
  return typeof v === "string" && LANGS.has(v) ? (v as "mn" | "ja" | "en") : "en";
}

function normalizeFront(raw: unknown): FlashcardFront | null {
  if (typeof raw === "string") {
    const term = raw.trim();
    return term ? { term, language: "en" } : null;
  }
  if (raw && typeof raw === "object") {
    const f = raw as Record<string, unknown>;
    const term = String(f.term ?? "").trim();
    if (!term) return null;
    return {
      term,
      reading: f.reading ? String(f.reading) : undefined,
      language: asLang(f.language),
      partsOfSpeech: Array.isArray(f.partsOfSpeech)
        ? (f.partsOfSpeech as unknown[]).map(String)
        : undefined,
    };
  }
  return null;
}

function normalizeBack(raw: unknown): FlashcardBack | null {
  if (typeof raw === "string") {
    const def = raw.trim();
    return def ? { definition: def, translations: [] } : null;
  }
  if (raw && typeof raw === "object") {
    const b = raw as Record<string, unknown>;
    const definition = String(b.definition ?? "").trim();
    if (!definition) return null;
    const translations = Array.isArray(b.translations)
      ? (b.translations as unknown[])
          .map((t) => {
            if (!t || typeof t !== "object") return null;
            const tt = t as Record<string, unknown>;
            const term = String(tt.term ?? "").trim();
            if (!term) return null;
            return {
              language: asLang(tt.language),
              term,
              explanation: tt.explanation ? String(tt.explanation) : undefined,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
      : [];
    const examples = Array.isArray(b.examples)
      ? (b.examples as unknown[])
          .map((e) => {
            if (!e || typeof e !== "object") return null;
            const ee = e as Record<string, unknown>;
            const text = String(ee.text ?? "").trim();
            if (!text) return null;
            return { text, language: asLang(ee.language) };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
      : undefined;
    return { definition, translations, examples };
  }
  return null;
}

/* ═══════════════════════════════════════════
   POST /api/decks/import-toml
   Body: TOML text (Content-Type: text/plain or application/toml)
   Creates a new deck and bulk-inserts its cards.
   Schema:
     [deck]
     name = "..."           # required
     description = "..."    # optional
     is_public = false      # optional

     [[cards]]
     front = "term" | { term, reading?, language?, partsOfSpeech? }
     back  = "def"  | { definition, translations?, examples? }
   ═══════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const text = await req.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    let parsed: ParsedToml;
    try {
      parsed = parseToml(text) as ParsedToml;
    } catch (e) {
      return NextResponse.json(
        { error: `Invalid TOML: ${(e as Error).message}` },
        { status: 400 },
      );
    }

    const name = String(parsed.deck?.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "[deck].name is required" },
        { status: 400 },
      );
    }

    const rawCards = Array.isArray(parsed.cards) ? (parsed.cards as RawCard[]) : [];
    if (!rawCards.length) {
      return NextResponse.json(
        { error: "At least one [[cards]] entry is required" },
        { status: 400 },
      );
    }

    const seenTerms = new Set<string>();
    const inserts: { front: FlashcardFront; back: FlashcardBack }[] = [];
    let skipped = 0;

    for (const c of rawCards.slice(0, MAX_CARDS)) {
      const front = normalizeFront(c.front);
      const back = normalizeBack(c.back);
      if (!front || !back) {
        skipped++;
        continue;
      }
      const key = front.term.toLowerCase();
      if (seenTerms.has(key)) {
        skipped++;
        continue;
      }
      seenTerms.add(key);
      inserts.push({ front, back });
    }

    if (!inserts.length) {
      return NextResponse.json(
        { error: "No valid cards to import" },
        { status: 400 },
      );
    }

    const slug = await uniqueDeckSlug(supabase, user.id, name);

    const { data: deck, error: deckErr } = await supabase
      .from("decks")
      .insert({
        owner_id: user.id,
        name,
        slug,
        description:
          typeof parsed.deck?.description === "string"
            ? parsed.deck.description.trim() || null
            : null,
        is_public: parsed.deck?.is_public === true,
      })
      .select(
        "id, name, slug, description, is_public, cloned_from_deck_id, created_at, updated_at",
      )
      .single();

    if (deckErr || !deck) {
      return NextResponse.json(
        { error: deckErr?.message || "Failed to create deck" },
        { status: 500 },
      );
    }

    const { error: cardsErr } = await supabase.from("flashcards").insert(
      inserts.map(({ front, back }) => ({
        user_id: user.id,
        deck_id: deck.id,
        front,
        back,
        source_type: "toml-import",
      })),
    );

    if (cardsErr) {
      // Roll back the empty deck so the user isn't left with a broken row.
      await supabase.from("decks").delete().eq("id", deck.id);
      return NextResponse.json({ error: cardsErr.message }, { status: 500 });
    }

    return NextResponse.json(
      { deck, imported: inserts.length, skipped },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error importing TOML deck", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
