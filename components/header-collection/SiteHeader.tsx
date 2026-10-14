"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { findSection } from "@/components/navigation/nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import CreateButton from "../button-collection/CreateButton";
import { LanguageToggleButton } from "../button-collection/LanguageSwitcherButton";
import ThemeToggleButton from "../button-collection/ThemeToggleButton";
import { NavUser } from "../NavUser";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const section = findSection(usePathname());

  return (
    <header className="glass-chrome sticky top-0 z-40 flex h-[var(--header-h)] shrink-0 items-center gap-2 px-3 sm:px-4">
      {/* Hairline in the logo colours instead of a plain border. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-blue/35 via-border to-brand-red/30"
      />

      <SidebarTrigger className="size-9 text-muted-foreground" />

      {/* The sidebar (with its logo) is a drawer on phones, so show the logo here. */}
      <Link href="/" className="md:hidden" aria-label="FutureHub home">
        <Logo />
      </Link>

      {/* Where you are: section icon + name (desktop; phones have the bottom tabs). */}
      {section && (
        <div className="hidden min-w-0 items-center gap-2.5 md:flex">
          <span aria-hidden className="h-5 w-px bg-border" />
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <section.icon className="size-4" />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight">{t(section.titleKey)}</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Preferences grouped in one glass pill. */}
        <div className="glass flex items-center rounded-full p-0.5 hover:[--glass-bg:var(--glass-fill)]">
          <ThemeToggleButton />
          <LanguageToggleButton />
        </div>
        {loading ? (
          <Skeleton className="size-8 rounded-full" />
        ) : user ? (
          <>
            <CreateButton />
            <NavUser />
          </>
        ) : (
          <Button asChild size="sm" className="ml-1 h-9 rounded-full px-4">
            <Link href="/signin">{t("auth.signIn")}</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

/** The article editor renders its own header inside the editor context. */
export function ResolvedHeader() {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/article/create")) return null;
  return <SiteHeader />;
}
