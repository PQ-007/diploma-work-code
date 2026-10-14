"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { PenLine, Settings, UserRound } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import {
  comingSoonNav,
  isActivePath,
  primaryNav,
  type NavLink,
} from "@/components/navigation/nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/lib/hooks/queries/useMyProfile";
import { cn } from "@/lib/utils";

/** Close the drawer after navigating on phones. */
function useCloseOnNavigate() {
  const { isMobile, setOpenMobile } = useSidebar();
  return () => {
    if (isMobile) setOpenMobile(false);
  };
}

const groupLabel = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80";

// Active: blue tint, bold label, blue icon and a short accent bar on the left edge.
const itemClass =
  "relative h-9 rounded-lg text-[14px] before:absolute before:left-0 before:top-1/2 before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity data-[active=true]:bg-sidebar-primary/10 data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground data-[active=true]:before:opacity-100 group-data-[collapsible=icon]:before:hidden [&>svg]:transition-colors data-[active=true]:[&>svg]:text-sidebar-primary";

function SubItemList({ items, activeHref }: { items: NavLink[]; activeHref?: string }) {
  const { t } = useTranslation();
  const close = useCloseOnNavigate();
  return (
    <SidebarMenuSub className="mr-0 gap-0.5 py-1">
      {items.map((sub) => (
        <SidebarMenuSubItem key={sub.href}>
          <SidebarMenuSubButton
            asChild
            isActive={sub.href === activeHref}
            className="h-8 rounded-md data-[active=true]:bg-sidebar-primary/10 data-[active=true]:font-medium data-[active=true]:text-sidebar-primary data-[active=true]:[&>svg]:text-sidebar-primary"
          >
            <Link href={sub.href} onClick={close}>
              <sub.icon />
              <span>{t(sub.titleKey)}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}

/** Sub-links are filters (?type=…); highlight the one in the URL. */
function SubItemsWithParams({ items }: { items: NavLink[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const activeHref = items.find((sub) => {
    const url = new URL(sub.href, "http://x");
    return url.pathname === pathname && [...url.searchParams].every(([k, v]) => params.get(k) === v);
  })?.href;
  return <SubItemList items={items} activeHref={activeHref} />;
}

function NavItems({ items, muted = false }: { items: NavLink[]; muted?: boolean }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const close = useCloseOnNavigate();

  return (
    <SidebarMenu className="gap-0.5">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={t(item.titleKey)}
              className={muted ? "h-9 rounded-lg text-[14px] text-muted-foreground" : itemClass}
            >
              <Link href={item.href} onClick={close}>
                <item.icon />
                <span>{t(item.titleKey)}</span>
              </Link>
            </SidebarMenuButton>

            {item.items && active && (
              <React.Suspense fallback={<SubItemList items={item.items} />}>
                <SubItemsWithParams items={item.items} />
              </React.Suspense>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

/** Signed-in shortcuts: your profile and settings. */
function YouGroup() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const profile = useMyProfile();
  if (!user) return null;

  const items: NavLink[] = [
    ...(profile?.user_name
      ? [{ titleKey: "nav_user.profile", href: `/profile/${profile.user_name}`, icon: UserRound }]
      : []),
    { titleKey: "nav_user.settings", href: "/settings", icon: Settings },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={groupLabel}>{t("sidebar.you")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <NavItems items={items} />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** Bottom card: an invitation for visitors, a nudge to write for members. */
function SidebarCallout() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const close = useCloseOnNavigate();
  if (loading) return null;

  return (
    <div className="surface-brand rounded-xl border p-3.5">
      <p className="text-sm font-semibold tracking-tight">
        {t(user ? "sidebar.shareTitle" : "sidebar.joinTitle")}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {t(user ? "sidebar.shareText" : "sidebar.joinText")}
      </p>
      {user ? (
        <Button asChild size="sm" variant="outline" className="mt-3 w-full">
          <Link href="/article/create" onClick={close}>
            <PenLine />
            {t("create_button.article")}
          </Link>
        </Button>
      ) : (
        <Button asChild size="sm" className="mt-3 w-full">
          <Link href="/signup" onClick={close}>
            {t("auth.signUp")}
          </Link>
        </Button>
      )}
    </div>
  );
}

export function LeftSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isMobile, state } = useSidebar();
  const close = useCloseOnNavigate();
  // Reading pages hide the sidebar completely instead of collapsing to icons.
  const isReadingPage = pathname
    ? /^\/(article|profile|project)\/[^/]+$/.test(pathname)
    : false;
  const collapsed = state === "collapsed" && !isMobile;

  return (
    <Sidebar
      collapsible={isReadingPage ? "offcanvas" : "icon"}
      // The plain border is replaced by the brand line below.
      className={cn("group-data-[side=left]:border-r-0", className)}
      {...props}
    >
      {/* Brand edge: logo blue at the top fading to red at the bottom. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-px bg-gradient-to-b from-brand-blue/40 via-brand-sky/25 to-brand-red/35"
      />

      <SidebarHeader className={cn("h-[var(--header-h)] justify-center", collapsed ? "items-center px-2" : "px-3")}>
        <Link
          href="/"
          onClick={close}
          className="flex items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="FutureHub home"
        >
          {collapsed ? <LogoMark className="size-7" /> : <Logo size="lg" />}
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className={groupLabel}>{t("sidebar.menu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={primaryNav} />
          </SidebarGroupContent>
        </SidebarGroup>

        <YouGroup />

        <SidebarGroup>
          <SidebarGroupLabel className={groupLabel}>{t("common.comingSoon")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={comingSoonNav} muted />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <SidebarCallout />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
