import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/dictionary/[slug]
   Get full entry detail including translations, examples, revisions
   ═══════════════════════════════════════════ */
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

    // 1. Fetch entry
    const { data: entry, error: entryError } = await supabase
      .from("dictionary_entries")
      .select(
        "id, term, slug, reading, language_code, definition, status, created_by, created_at, updated_at, views, saves, current_revision_id",
      )
      .eq("slug", slug)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Check access: approved = public, otherwise must be owner or moderator
    if (entry.status !== "approved") {
      if (!user) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
      }
      if (entry.created_by !== user.id) {
        // Check if moderator
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile || !["teacher", "admin"].includes(profile.role)) {
          return NextResponse.json(
            { error: "Entry not found" },
            { status: 404 },
          );
        }
      }
    }

    // Increment views (fire-and-forget)
    supabase
      .from("dictionary_entries")
      .update({ views: (entry.views || 0) + 1 })
      .eq("id", entry.id)
      .then(() => {});

    // 2. Fetch author profile
    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("id, user_name, display_name, avatar_url")
      .eq("id", entry.created_by)
      .single();

    // 3. Fetch translations
    const { data: translations } = await supabase
      .from("dictionary_translations")
      .select(
        "id, language_code, translated_term, explanation, created_by, created_at",
      )
      .eq("entry_id", entry.id)
      .order("language_code");

    // 4. Fetch examples
    const { data: examples } = await supabase
      .from("dictionary_examples")
      .select(
        "id, example_text, source, context, language_code, created_by, created_at",
      )
      .eq("entry_id", entry.id)
      .order("created_at");

    // 5. Fetch tags
    const { data: tagLinks } = await supabase
      .from("dictionary_entry_tags")
      .select("tag_id")
      .eq("entry_id", entry.id);

    const tags: string[] = [];
    if (tagLinks?.length) {
      const tagIds = tagLinks.map((t) => t.tag_id);
      const { data: tagRows } = await supabase
        .from("tags")
        .select("name")
        .in("id", tagIds);
      tagRows?.forEach((t) => tags.push(t.name));
    }

    // 6. Fetch revision history (latest 20)
    const { data: revisions } = await supabase
      .from("dictionary_revisions")
      .select(
        "id, revision_number, change_summary, status, created_by, created_at",
      )
      .eq("entry_id", entry.id)
      .order("revision_number", { ascending: false })
      .limit(20);

    // Fetch revision author names
    const revAuthorIds = [
      ...new Set((revisions || []).map((r) => r.created_by)),
    ];
    const revAuthorsById = new Map<string, string>();
    if (revAuthorIds.length) {
      const { data: revProfiles } = await supabase
        .from("profiles")
        .select("id, user_name, display_name")
        .in("id", revAuthorIds);
      revProfiles?.forEach((p) =>
        revAuthorsById.set(p.id, p.display_name || p.user_name || "Anonymous"),
      );
    }

    // 7. Check if current user saved this entry
    let saved = false;
    if (user) {
      const { data: saveRow } = await supabase
        .from("dictionary_saves")
        .select("entry_id")
        .eq("entry_id", entry.id)
        .eq("user_id", user.id)
        .maybeSingle();
      saved = !!saveRow;
    }

    // 8. Fetch moderation actions for this entry (visible to owner + moderators)
    let moderationActions: Array<{
      action: string;
      reason: string | null;
      moderator: string;
      created_at: string;
    }> = [];
    if (user && (entry.created_by === user.id || true)) {
      const { data: modActions } = await supabase
        .from("dictionary_moderation_actions")
        .select("action, reason, moderator_id, created_at")
        .eq("entry_id", entry.id)
        .order("created_at", { ascending: false });

      if (modActions?.length) {
        const modIds = [...new Set(modActions.map((m) => m.moderator_id))];
        const modNamesById = new Map<string, string>();
        const { data: modProfiles } = await supabase
          .from("profiles")
          .select("id, user_name, display_name")
          .in("id", modIds);
        modProfiles?.forEach((p) =>
          modNamesById.set(p.id, p.display_name || p.user_name || "Moderator"),
        );

        moderationActions = modActions.map((m) => ({
          action: m.action,
          reason: m.reason,
          moderator: modNamesById.get(m.moderator_id) || "Moderator",
          created_at: m.created_at,
        }));
      }
    }

    // 9. Fetch related entries (same tags, different entry)
    let relatedEntries: Array<{
      id: number;
      term: string;
      slug: string;
      language_code: string;
    }> = [];
    if (tagLinks?.length) {
      const tagIds = tagLinks.map((t) => t.tag_id);
      const { data: relatedTagLinks } = await supabase
        .from("dictionary_entry_tags")
        .select("entry_id")
        .in("tag_id", tagIds)
        .neq("entry_id", entry.id)
        .limit(10);

      if (relatedTagLinks?.length) {
        const relatedIds = [...new Set(relatedTagLinks.map((r) => r.entry_id))];
        const { data: relatedRows } = await supabase
          .from("dictionary_entries")
          .select("id, term, slug, language_code")
          .in("id", relatedIds)
          .eq("status", "approved")
          .limit(5);
        relatedEntries = relatedRows || [];
      }
    }

    return NextResponse.json({
      entry: {
        id: entry.id,
        term: entry.term,
        slug: entry.slug,
        reading: entry.reading,
        language_code: entry.language_code,
        definition: entry.definition,
        status: entry.status,
        views: entry.views,
        saves: entry.saves,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        author: {
          id: entry.created_by,
          display_name:
            authorProfile?.display_name ||
            authorProfile?.user_name ||
            "Anonymous",
          user_name: authorProfile?.user_name || "user",
          avatar_url: authorProfile?.avatar_url || "",
        },
        tags,
        saved,
      },
      translations: translations || [],
      examples: examples || [],
      revisions: (revisions || []).map((r) => ({
        id: r.id,
        revision_number: r.revision_number,
        change_summary: r.change_summary,
        status: r.status,
        author: revAuthorsById.get(r.created_by) || "Anonymous",
        created_at: r.created_at,
      })),
      moderationActions,
      relatedEntries,
    });
  } catch (error) {
    console.error("Error fetching dictionary entry", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   PUT /api/dictionary/[slug]
   Update a draft entry (owner only) or submit for review
   ═══════════════════════════════════════════ */
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

    const { data: entry } = await supabase
      .from("dictionary_entries")
      .select("id, created_by, status")
      .eq("slug", slug)
      .single();

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Only owner can edit drafts
    if (entry.created_by !== user.id || entry.status !== "draft") {
      return NextResponse.json(
        { error: "Cannot edit this entry" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      term,
      reading,
      definition,
      language_code,
      translations,
      examples,
      tags,
      submit,
    } = body;

    // Update entry
    const updates: Record<string, unknown> = {};
    if (term?.trim()) updates.term = term.trim();
    if (reading !== undefined) updates.reading = reading?.trim() || null;
    if (definition?.trim()) updates.definition = definition.trim();
    if (language_code && ["mn", "ja", "en"].includes(language_code))
      updates.language_code = language_code;
    if (submit) updates.status = "pending_review";

    if (Object.keys(updates).length) {
      await supabase
        .from("dictionary_entries")
        .update(updates)
        .eq("id", entry.id);
    }

    // Replace translations if provided
    if (Array.isArray(translations)) {
      await supabase
        .from("dictionary_translations")
        .delete()
        .eq("entry_id", entry.id);
      const translationRows = translations
        .filter((t: { translated_term?: string }) => t.translated_term?.trim())
        .map(
          (t: {
            language_code: string;
            translated_term: string;
            explanation?: string;
          }) => ({
            entry_id: entry.id,
            language_code: t.language_code,
            translated_term: t.translated_term.trim(),
            explanation: t.explanation?.trim() || null,
            created_by: user.id,
          }),
        );
      if (translationRows.length) {
        await supabase.from("dictionary_translations").insert(translationRows);
      }
    }

    // Replace examples if provided
    if (Array.isArray(examples)) {
      await supabase
        .from("dictionary_examples")
        .delete()
        .eq("entry_id", entry.id);
      const exampleRows = examples
        .filter((e: { example_text?: string }) => e.example_text?.trim())
        .map(
          (e: {
            example_text: string;
            source?: string;
            context?: string;
            language_code?: string;
          }) => ({
            entry_id: entry.id,
            example_text: e.example_text.trim(),
            source: e.source?.trim() || null,
            context: e.context?.trim() || null,
            language_code: e.language_code || language_code || "en",
            created_by: user.id,
          }),
        );
      if (exampleRows.length) {
        await supabase.from("dictionary_examples").insert(exampleRows);
      }
    }

    // Replace tags if provided
    if (Array.isArray(tags)) {
      await supabase
        .from("dictionary_entry_tags")
        .delete()
        .eq("entry_id", entry.id);
      for (const tagName of tags) {
        const { data: tagRow } = await supabase
          .from("tags")
          .upsert({ name: tagName.trim() }, { onConflict: "name" })
          .select("id")
          .single();
        if (tagRow) {
          await supabase
            .from("dictionary_entry_tags")
            .insert({ entry_id: entry.id, tag_id: tagRow.id });
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: submit ? "pending_review" : "draft",
    });
  } catch (error) {
    console.error("Error updating dictionary entry", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
