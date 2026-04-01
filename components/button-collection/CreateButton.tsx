"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Code,
  FileText,
  MessageSquare,
  MousePointerClick,
  SwatchBook,
  Trophy
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {useTranslation} from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const CreateButton = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleAction = (label: string, path?: string) => {
    console.log(`Action: Create ${label}`);
    if (path) {
      router.push(path);
    }
  };

  const createOptions = [
    {
      category: "Content",
      items: [
        {
          icon: FileText,
          label: t("create_button.article"),
          description: t("create_button.article_disc"),
          action: () => handleAction("Blog", "/article/create"),
        },
        {
          icon: SwatchBook,
          label: t("create_button.flashcards"),
          description: t("create_button.flashcards_disc"),
          action: () => handleAction("Flashcard Deck", "/flashcards/create"),
        },
      ],
    },
    {
      category: "Collaboration",
      items: [
        {
          icon: Trophy,
          label: t("create_button.contest"),
          description: t("create_button.contest_disc"),
          action: () => handleAction("Competition", "/competition/create"),
        },
        {
          icon: MessageSquare,
          label: t("create_button.discussions"),
          description: t("create_button.discussions_disc"),
          action: () => handleAction("Discussion", "/discussion/create"),
        },
      ],
    },
    {
      category: "Development",
      items: [
        {
          icon: Code,
          label: t("create_button.project"),
          description: t("create_button.project_disc"),
          action: () => handleAction("Project", "/project/create"),
        },
      ],
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default" 
          size="default" 
          className={cn(
            "h-9 px-3 rounded-md transition-colors",
            "flex items-center gap-1.5" 
          )}
          aria-label="Create new content or activity"
        >
          {/* Main Icon */}
          
          <span className="font-medium">{t("create_button.create")}</span>
          <MousePointerClick/>
          
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-72"
        side="bottom"
        align="end"
        sideOffset={8} // Increased offset slightly for better visual separation
      >
        {/* Categorized Options */}
        {createOptions.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground px-3 py-1 mt-1">
                {category.category}
              </DropdownMenuLabel>
              {category.items.map((item, itemIndex) => (
                <DropdownMenuItem
                  key={itemIndex}
                  onClick={item.action}
                  className="cursor-pointer px-3 py-2 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    {/* FIX: Using a distinct accent background for the icon container */}
                    <div className="w-8 h-8 rounded-md bg-accent/30 flex items-center justify-center group-hover:bg-accent transition-colors text-foreground">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            {/* Separator between categories */}
            {categoryIndex < createOptions.length - 1 && (
              <DropdownMenuSeparator />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateButton;