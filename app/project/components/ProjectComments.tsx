"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Reply, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ProjectComment } from "@/app/project/types";

interface CommentsProps {
  slug: string;
  comments: ProjectComment[];
  onCommentAdded: (comment: ProjectComment) => void;
  onCommentDeleted: (id: number) => void;
}

function CommentItem({
  comment,
  slug,
  depth,
  onReplyAdded,
  onCommentDeleted,
}: {
  comment: ProjectComment;
  slug: string;
  depth: number;
  onReplyAdded: (comment: ProjectComment) => void;
  onCommentDeleted: (id: number) => void;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody, parent_id: comment.id }),
      });
      if (res.ok) {
        const data = await res.json();
        onReplyAdded(data.comment);
        setReplyBody("");
        setReplying(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${slug}/comments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: comment.id, body: editBody }),
      });
      if (res.ok) {
        comment.body = editBody;
        setEditing(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/projects/${slug}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: comment.id }),
    });
    if (res.ok) {
      onCommentDeleted(comment.id);
    }
  };

  const isOwn = user?.id === comment.user_id;
  const timeAgo = new Date(comment.created_at).toLocaleDateString();

  return (
    <div
      className={`${depth > 0 ? "ml-6 border-l border-border/50 pl-4" : ""}`}
    >
      <div className="flex gap-3 py-3">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage src={comment.author?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px]">
            {(comment.author?.display_name || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.author?.display_name ||
                comment.author?.user_name ||
                "User"}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={submitting}>
                  {t("common.save") || "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                >
                  {t("common.cancel") || "Cancel"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
              {comment.body}
            </p>
          )}

          {/* Actions */}
          {!editing && user && (
            <div className="flex items-center gap-2 mt-1">
              {depth < 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => setReplying(!replying)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  {t("common.reply") || "Reply"}
                </Button>
              )}

              {isOwn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(true)}>
                      <Pencil className="h-3 w-3 mr-2" />
                      {t("common.edit") || "Edit"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      {t("common.delete") || "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply form */}
          {replying && (
            <div className="mt-2 space-y-2">
              <Textarea
                placeholder={t("project.writeReply") || "Write a reply..."}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={submitting}>
                  {submitting
                    ? t("common.sending") || "Sending..."
                    : t("common.reply") || "Reply"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplying(false)}
                >
                  {t("common.cancel") || "Cancel"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          slug={slug}
          depth={depth + 1}
          onReplyAdded={onReplyAdded}
          onCommentDeleted={onCommentDeleted}
        />
      ))}
    </div>
  );
}

export default function ProjectComments({
  slug,
  comments,
  onCommentAdded,
  onCommentDeleted,
}: CommentsProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const data = await res.json();
        onCommentAdded(data.comment);
        setBody("");
      }
    } finally {
      setSubmitting(false);
    }
  }, [body, slug, onCommentAdded]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {t("project.comments") || "Comments"} ({comments.length})
      </h3>

      {/* New comment form */}
      {user && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="text-xs">
              {(user.user_metadata?.display_name || user.email || "U")
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder={t("project.writeComment") || "Write a comment..."}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !body.trim()}
            >
              {submitting
                ? t("common.sending") || "Sending..."
                : t("project.postComment") || "Post Comment"}
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="divide-y divide-border">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            slug={slug}
            depth={0}
            onReplyAdded={onCommentAdded}
            onCommentDeleted={onCommentDeleted}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          {t("project.noComments") ||
            "No comments yet. Be the first to share your thoughts!"}
        </p>
      )}
    </div>
  );
}
