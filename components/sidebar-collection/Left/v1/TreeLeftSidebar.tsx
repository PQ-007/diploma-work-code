"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Anvil,
  BirdIcon,
  FolderPlus,
  GraduationCap,
  SquarePen,
  Store,
  SwatchBook,
  Swords,
  Telescope,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { TreeView } from "./TreeView";

// Type definitions for data
interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  subItems?: NavSubItem[];
}

interface NavSubItem {
  title: string;
  href: string;
  children?: NavSubItem[];
}

interface SidebarData {
  navMain: NavItem[];
}

// Sample data with nested sub-items
const data: SidebarData = {
  navMain: [
    {
      title: "Competitions",
      icon: Swords,
      href: "/competition",
    },
    {
      title: "Learn",
      icon: GraduationCap,
      href: "/learn",
    },
    {
      title: "Blogs",
      icon: Telescope,
      href: "/blog",
    },
    {
      title: "Projects",
      icon: Anvil,
      href: "/project",
    },
    {
      title: "Flashcards",
      icon: SwatchBook,
      href: "/flashcard",
    },
    {
      title: "Store",
      icon: Store,
      href: "/store",
    },
  ],
};

// Memoized navigation menu for the first sidebar
const NavMenu: React.FC<{ navItems: NavItem[]; activePath: string }> =
  React.memo(({ navItems, activePath }) => {
    const { setOpen, isMobile } = useSidebar();
    const router = useRouter();

    const handleNavigation = (href: string) => {
      if (isMobile) {
        setOpen(false);
      }
      router.push(href);
    };

    return (
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={{
                children: item.title,
                hidden: false,
              }}
              isActive={activePath === item.href}
              className="px-3 md:px-2 w-full"
              asChild
            >
              <button
                onClick={() => handleNavigation(item.href)}
                className="flex w-full items-center text-left"
                aria-label={`Navigate to ${item.title}`}
              >
                <item.icon className="size-4" />
                <span className="truncate">{item.title}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  });

NavMenu.displayName = "NavMenu";

// Enhanced Header with Quick Actions
const EnhancedSidebarHeader: React.FC<{
  title: string;
  onNewFile: () => void;
  onNewFolder: () => void;
  onToggleSearch?: () => void;
}> = ({ title, onNewFile, onNewFolder, onToggleSearch }) => {
  return (
    <div className="w-[256px] h-12 pt-0.5 border-b border-sidebar-border bg-sidebar pr-4">
      {/* Title and Actions Row */}
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-base font-semibold text-sidebar-foreground truncate flex-1">
          {title}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewFile}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md transition-all",
              "bg-sidebar-primary/10 text-sidebar-primary",
              "hover:bg-sidebar-primary/20 hover:scale-105",
              "active:scale-95 flex-1 justify-center"
            )}
            title="Create new file"
          >
            <SquarePen className="h-4 w-4" />
          </button>
          <button
            onClick={onNewFolder}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md transition-all",
              "bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground",
              "hover:scale-105 active:scale-95",
              "flex-1 justify-center"
            )}
            title="Create new folder"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export function TreeLeftSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { setOpen, isMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  // Handle null pathname by providing a fallback
  const safePathname = pathname ?? "/";
  const activeItem = data.navMain.find((item) =>
    safePathname.startsWith(item.href)
  );

  const { user } = useAuth();

  // Reference to TreeView component for calling its methods
  const treeViewRef = React.useRef<any>(null);

  // Quick action handlers that interact with TreeView
  const handleNewFile = React.useCallback(() => {
    console.log("Creating new file...");
    // The TreeView component will handle this internally via props
  }, []);

  const handleNewFolder = React.useCallback(() => {
    console.log("Creating new folder...");
    // The TreeView component will handle this internally via props
  }, []);

  const handleToggleSearch = React.useCallback(() => {
    console.log("Toggle search...");
    // Add your search toggle logic here
  }, []);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* First Sidebar (Icon-based) */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r border-sidebar-border"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="h-10 md:h-8 md:p-0 px-2"
                aria-label=""
              >
                <button
                  onClick={() => {
                    if (isMobile) setOpen(false);
                    router.push("/");
                  }}
                  className="flex w-full items-center gap-2 group"
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-full shrink-0  transition-transform">
                    <BirdIcon className="size-5 transition-all group-hover:rotate-12" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span className="truncate font-medium">
                      Sugureta Engineer
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      Dashboard
                    </span>
                  </div>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <NavMenu
                navItems={data.navMain}
                activePath={activeItem?.href || "/"}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Second Sidebar (Tree view content) */}
      <Sidebar
        collapsible="none"
        className="text-sm w-full md:w-[calc(var(--sidebar-width-content)+1px)] flex flex-col"
      >
        {/* Enhanced Header with Quick Actions */}
        <EnhancedSidebarHeader
          title={activeItem?.title || "Overview"}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onToggleSearch={handleToggleSearch}
        />

        {/* Tree View Content - Pass active section to TreeView */}
        <ScrollArea className="flex-1 overflow-hidden w-[256px] ">
          <TreeView
            showQuickActions={false}
            activeSection={activeItem?.href || "/"}
          />
        </ScrollArea>
      </Sidebar>
    </Sidebar>
  );
}
