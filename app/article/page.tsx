"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, PenLine, RefreshCw } from "lucide-react";
import { Chip, ChipRow } from "@/components/common/Chip";
import { SearchInput } from "@/components/common/SearchInput";
import { EmptyState, ErrorState } from "@/components/common/States";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useArticles } from "@/lib/hooks/queries/useArticles";
import { ArticleCardWrapper } from "./components/ArticleCardWrapper";

export default function ArticleBrowsePage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: articles, isLoading, error, refetch, isRefetching } = useArticles("published", language);

  // Most used tags across the loaded articles.
  const popularTags = useMemo(
    () =>
      Object.entries(
        (articles || []).reduce<Record<string, number>>((acc, item) => {
          for (const tag of item.content.tags) acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {}),
      )
        .sort((x, y) => y[1] - x[1])
        .slice(0, 12),
    [articles],
  );

  const q = searchQuery.toLowerCase().trim();
  const filtered = (articles || []).filter((item) => {
    const c = item.content;
    if (activeTag && !c.tags.includes(activeTag)) return false;
    return (
      !q ||
      c.title.toLowerCase().includes(q) ||
      (c.description?.toLowerCase() || "").includes(q) ||
      c.author.displayName.toLowerCase().includes(q) ||
      c.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
  const hasFilters = !!q || !!activeTag;
  const clear = () => {
    setSearchQuery("");
    setActiveTag(null);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <PageHeader
        className="!mb-2"
        title={t("articles.title")}
        subtitle={
          <>
            {t("articles.subtitle")}
            {!!articles?.length && <> · {articles.length} {t("common.published")}</>}
          </>
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
              aria-label={t("articles.refreshArticles")}
              className="text-muted-foreground"
            >
              <RefreshCw className={isRefetching ? "animate-spin" : undefined} />
            </Button>
            {user && (
              <Button asChild>
                <Link href="/article/create">
                  <PenLine />
                  <span className="hidden sm:inline">{t("create_button.article")}</span>
                </Link>
              </Button>
            )}
          </>
        }
      />

      <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder={t("articles.searchPlaceholder")} />

      {popularTags.length > 0 && (
        <ChipRow label={t("articles.popularTags")}>
          <Chip selected={!activeTag} onClick={() => setActiveTag(null)}>
            {t("common.all")}
          </Chip>
          {popularTags.map(([name, count]) => (
            <Chip key={name} selected={activeTag === name} count={count} onClick={() => setActiveTag(activeTag === name ? null : name)}>
              #{name}
            </Chip>
          ))}
        </ChipRow>
      )}

      {hasFilters && !isLoading && !error && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filtered.length} {filtered.length === 1 ? t("common.result") : t("common.results")}
          </span>
          <Button variant="link" size="sm" onClick={clear}>
            {t("common.clearFilters")}
          </Button>
        </div>
      )}

      {isLoading || isRefetching ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : String(error)} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={FileText}
            title={t("articles.noMatching")}
            description={t("articles.adjustFilters")}
            action={
              <Button variant="outline" size="sm" onClick={clear}>
                {t("common.clearFilters")}
              </Button>
            }
          />
        ) : (
          <EmptyState icon={FileText} title={t("articles.noArticlesYet")} description={t("articles.beFirst")} />
        )
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ArticleCardWrapper key={item.content.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
