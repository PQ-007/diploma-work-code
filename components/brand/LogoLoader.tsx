"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LogoMark } from "./Logo";

/**
 * Loading state: the logo mark spinning (accelerate → two turns → ease out → settle).
 * `fullscreen` centers it in the viewport without blocking the UI;
 * otherwise it centers inside its container (dialogs, sections).
 */
export function LogoLoader({ fullscreen = true, className }: { fullscreen?: boolean; className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center animate-in fade-in duration-300",
        fullscreen ? "pointer-events-none fixed inset-0 z-50" : "py-20",
        className,
      )}
    >
      <LogoMark className={cn("animate-logo-spin", fullscreen ? "size-14" : "size-10")} />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}
