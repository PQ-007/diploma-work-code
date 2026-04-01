import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ------------------------------------------------------------------ */
/*  PUT /api/projects/[slug]/sections — Batch update project sections  */
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

    const { sections } = await req.json();

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { error: "sections must be an array" },
        { status: 400 },
      );
    }

    // Upsert sections
    for (const section of sections) {
      if (section.id) {
        // Update existing
        await supabase
          .from("project_sections")
          .update({
            title: section.title,
            content: section.content,
            sort_order: section.sort_order,
          })
          .eq("id", section.id)
          .eq("project_id", project.id);
      } else {
        // Insert new
        await supabase.from("project_sections").insert({
          project_id: project.id,
          title: section.title,
          section_type: section.section_type || "custom",
          content: section.content || "",
          sort_order: section.sort_order || 0,
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/projects/[slug]/sections error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
