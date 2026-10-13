import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { uniqueDeckSlug } from "@/lib/flashcards/slug";

/* ═══════════════════════════════════════════
   GET /api/decks
   List the current user's decks with card counts.
   ═══════════════════════════════════════════ */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: decks, error } = await supabase
      .from("decks")
      .select(
        "id, name, slug, description, is_public, cloned_from_deck_id, created_at, updated_at",
      )
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const deckIds = (decks || []).map((d) => d.id);
    const countsById = new Map<number, number>();
    if (deckIds.length) {
      const { data: cards } = await supabase
        .from("flashcards")
        .select("deck_id")
        .in("deck_id", deckIds);
      (cards || []).forEach((c) => {
        countsById.set(c.deck_id, (countsById.get(c.deck_id) || 0) + 1);
      });
    }

    const items = (decks || []).map((d) => ({
      ...d,
      card_count: countsById.get(d.id) || 0,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("Error listing decks", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   POST /api/decks
   Body: { name, description?, isPublic? }
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
      name?: string;
      description?: string;
      isPublic?: boolean;
    };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slug = await uniqueDeckSlug(supabase, user.id, name);

    const { data: deck, error } = await supabase
      .from("decks")
      .insert({
        owner_id: user.id,
        name,
        slug,
        description: body.description?.trim() || null,
        is_public: !!body.isPublic,
      })
      .select(
        "id, name, slug, description, is_public, cloned_from_deck_id, created_at, updated_at",
      )
      .single();

    if (error || !deck) {
      return NextResponse.json(
        { error: error?.message || "Failed to create deck" },
        { status: 500 },
      );
    }

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    console.error("Error creating deck", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
