"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagSuggestion {
  id: number;
  name: string;
  similarity: number;
  similarityType: "exact" | "fuzzy" | "semantic" | "popular";
  usageCount: number;
}

interface SmartTagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SmartTagInput({
  tags,
  onTagsChange,
  maxTags = 5,
  placeholder = "Add tags (press Enter, max 5)...",
  className,
  disabled = false,
}: SmartTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced API call for tag suggestions
  const debouncedFetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length === 0) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/tags/suggestions?q=${encodeURIComponent(query)}&limit=8`,
        );
        if (response.ok) {
          const data = await response.json();
          // Filter out tags that are already selected
          const filteredSuggestions = data.suggestions.filter(
            (suggestion: TagSuggestion) => !tags.includes(suggestion.name),
          );
          setSuggestions(filteredSuggestions);
        }
      } catch (error) {
        console.error("Error fetching tag suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [tags],
  );

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSelectedIndex(-1);

    if (value.trim()) {
      setShowSuggestions(true);
      debouncedFetchSuggestions(value.trim());
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Add tag (either from suggestion or manual input)
  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim();

    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onTagsChange([...tags, trimmedTag]);
    }

    setInputValue("");
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        // Add selected suggestion
        addTag(suggestions[selectedIndex].name);
      } else if (inputValue.trim()) {
        // Add manual input
        addTag(inputValue.trim());
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
      return;
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags[tags.length - 1]);
      return;
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="px-2 py-1 text-xs font-normal bg-muted/50 hover:bg-muted/70 transition-colors flex items-center gap-1"
          >
            {tag}
            {!disabled && (
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-destructive transition-colors"
                aria-label={`Remove ${tag} tag`}
              >
                <X size={12} />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Input Field with Command */}
      <div className="relative">
        <Command
          className="relative overflow-visible bg-transparent border-none"
          shouldFilter={false}
        >
          <CommandInput
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue.trim()) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow for clicks
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={
              tags.length >= maxTags ? "Maximum tags reached" : placeholder
            }
            disabled={disabled || tags.length >= maxTags}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || isLoading) && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1">
              <CommandList className="max-h-48 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                {isLoading ? (
                  <CommandEmpty className="py-3 text-sm text-muted-foreground">
                    Loading...
                  </CommandEmpty>
                ) : suggestions.length === 0 ? (
                  <CommandEmpty className="py-3 text-sm text-muted-foreground">
                    No suggestions found
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={suggestion.id}
                        value={suggestion.name}
                        onSelect={() => addTag(suggestion.name)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 cursor-pointer text-sm",
                          "hover:bg-accent hover:text-accent-foreground",
                          index === selectedIndex &&
                            "bg-accent text-accent-foreground",
                        )}
                      >
                        <span className="truncate">{suggestion.name}</span>
                        {suggestion.usageCount > 0 && (
                          <span className="text-xs text-muted-foreground ml-2 shrink-0">
                            ({suggestion.usageCount})
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </div>
          )}
        </Command>
      </div>

      {/* Helper Text */}
      <div className="mt-1 text-xs text-muted-foreground">
        {tags.length}/{maxTags}
      </div>
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
