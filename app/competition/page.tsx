"use client";

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState } from "@/components/common/States";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompetitionCard } from "@/components/competition/CompetitionCard";
import { useCompetitions } from "@/lib/hooks/queries/useCompetitions";
import type { CompetitionStatus } from "@/lib/types/competition";

/** Page tabs → API statuses. Every non-draft status belongs to exactly one tab. */
const TABS: { key: string; statuses: CompetitionStatus[] }[] = [
  { key: "upcoming", statuses: ["upcoming"] },
  { key: "open", statuses: ["open"] },
  { key: "in_progress", statuses: ["running", "judging"] },
  { key: "finished", statuses: ["finished"] },
];
const DEFAULT_TAB = "open";

export default function CompetitionsPage() {
  return (
    <Suspense>
      <CompetitionsPageContent />
    </Suspense>
  );
}

function CompetitionsPageContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requested = searchParams.get("status");
  const tab = TABS.find((x) => x.key === requested) ?? TABS.find((x) => x.key === DEFAULT_TAB)!;
  const { data, isLoading, isError, error, refetch } = useCompetitions(tab.statuses, i18n.language);

  // Keep ?status= in sync with the tab (shareable links; same pattern as the project type filter).
  const changeTab = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === DEFAULT_TAB) params.delete("status");
      else params.set("status", key);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <PageHeader className="!mb-0" title={t("competition.title")} subtitle={t("competition.subtitle")} />

      <Tabs value={tab.key} onValueChange={changeTab}>
        <TabsList className="scrollbar-none flex h-10 w-full justify-start gap-1 overflow-x-auto sm:w-auto">
          {TABS.map((x) => (
            <TabsTrigger key={x.key} value={x.key} className="shrink-0 grow-0 px-3">
              {t(`competition.tabs.${x.key}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState icon={Trophy} title={t(`competition.empty.${tab.key}`)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <CompetitionCard key={c.id} competition={c} />
          ))}
        </div>
      )}
    </div>
  );
}
