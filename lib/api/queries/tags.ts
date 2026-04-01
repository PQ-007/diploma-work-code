import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetches tags for multiple content items.
 * This function eliminates the duplicate tag-fetching pattern that appears
 * in /api/articles, /api/profile/[slug], /api/discussions, and /api/projects.
 *
 * @param supabase - Supabase client instance
 * @param contentIds - Array of content IDs to fetch tags for
 * @param tableName - The junction table name ('article_tags', 'discussion_tags', or 'project_tags')
 * @returns Map of contentId -> array of tag names
 *
 * @example
 * const tags = await fetchTagsForContent(supabase, articleIds, 'article_tags');
 * const articleTags = tags.get(articleId); // ['javascript', 'react', 'typescript']
 */
export async function fetchTagsForContent(
  supabase: SupabaseClient,
  contentIds: string[],
  tableName: "article_tags" | "discussion_tags" | "project_tags",
): Promise<Map<string, string[]>> {
  if (!contentIds.length) return new Map();

  // Determine the correct column name based on table
  const idColumn =
    tableName === "article_tags"
      ? "article_id"
      : tableName === "discussion_tags"
        ? "discussion_id"
        : "project_id";

  // 1. Fetch tag links (junction table)
  const { data: tagLinks } = await supabase
    .from(tableName)
    .select(`${idColumn}, tag_id`)
    .in(idColumn, contentIds);

  if (!tagLinks || tagLinks.length === 0) {
    return new Map();
  }

  // 2. Extract unique tag IDs
  const tagIds = [...new Set(tagLinks.map((t) => String(t.tag_id)))].filter(
    Boolean,
  );

  // 3. Fetch tag names from tags table
  const tagsById = new Map<string, string>();
  if (tagIds.length > 0) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id, name")
      .in("id", tagIds);

    tagRows?.forEach((t) => {
      if (t.id && t.name) {
        tagsById.set(String(t.id), t.name);
      }
    });
  }

  // 4. Group tags by content ID
  const tagsByContent = new Map<string, string[]>();

  tagLinks.forEach((link: any) => {
    const contentId = link[idColumn] as string;
    const tagName = tagsById.get(String(link.tag_id));

    if (!tagName || !contentId) return;

    const existingTags = tagsByContent.get(contentId) || [];
    existingTags.push(tagName);
    tagsByContent.set(contentId, existingTags);
  });

  return tagsByContent;
}
