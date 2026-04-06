import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const WRITER_ROLES = ["owner", "contributor"] as const;
const VALID_UPDATE_TYPES = [
  "regular",
  "milestone",
  "release",
  "announcement",
] as const;

type UpdateType = (typeof VALID_UPDATE_TYPES)[number];

interface ProjectAccess {
  project: {
    id: number;
    is_public: boolean;
    created_by: string;
  };
  isOwner: boolean;
  isMember: boolean;
  canView: boolean;
  canWrite: boolean;
}

async function resolveProjectAccess(
  slug: string,
  userId: string | null,
): Promise<ProjectAccess | null> {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, is_public, created_by")
    .eq("slug", slug)
    .maybeSingle();

  if (!project) return null;

  const isOwner = !!userId && project.created_by === userId;
  let membershipRole: string | null = null;

  if (userId && !isOwner) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", project.id)
      .eq("user_id", userId)
      .maybeSingle();

    membershipRole = membership?.role || null;
  }

  const isMember = !!membershipRole;
  const canView = project.is_public || isOwner || isMember;
  const canWrite =
    isOwner ||
    WRITER_ROLES.includes(
      (membershipRole || "") as (typeof WRITER_ROLES)[number],
    );

  return {
    project,
    isOwner,
    isMember,
    canView,
    canWrite,
  };
}

/* ------------------------------------------------------------------ */
/*  GET /api/projects/[slug]/updates — List project updates            */
/* ------------------------------------------------------------------ */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const access = await resolveProjectAccess(slug, user?.id || null);
    if (!access) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!access.canView) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: updates, error } = await supabase
      .from("project_updates")
      .select("*")
      .eq("project_id", access.project.id)
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const authorIds = [
      ...new Set((updates || []).map((u) => u.created_by).filter(Boolean)),
    ];

    const profilesById = new Map<
      string,
      {
        id: string;
        user_name: string | null;
        display_name: string | null;
        avatar_url: string | null;
      }
    >();

    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_name, display_name, avatar_url")
        .in("id", authorIds);

      (profiles || []).forEach((p) => profilesById.set(p.id, p));
    }

    const hydrated = (updates || []).map((update) => ({
      ...update,
      author: profilesById.get(update.created_by) || null,
    }));

    return NextResponse.json({ updates: hydrated }, { status: 200 });
  } catch (error) {
    console.error("GET /api/projects/[slug]/updates error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/projects/[slug]/updates — Create update post             */
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

    const access = await resolveProjectAccess(slug, user.id);
    if (!access) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!access.canWrite) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const body = typeof payload.body === "string" ? payload.body.trim() : "";
    const imageUrl =
      typeof payload.image_url === "string" && payload.image_url.trim().length > 0
        ? payload.image_url.trim()
        : null;
    const updateType: UpdateType = VALID_UPDATE_TYPES.includes(payload.update_type)
      ? payload.update_type
      : "regular";

    if (!title || !body) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 },
      );
    }

    const { data: inserted, error } = await supabase
      .from("project_updates")
      .insert({
        project_id: access.project.id,
        created_by: user.id,
        title,
        body,
        update_type: updateType,
        image_url: imageUrl,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: author } = await supabase
      .from("profiles")
      .select("id, user_name, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    return NextResponse.json(
      { update: { ...inserted, author: author || null } },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/projects/[slug]/updates error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/projects/[slug]/updates — Edit update post                */
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

    const access = await resolveProjectAccess(slug, user.id);
    if (!access) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!access.canWrite) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();
    const id = Number(payload.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("project_updates")
      .select("id")
      .eq("id", id)
      .eq("project_id", access.project.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      if (typeof payload.title !== "string" || payload.title.trim().length === 0) {
        return NextResponse.json(
          { error: "title cannot be empty" },
          { status: 400 },
        );
      }
      update.title = payload.title.trim();
    }

    if (payload.body !== undefined) {
      if (typeof payload.body !== "string" || payload.body.trim().length === 0) {
        return NextResponse.json(
          { error: "body cannot be empty" },
          { status: 400 },
        );
      }
      update.body = payload.body.trim();
    }

    if (payload.update_type !== undefined) {
      if (!VALID_UPDATE_TYPES.includes(payload.update_type)) {
        return NextResponse.json(
          { error: "Invalid update_type" },
          { status: 400 },
        );
      }
      update.update_type = payload.update_type;
    }

    if (payload.image_url !== undefined) {
      update.image_url =
        typeof payload.image_url === "string" && payload.image_url.trim().length > 0
          ? payload.image_url.trim()
          : null;
    }

    if (payload.published_at !== undefined) {
      update.published_at = payload.published_at;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    update.updated_at = new Date().toISOString();

    const { data: updatedRow, error } = await supabase
      .from("project_updates")
      .update(update)
      .eq("id", id)
      .eq("project_id", access.project.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: author } = await supabase
      .from("profiles")
      .select("id, user_name, display_name, avatar_url")
      .eq("id", updatedRow.created_by)
      .maybeSingle();

    return NextResponse.json(
      { update: { ...updatedRow, author: author || null } },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/projects/[slug]/updates error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/projects/[slug]/updates — Delete update post           */
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

    const access = await resolveProjectAccess(slug, user.id);
    if (!access) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!access.canWrite) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("project_updates")
      .delete()
      .eq("id", id)
      .eq("project_id", access.project.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/projects/[slug]/updates error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
