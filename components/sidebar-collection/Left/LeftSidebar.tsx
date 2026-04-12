"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Anvil,
  Atom,
  Bird,
  Blocks,
  Brain,
  ChevronRight,
  Clock,
  Code,
  Edit,
  FileText,
  Flame,
  Folder,
  GraduationCap,
  Hammer,
  Library,
  MessagesSquare,
  MoreHorizontal,
  Rocket,
  Scroll,
  Share2,
  Store,
  SwatchBook,
  Swords,
  Telescope,
  Trash2,
  Trophy,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { NavItem, SidebarData } from "./type";

// Navigation data structure (using translation keys)
const navData: SidebarData = {
  navMain: [
    {
      titleKey: "sidebar.competitions",
      icon: Swords,
      href: "/competition",
      items: [
        {
          titleKey: "sidebar.ongoing",
          href: "/competition/ongoing",
          icon: Clock,
        },
        {
          titleKey: "sidebar.upcoming",
          href: "/competition/upcoming",
          icon: Rocket,
        },
        { titleKey: "sidebar.past", href: "/competition/past", icon: Trophy },
      ],
    },
    // {
    //   titleKey: "sidebar.learn",
    //   icon: GraduationCap,
    //   href: "/learn",
    //   authRequired: true,
    //   items: [
    //     {
    //       titleKey: "sidebar.algorithm",
    //       href: "/learn/algorithm",
    //       icon: Brain,
    //     },
    //     {
    //       titleKey: "sidebar.dataStructures",
    //       href: "/learn/data-structure",
    //       icon: Blocks,
    //     },
    //     {
    //       titleKey: "sidebar.languages",
    //       href: "/learn/programming-lang",
    //       icon: Code,
    //     },
    //     {
    //       titleKey: "sidebar.resources",
    //       href: "/learn/resources",
    //       icon: Library,
    //     },
    //   ],
    // },
    {
      titleKey: "sidebar.articles",
      icon: Telescope,
      href: "/article",
    },

    {
      titleKey: "sidebar.projects",
      icon: Anvil,
      href: "/project",
      items: [
        {
          titleKey: "sidebar.graduation",
          href: "/project/graduation",
          icon: GraduationCap,
        },
        
        {
          titleKey: "sidebar.tutorial",
          href: "/project/tutorial",
          icon: Hammer,
        },
      ],
    },
    {
      titleKey: "sidebar.discussions",
      icon: MessagesSquare,
      href: "/discussions",
      items: [],
    },
    // {
    //   titleKey: "sidebar.knowledgeTree",
    //   icon: Scroll,
    //   href: "/knowledge-tree",
    //   items: [],
    //   authRequired: true,
    // },
    {
      titleKey: "sidebar.dictionary",
      icon: Blocks,
      href: "/dictionary",
      items: [],
    },
    {
      titleKey: "sidebar.store",
      icon: Store,
      href: "/store",
      items: [],
      authRequired: true,
    },
  ],
  
};

function Header() {
  const { setOpen, isMobile } = useSidebar();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="flex items-center justify-between w-full h-[31px] ">
      <SidebarMenu className="flex-1">
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild aria-label="Home">
            <button
              onClick={() => {
                if (isMobile) setOpen(false);
                router.push("/");
              }}
              className="flex w-full items-center group"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-full shrink-0">
                <Bird className="size-5 transition-all group-hover:scale-110 group-hover:rotate-12" />
              </div>
              <div className="grid flex-1 text-left leading-tight min-w-0 h-9.5">
                <span className="truncate text-xl font-semibold tracking-wider">
                  FutureHub
                </span>
                <span className="truncate text-xs font-light text-muted-foreground tracking-wider">
                  Ad astra per aspera
                </span>
              </div>
            </button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpen, isMobile } = useSidebar();
  const { t } = useTranslation();

  const handleNavigation = (href: string) => {
    if (isMobile) {
      setOpen(false);
    }
    router.push(href);
  };

  const isActive = (href: string) => {
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className=" text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
        Navigation
      </SidebarGroupLabel>
      <SidebarGroupContent className="px-1.5 md:px-0 ">
        <SidebarMenu>
          {items.map((item) => {
            const hasSubItems = item.items && item.items.length > 0;

            return (
              <Collapsible
                key={item.titleKey}
                asChild
                defaultOpen={isActive(item.href)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  {/* If no sub-items, make the whole button clickable */}
                  {!hasSubItems ? (
                    <SidebarMenuButton
                      tooltip={t(item.titleKey)}
                      isActive={isActive(item.href)}
                      onClick={() => handleNavigation(item.href)}
                      className="px-3 md:px-2 w-full transition-all duration-200 hover:bg-accent/20 data-[active=true]:bg-accent/30"
                    >
                      {item.icon && (
                        <item.icon className="size-4 text-muted-foreground group-data-[active=true]/collapsible:text-foreground" />
                      )}
                      <span className="font-medium text-sm">
                        {t(item.titleKey)}
                      </span>
                    </SidebarMenuButton>
                  ) : (
                    /* If has sub-items, split into clickable title and chevron toggle */
                    <div className="flex items-center w-full">
                      {/* Clickable title area */}
                      <SidebarMenuButton
                        tooltip={t(item.titleKey)}
                        isActive={isActive(item.href)}
                        onClick={() => handleNavigation(item.href)}
                        className="flex-1 min-w-0 px-3 md:px-2 transition-all duration-200 hover:bg-accent/20 data-[active=true]:bg-accent/30"
                      >
                        {item.icon && (
                          <item.icon className="size-4 text-muted-foreground group-data-[active=true]/collapsible:text-foreground" />
                        )}
                        <span className="font-medium text-sm">
                          {t(item.titleKey)}
                        </span>
                      </SidebarMenuButton>

                      {/* Collapsible trigger - only the chevron */}
                      <CollapsibleTrigger asChild>
                        <button
                          className="shrink-0 px-2 py-2 hover:bg-accent/20 rounded-md transition-all duration-200 group-data-[collapsible=icon]:hidden"
                          aria-label={`Toggle ${t(item.titleKey)} submenu`}
                        >
                          <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </button>
                      </CollapsibleTrigger>
                    </div>
                  )}

                  {hasSubItems && (
                    <CollapsibleContent className="mt-1">
                      <SidebarMenuSub className="ml-8 mr-0 space-y-0.5 border-l-2 border-border/50 pl-3">
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.titleKey}>
                            <SidebarMenuSubButton
                              asChild
                              className="hover:bg-accent/30 rounded-md px-2 py-2 transition-all duration-200"
                            >
                              <button
                                onClick={() => handleNavigation(subItem.href)}
                                className="flex w-full items-center gap-2.5 text-left group/subitem"
                              >
                                {subItem.icon && (
                                  <subItem.icon className="size-3.5 text-muted-foreground/70 group-hover/subitem:text-muted-foreground transition-colors" />
                                )}
                                <span className="truncate text-sm text-muted-foreground group-hover/subitem:text-foreground transition-colors">
                                  {t(subItem.titleKey)}
                                </span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}



export function LeftSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, loading } = useAuth();
  const isAuthenticated = user !== null;
  const pathname = usePathname();
  const isArticleDetail = pathname
    ? /^\/article\/[^/]+$/.test(pathname)
    || /^\/profile\/[^/]+$/.test(pathname)
    ||  /^\/project\/[^/]+$/.test(pathname) : false;

  return (
    <Sidebar collapsible={isArticleDetail ? "offcanvas" : "icon"} {...props}>
      <SidebarHeader className="border-b ">
        <Header />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <NavMain
          items={
            isAuthenticated
              ? navData.navMain
              : navData.navMain.filter((item) => !item.authRequired)
          }
        />
        
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
