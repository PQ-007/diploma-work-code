import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { FlashcardFront, FlashcardBack } from "@/lib/flashcards/types";

interface Params {
  params: Promise<{ id: string }>;
}

/* ═══════════════════════════════════════════
   POST /api/decks/[id]/import
   Bulk import cards from CSV or JSON.
   - CSV: each line is "front\tback" (tab-separated), skip lines starting with #
   - JSON: { cards: [{ front, back }] } — front/back can be strings or FlashcardFront/Back
   Max 500 cards per request.
   Owner only.
   ═══════════════════════════════════════════ */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deckId = Number(id);
    if (!Number.isFinite(deckId)) {
      return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
    }

    const { data: deck } = await supabase
      .from("decks")
      .select("id, owner_id")
      .eq("id", deckId)
      .maybeSingle();

    if (!deck || deck.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") ?? "";

    type CardInput = { front: FlashcardFront | string; back: FlashcardBack | string };
    let cardInputs: CardInput[] = [];

    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { cards?: CardInput[] };
      cardInputs = body.cards ?? [];
    } else {
      // Treat as CSV text (tab-separated)
      const text = await req.text();
      const lines = text.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [front, ...rest] = trimmed.split("\t");
        const back = rest.join("\t");
        if (front?.trim() && back?.trim()) {
          cardInputs.push({ front: front.trim(), back: back.trim() });
        }
      }
    }

    if (!cardInputs.length) {
      return NextResponse.json({ error: "No valid cards found" }, { status: 400 });
    }

    const MAX_IMPORT = 500;
    const toImport = cardInputs.slice(0, MAX_IMPORT);

    // Fetch existing fronts to skip duplicates (by term text)
    const { data: existingCards } = await supabase
      .from("flashcards")
      .select("front")
      .eq("deck_id", deckId);

    const existingTerms = new Set(
      (existingCards || []).map((c) => {
        const f = c.front as FlashcardFront | string;
        if (typeof f === "string") return f.toLowerCase();
        if (f && typeof f === "object" && "term" in f) return (f.term as string).toLowerCase();
        return "";
      }),
    );

    const normalizeCard = (input: CardInput): {
      front: FlashcardFront;
      back: FlashcardBack;
    } => {
      let front: FlashcardFront;
      let back: FlashcardBack;

      if (typeof input.front === "string") {
        front = { term: input.front, language: "en" };
      } else {
        front = input.front as FlashcardFront;
      }

      if (typeof input.back === "string") {
        back = { definition: input.back, translations: [] };
      } else {
        back = input.back as FlashcardBack;
      }

      return { front, back };
    };

    const inserts = [];
    let skipped = 0;

    for (const input of toImport) {
      const { front } = normalizeCard(input);
      const termLower = front.term.toLowerCase();
      if (existingTerms.has(termLower)) {
        skipped++;
        continue;
      }
      existingTerms.add(termLower);
      inserts.push(normalizeCard(input));
    }

    if (!inserts.length) {
      return NextResponse.json({ imported: 0, skipped }, { status: 200 });
    }

    const { error } = await supabase.from("flashcards").insert(
      inserts.map(({ front, back }) => ({
        user_id: user.id,
        deck_id: deckId,
        front,
        back,
        source_type: "custom",
      })),
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase
      .from("decks")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", deckId);

    return NextResponse.json(
      { imported: inserts.length, skipped },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error importing cards", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
