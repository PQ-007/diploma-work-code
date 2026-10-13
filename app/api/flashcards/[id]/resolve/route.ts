import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { FlashcardFront, FlashcardBack } from "@/lib/flashcards/types";

interface Params {
  params: Promise<{ id: string }>;
}

/* ═══════════════════════════════════════════
   GET /api/flashcards/[id]/resolve
   Returns effective front/back for a card:
   - dict-linked: dynamic content from dictionary entry
   - custom: custom_front/back overrides
   - simple: plain front/back
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
      .select(
        "id, user_id, front, back, custom_front, custom_back, source_type, source_id",
      )
      .eq("id", cardId)
      .maybeSingle();

    if (!card || card.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let resolvedFront: FlashcardFront = card.front as FlashcardFront;
    let resolvedBack: FlashcardBack = card.back as FlashcardBack;
    let entrySlug: string | undefined;
    let translations: Array<{ language_code: string; translated_term: string }> = [];

    // If linked to a dictionary entry, fetch live content
    if (card.source_type === "dictionary" && card.source_id) {
      const { data: entry } = await supabase
        .from("dictionary_entries")
        .select("id, term, reading, language_code, definition, slug, status")
        .eq("id", card.source_id)
        .maybeSingle();

      if (entry) {
        entrySlug = entry.slug;

        // Fetch translations
        const { data: trans } = await supabase
          .from("dictionary_translations")
          .select("language_code, translated_term")
          .eq("entry_id", entry.id)
          .limit(5);
        translations = trans || [];

        // Build dynamic front from live entry
        resolvedFront = {
          term: entry.term,
          reading: entry.reading ?? undefined,
          language: (entry.language_code as "mn" | "ja" | "en") ?? "en",
        };

        // Build dynamic back from live entry + translations
        resolvedBack = {
          definition: entry.definition,
          translations: translations.map((t) => ({
            language: t.language_code as "mn" | "ja" | "en",
            term: t.translated_term,
          })),
        };
      }
    }

    // Apply custom overrides if set
    const isCustomized = !!(card.custom_front || card.custom_back);
    if (card.custom_front) resolvedFront = card.custom_front as FlashcardFront;
    if (card.custom_back) resolvedBack = card.custom_back as FlashcardBack;

    return NextResponse.json(
      {
        front: resolvedFront,
        back: resolvedBack,
        entrySlug,
        isCustomized,
        translations,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error resolving flashcard", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
