import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/flashcards/due?deckId=&limit=
   Returns cards due for review today (sm2_due_at <= now()).
   Owner only.
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
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 50, 1),
      200,
    );

    const now = new Date().toISOString();

    let query = supabase
      .from("flashcards")
      .select(
        "id, deck_id, front, back, custom_front, custom_back, source_type, source_id, sm2_interval, sm2_repetition, sm2_ease, sm2_due_at, created_at",
      )
      .eq("user_id", user.id)
      .lte("sm2_due_at", now)
      .order("sm2_due_at", { ascending: true })
      .limit(limit);

    if (deckIdParam) {
      const deckId = Number(deckIdParam);
      if (Number.isFinite(deckId)) query = query.eq("deck_id", deckId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [], count: (data || []).length }, { status: 200 });
  } catch (error) {
    console.error("Error fetching due cards", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
