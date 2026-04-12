"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Bookmark,
  ExternalLink,
  LayoutGrid,
  List,
  Clock,
  Flame,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileEdit,
  BookOpen,
} from "lucide-react";

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

// --- Status badge helper ---
function StatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: Record<string, string>;
}) {
  const config: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    approved: {
      label: labels.approved,
      className:
        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-1",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    pending_review: {
      label: labels.pending_review,
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    draft: {
      label: labels.draft,
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      icon: <FileEdit className="h-3 w-3 mr-1" />,
    },
    rejected: {
      label: labels.rejected,
      className: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
    },
  };
  const c = config[status] || config.draft;
  return (
    <Badge className={`${c.className} text-[10px]`}>
      {c.icon}
      {c.label}
    </Badge>
  );
}

function LanguageBadge({ code }: { code: string }) {
  const labels: Record<string, string> = { mn: "MN", ja: "JA", en: "EN" };
  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
      {labels[code] || code.toUpperCase()}
    </Badge>
  );
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
  const statusLabels = {
    approved: t("dictionary.status.approved"),
    pending_review: t("dictionary.status.pending_review"),
    draft: t("dictionary.status.draft"),
    rejected: t("dictionary.status.rejected"),
  };
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-6xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t("dictionary.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("dictionary.subtitle")}
            </p>
          </div>
          {user && (
            <Link href="/dictionary/create">
              <Button size="sm" className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {t("dictionary.addNewTerm")}
              </Button>
            </Link>
          )}
        </div>

        <div className="flex gap-8 xl:gap-12 justify-center">
          {/* Main Content */}
          <div className="flex-1 max-w-7xl space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("dictionary.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-9 h-10"
              />
              {/* Autocomplete suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 border-border/40 shadow-lg">
                  <CardContent className="p-0">
                    {suggestions.map((s) => (
                      <Link
                        key={s.id}
                        href={`/dictionary/${s.slug}`}
                        className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm">{s.term}</span>
                        <LanguageBadge code={s.language_code} />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Language filter */}
              <div className="flex items-center gap-1">
                {languageFilters.map((lf) => (
                  <Button
                    key={lf.value}
                    variant={
                      languageFilter === lf.value ? "secondary" : "ghost"
                    }
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => {
                      setLanguageFilter(lf.value);
                      setPage(1);
                    }}
                  >
                    {lf.label}
                  </Button>
                ))}
              </div>

              <div className="h-4 w-px bg-border" />

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="h-7 px-2 text-xs bg-muted/40 rounded-md border border-border/40 text-foreground"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>

              {/* My Drafts toggle */}
              {user && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <Button
                    variant={
                      statusFilter === "my_drafts" ? "secondary" : "ghost"
                    }
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => {
                      setStatusFilter(
                        statusFilter === "my_drafts" ? "approved" : "my_drafts",
                      );
                      setPage(1);
                    }}
                  >
                    <FileEdit className="h-3 w-3 mr-1" />
                    {t("dictionary.myDrafts")}
                  </Button>
                </>
              )}

              {/* View mode */}
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Letter Tabs */}
            <Tabs
              value={activeLetter}
              onValueChange={(val) => {
                setActiveLetter(val);
                setSearchQuery("");
                setPage(1);
              }}
            >
              <TabsList className="h-auto bg-muted/40 backdrop-blur-sm flex-wrap gap-0.5 p-1">
                {letterTabs.map((letter) => (
                  <TabsTrigger
                    key={letter}
                    value={letter}
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-2 py-1 text-xs font-medium"
                  >
                    {letter}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Entries Grid / List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {debouncedSearch
                    ? t("dictionary.noEntriesForSearch", {
                        search: debouncedSearch,
                      })
                    : statusFilter === "my_drafts"
                      ? t("dictionary.noDraftsYet")
                      : t("dictionary.noEntriesForLetter")}
                </p>
                {user && (
                  <Link href="/dictionary/create">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs mt-2"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      {t("dictionary.createFirstEntry")}
                    </Button>
                  </Link>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entries.map((entry) => (
                  <Link key={entry.id} href={`/dictionary/${entry.slug}`}>
                    <div className="border-border/40 hover:shadow-sm transition-all duration-200 cursor-pointer group h-full bg-card rounded-md p-4 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold group-hover:text-foreground/90 transition-colors">
                            {entry.display_term || entry.term}
                          </h3>
                          {entry.reading && (
                            <span className="text-xs text-muted-foreground">
                              ({entry.reading})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                          <LanguageBadge code={entry.language_code} />
                          {(entry.translation_languages || []).map((lang) => (
                            <LanguageBadge key={lang} code={lang} />
                          ))}
                          <StatusBadge
                            status={entry.status}
                            labels={statusLabels}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {entry.display_definition || entry.definition}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] font-normal px-1.5 py-0"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>
                            {t("dictionary.views", { count: entry.views })}
                          </span>
                          {user && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleToggleSave(entry.id, entry.saved);
                              }}
                              className="hover:text-foreground transition-colors"
                            >
                              <Bookmark
                                className={`h-3 w-3 ${entry.saved ? "fill-current" : ""}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={entry.author.avatar_url} />
                          <AvatarFallback className="text-[8px]">
                            {entry.author.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-muted-foreground">
                          {entry.author.display_name}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <Link key={entry.id} href={`/dictionary/${entry.slug}`}>
                    <Card className="border-border/40 hover:shadow-sm transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-3 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold group-hover:text-foreground/90 transition-colors">
                              {entry.display_term || entry.term}
                            </h3>
                            {entry.reading && (
                              <span className="text-xs text-muted-foreground">
                                ({entry.reading})
                              </span>
                            )}
                            <LanguageBadge code={entry.language_code} />
                            {(entry.translation_languages || []).map((lang) => (
                              <LanguageBadge key={lang} code={lang} />
                            ))}
                            <StatusBadge
                              status={entry.status}
                              labels={statusLabels}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 mt-0.5">
                            {entry.display_definition || entry.definition}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-[10px] text-muted-foreground">
                            {t("dictionary.views", { count: entry.views })}
                          </span>
                          {user && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleToggleSave(entry.id, entry.saved);
                              }}
                            >
                              <Bookmark
                                className={`h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors ${entry.saved ? "fill-current" : ""}`}
                              />
                            </button>
                          )}
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  {t("dictionary.pagination.previous")}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {t("dictionary.pagination.pageOf", {
                    page,
                    totalPages,
                  })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  {t("dictionary.pagination.next")}
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[320px] space-y-6 sticky top-8 h-fit">
            {/* Popular Topics */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4" />
                {t("dictionary.popularTopics")}
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      "programming",
                      "database",
                      "algorithm",
                      "math",
                      "kanji",
                      "web-dev",
                    ].map((topic) => (
                      <Badge
                        key={topic}
                        variant="secondary"
                        className="text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={() => {
                          setSearchQuery(topic);
                          setPage(1);
                        }}
                      >
                        #{topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <Card className="border-border/40">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">
                  {t("dictionary.stats")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold">{totalEntries}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("dictionary.statsTotalEntries")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">
                      {languageFilters.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("dictionary.statsLanguages")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Can't find the term? */}
            <Card className="border-border/40">
              <CardContent className="p-4 text-center space-y-2">
                <BookOpen className="h-6 w-6 mx-auto text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  {t("dictionary.cantFindTerm")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("dictionary.cantFindTermDesc")}
                </p>
                <Link href="/dictionary/create">
                  <Button size="sm" className="text-xs mt-1">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {t("dictionary.addNewTerm")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
