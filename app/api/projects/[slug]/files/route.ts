import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ------------------------------------------------------------------ */
/*  POST /api/projects/[slug]/files — Upload file metadata             */
/*  (Actual file upload to Supabase Storage is done client-side)       */
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

    // Check permission
    const isOwner = project.created_by === user.id;
    if (!isOwner) {
      const { data: membership } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership || !["owner", "contributor"].includes(membership.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { file_name, file_url, file_type, file_size } = await req.json();

    if (!file_name || !file_url) {
      return NextResponse.json(
        { error: "file_name and file_url are required" },
        { status: 400 },
      );
    }

    const { data: file, error } = await supabase
      .from("project_files")
      .insert({
        project_id: project.id,
        uploaded_by: user.id,
        file_name,
        file_url,
        file_type: file_type || null,
        file_size: file_size || null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[slug]/files error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/projects/[slug]/files — Delete file                    */
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

    const { id } = await req.json();

    await supabase
      .from("project_files")
      .delete()
      .eq("id", id)
      .eq("project_id", project.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/projects/[slug]/files error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
