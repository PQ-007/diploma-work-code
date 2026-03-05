import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/dictionary/search
   Full-text + trigram search for dictionary entries
   Query: ?q=&language=&limit=&offset=
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const url = req.nextUrl;
    const q = url.searchParams.get("q")?.trim() || "";
    const language = url.searchParams.get("language") || "";
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") || "20")),
    );
    const offset = parseInt(url.searchParams.get("offset") || "0");

    if (!q) {
      return NextResponse.json({ items: [], suggestions: [] }, { status: 200 });
    }

    // Use RPC for combined full-text + trigram search
    // Falls back to direct query if RPC not available
    const { data: entries, error } = await supabase.rpc("search_dictionary", {
      search_query: q,
      lang_filter: language || null,
      result_limit: limit,
      result_offset: offset,
    });

    if (error) {
      // Fallback: ILIKE search across entries (term/definition) + translations
      const { data: translationMatches } = await supabase
        .from("dictionary_translations")
        .select("entry_id")
        .ilike("translated_term", `%${q}%`);

      const translationIds = [
        ...new Set((translationMatches || []).map((t) => t.entry_id as number)),
      ];

      const orFilter =
        translationIds.length > 0
          ? `term.ilike.%${q}%,definition.ilike.%${q}%,id.in.(${translationIds.join(",")})`
          : `term.ilike.%${q}%,definition.ilike.%${q}%`;

      let query = supabase
        .from("dictionary_entries")
        .select(
          "id, term, slug, reading, language_code, definition, status, views, saves",
        )
        .eq("status", "approved")
        .or(orFilter)
        .order("views", { ascending: false })
        .range(offset, offset + limit - 1);

      if (language && ["mn", "ja", "en"].includes(language)) {
        query = query.eq("language_code", language);
      }

      const { data: fallbackEntries, error: fallbackError } = await query;

      if (fallbackError) {
        return NextResponse.json(
          { error: fallbackError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        items: fallbackEntries || [],
        suggestions: [],
      });
    }

    // Also fetch trigram suggestions for autocomplete
    const { data: suggestions } = await supabase.rpc(
      "suggest_dictionary_terms",
      {
        partial_term: q,
        result_limit: 5,
      },
    );

    return NextResponse.json({
      items: entries || [],
      suggestions: suggestions || [],
    });
  } catch (error) {
    console.error("Error searching dictionary", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
