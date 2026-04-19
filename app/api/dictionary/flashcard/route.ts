import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { uniqueDeckSlug } from "@/lib/flashcards/slug";

/* ═══════════════════════════════════════════
   POST /api/dictionary/flashcard
   Convert an approved dictionary entry into a flashcard.
   Body: { entryId, deckId? , deckName? }
     - Provide deckId to add to an existing deck.
     - Provide deckName to auto-create a new deck if none exists.
     - If neither is given, falls back to a user-owned "Dictionary" deck (created on demand).
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
      entryId?: number;
      deckId?: number;
      deckName?: string;
    };

    const entryId = Number(body.entryId);
    if (!Number.isFinite(entryId)) {
      return NextResponse.json(
        { error: "entryId is required" },
        { status: 400 },
      );
    }

    // Fetch the entry
    const { data: entry } = await supabase
      .from("dictionary_entries")
      .select("id, term, reading, language_code, definition, status")
      .eq("id", entryId)
      .maybeSingle();

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (entry.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved entries can be converted to flashcards" },
        { status: 400 },
      );
    }

    // Resolve target deck
    let targetDeckId: number | null = null;

    if (body.deckId !== undefined) {
      const deckId = Number(body.deckId);
      const { data: deck } = await supabase
        .from("decks")
        .select("id, owner_id")
        .eq("id", deckId)
        .maybeSingle();
      if (!deck || deck.owner_id !== user.id) {
        return NextResponse.json({ error: "Deck not found" }, { status: 404 });
      }
      targetDeckId = deck.id;
    } else {
      const deckName = body.deckName?.trim() || "Dictionary";
      // Find or create a deck with this name for the current user
      const { data: existing } = await supabase
        .from("decks")
        .select("id")
        .eq("owner_id", user.id)
        .eq("name", deckName)
        .maybeSingle();

      if (existing) {
        targetDeckId = existing.id;
      } else {
        const slug = await uniqueDeckSlug(supabase, user.id, deckName);
        const { data: newDeck, error: deckErr } = await supabase
          .from("decks")
          .insert({
            owner_id: user.id,
            name: deckName,
            slug,
            is_public: false,
          })
          .select("id")
          .single();
        if (deckErr || !newDeck) {
          return NextResponse.json(
            { error: deckErr?.message || "Failed to create deck" },
            { status: 500 },
          );
        }
        targetDeckId = newDeck.id;
      }
    }

    // Check if flashcard already exists for this entry (per user)
    const { data: existingFlashcard } = await supabase
      .from("flashcards")
      .select("id, deck_id")
      .eq("user_id", user.id)
      .eq("source_type", "dictionary")
      .eq("source_id", entryId)
      .maybeSingle();

    if (existingFlashcard) {
      return NextResponse.json(
        {
          flashcard_id: existingFlashcard.id,
          deck_id: existingFlashcard.deck_id,
          message: "Flashcard already exists",
        },
        { status: 200 },
      );
    }

    // Build front (term + reading) and back (definition + first translations)
    let front = entry.term;
    if (entry.reading) {
      front += ` (${entry.reading})`;
    }

    let back = entry.definition;

    const { data: translations } = await supabase
      .from("dictionary_translations")
      .select("language_code, translated_term")
      .eq("entry_id", entryId)
      .limit(3);

    if (translations?.length) {
      const translationLines = translations
        .map((t) => `[${t.language_code.toUpperCase()}] ${t.translated_term}`)
        .join("\n");
      back += "\n\n" + translationLines;
    }

    const { data: flashcard, error: flashcardError } = await supabase
      .from("flashcards")
      .insert({
        user_id: user.id,
        deck_id: targetDeckId,
        front,
        back,
        source_type: "dictionary",
        source_id: entryId,
      })
      .select("id, deck_id")
      .single();

    if (flashcardError || !flashcard) {
      return NextResponse.json(
        { error: flashcardError?.message || "Failed to create flashcard" },
        { status: 500 },
      );
    }

    await supabase
      .from("decks")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", targetDeckId);

    return NextResponse.json(
      { flashcard_id: flashcard.id, deck_id: flashcard.deck_id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating flashcard from entry", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
