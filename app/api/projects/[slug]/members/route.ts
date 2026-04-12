import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ slug: string }> };

/* ------------------------------------------------------------------ */
/*  GET /api/projects/[slug]/members                                    */
/* ------------------------------------------------------------------ */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: project } = await supabase
      .from("projects")
      .select("id, created_by, is_public")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: members, error } = await supabase
      .from("project_members")
      .select("user_id, role, joined_at")
      .eq("project_id", project.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = (members || []).map((m) => m.user_id).filter(Boolean);
    const profilesById = new Map<
      string,
      { id: string; user_name: string | null; display_name: string | null; avatar_url: string | null }
    >();

    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_name, display_name, avatar_url")
        .in("id", userIds);
      (profiles || []).forEach((p) => profilesById.set(p.id, p));
    }

    const result = (members || []).map((m) => ({
      ...m,
      profile: profilesById.get(m.user_id) ?? null,
    }));

    return NextResponse.json({ members: result }, { status: 200 });
  } catch (err) {
    console.error("GET members error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/projects/[slug]/members — Add a member                   */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest, { params }: Params) {
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

    // Only owner or existing contributor can add members
    const isOwner = project.created_by === user.id;
    if (!isOwner) {
      const { data: membership } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership || membership.role !== "owner") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { username, role = "viewer" } = body;

    if (!username?.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    if (!["owner", "contributor", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Look up the target user by username
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, user_name, display_name, avatar_url")
      .eq("user_name", username.trim().toLowerCase())
      .maybeSingle();

    if (!targetProfile) {
      return NextResponse.json(
        { error: `No user found with username "@${username.trim()}"` },
        { status: 404 },
      );
    }

    // Don't add the project owner as a member
    if (targetProfile.id === project.created_by) {
      return NextResponse.json(
        { error: "Project owner cannot be added as a member" },
        { status: 400 },
      );
    }

    // Upsert member
    const { error: upsertError } = await supabase
      .from("project_members")
      .upsert(
        { project_id: project.id, user_id: targetProfile.id, role },
        { onConflict: "project_id,user_id" },
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        member: {
          user_id: targetProfile.id,
          role,
          joined_at: new Date().toISOString(),
          profile: targetProfile,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST members error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/projects/[slug]/members — Remove a member              */
/* ------------------------------------------------------------------ */
export async function DELETE(req: NextRequest, { params }: Params) {
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

    const isOwner = project.created_by === user.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE members error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/projects/[slug]/members — Update a member's role        */
/* ------------------------------------------------------------------ */
export async function PATCH(req: NextRequest, { params }: Params) {
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

    if (!project || project.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { user_id, role } = await req.json();
    if (!user_id || !role) {
      return NextResponse.json({ error: "user_id and role required" }, { status: 400 });
    }

    if (!["owner", "contributor", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const { error } = await supabase
      .from("project_members")
      .update({ role })
      .eq("project_id", project.id)
      .eq("user_id", user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("PATCH members error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
