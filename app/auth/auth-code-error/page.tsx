"use client";

import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/** Where /auth/callback sends users whose confirmation or reset link is invalid or expired. */
export default function AuthCodeErrorPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <LinkIcon className="size-7" />
      </div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        {t("auth.linkInvalidTitle")}
      </h1>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        {t("auth.linkInvalidDesc")}
      </p>
      <div className="flex gap-3">
        <Button asChild size="sm">
          <Link href="/signin">{t("auth.signIn")}</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/forgot-password">{t("auth.forgotPassword")}</Link>
        </Button>
      </div>
    </div>
  );
}
