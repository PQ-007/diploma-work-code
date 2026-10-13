"use client";

import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

const languages = [
  { code: "mn", name: "Монгол" },
  { code: "ja", name: "日本語" },
  { code: "en", name: "English" },
] as const;

/** Interface language: icon + current code in the header, native names in the menu. */
export function LanguageToggleButton() {
  const { language, setLanguage } = useLanguage();
  const current = languages.find((l) => l.code === language) ?? languages[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 rounded-full px-2.5 text-muted-foreground"
          aria-label={`Language: ${current.name}`}
        >
          <Languages />
          <span className="font-mono text-xs font-semibold uppercase">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="cursor-pointer justify-between"
          >
            {lang.name}
            {language === lang.code && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
