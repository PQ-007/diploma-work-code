import "./globals.css";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { LeftSidebar } from "@/components/sidebar-collection/Left/LeftSidebar";
import { ResolvedHeader } from "@/components/header-collection/SiteHeader";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark h-full")} suppressHydrationWarning>
      <body className={cn(inter.className, "h-full overflow-hidden")}>
        <Providers>
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
                <div className="h-full p-4 md:p-6 lg:p-8">{children}</div>
              </main>
              <Toaster />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
