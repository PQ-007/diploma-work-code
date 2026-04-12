// src/app/FeedPage.tsx

"use client";
import { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// --- Components Import ---
import ListItem, { ListItemData } from "@/app/article/components/ListItem";
import DiscussionItem, {
  DiscussionItemData,
} from "@/app/discussions/components/DiscussionItem";
import DiscussionModal from "@/app/discussions/components/DiscussionModal";
import Leaderboard from "@/components/Leaderboard";
import PostCreationBox from "@/components/PostCreationBox";
import SidebarCarousel from "@/components/SidebarCarousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";
import { getRankIcon } from "@/lib/utils/rankIcons";

// --- Types ---
type PollOption = {
  id: number;
  option_text: string;
  display_order: number;
  votes: number;
};

type PollData = {
  id: number;
  question: string;
  ends_at: string | null;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    user_name: string;
    avatar_url: string;
    ranking_point?: number;
  };
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId: number | null;
};

type FeedEntry =
  | { kind: "article"; data: ListItemData; sortKey: string }
  | { kind: "discussion"; data: DiscussionItemData; sortKey: string }
  | { kind: "poll"; data: PollData; sortKey: string };

type ArticleApiItem = {
  article_id: string;
  title: string;
  sub_title?: string | null;
  published_at?: string | null;
  tags?: string[];
  author?: {
    display_name?: string | null;
    user_name?: string | null;
    avatar_url?: string | null;
    ranking_point?: number | null;
  } | null;
};

type ArticlesResponse = {
  items?: ArticleApiItem[];
};

type DiscussionsResponse = {
  items?: DiscussionItemData[];
};

type PollsResponse = {
  polls?: PollData[];
};

// --- Helpers ---
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- PollCard component ---
function PollCard({
  poll,
  onVote,
}: {
  poll: PollData;
  onVote: (pollId: number, optionId: number) => void;
}) {
  const hasVoted = poll.userVotedOptionId !== null;
  const isExpired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false;

  return (
    <Card className="overflow-hidden border-border/40 p-4 space-y-3">
      {/* Author row */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
          Poll
        </Badge>
        <Avatar className="h-6 w-6 border border-border/40">
          <AvatarImage src={poll.author.avatar_url} />
          <AvatarFallback className="text-xs">
            {poll.author.display_name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate flex items-center gap-1">
          {poll.author.display_name}
          {getRankIcon(poll.author.ranking_point || 0)}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDate(poll.created_at)}
        </span>
      </div>

      {/* Question */}
      <p className="text-[15px] font-semibold leading-snug">{poll.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const pct =
            poll.totalVotes > 0
              ? Math.round((opt.votes / poll.totalVotes) * 100)
              : 0;
          const isChosen = poll.userVotedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              disabled={hasVoted || isExpired}
              onClick={() => onVote(poll.id, opt.id)}
              className="w-full text-left"
            >
              <div
                className={`relative rounded-md border px-3 py-2 text-sm transition-colors ${
                  isChosen
                    ? "border-primary bg-primary/10"
                    : hasVoted || isExpired
                      ? "border-border/40 bg-muted/30"
                      : "border-border/40 hover:bg-muted/60 cursor-pointer"
                }`}
              >
                {hasVoted && (
                  <Progress
                    value={pct}
                    className="absolute inset-0 h-full rounded-md opacity-10"
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    {isChosen && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                    {opt.option_text}
                  </span>
                  {hasVoted && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {pct}%
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground">
        {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
        {isExpired && " · Closed"}
        {!isExpired && poll.ends_at && ` · Ends ${formatDate(poll.ends_at)}`}
        {` · Author: ${poll.author.ranking_point || 0} points`}
      </p>
    </Card>
  );
}

function FeedItemSkeleton() {
  return (
    <Card className="overflow-hidden border-border/40 p-3.5 h-[190px] flex flex-col justify-between space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-36 rounded" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-4/5 rounded" />
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-4/5 rounded" />
      </div>
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-4 w-10 rounded" />
          <Skeleton className="h-4 w-10 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </div>
    </Card>
  );
}

export default function FeedPage() {
  const { t } = useLanguage();

  // Feed state
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Article interaction state
  const [likedItems, setLikedItems] = useState(new Set<string>());
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set<string>());

  // Discussion modal state
  const [openDiscussionId, setOpenDiscussionId] = useState<string | null>(null);

  // ── Fetch all feed data on mount ──────────────────────────────────────────
  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      try {
        const [articlesRes, discussionsRes, pollsRes] = await Promise.all([
          fetch("/api/articles"),
          fetch("/api/discussions"),
          fetch("/api/polls"),
        ]);

        const [articlesData, discussionsData, pollsData]: [
          ArticlesResponse,
          DiscussionsResponse,
          PollsResponse,
        ] = await Promise.all([
          articlesRes.json(),
          discussionsRes.json(),
          pollsRes.json(),
        ]);

        const entries: FeedEntry[] = [];

        // Convert articles → ListItemData
        (articlesData.items ?? []).forEach((a) => {
          const item: ListItemData = {
            id: a.article_id,
            type: "blog",
            author: {
              name:
                a.author?.display_name ?? a.author?.user_name ?? "Anonymous",
              avatar: a.author?.avatar_url ?? "",
              username: a.author?.user_name ?? "user",
              contributions: 0,
              ranking_point: a.author?.ranking_point ?? 0,
            },
            timestamp: formatDate(a.published_at),
            content: {
              title: a.title,
              description: a.sub_title ?? "",
              tags: a.tags ?? [],
            },
            stats: { likes: 0, comments: 0, views: 0 },
          };
          entries.push({
            kind: "article",
            data: item,
            sortKey: a.published_at ?? "",
          });
        });

        // Add discussions directly (already match DiscussionItemData shape)
        (discussionsData.items ?? []).forEach((d) => {
          entries.push({
            kind: "discussion",
            data: d,
            sortKey: d.created_at ?? "",
          });
        });

        // Add polls
        (pollsData.polls ?? []).forEach((p) => {
          entries.push({
            kind: "poll",
            data: p,
            sortKey: p.created_at ?? "",
          });
        });

        // Sort newest first
        entries.sort((a, b) => (b.sortKey > a.sortKey ? 1 : -1));
        setFeed(entries);
      } catch (err) {
        console.error("Failed to load feed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  // ── Article handlers ──────────────────────────────────────────────────────
  const toggleLike = useCallback((id: string) => {
    setLikedItems((prev) => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedItems((prev) => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });
  }, []);

  // ── Discussion handlers ───────────────────────────────────────────────────
  const handleDiscussionVote = useCallback(
    async (id: string, direction: "up" | "down") => {
      // Optimistic update
      setFeed((prev) =>
        prev.map((entry) => {
          if (entry.kind !== "discussion" || entry.data.id !== id) return entry;
          const oldVote = entry.data.userVote;
          const oldDelta = oldVote === "up" ? 1 : oldVote === "down" ? -1 : 0;
          const newDelta = direction === "up" ? 1 : -1;
          const isToggle = oldVote === direction;
          return {
            ...entry,
            data: {
              ...entry.data,
              votes: entry.data.votes - oldDelta + (isToggle ? 0 : newDelta),
              userVote: isToggle ? null : direction,
            },
          };
        }),
      );
      try {
        await fetch("/api/discussions/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discussionId: id, vote: direction }),
        });
      } catch (err) {
        console.error("Failed to vote on discussion:", err);
      }
    },
    [],
  );

  const handleDiscussionBookmark = useCallback(async (id: string) => {
    // Optimistic update
    setFeed((prev) =>
      prev.map((entry) => {
        if (entry.kind !== "discussion" || entry.data.id !== id) return entry;
        return {
          ...entry,
          data: { ...entry.data, bookmarked: !entry.data.bookmarked },
        };
      }),
    );
    try {
      await fetch("/api/discussions/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discussionId: id }),
      });
    } catch (err) {
      console.error("Failed to bookmark discussion:", err);
    }
  }, []);

  // ── Poll handler ──────────────────────────────────────────────────────────
  const handlePollVote = useCallback(
    async (pollId: number, optionId: number) => {
      // Optimistic update
      setFeed((prev) =>
        prev.map((entry) => {
          if (entry.kind !== "poll" || entry.data.id !== pollId) return entry;
          const alreadyVoted = entry.data.userVotedOptionId !== null;
          const updatedOptions = entry.data.options.map((o) => ({
            ...o,
            votes:
              o.id === optionId
                ? o.votes + 1
                : o.id === entry.data.userVotedOptionId
                  ? o.votes - 1
                  : o.votes,
          }));
          return {
            ...entry,
            data: {
              ...entry.data,
              options: updatedOptions,
              totalVotes: alreadyVoted
                ? entry.data.totalVotes
                : entry.data.totalVotes + 1,
              userVotedOptionId: optionId,
            },
          };
        }),
      );
      try {
        await fetch("/api/polls/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pollId, optionId }),
        });
      } catch (err) {
        console.error("Failed to vote on poll:", err);
      }
    },
    [],
  );

  // ── Discussion modal vote sync ────────────────────────────────────────────
  const handleModalVoteChange = useCallback(
    (id: string, newVote: "up" | "down" | null, newTotal: number) => {
      setFeed((prev) =>
        prev.map((entry) => {
          if (entry.kind !== "discussion" || entry.data.id !== id) return entry;
          return {
            ...entry,
            data: { ...entry.data, votes: newTotal, userVote: newVote },
          };
        }),
      );
    },
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="page-shell-wide py-6 lg:py-3">
        <div className="flex gap-8 xl:gap-12 justify-center">
          {/* Main Feed */}
          <div className="flex-1 max-w-3xl">
            <PostCreationBox />

            {loading ? (
              <div className="space-y-4 mt-4">
                <FeedItemSkeleton />
                <FeedItemSkeleton />
                <FeedItemSkeleton />
                <FeedItemSkeleton />
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {feed.map((entry) => {
                  if (entry.kind === "article") {
                    return (
                      <ListItem
                        key={`article-${entry.data.id}`}
                        item={entry.data}
                        isLiked={likedItems.has(entry.data.id)}
                        isBookmarked={bookmarkedItems.has(entry.data.id)}
                        toggleLike={toggleLike}
                        toggleBookmark={toggleBookmark}
                      />
                    );
                  }
                  if (entry.kind === "discussion") {
                    return (
                      <DiscussionItem
                        key={`discussion-${entry.data.id}`}
                        item={entry.data}
                        onVote={handleDiscussionVote}
                        onBookmark={handleDiscussionBookmark}
                        onClick={(id) => setOpenDiscussionId(id)}
                      />
                    );
                  }
                  if (entry.kind === "poll") {
                    return (
                      <PollCard
                        key={`poll-${entry.data.id}`}
                        poll={entry.data}
                        onVote={handlePollVote}
                      />
                    );
                  }
                  return null;
                })}

                {feed.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-12">
                    No posts yet. Be the first to share something!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[320px] space-y-6 sticky top-8 h-fit">
            <SidebarCarousel />
            <Leaderboard isStudent={true} t={t} />
            <Leaderboard isStudent={false} t={t} />
          </aside>
        </div>
      </div>

      {/* Discussion detail modal */}
      <DiscussionModal
        discussionId={openDiscussionId}
        open={openDiscussionId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenDiscussionId(null);
        }}
        onVoteChange={handleModalVoteChange}
      />
    </div>
  );
}
