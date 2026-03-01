"use client";

import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowBigUp,
  ArrowBigDown,
  Bookmark,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Pin,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CommentAuthor {
  id: string;
  display_name: string;
  user_name: string;
  avatar_url: string;
}

interface Comment {
  id: string;
  body: string;
  parent_comment_id: string | null;
  created_at: string;
  author: CommentAuthor;
}

interface DiscussionDetail {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  answered: boolean;
  created_at: string;
  author: CommentAuthor;
  tags: string[];
  votes: number;
  userVote: "up" | "down" | null;
  bookmarked: boolean;
}

interface DiscussionModalProps {
  discussionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoteChange?: (
    id: string,
    newVote: "up" | "down" | null,
    newTotal: number,
  ) => void;
  onBookmarkChange?: (id: string, bookmarked: boolean) => void;
  onCommentCountChange?: (id: string, delta: number) => void;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DiscussionModal({
  discussionId,
  open,
  onOpenChange,
  onVoteChange,
  onBookmarkChange,
  onCommentCountChange,
}: DiscussionModalProps) {
  const { user } = useAuth();
  const [disc, setDisc] = useState<DiscussionDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!discussionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/discussions/${discussionId}`);
      if (res.ok) {
        const data = await res.json();
        setDisc(data.discussion);
        setComments(data.comments);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [discussionId]);

  useEffect(() => {
    if (open && discussionId) fetchDetail();
  }, [open, discussionId, fetchDetail]);

  const handleVote = async (direction: "up" | "down") => {
    if (!disc || !user || voteLoading) return;
    setVoteLoading(true);
    try {
      const res = await fetch("/api/discussions/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discussionId: disc.id, vote: direction }),
      });
      if (res.ok) {
        const { userVote } = await res.json();
        const oldVote = disc.userVote;
        let delta = 0;
        // Calculate delta for vote total
        if (oldVote === direction) {
          // Toggled off
          delta = direction === "up" ? -1 : 1;
        } else if (oldVote) {
          // Switched
          delta = direction === "up" ? 2 : -2;
        } else {
          // New vote
          delta = direction === "up" ? 1 : -1;
        }
        const newTotal = disc.votes + delta;
        setDisc({ ...disc, userVote, votes: newTotal });
        onVoteChange?.(disc.id, userVote, newTotal);
      }
    } catch {
      // ignore
    } finally {
      setVoteLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!disc || !user) return;
    try {
      const res = await fetch("/api/discussions/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discussionId: disc.id }),
      });
      if (res.ok) {
        const { bookmarked } = await res.json();
        setDisc({ ...disc, bookmarked });
        onBookmarkChange?.(disc.id, bookmarked);
      }
    } catch {
      // ignore
    }
  };

  const handleComment = async () => {
    if (!disc || !user || !commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/discussions/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discussionId: disc.id, body: commentText }),
      });
      if (res.ok) {
        const { comment } = await res.json();
        setComments((prev) => [...prev, comment]);
        setCommentText("");
        onCommentCountChange?.(disc.id, 1);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        {loading || !disc ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/40">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border/40">
                  <AvatarImage src={disc.author.avatar_url} />
                  <AvatarFallback className="text-sm font-medium">
                    {disc.author.display_name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {disc.author.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{disc.author.user_name}
                    </span>
                    {disc.pinned && (
                      <Pin className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(disc.created_at)}
                  </span>
                </div>
                {disc.answered && (
                  <Badge
                    variant="secondary"
                    className="text-xs border border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Answered
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base font-bold mt-2 leading-snug">
                {disc.title}
              </DialogTitle>
            </DialogHeader>

            {/* Body + Tags */}
            <div className="px-5 py-3 border-b border-border/40">
              {disc.body && (
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {disc.body}
                </p>
              )}
              {disc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {disc.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-2 py-0.5 text-xs font-normal border border-border/40"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Vote / Bookmark bar */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${disc.userVote === "up" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => handleVote("up")}
                    disabled={!user}
                  >
                    <ArrowBigUp
                      className="h-5 w-5"
                      fill={disc.userVote === "up" ? "currentColor" : "none"}
                    />
                  </Button>
                  <span className="text-sm font-semibold tabular-nums min-w-[2ch] text-center">
                    {disc.votes}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${disc.userVote === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => handleVote("down")}
                    disabled={!user}
                  >
                    <ArrowBigDown
                      className="h-5 w-5"
                      fill={disc.userVote === "down" ? "currentColor" : "none"}
                    />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{comments.length}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${disc.bookmarked ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"}`}
                    onClick={handleBookmark}
                    disabled={!user}
                  >
                    <Bookmark
                      className="h-4 w-4"
                      fill={disc.bookmarked ? "currentColor" : "none"}
                    />
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-5 py-3 space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No comments yet. Be the first to reply!
                  </p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                        <AvatarImage src={c.author.avatar_url} />
                        <AvatarFallback className="text-[10px]">
                          {c.author.display_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted/50 rounded-xl px-3 py-2">
                          <span className="text-xs font-semibold">
                            {c.author.display_name}
                          </span>
                          <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap">
                            {c.body}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground ml-3 mt-0.5">
                          {timeAgo(c.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Comment Input */}
            {user && (
              <div className="px-5 py-3 border-t border-border/40 flex items-end gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[40px] max-h-[120px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={handleComment}
                  disabled={!commentText.trim() || submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
