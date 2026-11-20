import { useQuery } from "@tanstack/react-query";
import type { CompetitionDetail, CompetitionStatus, CompetitionSummary } from "@/lib/types/competition";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `${url} → ${res.status}`);
  return body as T;
}

/**
 * Competition list. Without statuses: every non-draft competition.
 *
 * @example
 * const { data } = useCompetitions(["running", "judging"]); // "In progress" tab
 */
export function useCompetitions(statuses?: CompetitionStatus[]) {
  const status = statuses?.length ? statuses.join(",") : "";
  return useQuery({
    queryKey: ["competitions", status],
    queryFn: () =>
      getJson<{ items: CompetitionSummary[] }>(`/api/competitions${status ? `?status=${status}` : ""}`).then((r) => r.items),
  });
}

/** One competition with entries, teams and (when published, or for staff) results. 404 → error. */
export function useCompetition(slug: string | undefined) {
  return useQuery({
    queryKey: ["competition", slug],
    queryFn: () => getJson<CompetitionDetail>(`/api/competitions/${encodeURIComponent(slug!)}`),
    enabled: Boolean(slug),
  });
}
