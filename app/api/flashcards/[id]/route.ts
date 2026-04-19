import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

/* ═══════════════════════════════════════════
   GET /api/flashcards/[id]
   Owner only.
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest, { params }: Params) {
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
      .select("id, user_id, deck_id, front, back, source_type, source_id, created_at")
      .eq("id", cardId)
      .maybeSingle();

    if (!card || card.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ flashcard: card }, { status: 200 });
  } catch (error) {
    console.error("Error fetching flashcard", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   PATCH /api/flashcards/[id]
   Body: { front?, back?, deckId? }
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
      .select("id, user_id")
      .eq("id", cardId)
      .maybeSingle();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      front?: string;
      back?: string;
      deckId?: number;
    };

    const update: Record<string, unknown> = {};
    if (body.front !== undefined) {
      const f = body.front.trim();
      if (!f) return NextResponse.json({ error: "front cannot be empty" }, { status: 400 });
      update.front = f;
    }
    if (body.back !== undefined) {
      const b = body.back.trim();
      if (!b) return NextResponse.json({ error: "back cannot be empty" }, { status: 400 });
      update.back = b;
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

    const { data: card, error } = await supabase
      .from("flashcards")
      .update(update)
      .eq("id", cardId)
      .select("id, deck_id, front, back, source_type, source_id, created_at")
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: error?.message || "Failed to update flashcard" },
        { status: 500 },
      );
    }

    return NextResponse.json({ flashcard: card }, { status: 200 });
  } catch (error) {
    console.error("Error updating flashcard", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   DELETE /api/flashcards/[id]
   ═══════════════════════════════════════════ */
export async function DELETE(req: NextRequest, { params }: Params) {
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
