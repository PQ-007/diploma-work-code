"use client";
import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";

// --- Components Import ---
import ListItem from "@/app/article/components/ListItem";
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

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/articles?status=published");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load articles");
        }

        const items: ApiArticle[] = Array.isArray(data?.items)
          ? data.items
          : [];

        const mapped = items.map((article, index) => {
          const authorName = article.author?.user_name || "Anonymous";
          const username = article.author?.user_name
            ? `@${article.author.user_name}`
            : "@anonymous";
          const avatarUrl =
            article.author?.avatar_url ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;
          const published = article.published_at
            ? new Date(article.published_at).toLocaleDateString()
            : "Unpublished";

          // Use subtitle if available, otherwise skip description
          const description = article.sub_title || "";

          return {
            id: article.article_id,
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
              title: article.title || "Untitled article",
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
        setError(err?.message || "Failed to load articles");
        setFeedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

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
    if (activeTab === "all") return true;
    return item.content.tags.some((tag) =>
      tag.toLowerCase().includes(activeTab),
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-7xl">
        <div className="flex gap-8 xl:gap-12 justify-center">
          {/* Main Feed */}
          <div className="flex-1 max-w-7xl">
            {/* Category Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mb-6"
            >
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

            {/* Feed Items */}
            <div className="space-y-4">
              {loading && (
                <div className="text-sm text-muted-foreground">
                  Loading published articles...
                </div>
              )}
              {!loading && error && (
                <div className="text-sm text-red-500">{error}</div>
              )}
              {!loading && !error && filteredFeedItems.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No published articles yet.
                </div>
              )}
              {!loading &&
                !error &&
                filteredFeedItems.map((item) => (
                  <ListItem
                    key={item.id}
                    item={item}
                    isLiked={likedItems.has(item.id)}
                    isBookmarked={bookmarkedItems.has(item.id)}
                    isInReadingList={readingList.has(item.id)}
                    showQuickActions={showQuickActions === item.id}
                    toggleLike={toggleLike}
                    toggleBookmark={toggleBookmark}
                    toggleReadingList={toggleReadingList}
                    handleMoreClick={handleMoreClick}
                  />
                ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[320px] space-y-6 sticky top-8 h-fit">
            <TrendingTopics trendingTopics={trendingTopics} t={t} />
            <ReadingList readingListCount={readingList.size} />
          </aside>
        </div>
      </div>
    </div>
  );
}
