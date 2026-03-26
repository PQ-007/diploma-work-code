"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare,
  HelpCircle,
  Lightbulb,
  CircleDot,
  Hash,
  Loader2,
  Plus,
} from "lucide-react";

// --- New Unified System ---
import { useDiscussions } from "@/lib/hooks/queries/useDiscussions";
import { DiscussionCardWrapper } from "./components/DiscussionCardWrapper";

// --- Components Import ---
import DiscussionModal from "./components/DiscussionModal";
import TrendingTopics from "@/components/TrendingTopics";
import DiscussionCreateDialog from "@/components/DiscussionCreateDialog";

const tabKeys = [
  { value: "all", labelKey: "discussions.tabs.all", icon: MessageSquare },
  { value: "help", labelKey: "discussions.tabs.help", icon: HelpCircle },
  { value: "general", labelKey: "discussions.tabs.general", icon: Hash },
  {
    value: "unanswered",
    labelKey: "discussions.tabs.unanswered",
    icon: CircleDot,
  },
  { value: "ideas", labelKey: "discussions.tabs.ideas", icon: Lightbulb },
];

export default function DiscussionsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  // Modal state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // New discussion dialog
  const [createOpen, setCreateOpen] = useState(false);

  // Use React Query hook - automatic caching and state management!
  const { data: discussions, isLoading, error, refetch } = useDiscussions();

  // ── Open modal ──
  const handleOpenModal = (id: string) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  // ── Sync modal changes back to cache ──
  const handleModalVoteChange = (
    id: string,
    newVote: "up" | "down" | null,
    newTotal: number,
  ) => {
    // React Query will handle cache updates automatically
    // when mutations are triggered
  };

  const handleModalBookmarkChange = (id: string, bookmarked: boolean) => {
    // React Query will handle cache updates automatically
  };

  const handleModalCommentCountChange = (id: string, delta: number) => {
    // React Query will handle cache updates automatically
  };

  // ── Filter discussions ──
  const filteredDiscussions = (discussions || []).filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "unanswered") return !item.content.answered;
    return item.content.tags.some((tag) =>
      tag.toLowerCase().includes(activeTab.toLowerCase()),
    );
  });

  // Sort: pinned first, then by votes
  const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
    if (a.content.pinned && !b.content.pinned) return -1;
    if (!a.content.pinned && b.content.pinned) return 1;
    return b.stats.likes - a.stats.likes;
  });

  // Stats computed from real data
  const totalThreads = discussions?.length || 0;
  const answeredCount =
    discussions?.filter((d) => d.content.answered).length || 0;
  const unansweredCount = totalThreads - answeredCount;

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
              {t("discussions.subtitle")}
            </p>
          </div>
          {user && (
            <Button
              size="sm"
              className="text-xs"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {t("discussions.newDiscussion")}
            </Button>
          )}
        </div>

        <div className="flex gap-8 xl:gap-12 justify-center">
          {/* Main Content */}
          <div className="flex-1 max-w-3xl">
            {/* Category Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList className="h-10 bg-muted/40 backdrop-blur-sm flex-wrap gap-1">
                {tabKeys.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1 text-xs"
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      {t(tab.labelKey)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* Discussion Feed */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Card className="border-destructive/30">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Failed to load discussions
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
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : sortedDiscussions.length === 0 ? (
              <div className="text-sm text-muted-foreground py-16 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>{t("discussions.noDiscussions")}</p>
                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setCreateOpen(true)}
                  >
                    Start a discussion
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedDiscussions.map((item) => (
                  <DiscussionCardWrapper
                    key={item.content.id}
                    item={item}
                    onComment={() => handleOpenModal(item.content.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[300px] space-y-5 sticky top-8 h-fit">
            <TrendingTopics trendingTopics={[]} t={t} />
          </aside>
        </div>
      </div>

      {/* ═══ Discussion Detail Modal ═══ */}
      <DiscussionModal
        discussionId={selectedId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onVoteChange={handleModalVoteChange}
        onBookmarkChange={handleModalBookmarkChange}
        onCommentCountChange={handleModalCommentCountChange}
      />

      {/* ═══ Create Discussion Dialog ═══ */}
      <DiscussionCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => refetch()}
      />
    </div>
  );
}
