// src/app/FeedPage.tsx (or similar main route file)

"use client";
import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// --- Components Import ---
import ListItem from "@/app/article/components/ListItem";
import Leaderboard from "@/components/Leaderboard";
import PostCreationBox from "@/components/PostCreationBox";
import SidebarCarousel from "@/components/SidebarCarousel";

// --- Data ---
const feedItems = [
  {
    id: "1",
    type: "project",
    author: {
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      username: "@sarahchen",
      verified: true,
      reputation: 2450,
      contributions: 352,
      ranking_point: 2650,
    },
    timestamp: "Dec 1, 2025",
    readTime: "8 min",
    content: {
      title: "AlgoViz - Interactive Algorithm Visualizer",
      description:
        "Built a new tool to help students understand sorting algorithms through interactive visualizations. Features include step-by-step execution, code highlighting, and more.",
      tags: ["React", "D3.js"],
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
    type: "blog",
    author: {
      name: "Mike Rodriguez",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
      username: "@mikecodes",
      verified: true,
      reputation: 3200,
      contributions: 310,
      ranking_point: 2950,
    },
    timestamp: "Dec 2, 2025",
    readTime: "12 min",
    content: {
      title: "10 Advanced React Patterns You Should Know",
      description:
        "Dive deep into compound components, render props, custom hooks, and more. Learn how to write cleaner, more maintainable React code with these proven patterns.",
      tags: ["React", "JavaScript"],
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
    type: "discussion",
    author: {
      name: "Alex Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      username: "@alexj",
      verified: false,
      reputation: 1200,
      contributions: 245,
      ranking_point: 1800,
    },
    timestamp: "Dec 3, 2025",
    readTime: "5 min",
    content: {
      title:
        "Best practices for managing state in large-scale Rust applications?",
      description:
        "I'm working on a distributed system and debating between different state management libraries. Any recommendations or war stories?",
      tags: ["Rust", "State Management", "Distributed Systems"],
    },
    stats: {
      likes: 156,
      comments: 42,
      views: 890,
      shares: 12,
    },
    featured: false,
    trending: false,
  },
];

const leaderboard = [
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
    name: "Делгеен",
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
    name: "Тегелдер",
    avatar: "https://robohash.org/Emily",
    points: 8920,
    change: -2,
  },
];
// --- End of Data ---

export default function FeedPage() {
  const { t } = useLanguage();
  const [likedItems, setLikedItems] = useState(new Set(["2"]));
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set(["1", "3"]));

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-7xl">
        <div className="flex gap-8 xl:gap-12 justify-center">
          {/* Main Feed */}
          <div className="flex-1 max-w-2xl">
            {/* Post Creation Box */}
            <PostCreationBox />

            {/* Feed Items */}
            <div className="space-y-4">
              {feedItems.map((item) => (
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
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[320px] space-y-6 sticky top-8 h-fit">
            <SidebarCarousel />
            <Leaderboard isStudent={true} t={t} />
            <Leaderboard isStudent={false} t={t} />
          </aside>
        </div>
      </div>
    </div>
  );
}
