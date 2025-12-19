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
import {
  Anvil,
  Atom,
  Bird,
  Blocks,
  BookOpen,
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
  Home,
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
import { NavItem, LibraryItem, SidebarData } from "./type";
import { useAuth } from "@/contexts/AuthContext";

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
    {
      titleKey: "sidebar.learn",
      icon: GraduationCap,
      href: "/learn",
      items: [
        {
          titleKey: "sidebar.algorithm",
          href: "/learn/algorithm",
          icon: Brain,
        },
        {
          titleKey: "sidebar.dataStructures",
          href: "/learn/data-structures",
          icon: Blocks,
        },
        { titleKey: "sidebar.languages", href: "/learn/languages", icon: Code },
        {
          titleKey: "sidebar.resources",
          href: "/learn/resources",
          icon: Library,
        },
      ],
    },
    {
      titleKey: "sidebar.articles",
      icon: Telescope,
      href: "/article",
      items: [
        {
          titleKey: "sidebar.internship",
          href: "/article/internship",
          icon: Library,
        },
        {
          titleKey: "sidebar.post-grad",
          href: "/article/post-grad",
          icon: Library,
        },
      ],
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
          titleKey: "sidebar.contest",
          href: "/project/contest",
          icon: Library,
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
    {
      titleKey: "sidebar.knowledgeTree",
      icon: Scroll,
      href: "/knowledge-tree",
      items: [],
    },
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
    },
  ],
  navLibrary: [
    {
      nameKey: "sidebar.myProjects",
      icon: Flame,
      items: [
        {
          id: "1",
          nameKey: "sidebar.webDev",
          href: "/library/projects/web-dev",
        },
        {
          id: "2",
          nameKey: "sidebar.mobileDev",
          href: "/library/projects/mobile-dev",
        },
        { id: "3", nameKey: "sidebar.aiMl", href: "/library/projects/ai-ml" },
      ],
    },
    {
      nameKey: "sidebar.myArticles",
      icon: Atom,
      items: [
        {
          id: "4",
          nameKey: "sidebar.techArticles",
          href: "/library/articles/tech",
        },
        {
          id: "5",
          nameKey: "sidebar.tutorials",
          href: "/library/articles/tutorials",
        },
        {
          id: "6",
          nameKey: "sidebar.reviews",
          href: "/library/articles/reviews",
        },
      ],
    },
    {
      nameKey: "sidebar.myFlashcards",
      icon: SwatchBook,
      items: [
        {
          id: "7",
          nameKey: "sidebar.algorithms",
          href: "/library/flashcards/algorithms",
        },
        {
          id: "8",
          nameKey: "sidebar.dataScience",
          href: "/library/flashcards/data-science",
        },
        {
          id: "9",
          nameKey: "sidebar.webDesign",
          href: "/library/flashcards/web-design",
        },
      ],
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

export function NavLibrary({ items }: { items: LibraryItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpen } = useSidebar();
  const router = useRouter();
  const { t } = useTranslation();

  if (items.length === 0) return null;

  const handleNavigation = (href: string) => {
    if (isMobile) {
      setOpen(false);
    }
    router.push(href);
  };

  const isActive = (href: string) => {
    return pathname?.startsWith(href) ?? false;
  };

  const handleDelete = (itemId: string, itemName: string) => {
    if (confirm(`${t("sidebar.deleteConfirm")} "${itemName}"?`)) {
      console.log("Deleting item:", itemId);
      // Add your delete logic here
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
        Library
      </SidebarGroupLabel>
      <SidebarGroupContent className="px-1.5 md:px-0">
        <SidebarMenu>
          {items.map((item) => {
            const hasSubItems = item.items && item.items.length > 0;
            // Create a pseudo href for library categories (optional)
            const categoryHref = `/library/${item.nameKey.split(".").pop()}`;

            return (
              <Collapsible
                key={item.nameKey}
                asChild
                defaultOpen={false}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  {/* Split into clickable title and chevron toggle */}
                  <div className="flex items-center w-full">
                    {/* Clickable title area */}
                    <SidebarMenuButton
                      tooltip={t(item.nameKey)}
                      className="flex-1 min-w-0 px-3 md:px-2 transition-all duration-200 hover:bg-accent/20"
                    >
                      {item.icon && (
                        <item.icon className="size-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">
                        {t(item.nameKey)}
                      </span>
                    </SidebarMenuButton>

                    {/* Collapsible trigger - only the chevron */}
                    <CollapsibleTrigger asChild>
                      <button
                        className="shrink-0 px-2 py-2 hover:bg-accent/20 rounded-md transition-all duration-200 group-data-[collapsible=icon]:hidden"
                        aria-label={`Toggle ${t(item.nameKey)} submenu`}
                      >
                        <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  {hasSubItems && (
                    <CollapsibleContent className="mt-1">
                      <SidebarMenuSub className="ml-8 mr-0 space-y-0.5 border-l-2 border-border/50 pl-3">
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem
                            key={subItem.id}
                            className="group/item relative"
                          >
                            <SidebarMenuSubButton
                              asChild
                              className="hover:bg-accent/30 rounded-md px-2 py-2 pr-8 transition-all duration-200"
                            >
                              <button
                                onClick={() => handleNavigation(subItem.href)}
                                className="flex w-full items-center gap-2.5 text-left group/subitem"
                              >
                                <FileText className="size-3.5 text-muted-foreground/70 group-hover/subitem:text-muted-foreground transition-colors" />
                                <span className="truncate text-sm text-muted-foreground group-hover/subitem:text-foreground transition-colors flex-1">
                                  {t(subItem.nameKey)}
                                </span>
                              </button>
                            </SidebarMenuSubButton>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuAction
                                  showOnHover
                                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 hover:bg-accent"
                                >
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">More</span>
                                </SidebarMenuAction>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                className="w-48 rounded-lg border shadow-lg"
                                side={isMobile ? "bottom" : "right"}
                                align={isMobile ? "end" : "start"}
                              >
                                <DropdownMenuItem
                                  onClick={() => handleNavigation(subItem.href)}
                                  className="gap-2 px-3 py-2 cursor-pointer hover:bg-accent/70 transition-colors"
                                >
                                  <Folder className="size-4 text-muted-foreground" />
                                  <span>{t("sidebar.viewItem")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer hover:bg-accent/70 transition-colors">
                                  <Edit className="size-4 text-muted-foreground" />
                                  <span>{t("sidebar.editItem")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 px-3 py-2 cursor-pointer hover:bg-accent/70 transition-colors">
                                  <Share2 className="size-4 text-muted-foreground" />
                                  <span>{t("sidebar.shareItem")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDelete(subItem.id, t(subItem.nameKey))
                                  }
                                  className="gap-2 px-3 py-2 cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition-colors"
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                  <span className="text-destructive">
                                    {t("sidebar.deleteItem")}
                                  </span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
          <SidebarMenuItem>
            <SidebarMenuButton className="px-3 py-2.5 rounded-lg text-muted-foreground/70 hover:bg-accent/30 hover:text-foreground transition-all duration-200">
              <MoreHorizontal className="size-4 mr-3" />
              <span className="text-sm font-medium">{t("sidebar.more")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b ">
        <Header />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <NavMain items={navData.navMain} />
        {isAuthenticated && <NavLibrary items={navData.navLibrary} />}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
