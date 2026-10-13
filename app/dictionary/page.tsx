"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BookOpen, FileEdit, LayoutGrid, List, Plus } from "lucide-react";
import { TermCard } from "@/components/cards/TermCard";
import { Chip, ChipRow } from "@/components/common/Chip";
import { Pagination } from "@/components/common/Pagination";
import { SearchInput } from "@/components/common/SearchInput";
import { EmptyState } from "@/components/common/States";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// --- Types ---
interface DictionaryEntry {
  id: number;
  term: string;
  slug: string;
  reading: string | null;
  language_code: string;
  definition: string;
  status: string;
  views: number;
  saves: number;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    display_name: string;
    user_name: string;
    avatar_url: string;
  };
  tags: string[];
  saved: boolean;
  translation_languages: string[];
  display_term: string;
  display_definition: string;
}

interface SearchSuggestion {
  id: number;
  term: string;
  slug: string;
  language_code: string;
  similarity_score: number;
}

const letterTabs = [
  "ALL",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const languageFilters = [
  { value: "mn", label: "MN" },
  { value: "ja", label: "JA" },
  { value: "en", label: "EN" },
];

const sortOptions = [
  { value: "relevance", labelKey: "dictionary.sort.relevance" },
  { value: "newest", labelKey: "dictionary.sort.newest" },
  { value: "most_saved", labelKey: "dictionary.sort.mostSaved" },
];

export default function DictionaryPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [activeLetter, setActiveLetter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>(language);
  const [sortBy, setSortBy] = useState("relevance");
  const [statusFilter, setStatusFilter] = useState("approved");
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const limit = 18;

  // Sync language filter when site language changes
  useEffect(() => {
    setLanguageFilter(language);
    setPage(1);
  }, [language]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: sortBy,
        status: statusFilter,
      });
      if (languageFilter) params.set("language", languageFilter);
      if (activeLetter !== "ALL" && !debouncedSearch)
        params.set("letter", activeLetter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/dictionary?${params}`);
      const data = await res.json();
      setEntries(data.items || []);
      setTotalEntries(data.total || 0);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortBy,
    statusFilter,
    languageFilter,
    activeLetter,
    debouncedSearch,
  ]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Fetch search suggestions
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `/api/dictionary/search?q=${encodeURIComponent(debouncedSearch)}&limit=5`,
        );
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [debouncedSearch]);

  // Toggle save
  const handleToggleSave = async (entryId: number, currentlySaved: boolean) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, saved: !currentlySaved } : e,
      ),
    );
    try {
      await fetch("/api/dictionary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
    } catch {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, saved: currentlySaved } : e,
        ),
      );
    }
  };

  const totalPages = Math.ceil(totalEntries / limit);
  const isDrafts = statusFilter === "my_drafts";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0 space-y-4">
        <PageHeader
          className="!mb-2"
          title={t("dictionary.title")}
          subtitle={t("dictionary.subtitle")}
          actions={
            user && (
              <Button asChild>
                <Link href="/dictionary/create">
                  <Plus />
                  <span className="hidden sm:inline">{t("dictionary.addNewTerm")}</span>
                </Link>
              </Button>
            )
          }
        />

        {/* Search + suggestions */}
        <div className="relative">
          <SearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={t("dictionary.searchPlaceholder")}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border bg-popover p-1 shadow-md">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/dictionary/${s.slug}`}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    {s.term}
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">{s.language_code}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Toolbar: language · sort · drafts · view */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-8 items-center gap-0.5 rounded-lg bg-muted p-0.5" role="group" aria-label="Language">
            {languageFilters.map((lf) => (
              <button
                key={lf.value}
                type="button"
                aria-pressed={languageFilter === lf.value}
                onClick={() => {
                  setLanguageFilter(lf.value);
                  setPage(1);
                }}
                className={cn(
                  "h-7 rounded-md px-2.5 font-mono text-xs font-semibold transition-colors",
                  languageFilter === lf.value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {lf.label}
              </button>
            ))}
          </div>

          <Select
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="w-auto min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {user && (
            <Chip
              selected={isDrafts}
              onClick={() => {
                setStatusFilter(isDrafts ? "approved" : "my_drafts");
                setPage(1);
              }}
            >
              <FileEdit />
              {t("dictionary.myDrafts")}
            </Chip>
          )}

          <div className="ml-auto inline-flex h-8 items-center gap-0.5 rounded-lg bg-muted p-0.5" role="group" aria-label="View">
            {([["grid", LayoutGrid], ["list", List]] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                type="button"
                aria-label={mode}
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  viewMode === mode ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>

        {/* A–Z */}
        {!debouncedSearch && (
          <ChipRow label="Alphabet" className="!gap-1">
            {letterTabs.map((letter) => (
              <button
                key={letter}
                type="button"
                aria-pressed={activeLetter === letter}
                onClick={() => {
                  setActiveLetter(letter);
                  setPage(1);
                }}
                className={cn(
                  "h-8 min-w-8 shrink-0 rounded-md px-2 text-xs font-semibold transition-colors",
                  activeLetter === letter
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {letter === "ALL" ? t("common.all") : letter}
              </button>
            ))}
          </ChipRow>
        )}

        {!loading && (
          <p className="text-sm text-muted-foreground">{t("dictionary.termCount", { count: totalEntries })}</p>
        )}

        {/* Results */}
        {loading ? (
          <div className={cn("grid gap-3", viewMode === "grid" && "sm:grid-cols-2 lg:grid-cols-3")}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={cn("rounded-xl", viewMode === "grid" ? "h-40" : "h-16")} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={
              debouncedSearch
                ? t("dictionary.noEntriesForSearch", { search: debouncedSearch })
                : isDrafts
                  ? t("dictionary.noDraftsYet")
                  : t("dictionary.noEntriesForLetter")
            }
            action={
              user && (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/dictionary/create">
                    <Plus />
                    {t("dictionary.createFirstEntry")}
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <div className={cn("grid gap-3", viewMode === "grid" && "sm:grid-cols-2 lg:grid-cols-3")}>
            {entries.map((entry) => (
              <TermCard
                key={entry.id}
                entry={entry}
                layout={viewMode === "grid" ? "grid" : "row"}
                onToggleSave={user ? handleToggleSave : undefined}
              />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* Sidebar */}
      <aside className="hidden space-y-4 xl:block xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <h2 className="text-sm font-semibold">{t("dictionary.stats")}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-muted/60 py-2.5">
              <dt className="text-[11px] text-muted-foreground">{t("dictionary.statsTotalEntries")}</dt>
              <dd className="text-lg font-semibold tabular-nums">{totalEntries}</dd>
            </div>
            <div className="rounded-lg bg-muted/60 py-2.5">
              <dt className="text-[11px] text-muted-foreground">{t("dictionary.statsLanguages")}</dt>
              <dd className="text-lg font-semibold tabular-nums">{languageFilters.length}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
          <BookOpen className="mx-auto size-6 text-primary" />
          <h2 className="mt-2 text-sm font-semibold">{t("dictionary.cantFindTerm")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("dictionary.cantFindTermDesc")}</p>
          <Button asChild variant="secondary" size="sm" className="mt-3">
            <Link href="/dictionary/create">
              <Plus />
              {t("dictionary.addNewTerm")}
            </Link>
          </Button>
        </div>
      </aside>
    </div>
  );
}
