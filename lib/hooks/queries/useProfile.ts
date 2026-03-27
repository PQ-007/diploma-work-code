import { useQuery } from "@tanstack/react-query";

/**
 * Fetch user profile data by slug.
 * Uses React Query for automatic caching.
 *
 * @param slug - User's slug/username
 * @returns Query result with profile data
 *
 * @example
 * const { data: profile, isLoading } = useProfile('johndoe');
 */
export function useProfile(slug: string | null) {
  return useQuery({
    queryKey: ["profile", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Profile slug is required");
      const res = await fetch(`/api/profile/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("Profile not found");
      return res.json();
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10, // 10 minutes - profiles change less frequently
  });
}
