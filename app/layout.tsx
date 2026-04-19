import "./globals.css";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { Inter, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { AppChrome } from "@/components/AppChrome";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
});
const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-serif-jp",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark h-full")} suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          notoSansJP.variable,
          notoSerifJP.variable,
          "h-full overflow-hidden",
        )}
      >
        <Providers>
          <AppChrome>{children}</AppChrome>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
