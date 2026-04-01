import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ------------------------------------------------------------------ */
/*  GET /api/projects/[slug] — Fetch single project detail             */
/* ------------------------------------------------------------------ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch project
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Access check: public projects visible to all, otherwise must be owner/member
    const isOwner = user && project.created_by === user.id;
    let isMember = false;

    if (user && !isOwner) {
      const { data: membership } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .maybeSingle();
      isMember = !!membership;
    }

    if (!project.is_public && !isOwner && !isMember) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Increment views
    await supabase
      .from("projects")
      .update({ views: (project.views || 0) + 1 })
      .eq("id", project.id);

    // Fetch related data in parallel
    const [
      { data: sections },
      { data: members },
      { data: milestones },
      { data: comments },
      { data: files },
      { data: tagLinks },
    ] = await Promise.all([
      supabase
        .from("project_sections")
        .select("*")
        .eq("project_id", project.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("project_members")
        .select("user_id, role, joined_at")
        .eq("project_id", project.id),
      supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", project.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("project_comments")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("project_files")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_tags")
        .select("project_id, tag_id")
        .eq("project_id", project.id),
    ]);

    // Resolve tags
    const tagIds = (tagLinks || []).map((t) => String(t.tag_id));
    let tagNames: string[] = [];
    if (tagIds.length) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", tagIds);
      tagNames = (tagRows || []).map((t) => t.name);
    }

    // Resolve profiles for members + comments
    const allUserIds = [
      ...new Set([
        project.created_by,
        ...(members || []).map((m) => m.user_id),
        ...(comments || []).map((c) => c.user_id),
      ]),
    ].filter(Boolean);

    const profilesById = new Map<
      string,
      {
        id: string;
        user_name: string | null;
        display_name: string | null;
        avatar_url: string | null;
      }
    >();

    if (allUserIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_name, display_name, avatar_url")
        .in("id", allUserIds);
      (profiles || []).forEach((p) => profilesById.set(p.id, p));
    }

    // Check if user liked this project
    let userLiked = false;
    if (user) {
      const { data: like } = await supabase
        .from("project_likes")
        .select("project_id")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .maybeSingle();
      userLiked = !!like;
    }

    // Build threaded comments
    const commentMap = new Map<
      number,
      typeof comments extends (infer T)[] | null
        ? T & { author?: unknown; replies: unknown[] }
        : never
    >();
    const topLevelComments: unknown[] = [];

    (comments || []).forEach((c) => {
      const enriched = {
        ...c,
        author: profilesById.get(c.user_id) || null,
        replies: [] as unknown[],
      };
      commentMap.set(c.id, enriched);
    });

    commentMap.forEach((c) => {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id)!.replies.push(c);
      } else {
        topLevelComments.push(c);
      }
    });

    // Assemble result
    const result = {
      ...project,
      tags: tagNames,
      author: profilesById.get(project.created_by) || null,
      sections: sections || [],
      members: (members || []).map((m) => ({
        ...m,
        profile: profilesById.get(m.user_id) || null,
      })),
      milestones: milestones || [],
      comments: topLevelComments,
      files: files || [],
      userLiked,
      isOwner: !!isOwner,
      isMember,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("GET /api/projects/[slug] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/projects/[slug] — Update project                          */
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

    // Check ownership or contributor role
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

    const body = await req.json();
    const {
      title,
      description,
      category,
      project_type,
      difficulty,
      technologies,
      repository_url,
      demo_url,
      thumbnail_url,
      status: newStatus,
      is_public,
      progress,
      tags,
    } = body;

    // Build update payload (only include provided fields)
    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined)
      update.description = description?.trim() || null;
    if (category !== undefined) update.category = category?.trim() || null;
    if (project_type !== undefined) update.project_type = project_type;
    if (difficulty !== undefined) update.difficulty = difficulty;
    if (technologies !== undefined) update.technologies = technologies;
    if (repository_url !== undefined)
      update.repository_url = repository_url?.trim() || null;
    if (demo_url !== undefined) update.demo_url = demo_url?.trim() || null;
    if (thumbnail_url !== undefined)
      update.thumbnail_url = thumbnail_url?.trim() || null;
    if (newStatus !== undefined) update.status = newStatus;
    if (is_public !== undefined) update.is_public = is_public;
    if (progress !== undefined) update.progress = progress;

    // If publishing, set published_at
    if (is_public === true) {
      update.published_at = new Date().toISOString();
    }

    if (Object.keys(update).length > 0) {
      const { error: updateError } = await supabase
        .from("projects")
        .update(update)
        .eq("id", project.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 },
        );
      }
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Remove old tags
      await supabase.from("project_tags").delete().eq("project_id", project.id);

      // Insert new tags
      for (const tagName of tags) {
        const trimmed = tagName.trim().toLowerCase();
        if (!trimmed) continue;

        let { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("name", trimmed)
          .maybeSingle();

        let tagId: number;
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTag } = await supabase
            .from("tags")
            .insert({ name: trimmed })
            .select("id")
            .single();
          if (!newTag) continue;
          tagId = newTag.id;
        }

        await supabase.from("project_tags").insert({
          project_id: project.id,
          tag_id: tagId,
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/projects/[slug] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/projects/[slug] — Delete project                       */
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

    // Check ownership or admin role
    if (project.created_by !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/projects/[slug] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
