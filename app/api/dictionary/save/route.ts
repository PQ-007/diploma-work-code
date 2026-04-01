import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   POST /api/dictionary/save
   Toggle save/bookmark on a dictionary entry
   Body: { entryId }
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

    const { entryId } = (await req.json()) as { entryId: number };

    if (!entryId) {
      return NextResponse.json(
        { error: "entryId is required" },
        { status: 400 },
      );
    }

    const { data: existing } = await supabase
      .from("dictionary_saves")
      .select("entry_id")
      .eq("entry_id", entryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("dictionary_saves")
        .delete()
        .eq("entry_id", entryId)
        .eq("user_id", user.id);

      // Decrement saves count
      const { data: entry } = await supabase
        .from("dictionary_entries")
        .select("saves")
        .eq("id", entryId)
        .single();

      if (entry) {
        await supabase
          .from("dictionary_entries")
          .update({ saves: Math.max(0, (entry.saves || 0) - 1) })
          .eq("id", entryId);
      }

      return NextResponse.json({ saved: false });
    } else {
      await supabase
        .from("dictionary_saves")
        .insert({ entry_id: entryId, user_id: user.id });

      // Increment saves count
      const { data: entry } = await supabase
        .from("dictionary_entries")
        .select("saves")
        .eq("id", entryId)
        .single();

      if (entry) {
        await supabase
          .from("dictionary_entries")
          .update({ saves: (entry.saves || 0) + 1 })
          .eq("id", entryId);
      }

      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error("Error saving entry", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
