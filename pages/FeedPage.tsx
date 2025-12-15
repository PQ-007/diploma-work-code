// src/app/FeedPage.tsx (or similar main route file)

"use client";
import { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
// import { useAuth } from "@/contexts/AuthContext"; // Keeping it commented out as it's not strictly needed for this file's logic
import { Sparkles, Trophy, TrendingUp, BookOpen } from "lucide-react";

// --- Components Import ---
import ListItem from "@/components/article/ListItem";
import Leaderboard from "@/components/Leaderboard";
import TrendingTopics from "@/components/TrendingTopics";
import ReadingList from "@/components/ReadingList";
import AdventBanner from "@/components/AdventBanner";

// --- Data (Moved here for easy access, but ideally would come from an API/global store) ---
const feedItems = [
  // ... (Your original feedItems array) ...
  {
    id: "1",
    day: 1,
    type: "project",
    author: {
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      username: "@sarahchen",
      verified: true,
      reputation: 2450,
      contributions: 352,
    },
    timestamp: "Dec 1, 2025",
    readTime: "8 min",
    content: {
      title: "AlgoViz - Interactive Algorithm Visualizer",
      description:
        "Built a new tool to help students understand sorting algorithms through interactive visualizations. Features include step-by-step execution, code highlighting, and complexity analysis.",
      image:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
      tags: ["React", "D3.js", "Education", "Algorithms"],
    },
    stats: {
      likes: 234,
      comments: 45,
      views: 1200,
      shares: 23,
    },
    featured: false,
    trending: true,
  },
  {
    id: "2",
    day: 2,
    type: "blog",
    author: {
      name: "Mike Rodriguez",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
      username: "@mikecodes",
      verified: true,
      reputation: 3200,
      contributions: 310,
    },
    timestamp: "Dec 2, 2025",
    readTime: "12 min",
    content: {
      title: "10 Advanced React Patterns You Should Know",
      description:
        "Dive deep into compound components, render props, custom hooks, and more. Learn how to write cleaner, more maintainable React code with these proven patterns.",
      tags: ["React", "JavaScript", "Tutorial"],
    },
    stats: {
      likes: 567,
      comments: 89,
      views: 3400,
      shares: 78,
    },
    featured: true,
    trending: true,
  },
  {
    id: "3",
    day: 3,
    type: "contest",
    author: {
      name: "CodeMasters",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Code",
      username: "@codemasters",
      verified: true,
      reputation: 5600,
      contributions: 186,
    },
    timestamp: "Dec 3, 2025",
    readTime: "5 min",
    deadline: "3 days left",
    content: {
      title: "Summer Coding Challenge 2025",
      description:
        "Join our biggest coding competition yet! Solve algorithmic problems, compete with developers worldwide, and win amazing prizes. Registration closes in 3 days.",
      image:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
      tags: ["Contest", "Algorithms"],
    },
    stats: {
      likes: 890,
      comments: 156,
      views: 5600,
      shares: 234,
    },
    featured: false,
    trending: false,
  },
  {
    id: "4",
    day: 4,
    type: "achievement",
    author: {
      name: "Alex Kim",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      username: "@alexkim",
      verified: false,
      reputation: 1200,
      contributions: 215,
    },
    timestamp: "Dec 4, 2025",
    readTime: "3 min",
    content: {
      title: "Completed 100-Day Coding Streak!",
      description:
        "Finally hit 100 consecutive days of coding! Learned so much about consistency and building habits. Special thanks to the community for the support!",
      tags: ["Achievement", "Motivation"],
    },
    stats: {
      likes: 445,
      comments: 67,
      views: 1800,
    },
    featured: false,
    trending: false,
  },
  {
    id: "5",
    day: 5,
    type: "flashcard",
    author: {
      name: "Emma Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      username: "@emmawilson",
      verified: true,
      reputation: 1800,
      contributions: 154,
    },
    timestamp: "Dec 5, 2025",
    readTime: "15 min",
    content: {
      title: "JavaScript Interview Prep - 50 Essential Questions",
      description:
        "Created a comprehensive flashcard deck covering closures, async/await, prototypes, and more. Perfect for technical interviews!",
      tags: ["JavaScript", "Interview"],
    },
    stats: {
      likes: 678,
      comments: 92,
      views: 2900,
      shares: 145,
    },
    featured: false,
    trending: true,
  },
];

const leaderboard = [
  // ... (Your original leaderboard array) ...
  {
    rank: 1,
    name: "Билгүүнтүшиг",
    avatar: "https://robohash.org/Alexandra",
    points: 12450,
    change: 0,
  },
  {
    rank: 2,
    name: "Батсуурь",
    avatar: "https://robohash.org/David",
    points: 11230,
    change: 2,
  },
  {
    rank: 3,
    name: "З.Дөлгөөн",
    avatar: "https://robohash.org/SarahJ",
    points: 10890,
    change: -1,
  },
  {
    rank: 4,
    name: "Цэлмэг",
    avatar: "https://robohash.org/MikeZ",
    points: 9560,
    change: 1,
  },
  {
    rank: 5,
    name: "Төгөлдөр",
    avatar: "https://robohash.org/Emily",
    points: 8920,
    change: -2,
  },
];

const trendingTopics: Array<{ id: string; name: string; posts: number; trend: "up" | "stable" | "down" }> = [
  // ... (Your original trendingTopics array) ...
  { id: "1", name: "React 19", posts: 1234, trend: "up" },
  { id: "2", name: "Machine Learning", posts: 987, trend: "up" },
  { id: "3", name: "Web3", posts: 756, trend: "stable" },
  { id: "4", name: "TypeScript", posts: 654, trend: "up" },
  { id: "5", name: "System Design", posts: 543, trend: "down" },
];
// --- End of Data ---

export default function FeedPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");
  const [likedItems, setLikedItems] = useState(new Set(["2", "4"]));
  const [bookmarkedItems, setBookmarkedItems] = useState(
    new Set(["1", "3", "5"])
  );
  const [readingList, setReadingList] = useState(new Set<string>());
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

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
    return item.content.tags.some(tag => tag.toLowerCase().includes(activeTab));
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-7xl">
        <AdventBanner t={t} />

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
              {filteredFeedItems.map((item) => (
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
            <Leaderboard
              isStudent={true}
              leaderboard={leaderboard}
              t={t}
            />
            <Leaderboard
            isStudent={false}
              leaderboard={leaderboard}
              t={t}
            />
            <TrendingTopics
              trendingTopics={trendingTopics}
              t={t}
            />
            <ReadingList
              readingListCount={readingList.size}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}