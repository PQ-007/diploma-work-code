import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompetitionSignUpBody } from "@/lib/types/competition";

async function send<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body as T;
}

/** Refresh the competition page and the lists after a team's entry changes. */
function useInvalidateCompetition(slug: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["competition", slug] });
    queryClient.invalidateQueries({ queryKey: ["competitions"] });
  };
}

/**
 * Sign up a team: an existing contest project, or a new one created on the spot.
 * The error message is the API's (e.g. "Sign-up is closed").
 *
 * @example
 * const signUp = useCompetitionSignUp(slug);
 * signUp.mutate({ category: "bot", newProject: { title: "Team Alpha", description: "" } });
 */
export function useCompetitionSignUp(slug: string) {
  const invalidate = useInvalidateCompetition(slug);
  return useMutation({
    mutationFn: (body: CompetitionSignUpBody) =>
      send<{ id: number; project_slug: string; reregistered?: boolean }>(
        `/api/competitions/${encodeURIComponent(slug)}/entries`,
        { method: "POST", body: JSON.stringify(body) },
      ),
    onSuccess: invalidate,
  });
}

/** Withdraw the caller's entry while sign-up is open (signing up again re-registers it). */
export function useCompetitionWithdraw(slug: string) {
  const invalidate = useInvalidateCompetition(slug);
  return useMutation({
    mutationFn: (entryId: number) =>
      send<{ id: number; status: "withdrawn" }>(
        `/api/competitions/${encodeURIComponent(slug)}/entries/${entryId}`,
        { method: "DELETE" },
      ),
    onSuccess: invalidate,
  });
}
