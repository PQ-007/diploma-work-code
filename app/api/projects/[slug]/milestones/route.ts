import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ------------------------------------------------------------------ */
/*  POST /api/projects/[slug]/milestones — Add milestone               */
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

    const {
      title,
      description,
      due_date,
      sort_order = 0,
      kanban_status = "todo",
    } = await req.json();

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const validStatuses = ["todo", "in_progress", "done"];
    const safeKanbanStatus = validStatuses.includes(kanban_status)
      ? kanban_status
      : "todo";

    const { data: milestone, error } = await supabase
      .from("project_milestones")
      .insert({
        project_id: project.id,
        title: title.trim(),
        description: description?.trim() || null,
        due_date: due_date || null,
        sort_order,
        kanban_status: safeKanbanStatus,
        completed: safeKanbanStatus === "done",
        completed_at:
          safeKanbanStatus === "done" ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[slug]/milestones error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/projects/[slug]/milestones — Update milestone             */
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

    const {
      id,
      title,
      description,
      due_date,
      completed,
      sort_order,
      kanban_status,
    } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Milestone id is required" },
        { status: 400 },
      );
    }

    const validStatuses = ["todo", "in_progress", "done"];
    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined)
      update.description = description?.trim() || null;
    if (due_date !== undefined) update.due_date = due_date;
    if (kanban_status !== undefined && validStatuses.includes(kanban_status)) {
      update.kanban_status = kanban_status;
      update.completed = kanban_status === "done";
      update.completed_at =
        kanban_status === "done" ? new Date().toISOString() : null;
    } else if (completed !== undefined) {
      update.completed = completed;
      update.completed_at = completed ? new Date().toISOString() : null;
    }
    if (sort_order !== undefined) update.sort_order = sort_order;

    const { error } = await supabase
      .from("project_milestones")
      .update(update)
      .eq("id", id)
      .eq("project_id", project.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/projects/[slug]/milestones error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/projects/[slug]/milestones — Delete milestone          */
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
      .from("project_milestones")
      .delete()
      .eq("id", id)
      .eq("project_id", project.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/projects/[slug]/milestones error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
