"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="size-7" />
      </div>
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("common.notFoundTitle")}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("common.notFoundDesc")}</p>
      <Button asChild className="mt-6">
        <Link href="/">{t("common.goHome")}</Link>
      </Button>
    </div>
  );
}
