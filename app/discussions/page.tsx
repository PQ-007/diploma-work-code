"use client";
import { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  MessageSquare,
  HelpCircle,
  Lightbulb,
  CircleDot,
  Hash,
  Minus,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUp, ArrowDown } from "lucide-react";

import DiscussionItem, {
  type DiscussionItemData,
} from "./components/DiscussionItem";
import TrendingTopics from "@/components/TrendingTopics";

// --- Mock Data ---
const discussions: DiscussionItemData[] = [
  {
    id: "d1",
    author: {
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      username: "@sarahchen",
    },
    timestamp: "2h ago",
    title: "How to optimize React re-renders in large lists?",
    description:
      "I have a list of 10,000+ items and the UI freezes when scrolling. I've tried React.memo and useMemo but the performance is still bad. What are some strategies for handling this?",
    tags: ["React", "Performance", "Help"],
    stats: { votes: 24, replies: 12, views: 340 },
    answered: true,
    pinned: true,
  },
  {
    id: "d2",
    author: {
      name: "Mike Rodriguez",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
      username: "@mikecodes",
    },
    timestamp: "5h ago",
    title: "What's your preferred state management solution in 2026?",
    description:
      "With so many options available - Zustand, Jotai, Redux Toolkit, Signals - I'm curious what everyone is using for their production apps and why.",
    tags: ["General", "React", "State Management"],
    stats: { votes: 56, replies: 38, views: 890 },
    answered: false,
    pinned: false,
  },
  {
    id: "d3",
    author: {
      name: "Alex Kim",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      username: "@alexkim",
    },
    timestamp: "8h ago",
    title: "Show: Built a real-time collaborative markdown editor",
    description:
      "I just finished building a collaborative markdown editor using CRDTs and WebSockets. It supports real-time cursors, conflict-free editing, and offline sync. Would love feedback!",
    tags: ["Show", "WebSockets", "Project"],
    stats: { votes: 89, replies: 21, views: 1200 },
    answered: false,
    pinned: false,
  },
  {
    id: "d4",
    author: {
      name: "Emma Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      username: "@emmawilson",
    },
    timestamp: "12h ago",
    title: "Idea: Platform-wide code review matchmaking system",
    description:
      "What if FutureHub had a feature where you could submit your code for peer review and get matched with developers of similar skill level? Think of it like pair programming but async.",
    tags: ["Ideas", "Feature Request"],
    stats: { votes: 112, replies: 45, views: 2100 },
    answered: false,
    pinned: false,
  },
  {
    id: "d5",
    author: {
      name: "CodeMasters",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Code",
      username: "@codemasters",
    },
    timestamp: "1d ago",
    title: "TypeScript 6.0 - What features are you most excited about?",
    description:
      "The TypeScript team just announced the roadmap for 6.0 with pattern matching, pipe operator, and improved type inference. Which features are you looking forward to most?",
    tags: ["TypeScript", "General"],
    stats: { votes: 78, replies: 29, views: 1560 },
    answered: false,
    pinned: false,
  },
  {
    id: "d6",
    author: {
      name: "Батсуурь",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Batsuur",
      username: "@batsuur",
    },
    timestamp: "1d ago",
    title: "Need help: Docker container keeps crashing on deployment",
    description:
      "My Next.js app works fine locally but the Docker container exits with code 137 when I deploy to my VPS. I've allocated 2GB RAM. Has anyone experienced this?",
    tags: ["Help", "Docker", "DevOps"],
    stats: { votes: 15, replies: 8, views: 210 },
    answered: true,
    pinned: false,
  },
  {
    id: "d7",
    author: {
      name: "З.Дөлгөөн",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dolgoon",
      username: "@dolgoon",
    },
    timestamp: "2d ago",
    title: "Best practices for structuring a monorepo with Turborepo?",
    description:
      "Starting a new project with multiple packages (shared UI, API client, config). Looking for advice on folder structure, dependency management, and CI/CD setup with Turborepo.",
    tags: ["Help", "Monorepo", "Turborepo"],
    stats: { votes: 34, replies: 16, views: 670 },
    answered: false,
    pinned: false,
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

const trendingTopics: Array<{
  id: string;
  name: string;
  posts: number;
  trend: "up" | "stable" | "down";
}> = [
  { id: "1", name: "React 19", posts: 1234, trend: "up" },
  { id: "2", name: "Machine Learning", posts: 987, trend: "up" },
  { id: "3", name: "Web3", posts: 756, trend: "stable" },
  { id: "4", name: "TypeScript", posts: 654, trend: "up" },
  { id: "5", name: "System Design", posts: 543, trend: "down" },
];

const tabs = [
  { value: "all", label: "All", icon: MessageSquare },
  { value: "help", label: "Help", icon: HelpCircle },
  { value: "general", label: "General", icon: Hash },
  { value: "unanswered", label: "Unanswered", icon: CircleDot },
  { value: "ideas", label: "Ideas", icon: Lightbulb },
];

// --- End of Data ---

export default function DiscussionsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set<string>());
  const [votes, setVotes] = useState<Record<string, "up" | "down" | null>>({});

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedItems((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleVote = useCallback((id: string, direction: "up" | "down") => {
    setVotes((prev) => ({
      ...prev,
      [id]: prev[id] === direction ? null : direction,
    }));
  }, []);

  const filteredDiscussions = discussions.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "unanswered") return !item.answered;
    return item.tags.some((tag) =>
      tag.toLowerCase().includes(activeTab.toLowerCase()),
    );
  });

  // Sort: pinned first, then by votes
  const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.stats.votes - a.stats.votes;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t("sidebar.discussions")}
            </h1>
            <p className="text-sm text-muted-foreground">
              Ask questions, share ideas, and connect with the community.
            </p>
          </div>
          <Button size="sm" className="text-xs">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            New Discussion
          </Button>
        </div>

        <div className="flex gap-8 xl:gap-12 justify-center">
          {/* Main Content */}
          <div className="flex-1 max-w-7xl">
            {/* Category Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList className="h-10 bg-muted/40 backdrop-blur-sm flex-wrap gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1 text-xs"
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* Discussion Items */}
            <div className="space-y-3">
              {sortedDiscussions.length === 0 && (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  No discussions found for this category.
                </div>
              )}
              {sortedDiscussions.map((item) => (
                <DiscussionItem
                  key={item.id}
                  item={item}
                  isBookmarked={bookmarkedItems.has(item.id)}
                  userVote={votes[item.id] ?? null}
                  toggleBookmark={toggleBookmark}
                  toggleVote={toggleVote}
                />
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[320px] space-y-6 sticky top-8 h-fit">
            {/* Discussion Stats */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                Discussion Stats
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total threads</span>
                    <span className="font-medium">{discussions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Answered</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {discussions.filter((d) => d.answered).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Unanswered</span>
                    <span className="font-medium">
                      {discussions.filter((d) => !d.answered).length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Contributors */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                Top Contributors
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-0">
                  {leaderboard.map((user) => (
                    <div
                      key={user.rank}
                      className="flex items-center justify-between px-3 py-2.5 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-bold text-muted-foreground/60 w-5">
                          {user.rank}
                        </span>
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.points.toLocaleString()} points
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                        {user.change > 0 ? (
                          <ArrowUp className="h-2.5 w-2.5 text-green-500" />
                        ) : user.change < 0 ? (
                          <ArrowDown className="h-2.5 w-2.5 text-red-500" />
                        ) : (
                          <Minus className="h-2.5 w-2.5" />
                        )}
                        {Math.abs(user.change)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <TrendingTopics trendingTopics={trendingTopics} t={t} />
          </aside>
        </div>
      </div>
    </div>
  );
}
