"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ThemeToggleButton() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const themes = useMemo(
    () => [
      {
        name: t("themeToggle.light"),
        value: "light",
        icon: Sun,
        description: t("themeToggle.lightDescription"),
      },
      {
        name: t("themeToggle.dark"),
        value: "dark",
        icon: Moon,
        description: t("themeToggle.darkDescription"),
      },
      {
        name: t("themeToggle.system"),
        value: "system",
        icon: Monitor,
        description: t("themeToggle.systemDescription"),
      },
    ],
    [t],
  );

  const handleThemeChange = (newTheme: string) => setTheme(newTheme);

  // Only decide the real icon after mount
  const CurrentIcon = useMemo(() => {
    if (!mounted) return Monitor; // stable for SSR + first client render
    if (theme === "system") return Monitor;
    return resolvedTheme === "dark" ? Moon : Sun;
  }, [mounted, theme, resolvedTheme]);

  // Stable aria-label until mounted
  const ariaLabel = mounted
    ? t("themeToggle.currentTheme", { theme: theme ?? "system" })
    : t("themeToggle.theme");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 hover:bg-accent hover:text-accent-foreground transition-colors",
          )}
          aria-label={ariaLabel}
        >
          <CurrentIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            // Don’t “select” anything until mounted, or you can still mismatch checkmarks
            const isSelected = mounted && theme === themeOption.value;

            return (
              <DropdownMenuItem
                key={themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                className="cursor-pointer flex items-center justify-between px-2 py-2"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {themeOption.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {themeOption.description}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
