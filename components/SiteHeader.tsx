// components/SiteHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
// --- Shadcn Breadcrumb Imports ---
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// --- Component Imports ---
import CreateButton from "./button-collection/CreateButton";
import NotificationButton from "./button-collection/NotificationButton";
import SearchButton from "./button-collection/SearchButton";
import ThemeToggleButton from "./button-collection/ThemeToggleButton";
import { NavUser } from "./NavUser";
import { LanguageToggleButton } from "./button-collection/LanguageSwitcherButton";

// --- Utility Functions and Types ---

// Utility function to format breadcrumb segments
const formatSegment = (segment: string) =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// Type alias for use in the Breadcrumb component
type BreadcrumbItemType = {
  segment: string;
  path: string;
  isLast: boolean;
};

// --- Shadcn BreadcrumbNav Component (Fixed Spacing) ---

const ShadcnBreadcrumbNav = ({ items }: { items: BreadcrumbItemType[] }) => {
  const router = useRouter();

  if (items.length === 0) {
    return null;
  }

  const MAX_VISIBLE_SEGMENTS = 2;
  const showEllipsis = items.length > MAX_VISIBLE_SEGMENTS;

  const firstVisibleIndex = 0;
  const lastVisibleIndex = items.length - 1;
  const secondLastVisibleIndex = items.length - 2;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = item.isLast;
          const isFirst = index === firstVisibleIndex;
          const isCollapsed =
            index > firstVisibleIndex &&
            index < secondLastVisibleIndex &&
            showEllipsis;

          if (isCollapsed) {
            if (index === 1) {
              const collapsedItems = items.slice(1, items.length - 1);

              return (
                <div key="ellipsis-dropdown" className="flex items-center">
                  {/* FIX: Add spacing before the ellipsis dropdown */}
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1">
                        <BreadcrumbEllipsis className="size-2" />
                        <span className="sr-only">Toggle menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {collapsedItems.map((collapsedItem) => (
                          <DropdownMenuItem
                            key={collapsedItem.path}
                            onClick={() => router.push(collapsedItem.path)}
                          >
                            {formatSegment(collapsedItem.segment)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                </div>
              );
            }
            return null;
          }

          return (
            <div key={item.path} className="flex items-center">
              {/* FIX: Apply explicit horizontal margin (mx-2) to the separator */}
              {!isFirst && <BreadcrumbSeparator className="mx-2" />}

              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{formatSegment(item.segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.path}>{formatSegment(item.segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

// --- SiteHeader Main Component ---

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  const userData = {
    name: user?.user_metadata?.name || "Guest",
    email: user?.email || "",
    avatar: user?.user_metadata?.avatar_url || "",
  };

  // Generate breadcrumb items
  const breadcrumbItems: BreadcrumbItemType[] = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, array) => {
      // Reconstruct the path for each segment
      const path = `/${array.slice(0, index + 1).join("/")}`;
      return { segment, path, isLast: index === array.length - 1 };
    });

  return (
    <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-4 border-b bg-background/95 px-4 transition-all ease-linear supports-[backdrop-filter]:backdrop-blur-sm">
      <div className="flex w-full items-center justify-between gap-4">
        {/* LEFT SECTION: Sidebar Trigger */}
        <SidebarTrigger />

        {/* CENTER SECTION: Breadcrumbs (Using Shadcn UI Components) */}
        <div className="flex-1 min-w-0 flex items-center">
          <ShadcnBreadcrumbNav items={breadcrumbItems} />
        </div>

        {/* RIGHT SECTION: Search and User Actions */}
        <div className="flex items-center space-x-2 text-sm font-medium">
          <SearchButton />

          {/* User Utility Buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <CreateButton />
                <NotificationButton />
                <NavUser user={userData} />
              </>
            ) : (
              <>
                <ThemeToggleButton />
                <LanguageToggleButton />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/signin")}
                >
                  <span className="text-sm">{t("auth.signIn")}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
