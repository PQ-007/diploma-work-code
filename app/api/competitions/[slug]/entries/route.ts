import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createProject } from "@/lib/api/projects/createProject";
import { ENTRY_COLUMNS, dbErrorStatus, isSignupOpen } from "@/lib/api/competitions";

/* ------------------------------------------------------------------ */
/*  POST /api/competitions/[slug]/entries — Sign up a team             */
/*  Body: { category, projectId } or { category, newProject: { title, description } } */
/* ------------------------------------------------------------------ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  let createdProjectId: number | null = null;
  const supabase = await createClient();
  try {
    const { slug } = await params;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to sign up a team" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const projectId = Number.isInteger(body?.projectId) ? (body.projectId as number) : null;
    const newProject = body?.newProject && typeof body.newProject === "object" ? body.newProject : null;
    if (!category || (projectId === null) === (newProject === null)) {
      return NextResponse.json(
        { error: "Send { category, projectId } or { category, newProject: { title, description } }" },
        { status: 400 },
      );
    }

    const { data: competition } = await supabase
      .from("competitions")
      .select("id, categories, max_team_size")
      .eq("slug", slug)
      .maybeSingle();
    if (!competition) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!(await isSignupOpen(supabase, competition.id))) {
      return NextResponse.json({ error: "Sign-up is closed" }, { status: 409 });
    }
    if (!(competition.categories as string[]).includes(category)) {
      return NextResponse.json(
        { error: `Unknown category; choose one of: ${(competition.categories as string[]).join(", ")}` },
        { status: 400 },
      );
    }

    // The team's project: an existing contest project the caller owns, or a new one.
    let project: { id: number; slug: string };
    if (projectId !== null) {
      const { data: existing } = await supabase
        .from("projects")
        .select("id, slug, created_by, type")
        .eq("id", projectId)
        .maybeSingle();
      if (!existing) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      if (existing.created_by !== user.id) {
        return NextResponse.json({ error: "Only the project's owner can sign it up" }, { status: 403 });
      }
      if (existing.type !== "contest") {
        return NextResponse.json({ error: "Only contest projects can enter a competition" }, { status: 400 });
      }
      project = { id: existing.id, slug: existing.slug };
    } else {
      const title = typeof newProject.title === "string" ? newProject.title.trim() : "";
      const description = typeof newProject.description === "string" ? newProject.description.trim() : "";
      if (!title || title.length > 120) {
        return NextResponse.json({ error: "Team name (project title) is required, max 120 characters" }, { status: 400 });
      }
      // Public, so the team shows on the competition page.
      project = await createProject(supabase, user.id, {
        title,
        description,
        type: "contest",
        is_public: true,
        status: "in_progress",
        tags: [],
      });
      createdProjectId = project.id;
    }

    // Team size: project_members already includes the owner (role "owner").
    const { count: teamSize } = await supabase
      .from("project_members")
      .select("user_id", { count: "exact", head: true })
      .eq("project_id", project.id);
    if ((teamSize ?? 0) > competition.max_team_size) {
      await cleanup();
      return NextResponse.json(
        { error: `This team has ${teamSize} members; the limit is ${competition.max_team_size}` },
        { status: 400 },
      );
    }

    // A withdrawn entry for the same project and category is re-registered (the unique key allows one row).
    const { data: previous } = await supabase
      .from("competition_entries")
      .select(ENTRY_COLUMNS)
      .eq("competition_id", competition.id)
      .eq("project_id", project.id)
      .eq("category", category)
      .maybeSingle();

    if (previous) {
      if (previous.status !== "withdrawn") {
        return NextResponse.json(
          { error: previous.status === "disqualified" ? "This entry was disqualified" : "This team is already signed up in that category" },
          { status: 409 },
        );
      }
      const { data: updated, error } = await supabase
        .from("competition_entries")
        .update({ status: "registered" })
        .eq("id", previous.id)
        .select("id");
      if (error || !updated?.length) {
        return NextResponse.json({ error: error?.message ?? "Could not re-register" }, { status: error ? dbErrorStatus(error.code) : 403 });
      }
      return NextResponse.json({ id: previous.id, project_slug: project.slug, reregistered: true }, { status: 200 });
    }

    const { data: entry, error } = await supabase
      .from("competition_entries")
      .insert({ competition_id: competition.id, project_id: project.id, category })
      .select("id")
      .single();
    if (error) {
      await cleanup();
      return NextResponse.json({ error: error.message }, { status: dbErrorStatus(error.code) });
    }

    return NextResponse.json({ id: entry.id, project_slug: project.slug }, { status: 201 });
  } catch (error) {
    await cleanup();
    console.error("POST /api/competitions/[slug]/entries error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  /** Don't leave behind a project created for an entry that failed. */
  async function cleanup() {
    if (createdProjectId !== null) {
      await supabase.from("projects").delete().eq("id", createdProjectId);
      createdProjectId = null;
    }
  }
}
