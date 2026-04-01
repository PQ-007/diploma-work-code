import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ------------------------------------------------------------------ */
/*  POST /api/projects/[slug]/comments — Add comment                   */
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
      .select("id, is_public, created_by")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Must be public or user must be a member/owner
    if (!project.is_public && project.created_by !== user.id) {
      const { data: membership } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { body, parent_id } = await req.json();

    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 },
      );
    }

    // Validate parent exists if provided
    if (parent_id) {
      const { data: parent } = await supabase
        .from("project_comments")
        .select("id")
        .eq("id", parent_id)
        .eq("project_id", project.id)
        .maybeSingle();

      if (!parent) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 },
        );
      }
    }

    const { data: comment, error } = await supabase
      .from("project_comments")
      .insert({
        project_id: project.id,
        user_id: user.id,
        parent_id: parent_id || null,
        body: body.trim(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch author profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, user_name, display_name, avatar_url")
      .eq("id", user.id)
      .single();

    return NextResponse.json(
      { comment: { ...comment, author: profile, replies: [] } },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/projects/[slug]/comments error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/projects/[slug]/comments — Edit own comment               */
/* ------------------------------------------------------------------ */
export async function PUT(
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

    const { id, body } = await req.json();

    if (!id || !body || body.trim().length === 0) {
      return NextResponse.json(
        { error: "id and body are required" },
        { status: 400 },
      );
    }

    // Only allow editing own comments
    const { error } = await supabase
      .from("project_comments")
      .update({ body: body.trim() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/projects/[slug]/comments error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/projects/[slug]/comments — Delete comment              */
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

    const { id } = await req.json();

    // Check if user is comment owner or admin
    const { data: comment } = await supabase
      .from("project_comments")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (!comment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (comment.user_id !== user.id) {
      // Check admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await supabase.from("project_comments").delete().eq("id", id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/projects/[slug]/comments error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
