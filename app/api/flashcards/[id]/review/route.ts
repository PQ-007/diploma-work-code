import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

/* ═══════════════════════════════════════════
   POST /api/flashcards/[id]/review
   Body: { quality: 0|1|2|3|4|5 }
   Applies SM-2 algorithm. Inserts flashcard_reviews row.
   Owner only.

   SM-2 algorithm:
     if quality < 3:
       repetition = 0, interval = 1
     else:
       if repetition == 0: interval = 1
       elif repetition == 1: interval = 6
       else: interval = round(prev_interval * ease)
       repetition += 1
     ease = ease + 0.1 - (5-q)*(0.08 + (5-q)*0.02)
     ease = max(1.3, ease)
     due_at = now + interval days
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
    const cardId = Number(id);
    if (!Number.isFinite(cardId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = (await req.json()) as { quality?: number };
    const quality = Number(body.quality);
    if (!Number.isFinite(quality) || quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: "quality must be 0–5" },
        { status: 400 },
      );
    }

    const { data: card } = await supabase
      .from("flashcards")
      .select("id, user_id, sm2_interval, sm2_repetition, sm2_ease")
      .eq("id", cardId)
      .maybeSingle();

    if (!card || card.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // SM-2 algorithm
    let { sm2_interval: interval, sm2_repetition: repetition, sm2_ease: ease } = card;

    if (quality < 3) {
      repetition = 0;
      interval = 1;
    } else {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease);
      }
      repetition += 1;
    }

    ease = ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    ease = Math.max(1.3, ease);

    const dueAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();

    // Update card
    const { data: updated, error: updateError } = await supabase
      .from("flashcards")
      .update({
        sm2_interval: interval,
        sm2_repetition: repetition,
        sm2_ease: parseFloat(ease.toFixed(4)),
        sm2_due_at: dueAt,
      })
      .eq("id", cardId)
      .select("id, sm2_interval, sm2_repetition, sm2_ease, sm2_due_at")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Record review history
    await supabase.from("flashcard_reviews").insert({
      card_id: cardId,
      user_id: user.id,
      quality,
    });

    return NextResponse.json({ card: updated }, { status: 200 });
  } catch (error) {
    console.error("Error recording review", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
