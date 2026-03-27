"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "./providers/QueryProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
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
              {children}
            </ThemeProvider>
          </SidebarProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryProvider>
  );
}
