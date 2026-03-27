import { SupabaseClient } from "@supabase/supabase-js";
import { Author } from "@/lib/types/author";

/**
 * Fetches author profiles in bulk and normalizes them to the Author interface.
 * Eliminates duplicate profile-fetching logic across API routes.
 *
 * This function handles the inconsistent naming conventions in the database
 * (user_name, display_name, avatar_url) and normalizes them to our Author interface.
 *
 * @param supabase - Supabase client instance
 * @param authorIds - Array of author/user IDs to fetch
 * @returns Map of authorId -> Author object
 *
 * @example
 * const profiles = await fetchAuthorProfiles(supabase, authorIds);
 * const author = profiles.get(authorId); // { username, displayName, avatarUrl, ... }
 */
export async function fetchAuthorProfiles(
  supabase: SupabaseClient,
  authorIds: string[],
): Promise<Map<string, Author>> {
  if (!authorIds.length) return new Map();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, user_name, display_name, avatar_url, ranking_point, role")
    .in("id", authorIds);

  const profilesById = new Map<string, Author>();

  profiles?.forEach((p) => {
    profilesById.set(p.id, {
      id: p.id,
      username: p.user_name || "user",
      displayName: p.display_name || p.user_name || "Anonymous",
      avatarUrl: p.avatar_url,
      rankingPoint: p.ranking_point ?? 0,
      role: p.role,
    });
  });

  return profilesById;
}
