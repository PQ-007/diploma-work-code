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
export function useCompetitions(statuses?: CompetitionStatus[], lang?: string) {
  const status = statuses?.length ? statuses.join(",") : "";
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (lang) params.set("lang", lang);
  const qs = params.toString();
  return useQuery({
    queryKey: ["competitions", status, lang],
    queryFn: () => getJson<{ items: CompetitionSummary[] }>(`/api/competitions${qs ? `?${qs}` : ""}`).then((r) => r.items),
  });
}

/**
 * One competition with entries, teams and (when published, or for staff) results. 404 → error.
 * Pass the UI language so switching languages refetches the localized title/summary/rules.
 */
export function useCompetition(slug: string | undefined, lang?: string) {
  return useQuery({
    queryKey: ["competition", slug, lang],
    queryFn: () =>
      getJson<CompetitionDetail>(`/api/competitions/${encodeURIComponent(slug!)}${lang ? `?lang=${lang}` : ""}`),
    enabled: Boolean(slug),
  });
}
