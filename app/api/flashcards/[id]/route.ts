import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { FlashcardFront, FlashcardBack } from "@/lib/flashcards/types";
import { parseFront as pF, parseBack as pB } from "@/lib/flashcards/types";

function nc(c: Record<string, unknown>) {
  return {
    ...c,
    front:        pF(c.front)        ?? { term: String(c.front ?? ""),        language: "en" },
    back:         pB(c.back)         ?? { definition: String(c.back ?? ""),   translations: [] },
    custom_front: c.custom_front ? (pF(c.custom_front) ?? null) : null,
    custom_back:  c.custom_back  ? (pB(c.custom_back)  ?? null) : null,
  };
}

interface Params {
  params: Promise<{ id: string }>;
}

const CARD_SELECT =
  "id, user_id, deck_id, front, back, custom_front, custom_back, source_type, source_id, sm2_interval, sm2_repetition, sm2_ease, sm2_due_at, created_at";

/* ═══════════════════════════════════════════
   GET /api/flashcards/[id]
   Owner only.
   ═══════════════════════════════════════════ */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cardId = Number(id);
    if (!Number.isFinite(cardId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { data: card } = await supabase
      .from("flashcards")
      .select(CARD_SELECT)
      .eq("id", cardId)
      .maybeSingle();

    if (!card || card.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ flashcard: nc(card as Record<string, unknown>) }, { status: 200 });
  } catch (error) {
    console.error("Error fetching flashcard", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   PATCH /api/flashcards/[id]
   Body: {
     front?, back?,            // override base content (JSONB or string)
     customFront?, customBack?, // set/update user override
     resetCustom?: boolean,    // if true, clear custom_front/back
     deckId?
   }
   ═══════════════════════════════════════════ */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cardId = Number(id);
    if (!Number.isFinite(cardId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("flashcards")
      .select("id, user_id, source_type")
      .eq("id", cardId)
      .maybeSingle();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      front?: unknown;
      back?: unknown;
      customFront?: unknown;
      customBack?: unknown;
      resetCustom?: boolean;
      deckId?: number;
    };

    const update: Record<string, unknown> = {};

    if (body.front !== undefined) {
      const front = normalizeFront(body.front);
      if (!front.term) {
        return NextResponse.json({ error: "front.term cannot be empty" }, { status: 400 });
      }
      update.front = front;
    }

    if (body.back !== undefined) {
      const back = normalizeBack(body.back);
      if (!back.definition) {
        return NextResponse.json({ error: "back.definition cannot be empty" }, { status: 400 });
      }
      update.back = back;
    }

    // Custom overrides (for dict-linked cards edited by user)
    if (body.customFront !== undefined) {
      update.custom_front = body.customFront === null ? null : normalizeFront(body.customFront);
    }
    if (body.customBack !== undefined) {
      update.custom_back = body.customBack === null ? null : normalizeBack(body.customBack);
    }

    // Reset custom overrides — revert to live dict content
    if (body.resetCustom) {
      update.custom_front = null;
      update.custom_back = null;
    }

    if (body.deckId !== undefined) {
      const deckId = Number(body.deckId);
      if (!Number.isFinite(deckId)) {
        return NextResponse.json({ error: "Invalid deckId" }, { status: 400 });
      }
      const { data: deck } = await supabase
        .from("decks")
        .select("id, owner_id")
        .eq("id", deckId)
        .maybeSingle();
      if (!deck || deck.owner_id !== user.id) {
        return NextResponse.json({ error: "Deck not found" }, { status: 404 });
      }
      update.deck_id = deckId;
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: card, error } = await supabase
      .from("flashcards")
      .update(update)
      .eq("id", cardId)
      .select(CARD_SELECT)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: error?.message || "Failed to update flashcard" },
        { status: 500 },
      );
    }

    return NextResponse.json({ flashcard: nc(card as Record<string, unknown>) }, { status: 200 });
  } catch (error) {
    console.error("Error updating flashcard", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   DELETE /api/flashcards/[id]
   ═══════════════════════════════════════════ */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cardId = Number(id);
    if (!Number.isFinite(cardId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("flashcards")
      .select("id, user_id")
      .eq("id", cardId)
      .maybeSingle();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await supabase.from("flashcards").delete().eq("id", cardId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting flashcard", error);
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
