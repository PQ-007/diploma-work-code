"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronRight,
  Clock,
  FileEdit,
  AlertTriangle,
  Languages,
  ShieldCheck,
} from "lucide-react";

// --- Types ---
interface ModerationItem {
  id: number;
  entry_id: number;
  revision_number: number;
  term: string;
  reading: string | null;
  language_code: string;
  definition: string;
  change_summary: string | null;
  status: string;
  created_at: string;
  is_new_entry: boolean;
  author: {
    id: string;
    display_name: string;
    user_name: string;
    avatar_url: string;
  };
}

const LANG_LABELS: Record<string, string> = {
  mn: "Монгол",
  ja: "日本語",
  en: "English",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DictionaryModerationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Track which items are being actioned
  const [actioningIds, setActioningIds] = useState<Set<number>>(new Set());
  // Track rejection reason per item
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>(
    {},
  );
  // Track which items have the reject panel open
  const [rejectOpen, setRejectOpen] = useState<Set<number>>(new Set());

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [authLoading, user, router]);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dictionary/moderate?page=${page}&limit=20`);
      if (res.status === 403) {
        setError("You don't have permission to access the moderation queue.");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load moderation queue.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (user) fetchQueue();
  }, [user, fetchQueue]);

  const handleAction = async (
    revisionId: number,
    action: "approve" | "reject",
  ) => {
    if (action === "reject" && !rejectReasons[revisionId]?.trim()) {
      // Open reject panel if not open
      setRejectOpen((prev) => new Set(prev).add(revisionId));
      return;
    }

    setActioningIds((prev) => new Set(prev).add(revisionId));
    try {
      const res = await fetch("/api/dictionary/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revision_id: revisionId,
          action,
          reason:
            action === "reject" ? rejectReasons[revisionId]?.trim() : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || `Failed to ${action}`);
        return;
      }
      // Remove from list
      setItems((prev) => prev.filter((item) => item.id !== revisionId));
      setTotal((prev) => prev - 1);
      setRejectOpen((prev) => {
        const next = new Set(prev);
        next.delete(revisionId);
        return next;
      });
    } catch {
      alert(`Failed to ${action} entry.`);
    } finally {
      setActioningIds((prev) => {
        const next = new Set(prev);
        next.delete(revisionId);
        return next;
      });
    }
  };

  if (authLoading || (loading && items.length === 0)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-4xl px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <BookOpen className="h-4 w-4" />
          <Link
            href="/dictionary"
            className="hover:text-foreground transition-colors"
          >
            Dictionary
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Moderation Queue</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Moderation Queue</h1>
            {total > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {total} pending
              </Badge>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-red-500/30 bg-red-500/5 mb-6">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!error && items.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">All clear!</h2>
            <p className="text-sm text-muted-foreground">
              No pending entries need review right now.
            </p>
          </div>
        )}

        {/* Queue items */}
        <div className="space-y-4">
          {items.map((item) => {
            const isActioning = actioningIds.has(item.id);
            const isRejectOpen = rejectOpen.has(item.id);

            return (
              <Card key={item.id} className="border-border/40">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Meta badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge
                          className={
                            item.is_new_entry
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          }
                        >
                          {item.is_new_entry ? (
                            <>
                              <FileEdit className="h-3 w-3 mr-1" /> New Entry
                            </>
                          ) : (
                            <>
                              <FileEdit className="h-3 w-3 mr-1" /> Edit (Rev{" "}
                              {item.revision_number})
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Languages className="h-3 w-3 mr-1" />
                          {LANG_LABELS[item.language_code] ||
                            item.language_code}
                        </Badge>
                      </div>

                      {/* Term */}
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.term}
                      </h3>
                      {item.reading && (
                        <p className="text-sm text-muted-foreground">
                          {item.reading}
                        </p>
                      )}

                      {/* Definition preview */}
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {item.definition}
                      </p>

                      {/* Change summary */}
                      {item.change_summary && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Change: {item.change_summary}
                        </p>
                      )}

                      {/* Author + time */}
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <Link
                          href={`/profile/${item.author.user_name}`}
                          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={item.author.avatar_url} />
                            <AvatarFallback className="text-[8px]">
                              {item.author.display_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {item.author.display_name}
                        </Link>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleAction(item.id, "approve")}
                        disabled={isActioning}
                      >
                        {isActioning ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1.5" /> Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                          if (isRejectOpen) {
                            handleAction(item.id, "reject");
                          } else {
                            setRejectOpen((prev) => new Set(prev).add(item.id));
                          }
                        }}
                        disabled={isActioning}
                      >
                        <XCircle className="h-4 w-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </div>

                  {/* Reject reason input */}
                  {isRejectOpen && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Rejection reason (required)..."
                          value={rejectReasons[item.id] || ""}
                          onChange={(e) =>
                            setRejectReasons((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="min-h-[60px]"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRejectOpen((prev) => {
                                const next = new Set(prev);
                                next.delete(item.id);
                                return next;
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(item.id, "reject")}
                            disabled={
                              isActioning || !rejectReasons[item.id]?.trim()
                            }
                          >
                            {isActioning ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1.5" />
                            )}
                            Confirm Reject
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
