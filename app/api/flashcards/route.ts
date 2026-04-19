import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/flashcards
   Query: ?deckId=&q=&limit=&offset=
   Returns current user's cards (scoped by ownership).
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
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 50, 1),
      200,
    );
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    let query = supabase
      .from("flashcards")
      .select("id, deck_id, front, back, source_type, source_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (deckIdParam) {
      const deckId = Number(deckIdParam);
      if (Number.isFinite(deckId)) query = query.eq("deck_id", deckId);
    }
    if (q) {
      query = query.or(`front.ilike.%${q}%,back.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] }, { status: 200 });
  } catch (error) {
    console.error("Error listing flashcards", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   POST /api/flashcards
   Body: { front, back, deckId, sourceType?, sourceId? }
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

    const body = (await req.json()) as {
      front?: string;
      back?: string;
      deckId?: number;
      sourceType?: string;
      sourceId?: number;
    };
    const front = body.front?.trim();
    const back = body.back?.trim();
    const deckId = Number(body.deckId);

    if (!front || !back) {
      return NextResponse.json(
        { error: "front and back are required" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(deckId)) {
      return NextResponse.json({ error: "deckId is required" }, { status: 400 });
    }

    // Verify the deck belongs to this user
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
      .select("id, deck_id, front, back, source_type, source_id, created_at")
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: error?.message || "Failed to create flashcard" },
        { status: 500 },
      );
    }

    // Bump deck updated_at so newest-first ordering surfaces it
    await supabase
      .from("decks")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", deckId);

    return NextResponse.json({ flashcard: card }, { status: 201 });
  } catch (error) {
    console.error("Error creating flashcard", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
