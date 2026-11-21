import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompetitionEntry, CompetitionResultUpdate } from "@/lib/types/competition";

/* Organizer (staff) mutations for P1-04. The API answers 403 for everyone else. */

async function send<T>(url: string, method: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return (slug?: string) => {
    if (slug) queryClient.invalidateQueries({ queryKey: ["competition", slug] });
    queryClient.invalidateQueries({ queryKey: ["competitions"] });
  };
}

/** POST /api/competitions → { slug } (created as draft). */
export function useCreateCompetition() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => send<{ slug: string }>("/api/competitions", "POST", body),
    onSuccess: () => invalidate(),
  });
}

/** PUT /api/competitions/[slug] — fields, status, results_published. Returns the (possibly new) slug. */
export function useUpdateCompetition(slug: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      send<{ slug: string; status: string; results_published: boolean }>(`/api/competitions/${encodeURIComponent(slug)}`, "PUT", body),
    onSuccess: (r) => {
      invalidate(slug);
      if (r.slug !== slug) invalidate(r.slug);
    },
  });
}

/** PUT /api/competitions/[slug]/results — save fields/statuses and re-rank; [] just recomputes ranks. */
export function useSaveResults(slug: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (entries: CompetitionResultUpdate[]) =>
      send<{ entries: CompetitionEntry[] }>(`/api/competitions/${encodeURIComponent(slug)}/results`, "PUT", { entries }),
    onSuccess: () => invalidate(slug),
  });
}
