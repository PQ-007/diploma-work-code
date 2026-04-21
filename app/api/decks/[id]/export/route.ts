import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { termText, definitionText } from "@/lib/flashcards/types";

interface Params {
  params: Promise<{ id: string }>;
}

/* ═══════════════════════════════════════════
   GET /api/decks/[id]/export?format=csv|json
   Export a deck as CSV (Anki-compatible) or JSON.
   Owner only.
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deckId = Number(id);
    if (!Number.isFinite(deckId)) {
      return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
    }

    const { data: deck } = await supabase
      .from("decks")
      .select("id, owner_id, name, description, slug")
      .eq("id", deckId)
      .maybeSingle();

    if (!deck || deck.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: cards } = await supabase
      .from("flashcards")
      .select(
        "id, front, back, custom_front, custom_back, source_type, source_id, sm2_interval, sm2_repetition, sm2_ease, sm2_due_at, created_at",
      )
      .eq("deck_id", deckId)
      .order("created_at", { ascending: true });

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "csv";

    if (format === "json") {
      const data = {
        deck: {
          id: deck.id,
          name: deck.name,
          description: deck.description,
          slug: deck.slug,
          exported_at: new Date().toISOString(),
        },
        cards: (cards || []).map((c) => ({
          id: c.id,
          front: c.custom_front ?? c.front,
          back: c.custom_back ?? c.back,
          source_type: c.source_type,
          source_id: c.source_id,
          sm2_interval: c.sm2_interval,
          sm2_repetition: c.sm2_repetition,
          sm2_ease: c.sm2_ease,
          sm2_due_at: c.sm2_due_at,
          created_at: c.created_at,
        })),
      };

      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${deck.slug}-export.json"`,
        },
      });
    }

    // CSV (Anki-compatible: front\tback)
    const rows = (cards || []).map((c) => {
      const effectiveFront = c.custom_front ?? c.front;
      const effectiveBack = c.custom_back ?? c.back;
      const front = termText(effectiveFront).replace(/\t/g, " ");
      const back = definitionText(effectiveBack).replace(/\t/g, " ");
      return `${front}\t${back}`;
    });

    const csv = ["#separator:tab", `#deck:${deck.name}`, ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${deck.slug}-export.txt"`,
      },
    });
  } catch (error) {
    console.error("Error exporting deck", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
