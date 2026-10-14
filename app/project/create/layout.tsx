import { Suspense } from "react";
import { LogoLoader } from "@/components/brand/LogoLoader";

export default function ProjectCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<LogoLoader />}>{children}</Suspense>;
}
