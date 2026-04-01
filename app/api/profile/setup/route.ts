import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, username, avatarUrl, bio, bannerGradient, skills } =
      body;

    // Validate required fields
    if (
      !displayName ||
      typeof displayName !== "string" ||
      displayName.trim().length < 2
    ) {
      return NextResponse.json(
        { error: "Display name must be at least 2 characters" },
        { status: 400 },
      );
    }

    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length < 3
    ) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 },
      );
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, "");

    // Check if username is already taken by another user
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_name", cleanUsername)
      .neq("id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 },
      );
    }

    // Profile table holds: user_name, display_name, avatar_url, bio
    const { error: dbError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        user_name: cleanUsername,
        display_name: displayName.trim(),
        avatar_url: avatarUrl || null,
        bio: bio || null,
      },
      { onConflict: "id" },
    );

    if (dbError) {
      console.error("Profile upsert error:", JSON.stringify(dbError, null, 2));
      return NextResponse.json(
        {
          error: `Database error: ${dbError.message || dbError.details || dbError.hint || JSON.stringify(dbError)}`,
        },
        { status: 500 },
      );
    }

    // Auth users table (user_metadata) holds: displayName, bannerGradient, skills
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        displayName,
        username: cleanUsername,
        bannerGradient: bannerGradient || "",
        skills: Array.isArray(skills) ? skills : [],
        profileComplete: true,
      },
    });

    if (metaError) {
      console.error(
        "User metadata update error:",
        JSON.stringify(metaError, null, 2),
      );
      return NextResponse.json(
        {
          error: `Metadata error: ${metaError.message || JSON.stringify(metaError)}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, username: cleanUsername });
  } catch (err) {
    console.error("Profile setup unexpected error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
