import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, resolveLanguage } from "@/lib/language";
import "./globals.css";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { AppChrome } from "@/components/AppChrome";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const description =
  "A multilingual (mn / ja / en) community for technical articles, student projects, a shared dictionary of terms, and discussions.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://futurehub.works"),
  title: { default: "FutureHub", template: "%s · FutureHub" },
  description,
  applicationName: "FutureHub",
  openGraph: {
    type: "website",
    siteName: "FutureHub",
    title: "FutureHub — Read, build, define, discuss.",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "FutureHub — Read, build, define, discuss.",
    description,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render in the visitor's language on the server so hydration matches.
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const language = resolveLanguage(cookieStore.get(LANG_COOKIE)?.value, headerList.get("accept-language"));

  return (
    <html lang={language} className="h-full" suppressHydrationWarning>
      <body className={cn(inter.className, "h-full overflow-hidden")}>
        <Providers initialLanguage={language}>
          <AppChrome>{children}</AppChrome>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
