import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";

export type MyProfile = {
  user_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

/**
 * The signed-in user's own profile row. Shared by the header account menu and
 * the sidebar, so it's fetched once and cached per user.
 */
export function useMyProfile() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MyProfile | null> => {
      const { data } = await createClient()
        .from("profiles")
        .select("user_name, display_name, avatar_url, role")
        .eq("id", user!.id)
        .single();
      return data ?? null;
    },
  });

  // Ignore a profile cached for a previous session once signed out.
  return user ? (query.data ?? null) : null;
}
