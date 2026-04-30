"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  ChevronRight,
  Globe,
  Key,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Settings,
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

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>
      </div>

      {/* Appearance */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t("settings.appearance")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("settings.theme")}</p>
            <div className="flex gap-2">
              {THEMES.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 rounded-lg border py-3 text-xs font-medium transition-all ${
                    theme === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(`settings.theme_${value}`)}
                  {theme === value && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t("settings.language")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1.5">
            {LANGUAGES.map((lang) => {
              const isActive = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/8 border border-primary/20 text-foreground"
                      : "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{lang.native}</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {lang.code.toUpperCase()}
                    </Badge>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            {t("settings.account")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {userName && (
            <Link
              href={`/profile/${userName}/edit`}
              className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {t("settings.editProfile")}
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <Separator className="my-1" />
          <Link
            href="/profile/password"
            className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              {t("settings.changePassword")}
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="border-border/60">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("settings.signedInAs")}</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/");
              }}
            >
              {t("nav_user.logout")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
