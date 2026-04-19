import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/decks/browse
   List public decks from other users.
   Query: ?q= (search by name/description), ?limit=
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 30, 1),
      100,
    );

    let query = supabase
      .from("decks")
      .select(
        "id, owner_id, name, slug, description, cloned_from_deck_id, created_at, updated_at",
      )
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (user) {
      query = query.neq("owner_id", user.id);
    }

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data: decks, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const deckIds = (decks || []).map((d) => d.id);
    const ownerIds = Array.from(new Set((decks || []).map((d) => d.owner_id)));

    // Card counts + first 3 previews per deck
    const countsById = new Map<number, number>();
    const previewsByDeck = new Map<
      number,
      { id: number; front: string; back: string }[]
    >();

    if (deckIds.length) {
      const { data: cards } = await supabase
        .from("flashcards")
        .select("id, deck_id, front, back, created_at")
        .in("deck_id", deckIds)
        .order("created_at", { ascending: true });

      (cards || []).forEach((c) => {
        countsById.set(c.deck_id, (countsById.get(c.deck_id) || 0) + 1);
        const arr = previewsByDeck.get(c.deck_id) || [];
        if (arr.length < 3) {
          arr.push({ id: c.id, front: c.front, back: c.back });
          previewsByDeck.set(c.deck_id, arr);
        }
      });
    }

    // Owners info
    const ownersById = new Map<
      string,
      { id: string; display_name: string; user_name: string; avatar_url: string | null }
    >();
    if (ownerIds.length) {
      const { data: owners } = await supabase
        .from("profiles")
        .select("id, display_name, user_name, avatar_url")
        .in("id", ownerIds);
      (owners || []).forEach((o) => ownersById.set(o.id, o));
    }

    // Decks the current user has already cloned (to disable the button)
    const clonedSourceIds = new Set<number>();
    if (user && deckIds.length) {
      const { data: myClones } = await supabase
        .from("decks")
        .select("cloned_from_deck_id")
        .eq("owner_id", user.id)
        .in("cloned_from_deck_id", deckIds);
      (myClones || []).forEach((c) => {
        if (c.cloned_from_deck_id) clonedSourceIds.add(c.cloned_from_deck_id);
      });
    }

    const items = (decks || []).map((d) => ({
      ...d,
      card_count: countsById.get(d.id) || 0,
      previews: previewsByDeck.get(d.id) || [],
      owner: ownersById.get(d.owner_id) || null,
      already_cloned: clonedSourceIds.has(d.id),
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("Error browsing public decks", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
