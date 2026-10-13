"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ResolvedHeader } from "@/components/header-collection/SiteHeader";
import { BottomNav } from "@/components/navigation/BottomNav";
import { LeftSidebar } from "@/components/sidebar-collection/Left/LeftSidebar";

const AUTH_FULLSCREEN_PREFIXES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/auth/reset-password",
];

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";

  if (AUTH_FULLSCREEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return <div className="h-full w-full overflow-auto">{children}</div>;
  }

  // The editor is a full-height workspace with its own header.
  const isEditor = pathname.startsWith("/article/create");

  return (
    <div className="flex h-full w-full">
      <LeftSidebar />

      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <ResolvedHeader />
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden">
          <div
            className={
              isEditor
                ? "h-full"
                : "px-4 pt-5 pb-bottom-nav sm:px-6 md:pt-8 lg:px-8"
            }
          >
            {children}
          </div>
        </main>
      </div>

      {!isEditor && <BottomNav />}
    </div>
  );
}
