"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  Check,
  Omega,
  Pi,
  Sigma,
} from "lucide-react";
import { Button } from "@/components/ui/button"; 
import { toast } from "sonner"; // Assuming toast is available for feedback

// Define languages structure
const languages = [
  { code: "en", name: "English", icon: Omega },
  { code: "mn", name: "Монгол", icon: Sigma },
  { code: "ja", name: "日本語", icon: Pi },
] as const;

export function LanguageToggleButton() {
  const { language, setLanguage } = useLanguage();
  const currentLanguage = languages.find((lang) => lang.code === language);
  const CurrentIcon = currentLanguage?.icon || Omega; // Default to Omega (English)

  const handleLanguageChange = (code: "en" | "mn" | "ja") => {
    setLanguage(code);
    const selectedLang =
      languages.find((lang) => lang.code === code)?.name || code;
    toast.success("Language Changed", {
      description: `Language set to ${selectedLang}.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-8 hover:bg-accent hover:text-accent-foreground transition-colors"
          )}
          aria-label={`Current language: ${currentLanguage?.name || 'English'}`}
        >
          <CurrentIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          {languages.map((langOption) => {
            const Icon = langOption.icon;
            const isSelected = language === langOption.code;

            return (
              <DropdownMenuItem
                key={langOption.code}
                onClick={() => handleLanguageChange(langOption.code)}
                className="cursor-pointer flex items-center justify-between px-2 py-2"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {langOption.name}
                  </span>
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