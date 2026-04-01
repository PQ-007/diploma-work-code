"use client";

import React, { useState, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TagSuggestion {
  id: number;
  name: string;
  similarity: number;
  similarityType: "exact" | "fuzzy" | "semantic" | "popular";
  usageCount: number;
}

interface TagInputWithSuggestionsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInputWithSuggestions({
  tags,
  onTagsChange,
  maxTags = 5,
  placeholder = "Add tags (press Enter, max 5)...",
  disabled = false,
}: TagInputWithSuggestionsProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced API call for tag suggestions (exact same logic as SmartTagInput)
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

  // Handle input change (exact same logic as SmartTagInput)
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

  // Add tag (exact same logic as SmartTagInput)
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

  // Handle keyboard navigation (exact same logic as SmartTagInput)
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

  // Hide suggestions when clicking outside
  const handleBlur = () => {
    // Small delay to allow for suggestion clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      {/* Keep your preferred inline tag display - exact same styles */}
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-2 px-2 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-sm"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="flex items-center rounded-full transition-colors hover:bg-white/20 px-1 py-0.5"
              aria-label={t("articles.create.removeTag", { tag })}
            >
              <X size={14} />
            </button>
          </span>
        ))}

        {/* Enhanced input with suggestions - keeping your exact same styles */}
        <div className="relative flex-1 min-w-[220px]">
          <input
            ref={inputRef}
            type="text"
            className="w-full px-3 py-2.5 bg-background border border-border rounded-full text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={
              tags.length >= maxTags
                ? t("articles.create.maxTagsReached")
                : placeholder
            }
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => {
              if (inputValue.trim()) {
                setShowSuggestions(true);
              }
            }}
            disabled={disabled || tags.length >= maxTags}
          />

          {/* Qiita-style dropdown - keep your preferred styling */}
          {showSuggestions && (suggestions.length > 0 || isLoading) && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {t("articles.create.loadingSuggestions")}
                </div>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {t("articles.create.noTagsFound")}
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    onClick={() => addTag(suggestion.name)}
                    className={`px-4 py-2.5 cursor-pointer text-sm flex items-center justify-between transition-colors ${
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <span className="font-medium truncate">
                      {suggestion.name}
                    </span>
                    {suggestion.usageCount > 0 && (
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        ({suggestion.usageCount})
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Debounce utility function (exact same as SmartTagInput)
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
