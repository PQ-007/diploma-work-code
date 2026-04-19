import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { uniqueDeckSlug } from "@/lib/flashcards/slug";

interface Params {
  params: Promise<{ id: string }>;
}

/* ═══════════════════════════════════════════
   GET /api/decks/[id]
   Returns deck details with cards. Accessible by
   owner always, or anyone if the deck is public.
   `id` may be a numeric id OR a deck slug (owner-scoped).
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { id } = await params;

    // Try numeric id first; if not numeric, resolve by slug (owner's slug)
    const numericId = Number(id);
    let deckQuery = supabase
      .from("decks")
      .select(
        "id, owner_id, name, slug, description, is_public, cloned_from_deck_id, created_at, updated_at",
      );

    if (Number.isFinite(numericId) && `${numericId}` === id) {
      deckQuery = deckQuery.eq("id", numericId);
    } else {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      deckQuery = deckQuery.eq("owner_id", user.id).eq("slug", id);
    }

    const { data: deck } = await deckQuery.maybeSingle();

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const isOwner = user?.id === deck.owner_id;
    if (!isOwner && !deck.is_public) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: cards } = await supabase
      .from("flashcards")
      .select("id, front, back, source_type, source_id, created_at")
      .eq("deck_id", deck.id)
      .order("created_at", { ascending: false });

    // Owner info for the cloned-from banner and public browse detail
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("id, display_name, user_name, avatar_url")
      .eq("id", deck.owner_id)
      .maybeSingle();

    return NextResponse.json(
      { deck, cards: cards || [], owner: ownerProfile, isOwner },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching deck", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   PATCH /api/decks/[id]
   Body: { name?, description?, isPublic? }
   Owner only.
   ═══════════════════════════════════════════ */
export async function PATCH(req: NextRequest, { params }: Params) {
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

    const { data: existing } = await supabase
      .from("decks")
      .select("id, owner_id, slug, name")
      .eq("id", deckId)
      .maybeSingle();

    if (!existing || existing.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      name?: string;
      description?: string | null;
      isPublic?: boolean;
    };

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      update.name = name;
      if (name !== existing.name) {
        update.slug = await uniqueDeckSlug(supabase, user.id, name);
      }
    }
    if (body.description !== undefined) {
      update.description = body.description?.toString().trim() || null;
    }
    if (body.isPublic !== undefined) {
      update.is_public = !!body.isPublic;
    }

    const { data: deck, error } = await supabase
      .from("decks")
      .update(update)
      .eq("id", deckId)
      .select(
        "id, name, slug, description, is_public, cloned_from_deck_id, created_at, updated_at",
      )
      .single();

    if (error || !deck) {
      return NextResponse.json(
        { error: error?.message || "Failed to update deck" },
        { status: 500 },
      );
    }

    return NextResponse.json({ deck }, { status: 200 });
  } catch (error) {
    console.error("Error updating deck", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   DELETE /api/decks/[id]
   Owner only. Cascade deletes all flashcards via FK.
   ═══════════════════════════════════════════ */
export async function DELETE(req: NextRequest, { params }: Params) {
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

    const { data: existing } = await supabase
      .from("decks")
      .select("id, owner_id")
      .eq("id", deckId)
      .maybeSingle();

    if (!existing || existing.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Cascade via FK, but do it explicitly in case FK cascade isn't applied in prod
    await supabase.from("flashcards").delete().eq("deck_id", deckId);
    const { error } = await supabase.from("decks").delete().eq("id", deckId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting deck", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
