"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle, FileText, Flame, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

// --- New Unified System ---
import { useArticles } from "@/lib/hooks/queries/useArticles";
import { ArticleCardWrapper } from "./components/ArticleCardWrapper";

// --- Components Import ---
import {
  ArticleFeedSkeleton,
  ArticlePageSkeleton,
} from "@/app/article/components/ArticleSkeleton";
import ReadingList from "@/components/ReadingList";

const popularTags = [
  { name: "React", count: 128 },
  { name: "TypeScript", count: 96 },
  { name: "Next.js", count: 84 },
  { name: "Python", count: 72 },
  { name: "AI", count: 67 },
  { name: "Rust", count: 54 },
  { name: "System Design", count: 48 },
  { name: "DevOps", count: 41 },
];

const stripMarkdown = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[>*#_\-\[\]\(\)!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const calcReadTime = (body: string) => {
  const words = stripMarkdown(body || "")
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
};

export default function ArticleBrowsePage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [readingList, setReadingList] = useState(new Set<string>());

  // Use React Query hook - automatic caching and state management!
  const {
    data: articles,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useArticles("published", language);

  // Filter articles based on tab and search
  const filteredArticles = (articles || []).filter((item) => {
    // Tab filter
    const matchesTab =
      activeTab === "all" ||
      item.content.tags.some((tag) => tag.toLowerCase().includes(activeTab));

    // Search filter
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.content.title.toLowerCase().includes(q) ||
      (item.content.description?.toLowerCase() || "").includes(q) ||
      item.content.author.displayName.toLowerCase().includes(q) ||
      item.content.tags.some((tag) => tag.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const totalCount = articles?.length || 0;
  const filteredCount = filteredArticles.length;

  // Initial full-page skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="page-shell-wide py-6 lg:py-3">
          <div className="mb-6 max-w-6xl w-full px-3 mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-4 w-56 rounded-md" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <ArticlePageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="page-shell-wide py-6 lg:py-3">
        {/* Page Header */}
        <div className="mb-6 max-w-6xl w-full px-3 mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t("articles.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("articles.subtitle")}
              {totalCount > 0 && (
                <span className="ml-1">
                  &middot; {totalCount} {t("common.published")}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => refetch()}
              disabled={isRefetching}
              title={t("articles.refreshArticles")}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="flex gap-8 xl:gap-12 justify-center">
          {/* Main Feed */}
          <div className="flex-1 max-w-3xl space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("articles.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Results info bar */}
            {(searchQuery || activeTab !== "all") && !error && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {filteredCount}{" "}
                  {filteredCount !== 1
                    ? t("common.results")
                    : t("common.result")}
                  {searchQuery && (
                    <span>
                      {" "}
                      {t("common.for")} &ldquo;{searchQuery}&rdquo;
                    </span>
                  )}
                  {activeTab !== "all" && <span> in {activeTab}</span>}
                </span>
                {(searchQuery || activeTab !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveTab("all");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}

            {/* Refresh indicator */}
            {isRefetching && <ArticleFeedSkeleton count={2} />}

            {/* Error State */}
            {!isRefetching && error && (
              <Card className="border-destructive/30">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {t("articles.failedToLoad")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {error instanceof Error ? error.message : String(error)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => refetch()}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isRefetching && !error && filteredCount === 0 && (
              <Card className="border-border/40">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {searchQuery || activeTab !== "all" ? (
                    <div>
                      <p className="text-sm font-medium">
                        {t("articles.noMatching")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("articles.adjustFilters")}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs mt-3"
                        onClick={() => {
                          setSearchQuery("");
                          setActiveTab("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">
                        {t("articles.noArticlesYet")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("articles.beFirst")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Feed Items - Using new unified ContentCard! */}
            {!isRefetching && !error && filteredCount > 0 && (
              <div className="space-y-4">
                {filteredArticles.map((item) => (
                  <ArticleCardWrapper key={item.content.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[320px] space-y-6 sticky top-8 h-fit">
            {/* Popular Tags */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4" />
                {t("articles.popularTags")}
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="secondary"
                        className="text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={() => {
                          setSearchQuery(tag.name);
                          setActiveTab("all");
                        }}
                      >
                        #{tag.name}
                        <span className="ml-1 text-muted-foreground">
                          {tag.count}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <ReadingList readingListCount={readingList.size} />
          </aside>
        </div>
      </div>
    </div>
  );
}
