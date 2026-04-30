import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) +
    "-" +
    Date.now().toString(36)
  );
}

/* ------------------------------------------------------------------ */
/*  GET /api/projects — List projects                                  */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "public"; // public | my | member
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const status = searchParams.get("status") || "";
    const projectType = searchParams.get("type") || "";
    const sortBy = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const offset = (page - 1) * limit;

    const buildProjectsQuery = () => {
      // Select all available columns so listing continues to work even when optional columns differ between environments.
      let query = supabase.from("projects").select("*");

      // Scope filtering
      if (scope === "my" && user) {
        query = query.eq("created_by", user.id);
      } else if (scope === "member" && user) {
        // Will be filtered after fetch using members
        query = query.or(
          `created_by.eq.${user.id},id.in.(select project_id from project_members where user_id = '${user.id}')`,
        );
      } else {
        // Public scope
        query = query.eq("is_public", true);
      }

      // Filters
      if (category) query = query.eq("category", category);
      if (difficulty) query = query.eq("difficulty", difficulty);
      if (status) query = query.eq("status", status);
      // NOTE: project type filtering is handled client-side for schema-compatibility across environments.
      if (search)
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%`,
        );

      // Sorting
      switch (sortBy) {
        case "most_liked":
          query = query.order("likes_count", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "newest":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      return query.range(offset, offset + limit - 1);
    };

    const { data: projects, error } = await buildProjectsQuery();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ items: [], total: 0 }, { status: 200 });
    }

    const projectIds = projects.map((p) => p.id);

    // Fetch tags
    const { data: tagLinks } = await supabase
      .from("project_tags")
      .select("project_id, tag_id")
      .in("project_id", projectIds);

    const tagIds = [...new Set((tagLinks || []).map((t) => String(t.tag_id)))];
    const tagsById = new Map<string, string>();
    if (tagIds.length) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", tagIds);
      (tagRows || []).forEach((t) => {
        if (t.id && t.name) tagsById.set(String(t.id), t.name);
      });
    }

    const tagsByProject = new Map<number, string[]>();
    (tagLinks || []).forEach((link) => {
      const name = tagsById.get(String(link.tag_id));
      if (!name) return;
      const arr = tagsByProject.get(link.project_id) || [];
      arr.push(name);
      tagsByProject.set(link.project_id, arr);
    });

    // Fetch author profiles
    const authorIds = [
      ...new Set(projects.map((p) => p.created_by).filter(Boolean)),
    ];
    const profilesById = new Map<
      string,
      {
        user_name: string | null;
        display_name: string | null;
        avatar_url: string | null;
      }
    >();
    if (authorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_name, display_name, avatar_url")
        .in("id", authorIds);
      (profiles || []).forEach((p) => {
        profilesById.set(p.id, {
          user_name: p.user_name,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        });
      });
    }

    // Check user likes
    let userLikes = new Set<number>();
    if (user) {
      const { data: likes } = await supabase
        .from("project_likes")
        .select("project_id")
        .eq("user_id", user.id)
        .in("project_id", projectIds);
      (likes || []).forEach((l) => userLikes.add(l.project_id));
    }

    const items = projects.map((p) => ({
      ...p,
      type: (p as { type?: string }).type || "private",
      technologies: (p as { technologies?: string[] }).technologies || [],
      tags: tagsByProject.get(p.id) || [],
      author: profilesById.get(p.created_by) || null,
      userLiked: userLikes.has(p.id),
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/projects — Create a new project                          */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      type: projectType = "private",
      difficulty = "beginner",
      technologies = [],
      repository_url,
      demo_url,
      video_url,
      thumbnail_url,
      is_public = false,
      status: initialStatus = "draft",
      tags = [],
    } = body;

    const normalizedDescription =
      typeof description === "string" ? description.trim() : "";
    const normalizedTags = Array.isArray(tags)
      ? Array.from(
          new Set(
            tags
              .map((tag: unknown) =>
                typeof tag === "string" ? tag.trim().toLowerCase() : "",
              )
              .filter(Boolean),
          ),
        )
      : [];

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!normalizedDescription) {
      return NextResponse.json(
        { error: "About content is required" },
        { status: 400 },
      );
    }

    if (normalizedTags.length === 0) {
      return NextResponse.json(
        { error: "At least one tag is required" },
        { status: 400 },
      );
    }

    const slug = generateSlug(title);

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        title: title.trim(),
        slug,
        description: normalizedDescription,
        category: category?.trim() || null,
        type: projectType,
        difficulty,
        repository_url: repository_url?.trim() || null,
        demo_url: demo_url?.trim() || null,
        thumbnail_url: thumbnail_url?.trim() || null,
        created_by: user.id,
        is_public,
        status: initialStatus,
        ...(is_public ? { published_at: new Date().toISOString() } : {}),
      })
      .select("id, slug")
      .single();

    if (projectError) {
      return NextResponse.json(
        { error: projectError.message },
        { status: 500 },
      );
    }

    // Add owner as member
    await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role: "owner",
    });

    // Create default sections
    const defaultSections = [
      { title: "Overview", section_type: "overview", sort_order: 0 },
      { title: "Goals", section_type: "goals", sort_order: 1 },
      { title: "Architecture", section_type: "architecture", sort_order: 2 },
      {
        title: "Implementation",
        section_type: "implementation",
        sort_order: 3,
      },
      { title: "Results", section_type: "results", sort_order: 4 },
      {
        title: "Lessons Learned",
        section_type: "lessons_learned",
        sort_order: 5,
      },
    ];

    await supabase.from("project_sections").insert(
      defaultSections.map((s) => ({
        ...s,
        project_id: project.id,
      })),
    );

    // Handle tags
    if (normalizedTags.length > 0) {
      for (const tagName of normalizedTags) {
        const trimmed = tagName;
        if (!trimmed) continue;

        // Get or create tag
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

    return NextResponse.json(
      { id: project.id, slug: project.slug },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
