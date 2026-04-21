"use client";

import { LeftSidebar } from "@/components/sidebar-collection/Left/LeftSidebar";
import { RightSidebar } from "@/components/sidebar-collection/Right/RightSidebar";
import { ResolvedHeader } from "@/components/header-collection/SiteHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface AppChromeProps {
  children: ReactNode;
}

const AUTH_FULLSCREEN_PREFIXES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/auth/reset-password",
];

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isAuthFullscreen = AUTH_FULLSCREEN_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  if (isAuthFullscreen) {
    return <div className="h-full w-full overflow-auto">{children}</div>;
  }

  return (
    <div className="flex h-full w-full">
      <div className="hidden md:block">
        <LeftSidebar />
      </div>

      <div className="md:hidden">
        <LeftSidebar />
      </div>

      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        <ResolvedHeader />
        <main className="flex-1 overflow-y-auto relative">
          <div className="h-full py-4 md:py-6 lg:py-8 px-[clamp(10px,1.8vw,28px)]">
            {children}
          </div>
        </main>
      </div>

      {/* <div className="hidden md:block">
        <SidebarProvider defaultOpen={false}>
          <RightSidebar />
        </SidebarProvider>
      </div> */}
    </div>
  );
}
