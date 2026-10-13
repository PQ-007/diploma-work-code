"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertCircle, FileText, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

// --- New Unified System ---
import { useArticles } from "@/lib/hooks/queries/useArticles";
import { ArticleCardWrapper } from "./components/ArticleCardWrapper";

// --- Components Import ---
import {
  ArticleFeedSkeleton,
  ArticlePageSkeleton,
} from "@/app/article/components/ArticleSkeleton";


export default function ArticleBrowsePage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Most used tags across the loaded articles.
  const popularTags = Object.entries(
    (articles || []).reduce<Record<string, number>>((acc, item) => {
      for (const tag of item.content.tags) acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((x, y) => y[1] - x[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));
  const filteredCount = filteredArticles.length;

  // Initial full-page skeleton
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <ArticlePageSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title={t("articles.title")}
        subtitle={
          <>
            {t("articles.subtitle")}
            {totalCount > 0 && <> &middot; {totalCount} {t("common.published")}</>}
          </>
        }
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-foreground"
            onClick={() => refetch()}
            disabled={isRefetching}
            title={t("articles.refreshArticles")}
            aria-label={t("articles.refreshArticles")}
          >
            <RefreshCw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        }
      />

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("articles.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-full bg-card pl-9 text-sm"
              />
            </div>

            {/* Popular tags (real counts) */}
            {popularTags.length > 0 && (
              <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {popularTags.map((tag) => {
                  const selected = searchQuery === tag.name;
                  return (
                    <button
                      key={tag.name}
                      onClick={() => setSearchQuery(selected ? "" : tag.name)}
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      #{tag.name}
                      <span className="ml-1 opacity-70">{tag.count}</span>
                    </button>
                  );
                })}
              </div>
            )}

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
    </div>
  );
}
