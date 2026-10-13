import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/leaderboard?type=rated|contributors&limit=5
   - type=rated        → top N profiles by ranking_point
   - type=contributors → top N profiles by published article count
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "rated";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 20);

    if (type === "rated") {
      // Top users by ranking_point
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_name, display_name, avatar_url, ranking_point")
        .order("ranking_point", { ascending: false })
        .limit(limit);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const result = (profiles ?? []).map((p, idx) => ({
        rank: idx + 1,
        name: p.display_name || p.user_name || "Anonymous",
        username: p.user_name || "",
        avatar: p.avatar_url || "",
        points: p.ranking_point ?? 0,
      }));

      return NextResponse.json({ items: result }, { status: 200 });
    }

    if (type === "contributors") {
      // Count published articles per author
      const { data: rows, error } = await supabase
        .from("articles")
        .select("author_id")
        .eq("status", "published");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Tally counts
      const countByAuthor = new Map<string, number>();
      (rows ?? []).forEach((r) => {
        if (!r.author_id) return;
        countByAuthor.set(
          r.author_id,
          (countByAuthor.get(r.author_id) ?? 0) + 1,
        );
      });

      if (!countByAuthor.size) {
        return NextResponse.json({ items: [] }, { status: 200 });
      }

      // Sort by count descending and take top N author ids
      const topAuthorIds = [...countByAuthor.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_name, display_name, avatar_url, ranking_point")
        .in("id", topAuthorIds);

      if (profilesError) {
        return NextResponse.json(
          { error: profilesError.message },
          { status: 500 },
        );
      }

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      const result = topAuthorIds
        .map((id, idx) => {
          const p = profileMap.get(id);
          const count = countByAuthor.get(id) ?? 0;
          return {
            rank: idx + 1,
            name: p?.display_name || p?.user_name || "Anonymous",
            username: p?.user_name || "",
            avatar: p?.avatar_url || "",
            points: count, // "points" == article count for contributors board
          };
        })
        .filter((r) => r.name !== undefined);

      return NextResponse.json({ items: result }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
