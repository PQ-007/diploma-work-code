import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   POST /api/dictionary/duplicate-check
   Check for duplicate/similar terms before creating
   Body: { term, language_code }
   ═══════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { term, language_code } = (await req.json()) as {
      term: string;
      language_code: string;
    };

    if (!term?.trim()) {
      return NextResponse.json({ matches: [] });
    }

    // Use trigram similarity to find similar terms
    // Falls back to ILIKE if pg_trgm RPC not available
    const { data: matches, error } = await supabase.rpc(
      "check_dictionary_duplicates",
      {
        search_term: term.trim(),
        lang_code: language_code || null,
      },
    );

    if (error) {
      // Fallback: simple ILIKE search
      const { data: fallbackMatches } = await supabase
        .from("dictionary_entries")
        .select("id, term, slug, language_code, status")
        .or(`term.ilike.%${term.trim()}%,term.ilike.${term.trim()}%`)
        .in("status", ["approved", "pending_review"])
        .limit(5);

      return NextResponse.json({
        matches: (fallbackMatches || []).map((m) => ({
          id: m.id,
          term: m.term,
          slug: m.slug,
          language_code: m.language_code,
          status: m.status,
          similarity: null,
        })),
      });
    }

    return NextResponse.json({ matches: matches || [] });
  } catch (error) {
    console.error("Error checking duplicates", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
