"use client";
import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Search,
  RefreshCw,
  FileText,
  AlertCircle,
  Flame,
  Users,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Components Import ---
import ListItem from "@/app/article/components/ListItem";
import {
  ArticlePageSkeleton,
  ArticleFeedSkeleton,
} from "@/app/article/components/ArticleSkeleton";
import TrendingTopics from "@/components/TrendingTopics";
import ReadingList from "@/components/ReadingList";
interface ApiArticle {
  article_id: string;
  title: string;
  sub_title: string | null;
  body: string;
  language_code: string;
  published_at: string | null;
  author_id: string | null;
  author: {
    user_name: string | null;
    avatar_url: string | null;
    ranking_point: number | null;
  } | null;
  tags: string[];
}

interface FeedItem {
  id: string;
  type: string;
  day: number;
  author: {
    name: string;
    avatar: string;
    username: string;
    verified: boolean;
    reputation: number;
    contributions: number;
    ranking_point: number;
  };
  timestamp: string;
  readTime: string;
  content: {
    title: string;
    description: string;
    image?: string;
    tags: string[];
  };
  stats: {
    likes: number;
    comments: number;
    views: number;
    shares?: number;
  };
  featured: boolean;
  trending: boolean;
}

const trendingTopics: Array<{
  id: string;
  name: string;
  posts: number;
  trend: "up" | "stable" | "down";
}> = [
  // ... (Your original trendingTopics array) ...
  { id: "1", name: "React 19", posts: 1234, trend: "up" },
  { id: "2", name: "Machine Learning", posts: 987, trend: "up" },
  { id: "3", name: "Web3", posts: 756, trend: "stable" },
  { id: "4", name: "TypeScript", posts: 654, trend: "up" },
  { id: "5", name: "System Design", posts: 543, trend: "down" },
];
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

const topAuthors = [
  {
    name: "Sarah Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    username: "@sarahchen",
    articles: 24,
  },
  {
    name: "Mike Rodriguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    username: "@mikecodes",
    articles: 19,
  },
  {
    name: "Emma Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    username: "@emmawilson",
    articles: 15,
  },
  {
    name: "Alex Kim",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    username: "@alexkim",
    articles: 12,
  },
];
// --- End of Data ---

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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");
  const [likedItems, setLikedItems] = useState(new Set<string>());
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set<string>());
  const [readingList, setReadingList] = useState(new Set<string>());
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchArticles = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const res = await fetch("/api/articles?status=published");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("articles.failedToLoad"));
      }

      const items: ApiArticle[] = Array.isArray(data?.items) ? data.items : [];

      const mapped = items.map((article, index) => {
        const authorName = article.author?.user_name || t("articles.anonymous");
        const username = article.author?.user_name
          ? `@${article.author.user_name}`
          : "@anonymous";
        const avatarUrl =
          article.author?.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;
        const published = article.published_at
          ? new Date(article.published_at).toLocaleDateString()
          : t("articles.unpublished");

        const description = article.sub_title || "";

        return {
          id: article.article_id,
          type: "article",
          day: index + 1,
          author: {
            name: authorName,
            avatar: avatarUrl,
            username,
            verified: false,
            reputation: 0,
            contributions: 0,
            ranking_point: article.author?.ranking_point ?? 0,
          },
          timestamp: published,
          readTime: calcReadTime(article.body || ""),
          content: {
            title: article.title || t("articles.untitled"),
            description,
            tags: article.tags || [],
          },
          stats: {
            likes: 0,
            comments: 0,
            views: 0,
          },
          featured: index === 0,
          trending: index < 3,
        } as FeedItem;
      });

      setFeedItems(mapped);
    } catch (err: any) {
      console.error("Error loading articles", err);
      setError(err?.message || t("articles.failedToLoad"));
      setFeedItems([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const toggleLike = useCallback((id: string) => {
    setLikedItems((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedItems((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleReadingList = useCallback((id: string) => {
    setReadingList((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
    setShowQuickActions(null);
  }, []);

  const handleMoreClick = useCallback((id: string | null) => {
    setShowQuickActions((prev) => (prev === id ? null : id));
  }, []);

  const filteredFeedItems = feedItems.filter((item) => {
    // Tab filter
    const matchesTab =
      activeTab === "all" ||
      item.content.tags.some((tag) => tag.toLowerCase().includes(activeTab));

    // Search filter
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.content.title.toLowerCase().includes(q) ||
      item.content.description.toLowerCase().includes(q) ||
      item.author.name.toLowerCase().includes(q) ||
      item.content.tags.some((tag) => tag.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const totalCount = feedItems.length;
  const filteredCount = filteredFeedItems.length;

  // Initial full-page skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto py-6 lg:py-3 max-w-7xl">
          <div className="mb-6">
            <div className="h-6 w-32 bg-muted-foreground/15 animate-pulse rounded-md mb-1" />
            <div className="h-4 w-56 bg-muted-foreground/15 animate-pulse rounded-md" />
          </div>
          <ArticlePageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
              onClick={() => fetchArticles(true)}
              disabled={isRefreshing}
              title={t("articles.refreshArticles")}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="flex gap-8 xl:gap-12 justify-center">
          {/* Main Feed */}
          <div className="flex-1 max-w-7xl space-y-4">
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

            {/* Category Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-10 bg-muted/40 backdrop-blur-sm flex-wrap gap-1">
                {["all", "nextjs", "ai", "python", "rust"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1 text-xs capitalize"
                  >
                    {tab === "all" ? "All" : tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

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
            {isRefreshing && <ArticleFeedSkeleton count={2} />}

            {/* Error State */}
            {!isRefreshing && error && (
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
                      {error}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => fetchArticles(false)}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isRefreshing && !error && filteredCount === 0 && (
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

            {/* Feed Items */}
            {!isRefreshing && !error && filteredCount > 0 && (
              <div className="space-y-4">
                {filteredFeedItems.map((item) => (
                  <ListItem
                    key={item.id}
                    item={item}
                    isLiked={likedItems.has(item.id)}
                    isBookmarked={bookmarkedItems.has(item.id)}
                    toggleLike={toggleLike}
                    toggleBookmark={toggleBookmark}
                  />
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

            <TrendingTopics trendingTopics={trendingTopics} t={t} />

            {/* Top Authors */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                {t("articles.topAuthors")}
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-0">
                  {topAuthors.map((author, i) => (
                    <div
                      key={author.username}
                      className="flex items-center justify-between px-3 py-2.5 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={author.avatar} />
                          <AvatarFallback className="text-xs">
                            {author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {author.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {author.articles} {t("common.articles")}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
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
