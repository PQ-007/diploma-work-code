import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId || targetUserId === user.id) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (existing) {
      // Unfollow
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      return NextResponse.json({ followed: false });
    } else {
      // Follow
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: targetUserId });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ followed: true });
    }
  } catch (err) {
    console.error("Follow API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
