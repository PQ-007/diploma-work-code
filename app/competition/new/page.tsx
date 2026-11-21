"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";
import { CompetitionForm } from "@/components/competition/CompetitionForm";
import { useCreateCompetition } from "@/lib/hooks/mutations/useCompetitionAdmin";

/** Organizers: create a competition (as a draft), then continue on its manage page. */
export default function NewCompetitionPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const create = useCreateCompetition();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={t("competition.manage.newTitle")} subtitle={t("competition.manage.newSubtitle")} />
      <CompetitionForm
        submitting={create.isPending}
        error={create.isError ? (create.error as Error).message : null}
        onSubmit={(body) => create.mutate(body, { onSuccess: (r) => router.push(`/competition/${r.slug}/manage`) })}
      />
    </div>
  );
}
