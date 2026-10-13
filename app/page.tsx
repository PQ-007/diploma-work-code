"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/components/brand/Logo";
import { FeedCard, type FeedItem, type FeedKind } from "@/components/feed/FeedCard";
import Leaderboard from "@/components/Leaderboard";
import { Chip, ChipRow } from "@/components/common/Chip";
import { EmptyState } from "@/components/common/States";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

/* ── API shapes (only the fields the feed uses) ─────────────────────────── */
interface Author { display_name?: string | null; user_name?: string | null; avatar_url?: string | null }
interface ArticleRow { article_id: string; title: string; sub_title?: string | null; created_at: string; views?: number; reactions?: number; comments?: number; tags?: string[]; author?: Author | null }
interface ProjectRow { id: number; slug: string; title: string; description?: string | null; thumbnail_url?: string | null; created_at: string; views?: number; likes_count?: number; tags?: string[]; author?: Author | null }
interface DiscussionRow { id: string; title: string; body?: string; created_at: string; votes?: number; commentCount?: number; tags?: string[]; author?: Author | null }
interface TermRow { id: number; slug: string; term: string; reading?: string | null; definition: string; language_code: string; created_at: string }

async function getItems<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const json = await res.json();
  return (json.items ?? []) as T[];
}

const name = (a?: Author | null) =>
  a ? { name: a.display_name || a.user_name || "—", avatarUrl: a.avatar_url } : null;

const FILTERS: { key: "all" | FeedKind; label: string }[] = [
  { key: "all", label: "home.filter.all" },
  { key: "article", label: "sidebar.articles" },
  { key: "project", label: "sidebar.projects" },
  { key: "discussion", label: "sidebar.discussions" },
  { key: "term", label: "sidebar.dictionary" },
];

/** How many dictionary terms join the mixed "All" feed (the dictionary is large). */
const TERMS_IN_ALL = 4;

export default function HomePage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<"all" | FeedKind>("all");

  const articles = useQuery({ queryKey: ["feed", "articles"], queryFn: () => getItems<ArticleRow>("/api/articles") });
  const projects = useQuery({ queryKey: ["feed", "projects"], queryFn: () => getItems<ProjectRow>("/api/projects?scope=public&sort=newest") });
  const discussions = useQuery({ queryKey: ["feed", "discussions"], queryFn: () => getItems<DiscussionRow>("/api/discussions") });
  const terms = useQuery({ queryKey: ["feed", "terms"], queryFn: () => getItems<TermRow>("/api/dictionary?sort=newest&limit=12") });

  const loading = articles.isLoading || projects.isLoading || discussions.isLoading || terms.isLoading;

  const feed = useMemo(() => {
    const items: FeedItem[] = [
      ...(articles.data ?? []).map((a): FeedItem => ({
        kind: "article", id: `a${a.article_id}`, href: `/article/${a.article_id}`,
        title: a.title, excerpt: a.sub_title, createdAt: a.created_at, author: name(a.author), tags: a.tags,
        stats: { views: a.views ?? 0, likes: a.reactions ?? 0, comments: a.comments ?? 0 },
      })),
      ...(projects.data ?? []).map((p): FeedItem => ({
        kind: "project", id: `p${p.id}`, href: `/project/${p.slug}`,
        title: p.title, excerpt: p.description, createdAt: p.created_at, author: name(p.author), tags: p.tags,
        imageUrl: p.thumbnail_url, stats: { views: p.views ?? 0, likes: p.likes_count ?? 0 },
      })),
      ...(discussions.data ?? []).map((d): FeedItem => ({
        kind: "discussion", id: `d${d.id}`, href: `/discussions?open=${d.id}`,
        title: d.title, excerpt: d.body, createdAt: d.created_at, author: name(d.author), tags: d.tags,
        stats: { votes: d.votes ?? 0, comments: d.commentCount ?? 0 },
      })),
    ];
    const termItems = (terms.data ?? []).map((e): FeedItem => ({
      kind: "term", id: `t${e.id}`, href: `/dictionary/${e.slug}`,
      title: e.reading ? `${e.term} (${e.reading})` : e.term, excerpt: e.definition,
      createdAt: e.created_at, meta: e.language_code.toUpperCase(),
    }));

    if (filter === "term") return termItems;
    const mixed = filter === "all" ? [...items, ...termItems.slice(0, TERMS_IN_ALL)] : items.filter((i) => i.kind === filter);
    return mixed.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [articles.data, projects.data, discussions.data, terms.data, filter]);

  return (
    <div className="container-page !px-0">
      {!authLoading && !user && (
        <section className="mb-6 flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
          <LogoMark className="size-11" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{t("home.introTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.introText")}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/signup">{t("auth.signUp")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/signin">{t("auth.signIn")}</Link>
            </Button>
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="feed-title" className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="feed-title" className="text-xl font-semibold tracking-tight">{t("home.latest")}</h2>
            <ChipRow label={t("home.latest")}>
              {FILTERS.map((f) => (
                <Chip key={f.key} selected={filter === f.key} onClick={() => setFilter(f.key)}>
                  {t(f.label)}
                </Chip>
              ))}
            </ChipRow>
          </div>

          <div className="space-y-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
              : feed.length === 0
                ? <EmptyState icon={Inbox} title={t("home.empty")} />
                : feed.map((item) => <FeedCard key={item.id} item={item} />)}
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Leaderboard isStudent={true} t={(key) => t(key)} />
          <Leaderboard isStudent={false} t={(key) => t(key)} />
        </aside>
      </div>
    </div>
  );
}
