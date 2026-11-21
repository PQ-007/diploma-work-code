"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Settings2, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { EmptyState, ErrorState } from "@/components/common/States";
import { FormAlert } from "@/components/common/Form";
import { StatusBadge } from "@/components/common/StatusBadge";
import { KeyDates } from "@/components/competition/KeyDates";
import { RulesContent } from "@/components/competition/RulesContent";
import { EntryList, categoryLabel } from "@/components/competition/EntryList";
import { ResultsTable } from "@/components/competition/ResultsTable";
import { SignUpDialog } from "@/components/competition/SignUpDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCompetition } from "@/lib/hooks/queries/useCompetitions";
import { useCompetitionWithdraw } from "@/lib/hooks/mutations/useCompetitionEntry";
import type { CompetitionDetail, CompetitionEntry } from "@/lib/types/competition";

export default function CompetitionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { data: c, isLoading, isError, error, refetch } = useCompetition(slug, i18n.language);
  const [signUpOpen, setSignUpOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Skeleton className="aspect-[3/1] w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
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

  const myEntries = c.entries.filter((e) => c.my_entry_ids.includes(e.id));
  const signUpAction = !c.signup_open ? null : authLoading ? null : user ? (
    <Button onClick={() => setSignUpOpen(true)}>{t("competition.signUp")}</Button>
  ) : (
    <Button asChild>
      <Link href={`/signin?redirect=${encodeURIComponent(`/competition/${c.slug}`)}`}>{t("competition.signInToSignUp")}</Link>
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Cover */}
      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl border bg-muted">
        {c.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.cover_url} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/5 to-brand-sky/20">
            <Trophy className="size-12 text-primary/40" />
          </div>
        )}
      </div>

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge kind="competitionKind" value={c.kind} />
            <StatusBadge kind="competition" value={c.status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{c.title}</h1>
          {c.summary && <p className="text-muted-foreground">{c.summary}</p>}
          <KeyDates competition={c} />
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" aria-hidden />
            {t("competition.teams", { count: c.entry_count })} · {t("competition.maxTeam", { count: c.max_team_size })}
          </p>
        </div>
        {(signUpAction || c.is_staff) && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {c.is_staff && (
              <Button variant="outline" asChild>
                <Link href={`/competition/${c.slug}/manage`}>
                  <Settings2 /> {t("competition.manage.manage")}
                </Link>
              </Button>
            )}
            {signUpAction}
          </div>
        )}
      </header>

      {myEntries.length > 0 && <MyEntries competition={c} entries={myEntries} />}

      <Tabs defaultValue={c.results_published ? "results" : "rules"}>
        <TabsList variant="underline">
          <TabsTrigger value="rules">{t("competition.detailTabs.rules")}</TabsTrigger>
          <TabsTrigger value="teams">{t("competition.detailTabs.teams")}</TabsTrigger>
          {c.results_published && <TabsTrigger value="results">{t("competition.detailTabs.results")}</TabsTrigger>}
        </TabsList>
        <TabsContent value="rules" className="pt-5">
          {c.rules ? <RulesContent key={c.rules} source={c.rules} /> : <EmptyState icon={Trophy} title={t("competition.noRules")} />}
        </TabsContent>
        <TabsContent value="teams" className="pt-5">
          <EntryList entries={c.entries} categories={c.categories} />
        </TabsContent>
        {c.results_published && (
          <TabsContent value="results" className="pt-5">
            <ResultsTable entries={c.entries} categories={c.categories} />
          </TabsContent>
        )}
      </Tabs>

      {user && (
        <SignUpDialog slug={c.slug} categories={c.categories} open={signUpOpen} onOpenChange={setSignUpOpen} />
      )}
    </div>
  );
}

/** The caller's own entries: category, status, and Withdraw while sign-up is open. */
function MyEntries({ competition: c, entries }: { competition: CompetitionDetail; entries: CompetitionEntry[] }) {
  const { t } = useTranslation();
  const withdraw = useCompetitionWithdraw(c.slug);
  const [confirm, setConfirm] = useState<CompetitionEntry | null>(null);

  return (
    <section aria-labelledby="my-entry" className="rounded-xl border bg-card p-4">
      <h2 id="my-entry" className="mb-3 text-sm font-semibold">{t("competition.myEntry.title")}</h2>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{e.project?.title}</span>
            <span className="text-sm capitalize text-muted-foreground">· {categoryLabel(e.category)}</span>
            <StatusBadge kind="entry" value={e.status} />
            <span className="flex-1" />
            {e.status === "registered" && c.signup_open && (
              <Button variant="outline" size="sm" onClick={() => setConfirm(e)}>
                {t("competition.myEntry.withdraw")}
              </Button>
            )}
            {e.status === "withdrawn" && c.signup_open && (
              <span className="w-full text-xs text-muted-foreground sm:w-auto">{t("competition.myEntry.withdrawnHint")}</span>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("competition.myEntry.withdrawTitle")}</DialogTitle>
            <DialogDescription>{t("competition.myEntry.withdrawText")}</DialogDescription>
          </DialogHeader>
          {withdraw.isError && <FormAlert>{(withdraw.error as Error).message}</FormAlert>}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={withdraw.isPending}
              onClick={() => confirm && withdraw.mutate(confirm.id, { onSuccess: () => setConfirm(null) })}
            >
              {withdraw.isPending ? t("competition.myEntry.withdrawing") : t("competition.myEntry.withdraw")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
