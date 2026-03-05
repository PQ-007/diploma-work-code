import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/* ═══════════════════════════════════════════
   GET /api/dictionary
   List/browse approved dictionary entries with filters + pagination
   Query params: ?search=&language=&tag=&sort=&page=&limit=&status=
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const url = req.nextUrl;
    const search = url.searchParams.get("search")?.trim() || "";
    const language = url.searchParams.get("language") || "";
    const tag = url.searchParams.get("tag") || "";
    const sort = url.searchParams.get("sort") || "relevance"; // relevance | newest | most_saved
    const status = url.searchParams.get("status") || "approved";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") || "20")),
    );
    const offset = (page - 1) * limit;
    const letter = url.searchParams.get("letter") || "";

    // Build base query
    let query = supabase
      .from("dictionary_entries")
      .select(
        "id, term, slug, reading, language_code, definition, status, created_by, created_at, updated_at, views, saves",
        { count: "exact" },
      );

    // Status filter — only moderators/owners can see non-approved
    if (status === "approved") {
      query = query.eq("status", "approved");
    } else if (status === "my_drafts" && user) {
      query = query
        .eq("created_by", user.id)
        .in("status", ["draft", "pending_review", "rejected"]);
    } else if (status === "pending_review" && user) {
      // Moderators see pending entries
      query = query.eq("status", "pending_review");
    } else {
      query = query.eq("status", "approved");
    }

    // Language filter — includes entries written in this language AND entries that have translations in this language
    if (language && ["mn", "ja", "en"].includes(language)) {
      const { data: translationLangMatches } = await supabase
        .from("dictionary_translations")
        .select("entry_id")
        .eq("language_code", language);
      const translationLangIds = [
        ...new Set(
          (translationLangMatches || []).map((t) => t.entry_id as number),
        ),
      ];
      if (translationLangIds.length > 0) {
        query = query.or(
          `language_code.eq.${language},id.in.(${translationLangIds.join(",")})`,
        );
      } else {
        query = query.eq("language_code", language);
      }
    }

    // Letter filter
    if (letter && letter.length === 1) {
      query = query.ilike("term", `${letter}%`);
    }

    // Search filter — matches term OR any translated_term in dictionary_translations
    if (search) {
      const { data: translationMatches } = await supabase
        .from("dictionary_translations")
        .select("entry_id")
        .ilike("translated_term", `%${search}%`);

      const translationIds = [
        ...new Set((translationMatches || []).map((t) => t.entry_id as number)),
      ];

      if (translationIds.length > 0) {
        query = query.or(
          `term.ilike.%${search}%,id.in.(${translationIds.join(",")})`,
        );
      } else {
        query = query.ilike("term", `%${search}%`);
      }
    }

    // Sort
    if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "most_saved") {
      query = query.order("saves", { ascending: false });
    } else {
      query = query.order("views", { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: entries, error: entriesError, count } = await query;

    if (entriesError) {
      return NextResponse.json(
        { error: entriesError.message },
        { status: 500 },
      );
    }

    if (!entries?.length) {
      return NextResponse.json(
        { items: [], total: 0, page, limit },
        { status: 200 },
      );
    }

    const entryIds = entries.map((e) => e.id);
    const authorIds = [...new Set(entries.map((e) => e.created_by))];

    // Fetch author profiles
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

    // Fetch tags for entries
    const { data: tagLinks } = await supabase
      .from("dictionary_entry_tags")
      .select("entry_id, tag_id")
      .in("entry_id", entryIds);

    const tagIds = [...new Set((tagLinks || []).map((t) => String(t.tag_id)))];
    const tagsById = new Map<string, string>();
    if (tagIds.length) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", tagIds);
      tagRows?.forEach((t) => tagsById.set(String(t.id), t.name));
    }

    const tagsByEntry = new Map<number, string[]>();
    (tagLinks || []).forEach((link) => {
      const name = tagsById.get(String(link.tag_id));
      if (!name) return;
      const arr = tagsByEntry.get(link.entry_id) || [];
      arr.push(name);
      tagsByEntry.set(link.entry_id, arr);
    });

    // Filter by tag if specified (post-filter since no direct join)
    let filteredEntries = entries;
    if (tag) {
      const matchingEntryIds = new Set<number>();
      tagsByEntry.forEach((tags, entryId) => {
        if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
          matchingEntryIds.add(entryId);
        }
      });
      filteredEntries = entries.filter((e) => matchingEntryIds.has(e.id));
    }

    // Current user's saves
    const savedSet = new Set<number>();
    if (user) {
      const { data: saves } = await supabase
        .from("dictionary_saves")
        .select("entry_id")
        .eq("user_id", user.id)
        .in("entry_id", entryIds);
      saves?.forEach((s) => savedSet.add(s.entry_id));
    }

    // Fetch translation language codes per entry
    const { data: translationLangRows } = await supabase
      .from("dictionary_translations")
      .select("entry_id, language_code")
      .in("entry_id", entryIds);
    const translationLangsByEntry = new Map<number, string[]>();
    (translationLangRows || []).forEach((row) => {
      const arr = translationLangsByEntry.get(row.entry_id) || [];
      if (!arr.includes(row.language_code)) arr.push(row.language_code);
      translationLangsByEntry.set(row.entry_id, arr);
    });

    // Fetch display-language translations for entries whose native language differs from the filter
    const displayTransByEntry = new Map<
      number,
      { term: string; definition: string }
    >();
    if (language) {
      const nonNativeIds = filteredEntries
        .filter((e) => e.language_code !== language)
        .map((e) => e.id);
      if (nonNativeIds.length > 0) {
        const { data: displayTrans } = await supabase
          .from("dictionary_translations")
          .select("entry_id, translated_term, explanation")
          .in("entry_id", nonNativeIds)
          .eq("language_code", language);
        displayTrans?.forEach((t) => {
          displayTransByEntry.set(t.entry_id, {
            term: t.translated_term,
            definition: t.explanation || "",
          });
        });
      }
    }

    // Assemble response
    const items = filteredEntries.map((e) => {
      const author = profilesById.get(e.created_by);
      const disp = displayTransByEntry.get(e.id);
      return {
        id: e.id,
        term: e.term,
        slug: e.slug,
        reading: e.reading,
        language_code: e.language_code,
        definition: e.definition,
        display_term: disp?.term || e.term,
        display_definition: disp?.definition || e.definition,
        status: e.status,
        views: e.views,
        saves: e.saves,
        created_at: e.created_at,
        updated_at: e.updated_at,
        author: {
          id: e.created_by,
          display_name:
            author?.display_name || author?.user_name || "Anonymous",
          user_name: author?.user_name || "user",
          avatar_url: author?.avatar_url || "",
        },
        tags: tagsByEntry.get(e.id) || [],
        saved: savedSet.has(e.id),
        translation_languages: (translationLangsByEntry.get(e.id) || []).filter(
          (lang) => lang !== e.language_code,
        ),
      };
    });

    return NextResponse.json(
      { items, total: count || 0, page, limit },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error listing dictionary entries", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════
   POST /api/dictionary
   Create a new dictionary entry (draft or pending_review)
   Body: { term, reading?, language_code, definition, translations[], examples[], tags[], submit? }
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

    const body = await req.json();
    const {
      term,
      reading,
      language_code,
      definition,
      translations = [],
      examples = [],
      tags = [],
      submit = false, // if true → pending_review, else → draft
    } = body as {
      term: string;
      reading?: string;
      language_code: string;
      definition: string;
      translations?: {
        language_code: string;
        translated_term: string;
        explanation?: string;
      }[];
      examples?: {
        example_text: string;
        source?: string;
        context?: string;
        language_code: string;
      }[];
      tags?: string[];
      submit?: boolean;
    };

    // Validation
    if (!term?.trim()) {
      return NextResponse.json({ error: "Term is required" }, { status: 400 });
    }
    if (!language_code || !["mn", "ja", "en"].includes(language_code)) {
      return NextResponse.json(
        { error: "Valid language_code required (mn/ja/en)" },
        { status: 400 },
      );
    }
    if (!definition?.trim()) {
      return NextResponse.json(
        { error: "Definition is required" },
        { status: 400 },
      );
    }

    // Generate slug
    const baseSlug = term
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s]+/g, "-")
      .substring(0, 100);

    // Check slug uniqueness
    const { data: existingSlug } = await supabase
      .from("dictionary_entries")
      .select("id")
      .eq("slug", baseSlug)
      .maybeSingle();

    const slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;

    const status = submit ? "pending_review" : "draft";

    // Insert entry
    const { data: entry, error: entryError } = await supabase
      .from("dictionary_entries")
      .insert({
        term: term.trim(),
        slug,
        reading: reading?.trim() || null,
        language_code,
        definition: definition.trim(),
        status,
        created_by: user.id,
      })
      .select("id, slug")
      .single();

    if (entryError || !entry) {
      return NextResponse.json(
        { error: entryError?.message || "Failed to create entry" },
        { status: 500 },
      );
    }

    // Insert translations
    if (translations.length) {
      const translationRows = translations
        .filter((t) => t.translated_term?.trim())
        .map((t) => ({
          entry_id: entry.id,
          language_code: t.language_code,
          translated_term: t.translated_term.trim(),
          explanation: t.explanation?.trim() || null,
          created_by: user.id,
        }));

      if (translationRows.length) {
        await supabase.from("dictionary_translations").insert(translationRows);
      }
    }

    // Insert examples
    if (examples.length) {
      const exampleRows = examples
        .filter((e) => e.example_text?.trim())
        .map((e) => ({
          entry_id: entry.id,
          example_text: e.example_text.trim(),
          source: e.source?.trim() || null,
          context: e.context?.trim() || null,
          language_code: e.language_code || language_code,
          created_by: user.id,
        }));

      if (exampleRows.length) {
        await supabase.from("dictionary_examples").insert(exampleRows);
      }
    }

    // Upsert tags and link
    if (tags.length) {
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

    // Create initial revision
    const { data: revision } = await supabase
      .from("dictionary_revisions")
      .insert({
        entry_id: entry.id,
        revision_number: 1,
        term: term.trim(),
        reading: reading?.trim() || null,
        language_code,
        definition: definition.trim(),
        translations_snapshot: translations,
        examples_snapshot: examples,
        tags_snapshot: tags,
        change_summary: "Initial entry",
        status,
        created_by: user.id,
      })
      .select("id")
      .single();

    // Link revision to entry
    if (revision) {
      await supabase
        .from("dictionary_entries")
        .update({ current_revision_id: revision.id })
        .eq("id", entry.id);
    }

    return NextResponse.json(
      { id: entry.id, slug: entry.slug, status },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating dictionary entry", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
