import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/flashcards/lookup?q=<term>&lang=<mn|ja|en>
   Internal dictionary search by term (fuzzy).
   Used by FlashcardFormDialog "Look up" button.
   No auth required (public read on approved entries).
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const lang = searchParams.get("lang") ?? undefined;

  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    let query = supabase
      .from("dictionary_entries")
      .select(
        "id, term, reading, language_code, definition, status, slug",
      )
      .ilike("term", `%${q}%`)
      .order("term", { ascending: true })
      .limit(10);

    if (lang) {
      query = query.eq("language_code", lang);
    }

    const { data: entries, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!entries?.length) {
      return NextResponse.json({ entries: [] }, { status: 200 });
    }

    // Fetch translations for found entries
    const entryIds = entries.map((e) => e.id);
    const { data: translations } = await supabase
      .from("dictionary_translations")
      .select("entry_id, language_code, translated_term")
      .in("entry_id", entryIds);

    const translationsByEntry = new Map<
      number,
      Array<{ language_code: string; translated_term: string }>
    >();
    (translations || []).forEach((t) => {
      const arr = translationsByEntry.get(t.entry_id) ?? [];
      arr.push({ language_code: t.language_code, translated_term: t.translated_term });
      translationsByEntry.set(t.entry_id, arr);
    });

    const result = entries.map((e) => ({
      ...e,
      translations: translationsByEntry.get(e.id) ?? [],
    }));

    return NextResponse.json({ entries: result }, { status: 200 });
  } catch (error) {
    console.error("Lookup error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
