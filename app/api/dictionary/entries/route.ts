import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { uniqueDeckSlug } from "@/lib/flashcards/slug";
import type { FlashcardFront, FlashcardBack } from "@/lib/flashcards/types";

/* ═══════════════════════════════════════════
   POST /api/dictionary/entries
   Create a draft dictionary entry + revision in one call.
   Optionally also creates a linked flashcard.
   Body: {
     term, definition, languageCode,
     reading?, deckId?, createFlashcard?
   }
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
      term?: string;
      definition?: string;
      languageCode?: string;
      reading?: string;
      deckId?: number;
      createFlashcard?: boolean;
    };

    const term = body.term?.trim();
    const definition = body.definition?.trim();
    const languageCode = body.languageCode?.trim() || "en";

    if (!term) {
      return NextResponse.json({ error: "term is required" }, { status: 400 });
    }
    if (!definition) {
      return NextResponse.json(
        { error: "definition is required" },
        { status: 400 },
      );
    }

    // Build slug from term
    const baseSlug = term
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);

    // Find unique slug
    let slug = baseSlug || "entry";
    let suffix = 0;
    while (true) {
      const { data: existing } = await supabase
        .from("dictionary_entries")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }

    // Create draft entry
    const { data: entry, error: entryError } = await supabase
      .from("dictionary_entries")
      .insert({
        term,
        slug,
        definition,
        language_code: languageCode,
        reading: body.reading?.trim() || null,
        status: "draft",
        created_by: user.id,
      })
      .select("id, term, slug, definition, language_code, reading, status")
      .single();

    if (entryError || !entry) {
      return NextResponse.json(
        { error: entryError?.message || "Failed to create entry" },
        { status: 500 },
      );
    }

    // Create revision
    await supabase.from("dictionary_revisions").insert({
      entry_id: entry.id,
      proposed_by: user.id,
      term,
      definition,
      language_code: languageCode,
      reading: body.reading?.trim() || null,
      revision_number: 1,
      status: "pending_review",
    });

    // Optionally create linked flashcard
    let flashcard = null;
    if (body.createFlashcard) {
      let targetDeckId: number | null = null;

      if (body.deckId !== undefined) {
        const deckId = Number(body.deckId);
        const { data: deck } = await supabase
          .from("decks")
          .select("id, owner_id")
          .eq("id", deckId)
          .maybeSingle();
        if (deck && deck.owner_id === user.id) {
          targetDeckId = deck.id;
        }
      }

      if (!targetDeckId) {
        // Fall back to "Dictionary" deck
        const { data: existing } = await supabase
          .from("decks")
          .select("id")
          .eq("owner_id", user.id)
          .eq("name", "Dictionary")
          .maybeSingle();
        if (existing) {
          targetDeckId = existing.id;
        } else {
          const slug = await uniqueDeckSlug(supabase, user.id, "Dictionary");
          const { data: newDeck } = await supabase
            .from("decks")
            .insert({ owner_id: user.id, name: "Dictionary", slug, is_public: false })
            .select("id")
            .single();
          if (newDeck) targetDeckId = newDeck.id;
        }
      }

      if (targetDeckId) {
        const front: FlashcardFront = {
          term: entry.term,
          reading: entry.reading ?? undefined,
          language: (entry.language_code as "mn" | "ja" | "en") ?? "en",
        };
        const back: FlashcardBack = {
          definition: entry.definition,
          translations: [],
        };

        const { data: fc } = await supabase
          .from("flashcards")
          .insert({
            user_id: user.id,
            deck_id: targetDeckId,
            front,
            back,
            source_type: "dictionary",
            source_id: entry.id,
          })
          .select("id, deck_id")
          .single();
        flashcard = fc;

        if (targetDeckId) {
          await supabase
            .from("decks")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", targetDeckId);
        }
      }
    }

    return NextResponse.json({ entry, flashcard }, { status: 201 });
  } catch (error) {
    console.error("Error creating dictionary entry", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
