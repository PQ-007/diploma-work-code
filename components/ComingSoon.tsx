"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  icon: LucideIcon;
  titleKey: string;
}

/** Placeholder for sections that are announced in the nav but not built yet. */
export default function ComingSoon({ icon: Icon, titleKey }: ComingSoonProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-7" />
      </div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">{t(titleKey)}</h1>
      <p className="mb-1 text-sm font-medium text-primary">
        {t("common.comingSoon")}
      </p>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        {t("common.comingSoonDesc")}
      </p>
      <Button asChild size="sm" variant="outline">
        <Link href="/">
          <ArrowLeft className="mr-2 size-4" />
          {t("common.back")}
        </Link>
      </Button>
    </div>
  );
}
