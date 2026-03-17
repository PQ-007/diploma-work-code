import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const {
      display_name,
      user_name,
      bio,
      avatar_url,
      skills,
      interest,
      banner_gradient,
      avatar_ring_color,
      pinned_article_ids,
      pinned_project_ids,
      language_skills,
    } = body;

    // Validate display_name if provided
    if (
      display_name !== undefined &&
      (typeof display_name !== "string" || display_name.trim().length < 2)
    ) {
      return NextResponse.json(
        { error: "Display name must be at least 2 characters" },
        { status: 400 },
      );
    }

    // Validate user_name if provided
    if (user_name !== undefined) {
      if (typeof user_name !== "string" || user_name.trim().length < 3) {
        return NextResponse.json(
          { error: "Username must be at least 3 characters" },
          { status: 400 },
        );
      }

      const cleanUsername = user_name.toLowerCase().replace(/[^a-z0-9_-]/g, "");

      // Check uniqueness
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
    }

    // Build the update payload — only include fields that were sent
    const profileUpdate: Record<string, unknown> = {};

    if (display_name !== undefined)
      profileUpdate.display_name = display_name.trim();
    if (user_name !== undefined)
      profileUpdate.user_name = user_name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
    if (bio !== undefined) profileUpdate.bio = bio || null;
    if (avatar_url !== undefined) profileUpdate.avatar_url = avatar_url || null;
    if (skills !== undefined) profileUpdate.skills = skills || null;
    if (interest !== undefined) profileUpdate.interest = interest || null;
    if (banner_gradient !== undefined)
      profileUpdate.banner_gradient = banner_gradient;
    if (avatar_ring_color !== undefined)
      profileUpdate.avatar_ring_color = avatar_ring_color;
    if (pinned_article_ids !== undefined)
      profileUpdate.pinned_article_ids = Array.isArray(pinned_article_ids)
        ? pinned_article_ids
            .map((id) => (typeof id === "string" ? parseInt(id, 10) : id))
            .filter((id) => !isNaN(id))
        : [];
    if (pinned_project_ids !== undefined)
      profileUpdate.pinned_project_ids = Array.isArray(pinned_project_ids)
        ? pinned_project_ids
            .map((id) =>
              typeof id === "number" ? id : parseInt(String(id), 10),
            )
            .filter((id) => !isNaN(id))
        : [];

    // Update profiles table
    if (Object.keys(profileUpdate).length > 0) {
      const { error: dbError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);

      if (dbError) {
        console.error("Profile update error:", dbError);
        return NextResponse.json(
          { error: `Database error: ${dbError.message}` },
          { status: 500 },
        );
      }
    }

    // Update language skills if provided
    if (Array.isArray(language_skills)) {
      // Delete existing language skills for this user
      await supabase.from("language_skills").delete().eq("user_id", user.id);

      // Insert new ones
      if (language_skills.length > 0) {
        const rows = language_skills.map(
          (
            ls: {
              language_name: string;
              flag_emoji?: string;
              proficiency_level?: string;
            },
            idx: number,
          ) => ({
            user_id: user.id,
            language_name: ls.language_name,
            flag_emoji: ls.flag_emoji || "",
            proficiency_level: ls.proficiency_level || "Beginner",
            sort_order: idx,
          }),
        );

        const { error: lsError } = await supabase
          .from("language_skills")
          .insert(rows);

        if (lsError) {
          console.error("Language skills insert error:", lsError);
          return NextResponse.json(
            { error: `Language skills error: ${lsError.message}` },
            { status: 500 },
          );
        }
      }
    }

    // Also sync key fields to user_metadata for backward compatibility
    const metaUpdate: Record<string, unknown> = {};
    if (display_name !== undefined) metaUpdate.displayName = display_name;
    if (user_name !== undefined)
      metaUpdate.username = user_name.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (banner_gradient !== undefined)
      metaUpdate.bannerGradient = banner_gradient;
    if (skills !== undefined)
      metaUpdate.skills = skills
        ? skills
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

    if (Object.keys(metaUpdate).length > 0) {
      await supabase.auth.updateUser({ data: metaUpdate });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Profile update API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
