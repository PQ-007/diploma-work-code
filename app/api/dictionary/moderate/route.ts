import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   POST /api/dictionary/moderate
   Approve or reject a pending revision (teacher/admin only)
   Body: { revision_id, action: "approve" | "reject", reason? }
   ═══════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check moderator role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Forbidden: moderators only" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { revision_id, action, reason } = body as {
      revision_id: number;
      action: "approve" | "reject";
      reason?: string;
    };

    if (!revision_id || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "revision_id and valid action required" },
        { status: 400 },
      );
    }

    if (action === "reject" && !reason?.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 },
      );
    }

    // Fetch the revision
    const { data: revision } = await supabase
      .from("dictionary_revisions")
      .select(
        "id, entry_id, revision_number, term, reading, language_code, definition, translations_snapshot, examples_snapshot, tags_snapshot, status, created_by",
      )
      .eq("id", revision_id)
      .single();

    if (!revision) {
      return NextResponse.json(
        { error: "Revision not found" },
        { status: 404 },
      );
    }

    if (revision.status !== "pending_review") {
      return NextResponse.json(
        { error: "Revision is not pending review" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      // Update revision status
      await supabase
        .from("dictionary_revisions")
        .update({ status: "approved" })
        .eq("id", revision_id);

      // Apply revision to the main entry
      await supabase
        .from("dictionary_entries")
        .update({
          term: revision.term,
          reading: revision.reading,
          language_code: revision.language_code,
          definition: revision.definition,
          status: "approved",
          current_revision_id: revision.id,
        })
        .eq("id", revision.entry_id);

      // Replace translations from snapshot
      if (
        Array.isArray(revision.translations_snapshot) &&
        revision.translations_snapshot.length
      ) {
        await supabase
          .from("dictionary_translations")
          .delete()
          .eq("entry_id", revision.entry_id);
        const translationRows = (
          revision.translations_snapshot as Array<{
            language_code: string;
            translated_term: string;
            explanation?: string;
          }>
        )
          .filter((t) => t.translated_term?.trim())
          .map((t) => ({
            entry_id: revision.entry_id,
            language_code: t.language_code,
            translated_term: t.translated_term.trim(),
            explanation: t.explanation?.trim() || null,
            created_by: revision.created_by,
          }));
        if (translationRows.length) {
          await supabase
            .from("dictionary_translations")
            .insert(translationRows);
        }
      }

      // Replace examples from snapshot
      if (
        Array.isArray(revision.examples_snapshot) &&
        revision.examples_snapshot.length
      ) {
        await supabase
          .from("dictionary_examples")
          .delete()
          .eq("entry_id", revision.entry_id);
        const exampleRows = (
          revision.examples_snapshot as Array<{
            example_text: string;
            source?: string;
            context?: string;
            language_code?: string;
          }>
        )
          .filter((e) => e.example_text?.trim())
          .map((e) => ({
            entry_id: revision.entry_id,
            example_text: e.example_text.trim(),
            source: e.source?.trim() || null,
            context: e.context?.trim() || null,
            language_code: e.language_code || revision.language_code,
            created_by: revision.created_by,
          }));
        if (exampleRows.length) {
          await supabase.from("dictionary_examples").insert(exampleRows);
        }
      }

      // Replace tags from snapshot
      if (
        Array.isArray(revision.tags_snapshot) &&
        revision.tags_snapshot.length
      ) {
        await supabase
          .from("dictionary_entry_tags")
          .delete()
          .eq("entry_id", revision.entry_id);
        for (const tagName of revision.tags_snapshot as string[]) {
          const { data: tagRow } = await supabase
            .from("tags")
            .upsert({ name: tagName.trim() }, { onConflict: "name" })
            .select("id")
            .single();
          if (tagRow) {
            await supabase
              .from("dictionary_entry_tags")
              .insert({ entry_id: revision.entry_id, tag_id: tagRow.id });
          }
        }
      }
    } else {
      // Reject the revision
      await supabase
        .from("dictionary_revisions")
        .update({ status: "rejected" })
        .eq("id", revision_id);

      // If this was revision 1 (new entry), also reject the entry itself
      if (revision.revision_number === 1) {
        await supabase
          .from("dictionary_entries")
          .update({ status: "rejected" })
          .eq("id", revision.entry_id);
      }
    }

    // Log the moderation action
    await supabase.from("dictionary_moderation_actions").insert({
      revision_id,
      entry_id: revision.entry_id,
      action,
      reason: reason?.trim() || null,
      moderator_id: user.id,
    });

    return NextResponse.json({ success: true, action, revision_id });
  } catch (error) {
    console.error("Error moderating entry", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   GET /api/dictionary/moderate
   List pending revisions for moderation queue
   Query: ?page=&limit=
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check moderator role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Forbidden: moderators only" },
        { status: 403 },
      );
    }

    const url = req.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") || "20")),
    );
    const offset = (page - 1) * limit;

    // Fetch pending revisions
    const {
      data: revisions,
      error,
      count,
    } = await supabase
      .from("dictionary_revisions")
      .select(
        "id, entry_id, revision_number, term, reading, language_code, definition, change_summary, status, created_by, created_at",
        { count: "exact" },
      )
      .eq("status", "pending_review")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!revisions?.length) {
      return NextResponse.json({ items: [], total: 0, page, limit });
    }

    // Fetch author profiles
    const authorIds = [...new Set(revisions.map((r) => r.created_by))];
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
      profiles?.forEach((p) =>
        profilesById.set(p.id, {
          user_name: p.user_name,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        }),
      );
    }

    const items = revisions.map((r) => {
      const author = profilesById.get(r.created_by);
      return {
        ...r,
        is_new_entry: r.revision_number === 1,
        author: {
          id: r.created_by,
          display_name:
            author?.display_name || author?.user_name || "Anonymous",
          user_name: author?.user_name || "user",
          avatar_url: author?.avatar_url || "",
        },
      };
    });

    return NextResponse.json({ items, total: count || 0, page, limit });
  } catch (error) {
    console.error("Error listing moderation queue", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
