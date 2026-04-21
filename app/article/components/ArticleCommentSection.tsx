"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CornerDownRight,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommentAuthor {
  id: string;
  display_name: string;
  user_name: string;
  avatar_url: string;
}

export interface ArticleComment {
  id: number;
  body: string;
  parent_comment_id: number | null;
  created_at: string;
  author: CommentAuthor;
}

interface ArticleCommentSectionProps {
  articleId: number;
}

export interface ArticleCommentSectionHandle {
  focus: () => void;
}

function timeAgo(
  dateStr: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t("articles.detail.comments.justNow");
  if (diffMin < 60)
    return t("articles.detail.comments.minutesAgo", { count: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)
    return t("articles.detail.comments.hoursAgo", { count: diffH });
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30)
    return t("articles.detail.comments.daysAgo", { count: diffD });
  return d.toLocaleDateString();
}

function CommentItem({
  comment,
  replies,
  currentUserId,
  onReply,
  onDelete,
}: {
  comment: ArticleComment;
  replies: ArticleComment[];
  currentUserId: string | null;
  onReply: (parentId: number) => void;
  onDelete: (commentId: number) => void;
}) {
  const { t } = useLanguage();
  const isOwn = currentUserId === comment.author.id;

  return (
    <div className="group">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 mt-0.5 shrink-0">
          <AvatarImage src={comment.author.avatar_url} />
          <AvatarFallback className="text-xs">
            {comment.author.display_name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{comment.author.display_name}</span>
            <span className="text-xs text-muted-foreground">
              @{comment.author.user_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(comment.created_at, t)}
            </span>
          </div>
          <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
            {comment.body}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onReply(comment.id)}
            >
              <CornerDownRight className="h-3 w-3 mr-1" />
              {t("articles.detail.comments.reply")}
            </Button>
            {isOwn && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t("articles.detail.comments.delete")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="ml-10 mt-3 space-y-3 border-l-2 border-border/40 pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]} // Only one level deep for now
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const ArticleCommentSection = forwardRef<
  ArticleCommentSectionHandle,
  ArticleCommentSectionProps
>(function ArticleCommentSection({ articleId }, ref) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focus() {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => textareaRef.current?.focus(), 300);
    },
  }));

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/comments?articleId=${articleId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/articles/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          body: body.trim(),
          parentCommentId: replyTo,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setBody("");
        setReplyTo(null);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      const res = await fetch("/api/articles/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // ignore
    }
  };

  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const repliesByParent = comments.reduce(
    (acc, c) => {
      if (c.parent_comment_id) {
        (acc[c.parent_comment_id] ||= []).push(c);
      }
      return acc;
    },
    {} as Record<number, ArticleComment[]>,
  );

  const replyComment = replyTo ? comments.find((c) => c.id === replyTo) : null;

  return (
    <div ref={sectionRef}>
      <Card className="bg-card/50 border-border/60 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("articles.detail.comments.title", { count: comments.length })}
            </span>
          </div>

          {/* Comment input */}
          {user ? (
            <div className="space-y-3 mb-6">
              {replyTo && replyComment && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  <CornerDownRight className="h-3 w-3" />
                  <span>
                    {t("articles.detail.comments.replyingTo")}{" "}
                    <span className="font-medium text-foreground">
                      {replyComment.author.display_name}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 ml-auto text-xs px-1"
                    onClick={() => setReplyTo(null)}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              )}
              <Textarea
                ref={textareaRef}
                placeholder={t("articles.detail.comments.writeComment")}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {t("articles.detail.comments.submitHint")}
                </span>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!body.trim() || submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  {replyTo
                    ? t("articles.detail.comments.reply")
                    : t("articles.detail.comments.comment")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mb-6 p-4 rounded-md bg-muted/30 text-center">
              {t("articles.detail.comments.signInToComment")}
            </div>
          )}

          <Separator className="mb-5" />

          {/* Comments list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : topLevel.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              {t("articles.detail.comments.noComments")}
            </div>
          ) : (
            <div className="space-y-5">
              {topLevel.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={repliesByParent[comment.id] || []}
                  currentUserId={user?.id || null}
                  onReply={(parentId) => setReplyTo(parentId)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

export default ArticleCommentSection;
