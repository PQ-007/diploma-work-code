import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   POST /api/dictionary/flashcard
   Convert an approved dictionary entry into a flashcard
   Body: { entryId, deck? }
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

    const { entryId, deck } = (await req.json()) as {
      entryId: number;
      deck?: string;
    };

    if (!entryId) {
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
      .single();

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (entry.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved entries can be converted to flashcards" },
        { status: 400 },
      );
    }

    // Check if flashcard already exists for this entry
    const { data: existingFlashcard } = await supabase
      .from("flashcards")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_type", "dictionary")
      .eq("source_id", entryId)
      .maybeSingle();

    if (existingFlashcard) {
      return NextResponse.json(
        {
          flashcard_id: existingFlashcard.id,
          message: "Flashcard already exists",
        },
        { status: 200 },
      );
    }

    // Build front (term + reading) and back (definition + first translation)
    let front = entry.term;
    if (entry.reading) {
      front += ` (${entry.reading})`;
    }

    let back = entry.definition;

    // Add first translation if available
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

    // Create flashcard
    const { data: flashcard, error: flashcardError } = await supabase
      .from("flashcards")
      .insert({
        user_id: user.id,
        front,
        back,
        source_type: "dictionary",
        source_id: entryId,
        deck: deck?.trim() || "dictionary",
      })
      .select("id")
      .single();

    if (flashcardError || !flashcard) {
      return NextResponse.json(
        { error: flashcardError?.message || "Failed to create flashcard" },
        { status: 500 },
      );
    }

    return NextResponse.json({ flashcard_id: flashcard.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating flashcard from entry", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
