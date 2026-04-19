import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/flashcards/stats?deckId=
   Returns per-user (or per-deck) statistics.
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
    const deckId = deckIdParam ? Number(deckIdParam) : null;

    const now = new Date();
    const nowIso = now.toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Build base card query
    let cardQuery = supabase
      .from("flashcards")
      .select("id, sm2_interval, sm2_repetition, sm2_due_at")
      .eq("user_id", user.id);
    if (deckId && Number.isFinite(deckId)) {
      cardQuery = cardQuery.eq("deck_id", deckId);
    }
    const { data: cards } = await cardQuery;

    const allCards = cards || [];
    const total = allCards.length;
    const dueToday = allCards.filter((c) => c.sm2_due_at <= nowIso).length;
    const mastered = allCards.filter((c) => c.sm2_interval >= 21).length;
    const learning = allCards.filter(
      (c) => c.sm2_repetition > 0 && c.sm2_interval < 21,
    ).length;
    const newCards = allCards.filter((c) => c.sm2_repetition === 0).length;

    // Reviews in last 7 days (accuracy + today count)
    let reviewQuery = supabase
      .from("flashcard_reviews")
      .select("quality, reviewed_at, card_id")
      .eq("user_id", user.id)
      .gte("reviewed_at", sevenDaysAgo)
      .order("reviewed_at", { ascending: true });

    if (deckId && Number.isFinite(deckId)) {
      const cardIds = allCards.map((c) => c.id);
      if (cardIds.length) {
        reviewQuery = reviewQuery.in("card_id", cardIds);
      }
    }

    const { data: reviews7d } = await reviewQuery;
    const r7 = reviews7d || [];

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const reviewedToday = r7.filter(
      (r) => r.reviewed_at >= todayStart.toISOString(),
    ).length;

    const accuracy7d =
      r7.length === 0
        ? null
        : r7.filter((r) => r.quality >= 3).length / r7.length;

    // Streak: consecutive days with at least 1 review (working backwards from today)
    const reviewedDays = new Set(
      r7.map((r) => r.reviewed_at.slice(0, 10)),
    );
    let streakDays = 0;
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    while (true) {
      const dayStr = cursor.toISOString().slice(0, 10);
      if (reviewedDays.has(dayStr)) {
        streakDays++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    // Heatmap: reviews per day over last 90 days
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    let heatmapQuery = supabase
      .from("flashcard_reviews")
      .select("reviewed_at")
      .eq("user_id", user.id)
      .gte("reviewed_at", ninetyDaysAgo);

    if (deckId && Number.isFinite(deckId) && allCards.length) {
      heatmapQuery = heatmapQuery.in("card_id", allCards.map((c) => c.id));
    }

    const { data: heatmapRows } = await heatmapQuery;
    const heatmapCounts: Record<string, number> = {};
    (heatmapRows || []).forEach((r) => {
      const day = r.reviewed_at.slice(0, 10);
      heatmapCounts[day] = (heatmapCounts[day] ?? 0) + 1;
    });

    // Per-deck breakdown (only when not already filtered by deck)
    let deckBreakdown: Array<{
      deck_id: number;
      deck_name: string;
      deck_slug: string;
      total: number;
      due: number;
      mastered: number;
    }> = [];

    if (!deckId) {
      const { data: decks } = await supabase
        .from("decks")
        .select("id, name, slug")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false });

      const { data: allUserCards } = await supabase
        .from("flashcards")
        .select("id, deck_id, sm2_interval, sm2_due_at")
        .eq("user_id", user.id);

      const cardsByDeck = new Map<number, typeof allUserCards>();
      (allUserCards || []).forEach((c) => {
        const arr = cardsByDeck.get(c.deck_id) ?? [];
        arr.push(c);
        cardsByDeck.set(c.deck_id, arr);
      });

      deckBreakdown = (decks || []).map((d) => {
        const dc = cardsByDeck.get(d.id) ?? [];
        return {
          deck_id: d.id,
          deck_name: d.name,
          deck_slug: d.slug,
          total: dc.length,
          due: dc.filter((c) => c.sm2_due_at <= nowIso).length,
          mastered: dc.filter((c) => c.sm2_interval >= 21).length,
        };
      });
    }

    return NextResponse.json(
      {
        total,
        due_today: dueToday,
        reviewed_today: reviewedToday,
        mastered,
        learning,
        new: newCards,
        accuracy_7d: accuracy7d,
        streak_days: streakDays,
        heatmap: heatmapCounts,
        deck_breakdown: deckBreakdown,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching stats", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
