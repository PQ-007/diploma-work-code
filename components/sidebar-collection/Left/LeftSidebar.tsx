"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Logo, LogoMark } from "@/components/brand/Logo";
import {
  comingSoonNav,
  isActivePath,
  primaryNav,
  type NavLink,
} from "@/components/navigation/nav";
import {
  Sidebar,
  SidebarContent,
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

function NavItems({ items, muted = false }: { items: NavLink[]; muted?: boolean }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isMobile, setOpenMobile } = useSidebar();
  const close = () => {
    if (isMobile) setOpenMobile(false);
  };

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
              className={
                muted
                  ? "text-muted-foreground"
                  : "data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground"
              }
            >
              <Link href={item.href} onClick={close}>
                <item.icon className={active ? "text-sidebar-primary" : undefined} />
                <span>{t(item.titleKey)}</span>
              </Link>
            </SidebarMenuButton>

            {item.items && active && (
              <SidebarMenuSub>
                {item.items.map((sub) => (
                  <SidebarMenuSubItem key={sub.href}>
                    <SidebarMenuSubButton asChild>
                      <Link href={sub.href} onClick={close}>
                        <sub.icon />
                        <span>{t(sub.titleKey)}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function LeftSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isMobile, setOpenMobile, state } = useSidebar();
  // Reading pages hide the sidebar completely instead of collapsing to icons.
  const isReadingPage = pathname
    ? /^\/(article|profile|project)\/[^/]+$/.test(pathname)
    : false;

  return (
    <Sidebar collapsible={isReadingPage ? "offcanvas" : "icon"} {...props}>
      <SidebarHeader className="h-[var(--header-h)] justify-center px-3">
        <Link
          href="/"
          onClick={() => isMobile && setOpenMobile(false)}
          className="flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="FutureHub home"
        >
          {state === "collapsed" && !isMobile ? <LogoMark className="size-7" /> : <Logo />}
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 pt-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <NavItems items={primaryNav} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("common.comingSoon")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems items={comingSoonNav} muted />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
