"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "./providers/QueryProvider";
import type { Language } from "@/lib/language";

export function Providers({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  return (
    <QueryProvider>
      <LanguageProvider initialLanguage={initialLanguage}>
        <AuthProvider>
          <SidebarProvider defaultOpen>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
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
