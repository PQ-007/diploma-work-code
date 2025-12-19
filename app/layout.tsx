"use client";

import { LeftSidebar } from "@/components/sidebar-collection/Left/LeftSidebar";
import { SiteHeader } from "@/components/SiteHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Basic layout for initial load
  if (!mounted) {
    return (
      <html lang="en" className={cn("dark h-full")} suppressHydrationWarning>
        <body className={cn(inter.className, "h-full overflow-hidden")}>
          <LanguageProvider>
            <AuthProvider>
              <div className="flex h-full w-full">
                <div className="flex-1 flex flex-col">
                  <div className="h-12 border-b bg-background"></div>
                  <main className="flex-1 overflow-y-auto">
                    <div className="h-full p-4 md:p-6 lg:p-8">{children}</div>
                  </main>
                </div>
              </div>
            </AuthProvider>
          </LanguageProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={cn("dark h-full")} suppressHydrationWarning>
      <body className={cn(inter.className, "h-full overflow-hidden")}>
        <LanguageProvider>
          <AuthProvider>
            <SidebarProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
                disableTransitionOnChange
                storageKey="theme-preference"
              >
                <div className="flex h-full w-full">
                  {/* Left Sidebar - Hidden on mobile unless opened */}
                  <div className="hidden md:block">
                    <LeftSidebar />
                  </div>

                  {/* Mobile Left Sidebar Overlay */}
                  <div className="md:hidden">
                    <LeftSidebar />
                  </div>

                  {/* Main Content Area */}
                  <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
                    <SiteHeader />

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto relative">
                      <div className="h-full p-4 md:p-6 lg:p-8">{children}</div>
                    </main>
                    <Toaster />
                  </div>
                </div>
              </ThemeProvider>
            </SidebarProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
