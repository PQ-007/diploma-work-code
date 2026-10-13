"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
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

  return (
    <header className="sticky top-0 z-40 flex h-[var(--header-h)] shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur-md sm:px-4">
      <SidebarTrigger className="size-9 text-muted-foreground" />

      {/* The sidebar (with its logo) is a drawer on phones, so show the logo here. */}
      <Link href="/" className="md:hidden" aria-label="FutureHub home">
        <Logo />
      </Link>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <ThemeToggleButton />
        <LanguageToggleButton />
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
