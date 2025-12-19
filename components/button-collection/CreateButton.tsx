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
  ChevronDown,
  Code,
  FileText,
  MessageSquare,
  MousePointerClick,
  Plus,
  SwatchBook,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

const CreateButton = () => {
  const router = useRouter();

  // Defined action handler to show intended route/action (for demonstration)
  const handleAction = (label: string, path?: string) => {
    console.log(`Action: Create ${label}`);
    if (path) {
      router.push(path);
    }
    // You'd typically close the dropdown here if needed, but the library handles it.
  };

  const createOptions = [
    {
      category: "Content",
      items: [
        {
          icon: FileText,
          label: "Blog",
          description: "Write a new blog post",
          action: () => handleAction("Blog", "/create/blog"),
        },
        {
          icon: SwatchBook,
          label: "Flashcard Deck",
          description: "Make a new flashcard deck",
          action: () => handleAction("Flashcard Deck", "/create/flashcards"),
        },
      ],
    },
    {
      category: "Collaboration",
      items: [
        {
          icon: Trophy,
          label: "Competition",
          description: "Organize a new competition",
          action: () => handleAction("Competition", "/create/competition"),
        },
        {
          icon: MessageSquare,
          label: "Discussion",
          description: "Start a discussion thread",
          action: () => handleAction("Discussion", "/create/discussion"),
        },
      ],
    },
    {
      category: "Development",
      items: [
        {
          icon: Code,
          label: "Project",
          description: "Create new coding project",
          action: () => handleAction("Project", "/create/project"),
        },
      ],
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* FIX: Using 'default' variant and explicit sizing for a strong call to action */}
        <Button
          // Use 'default' variant for better visibility (or 'primary' if customized)
          variant="default" 
          size="default" 
          className={cn(
            "h-9 px-3 rounded-md transition-colors", // Standard button sizing
            "flex items-center gap-1.5" // Ensure proper spacing for icons
          )}
          aria-label="Create new content or activity"
        >
          {/* Main Icon */}
          
          <span className="font-medium">Create</span>
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