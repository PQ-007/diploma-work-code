import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ------------------------------------------------------------------ */
/*  POST /api/projects/[slug]/like — Toggle like on project            */
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
      .select("id, is_public")
      .eq("slug", slug)
      .maybeSingle();

    if (!project || !project.is_public) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check existing like
    const { data: existing } = await supabase
      .from("project_likes")
      .select("project_id")
      .eq("project_id", project.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Unlike
      await supabase
        .from("project_likes")
        .delete()
        .eq("project_id", project.id)
        .eq("user_id", user.id);

      return NextResponse.json({ liked: false }, { status: 200 });
    } else {
      // Like
      await supabase.from("project_likes").insert({
        project_id: project.id,
        user_id: user.id,
      });

      return NextResponse.json({ liked: true }, { status: 200 });
    }
  } catch (error) {
    console.error("POST /api/projects/[slug]/like error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
