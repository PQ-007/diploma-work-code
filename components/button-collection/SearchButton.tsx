"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Search,
  Clock,
  Settings,
  FileText,
  Users,
  Hash,
  Home,
  User,
  Calendar,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SearchButton = () => {
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    "React components",
    "Next.js routing",
    "TypeScript interfaces",
    "Component library",
    "API documentation",
  ]);

  // Use useEffect for keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const addToRecentSearches = (search: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== search);
      return [search, ...filtered].slice(0, 5);
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className={cn(
          "size-7 hover:bg-accent hover:text-accent-foreground transition-colors",
        )}
        aria-label="Search (⌘K)"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search, index) => (
                <CommandItem
                  key={`recent-${index}`}
                  onSelect={() => {
                    runCommand(() => {
                      addToRecentSearches(search);
                    });
                  }}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span>{search}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => null)}>
              <Home className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => null)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => null)}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Calendar</span>
              <CommandShortcut>⌘C</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Search Categories */}
          <CommandGroup heading="Search In">
            <CommandItem onSelect={() => runCommand(() => null)}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Search Documents</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => null)}>
              <Users className="mr-2 h-4 w-4" />
              <span>Search People</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => null)}>
              <Hash className="mr-2 h-4 w-4" />
              <span>Search Tags</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Settings */}
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => null)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Search Settings</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => null)}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchButton;
