import { NextResponse } from "next/server";
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
export async function POST() {
  return NextResponse.json(
    {
      error: "Team membership editing has been retired from showcase mode.",
    },
    { status: 410 },
  );
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/projects/[slug]/members — Remove a member              */
/* ------------------------------------------------------------------ */
export async function DELETE() {
  return NextResponse.json(
    {
      error: "Team membership editing has been retired from showcase mode.",
    },
    { status: 410 },
  );
}
