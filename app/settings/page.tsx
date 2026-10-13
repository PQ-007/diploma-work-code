"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormSection } from "@/components/common/Form";
import { LanguageBadge } from "@/components/common/LanguageBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Check,
  ChevronRight,
  Globe,
  Key,
  Monitor,
  Moon,
  Palette,
  Sun,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "mn", label: "Mongolian", native: "Монгол" },
  { code: "ja", label: "Japanese", native: "日本語" },
] as const;

const THEMES = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [userName, setUserName] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
      return;
    }
    if (!user) return;

    supabase
      .from("profiles")
      .select("user_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setUserName(data?.user_name ?? null);
        setProfileLoading(false);
      });
  }, [authLoading, user, supabase, router]);

  const handleLanguageChange = (code: "en" | "mn" | "ja") => {
    setLanguage(code);
    toast.success(t("settings.languageChanged"));
  };

  const row =
    "flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors hover:bg-accent/60";

  if (authLoading || profileLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <PageHeader className="!mb-1" title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <FormSection title={<span className="inline-flex items-center gap-2"><Palette className="size-4 text-primary" />{t("settings.appearance")}</span>}>
        <div role="radiogroup" aria-label={t("settings.theme")} className="grid grid-cols-3 gap-2">
          {THEMES.map(({ value, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border py-3.5 text-sm font-medium transition-colors ${
                  active ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Icon className="size-5" />
                {t(`settings.theme_${value}`)}
              </button>
            );
          })}
        </div>
      </FormSection>

      <FormSection title={<span className="inline-flex items-center gap-2"><Globe className="size-4 text-primary" />{t("settings.language")}</span>}>
        <div role="radiogroup" aria-label={t("settings.language")} className="-mx-1 space-y-1">
          {LANGUAGES.map((lang) => {
            const active = language === lang.code;
            return (
              <button
                key={lang.code}
                role="radio"
                aria-checked={active}
                onClick={() => handleLanguageChange(lang.code)}
                className={`${row} ${active ? "bg-accent text-accent-foreground" : "text-foreground"}`}
              >
                <span className="flex items-center gap-3">
                  <LanguageBadge code={lang.code} active={active} />
                  <span className="font-medium">{lang.native}</span>
                </span>
                {active && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </FormSection>

      <FormSection title={<span className="inline-flex items-center gap-2"><UserRound className="size-4 text-primary" />{t("settings.account")}</span>}>
        <div className="-mx-1 space-y-1">
          {userName && (
            <Link href={`/profile/${userName}/edit`} className={row}>
              <span className="flex items-center gap-2.5">
                <UserRound className="size-4 text-muted-foreground" />
                {t("settings.editProfile")}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          )}
          <Link href="/profile/password" className={row}>
            <span className="flex items-center gap-2.5">
              <Key className="size-4 text-muted-foreground" />
              {t("settings.changePassword")}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("settings.signedInAs")}</p>
            <p className="truncate text-sm font-medium">{user?.email}</p>
          </div>
          <Button
            variant="destructive-soft"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/");
            }}
          >
            {t("nav_user.logout")}
          </Button>
        </div>
      </FormSection>
    </div>
  );
}
