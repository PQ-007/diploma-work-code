import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { uniqueDeckSlug } from "@/lib/flashcards/slug";

interface Params {
  params: Promise<{ id: string }>;
}

/* ═══════════════════════════════════════════
   POST /api/decks/[id]/clone
   Clone a public deck into the current user's library.
   Copies all cards with source_type='cloned', source_id=original card id.
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
    const sourceDeckId = Number(id);
    if (!Number.isFinite(sourceDeckId)) {
      return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
    }

    const { data: source } = await supabase
      .from("decks")
      .select("id, owner_id, name, description, is_public")
      .eq("id", sourceDeckId)
      .maybeSingle();

    if (!source) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (source.owner_id === user.id) {
      return NextResponse.json(
        { error: "Cannot clone your own deck" },
        { status: 400 },
      );
    }

    if (!source.is_public) {
      return NextResponse.json(
        { error: "This deck is not public" },
        { status: 403 },
      );
    }

    const slug = await uniqueDeckSlug(supabase, user.id, source.name);

    const { data: newDeck, error: newDeckError } = await supabase
      .from("decks")
      .insert({
        owner_id: user.id,
        name: source.name,
        slug,
        description: source.description,
        is_public: false,
        cloned_from_deck_id: source.id,
      })
      .select("id, name, slug")
      .single();

    if (newDeckError || !newDeck) {
      return NextResponse.json(
        { error: newDeckError?.message || "Failed to clone deck" },
        { status: 500 },
      );
    }

    // Copy all cards
    const { data: sourceCards } = await supabase
      .from("flashcards")
      .select("id, front, back")
      .eq("deck_id", source.id);

    if (sourceCards?.length) {
      const rows = sourceCards.map((c) => ({
        user_id: user.id,
        deck_id: newDeck.id,
        front: c.front,
        back: c.back,
        source_type: "cloned",
        source_id: c.id,
      }));
      const { error: insertError } = await supabase.from("flashcards").insert(rows);
      if (insertError) {
        // Best-effort rollback of the deck row
        await supabase.from("decks").delete().eq("id", newDeck.id);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ deck: newDeck }, { status: 201 });
  } catch (error) {
    console.error("Error cloning deck", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
