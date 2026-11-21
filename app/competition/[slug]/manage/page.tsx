"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/common/States";
import { FormAlert } from "@/components/common/Form";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CompetitionForm } from "@/components/competition/CompetitionForm";
import { ManageEntries } from "@/components/competition/ManageEntries";
import { ManageResults } from "@/components/competition/ManageResults";
import { useCompetition } from "@/lib/hooks/queries/useCompetitions";
import { useUpdateCompetition } from "@/lib/hooks/mutations/useCompetitionAdmin";

/** Organizers: edit the competition, handle entries, import and publish results. (Server layout = staff only.) */
export default function ManageCompetitionPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { data: c, isLoading, isError, error, refetch } = useCompetition(slug, i18n.language);
  const update = useUpdateCompetition(slug);
  const [saved, setSaved] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (isError || !c) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const publishing = !c.results_published;
  const entriesKey = c.entries.map((e) => `${e.id}:${e.status}:${e.score}:${e.tiebreak}:${e.note}:${e.rank}`).join("|");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge kind="competition" value={c.status} />
            <Badge variant={c.results_published ? "success" : "neutral"}>
              {t(c.results_published ? "competition.manage.results.published" : "competition.manage.results.notPublished")}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/competition/${c.slug}`}>
              <ExternalLink /> {t("competition.manage.viewPage")}
            </Link>
          </Button>
          <Button variant={publishing ? "default" : "outline"} onClick={() => { update.reset(); setConfirmPublish(true); }}>
            {t(publishing ? "competition.manage.results.publish" : "competition.manage.results.unpublish")}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="details">
        <TabsList variant="underline">
          <TabsTrigger value="details">{t("competition.manage.tabs.details")}</TabsTrigger>
          <TabsTrigger value="entries">{t("competition.manage.tabs.entries")}</TabsTrigger>
          <TabsTrigger value="results">{t("competition.manage.tabs.results")}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-5">
          {saved && !update.isPending && <FormAlert tone="info">{t("competition.manage.form.saved")}</FormAlert>}
          <CompetitionForm
            key={c.slug}
            initial={c}
            submitting={update.isPending}
            error={update.isError && !confirmPublish ? (update.error as Error).message : null}
            onSubmit={(body) => {
              setSaved(false);
              update.mutate(body, {
                onSuccess: (r) => {
                  setSaved(true);
                  if (r.slug !== c.slug) router.replace(`/competition/${r.slug}/manage`);
                },
              });
            }}
          />
        </TabsContent>

        <TabsContent value="entries" className="pt-5">
          <ManageEntries slug={c.slug} entries={c.entries} />
        </TabsContent>

        <TabsContent value="results" className="pt-5">
          <ManageResults key={entriesKey} slug={c.slug} entries={c.entries} categories={c.categories} />
        </TabsContent>
      </Tabs>

      <Dialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t(publishing ? "competition.manage.results.publishTitle" : "competition.manage.results.unpublishTitle")}</DialogTitle>
            <DialogDescription>{t(publishing ? "competition.manage.results.publishText" : "competition.manage.results.unpublishText")}</DialogDescription>
          </DialogHeader>
          {update.isError && <FormAlert>{(update.error as Error).message}</FormAlert>}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              disabled={update.isPending}
              onClick={() => update.mutate({ results_published: publishing }, { onSuccess: () => setConfirmPublish(false) })}
            >
              {t(publishing ? "competition.manage.results.publish" : "competition.manage.results.unpublish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
