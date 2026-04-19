import type { SupabaseClient } from "@supabase/supabase-js";

export function slugifyDeckName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "deck";
}

export async function uniqueDeckSlug(
  supabase: SupabaseClient,
  ownerId: string,
  desiredName: string,
): Promise<string> {
  const base = slugifyDeckName(desiredName);
  let candidate = base;
  let n = 2;
  while (true) {
    const { data } = await supabase
      .from("decks")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("slug", candidate);
    if (!data?.length) return candidate;
    candidate = `${base}-${n++}`;
    if (n > 100) return `${base}-${Date.now()}`;
  }
}
