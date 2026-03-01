"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import DiscussionItem, {
  type DiscussionItemData,
} from "./components/DiscussionItem";
import DiscussionModal from "./components/DiscussionModal";
import TrendingTopics from "@/components/TrendingTopics";

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
  const [discussions, setDiscussions] = useState<DiscussionItemData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // New discussion dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discussions");
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  // ── Inline vote (optimistic + API) ──
  const handleVote = useCallback(
    async (id: string, direction: "up" | "down") => {
      if (!user) return;
      const disc = discussions.find((d) => d.id === id);
      if (!disc) return;

      // Optimistic update
      const oldVote = disc.userVote;
      let newUserVote: "up" | "down" | null;
      let delta = 0;

      if (oldVote === direction) {
        newUserVote = null;
        delta = direction === "up" ? -1 : 1;
      } else if (oldVote) {
        newUserVote = direction;
        delta = direction === "up" ? 2 : -2;
      } else {
        newUserVote = direction;
        delta = direction === "up" ? 1 : -1;
      }

      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, userVote: newUserVote, votes: d.votes + delta }
            : d,
        ),
      );

      try {
        await fetch("/api/discussions/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discussionId: id, vote: direction }),
        });
      } catch {
        // Revert on error
        setDiscussions((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, userVote: oldVote, votes: d.votes - delta }
              : d,
          ),
        );
      }
    },
    [discussions, user],
  );

  // ── Inline bookmark (optimistic + API) ──
  const handleBookmark = useCallback(
    async (id: string) => {
      if (!user) return;
      const disc = discussions.find((d) => d.id === id);
      if (!disc) return;

      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, bookmarked: !d.bookmarked } : d,
        ),
      );

      try {
        await fetch("/api/discussions/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discussionId: id }),
        });
      } catch {
        setDiscussions((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, bookmarked: !d.bookmarked } : d,
          ),
        );
      }
    },
    [discussions, user],
  );

  // ── Open modal ──
  const handleOpenModal = (id: string) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  // ── Sync modal changes back to list ──
  const handleModalVoteChange = (
    id: string,
    newVote: "up" | "down" | null,
    newTotal: number,
  ) => {
    setDiscussions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, userVote: newVote, votes: newTotal } : d,
      ),
    );
  };

  const handleModalBookmarkChange = (id: string, bookmarked: boolean) => {
    setDiscussions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, bookmarked } : d)),
    );
  };

  const handleModalCommentCountChange = (id: string, delta: number) => {
    setDiscussions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, commentCount: d.commentCount + delta } : d,
      ),
    );
  };

  // ── Create new discussion ──
  const handleAddTag = () => {
    const tag = newTagInput.trim();
    if (tag && !newTags.includes(tag) && newTags.length < 5) {
      setNewTags([...newTags, tag]);
      setNewTagInput("");
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          body: newBody,
          tags: newTags,
        }),
      });
      if (res.ok) {
        setCreateOpen(false);
        setNewTitle("");
        setNewBody("");
        setNewTags([]);
        fetchDiscussions();
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  // ── Filter ──
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
    return b.votes - a.votes;
  });

  // Stats computed from real data
  const totalThreads = discussions.length;
  const answeredCount = discussions.filter((d) => d.answered).length;
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
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
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
                  <DiscussionItem
                    key={item.id}
                    item={item}
                    onVote={handleVote}
                    onBookmark={handleBookmark}
                    onClick={handleOpenModal}
                    disabled={!user}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[300px] space-y-5 sticky top-8 h-fit">
            {/* Discussion Stats */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                {t("discussions.stats")}
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("discussions.totalThreads")}
                    </span>
                    <span className="font-medium">{totalThreads}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("discussions.answered")}
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {answeredCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("discussions.unanswered")}
                    </span>
                    <span className="font-medium">{unansweredCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

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
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Discussion</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Describe your discussion... (optional)"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              className="min-h-[100px]"
            />
            <div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTagInput.trim() || newTags.length >= 5}
                >
                  Add
                </Button>
              </div>
              {newTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {newTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1 text-xs"
                    >
                      {tag}
                      <button
                        onClick={() =>
                          setNewTags(newTags.filter((t) => t !== tag))
                        }
                        className="hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim() || creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-1.5" />
              )}
              Post Discussion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
