import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ------------------------------------------------------------------ */
/*  GET /api/projects/[slug]/members — List members                    */
/* ------------------------------------------------------------------ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: members } = await supabase
      .from("project_members")
      .select("user_id, role, joined_at")
      .eq("project_id", project.id);

    const userIds = (members || []).map((m) => m.user_id);
    const profilesById = new Map<string, unknown>();

    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_name, display_name, avatar_url")
        .in("id", userIds);
      (profiles || []).forEach((p) => profilesById.set(p.id, p));
    }

    const result = (members || []).map((m) => ({
      ...m,
      profile: profilesById.get(m.user_id) || null,
    }));

    return NextResponse.json({ members: result }, { status: 200 });
  } catch (error) {
    console.error("GET /api/projects/[slug]/members error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/projects/[slug]/members — Add a member                   */
/* ------------------------------------------------------------------ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, created_by")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only owner can add members
    if (project.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { user_id, role = "viewer" } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    // Validate role
    if (!["contributor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be contributor or viewer." },
        { status: 400 },
      );
    }

    // Check if user exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user_id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert member
    const { error } = await supabase.from("project_members").upsert(
      {
        project_id: project.id,
        user_id,
        role,
      },
      { onConflict: "project_id,user_id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[slug]/members error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/projects/[slug]/members — Remove a member              */
/* ------------------------------------------------------------------ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, created_by")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (project.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { user_id } = await req.json();

    // Cannot remove the owner
    if (user_id === project.created_by) {
      return NextResponse.json(
        { error: "Cannot remove the project owner" },
        { status: 400 },
      );
    }

    await supabase
      .from("project_members")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", user_id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/projects/[slug]/members error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
