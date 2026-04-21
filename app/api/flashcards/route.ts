import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { FlashcardFront, FlashcardBack } from "@/lib/flashcards/types";
import { parseFront as pF, parseBack as pB } from "@/lib/flashcards/types";

function normalizeCardRow(c: Record<string, unknown>) {
  return {
    ...c,
    front:        pF(c.front)        ?? { term: String(c.front ?? ""),        language: "en" },
    back:         pB(c.back)         ?? { definition: String(c.back ?? ""),   translations: [] },
    custom_front: c.custom_front ? (pF(c.custom_front) ?? null) : null,
    custom_back:  c.custom_back  ? (pB(c.custom_back)  ?? null) : null,
  };
}

const CARD_SELECT =
  "id, deck_id, front, back, custom_front, custom_back, source_type, source_id, sm2_interval, sm2_repetition, sm2_ease, sm2_due_at, created_at";

/* ═══════════════════════════════════════════
   GET /api/flashcards
   Query: ?deckId=&q=&limit=&offset=&due=1
   Returns current user's cards.
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deckIdParam = searchParams.get("deckId");
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
    const dueOnly = searchParams.get("due") === "1";

    let query = supabase
      .from("flashcards")
      .select(CARD_SELECT)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (deckIdParam) {
      const deckId = Number(deckIdParam);
      if (Number.isFinite(deckId)) query = query.eq("deck_id", deckId);
    }

    if (dueOnly) {
      query = query.lte("sm2_due_at", new Date().toISOString());
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let items = (data || []).map((c) => normalizeCardRow(c as Record<string, unknown>));

    // Text search (filter in memory since front/back may be JSONB or text)
    if (q) {
      const lq = q.toLowerCase();
      items = items.filter((c) => {
        const front = c.front as FlashcardFront;
        const back = c.back as FlashcardBack;
        return (
          (front?.term ?? "").toLowerCase().includes(lq) ||
          (back?.definition ?? "").toLowerCase().includes(lq)
        );
      });
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("Error listing flashcards", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   POST /api/flashcards
   Body (dictionary style):
     { front: FlashcardFront, back: FlashcardBack, deckId, sourceType?, sourceId? }
   Body (quick / legacy):
     { front: string, back: string, deckId, sourceType?, sourceId? }
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

    const body = await req.json();
    const deckId = Number(body.deckId);

    if (!Number.isFinite(deckId)) {
      return NextResponse.json({ error: "deckId is required" }, { status: 400 });
    }

    // Normalize front/back to JSONB shape
    const front = normalizeFront(body.front);
    const back = normalizeBack(body.back);

    if (!front.term) {
      return NextResponse.json(
        { error: "front.term (or front string) is required" },
        { status: 400 },
      );
    }
    if (!back.definition) {
      return NextResponse.json(
        { error: "back.definition (or back string) is required" },
        { status: 400 },
      );
    }

    // Verify deck belongs to this user
    const { data: deck } = await supabase
      .from("decks")
      .select("id, owner_id")
      .eq("id", deckId)
      .maybeSingle();
    if (!deck || deck.owner_id !== user.id) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const { data: card, error } = await supabase
      .from("flashcards")
      .insert({
        user_id: user.id,
        deck_id: deckId,
        front,
        back,
        source_type: body.sourceType || "custom",
        source_id: body.sourceId ?? null,
      })
      .select(CARD_SELECT)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: error?.message || "Failed to create flashcard" },
        { status: 500 },
      );
    }

    await supabase
      .from("decks")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", deckId);

    return NextResponse.json({ flashcard: normalizeCardRow(card as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    console.error("Error creating flashcard", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeFront(front: unknown): FlashcardFront {
  if (typeof front === "string") {
    return { term: front.trim(), language: "en" };
  }
  if (front && typeof front === "object") {
    const f = front as Record<string, unknown>;
    return {
      term: String(f.term ?? f.text ?? "").trim(),
      reading: f.reading ? String(f.reading) : undefined,
      language: (f.language as "mn" | "ja" | "en") ?? "en",
      partsOfSpeech: Array.isArray(f.partsOfSpeech) ? (f.partsOfSpeech as string[]) : undefined,
    };
  }
  return { term: "", language: "en" };
}

function normalizeBack(back: unknown): FlashcardBack {
  if (typeof back === "string") {
    return { definition: back.trim(), translations: [] };
  }
  if (back && typeof back === "object") {
    const b = back as Record<string, unknown>;
    return {
      definition: String(b.definition ?? b.text ?? "").trim(),
      translations: Array.isArray(b.translations)
        ? (b.translations as FlashcardBack["translations"])
        : [],
      examples: Array.isArray(b.examples)
        ? (b.examples as FlashcardBack["examples"])
        : undefined,
    };
  }
  return { definition: "", translations: [] };
}
