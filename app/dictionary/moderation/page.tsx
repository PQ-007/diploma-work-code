"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, FileEdit, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormAlert } from "@/components/common/Form";
import { LanguageBadge } from "@/components/common/LanguageBadge";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/States";
import { UserChip } from "@/components/common/UserChip";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { relativeTime } from "@/lib/utils/relativeTime";

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

  const { t, i18n } = useTranslation();
  const m = (key: string, opts?: Record<string, unknown>) => t(`dictionary.moderation.${key}`, opts);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <PageHeader
        className="!mb-2"
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            {m("title")}
          </span>
        }
        subtitle={m("subtitle")}
        actions={total > 0 && <Badge variant="warning">{m("pending", { count: total })}</Badge>}
      />

      {error && <FormAlert>{error}</FormAlert>}

      {authLoading || (loading && items.length === 0) ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : !error && items.length === 0 ? (
        <EmptyState icon={CheckCircle} title={m("allClear")} description={m("allClearDesc")} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isActioning = actioningIds.has(item.id);
            const isRejectOpen = rejectOpen.has(item.id);
            const closeReject = () =>
              setRejectOpen((prev) => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
              });

            return (
              <article key={item.id} className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={item.is_new_entry ? "brand" : "sky"}>
                    <FileEdit />
                    {item.is_new_entry ? m("newEntry") : m("edit", { number: item.revision_number })}
                  </Badge>
                  <LanguageBadge code={item.language_code} />
                </div>

                <h3 className="mt-2 text-lg font-semibold tracking-tight">{item.term}</h3>
                {item.reading && <p className="text-sm text-muted-foreground">{item.reading}</p>}
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.definition}</p>

                {item.change_summary && (
                  <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    <span className="font-medium">{m("change")}:</span> {item.change_summary}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <UserChip name={item.author.display_name} avatarUrl={item.author.avatar_url} username={item.author.user_name} />
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {relativeTime(item.created_at, i18n.language)}
                  </span>
                </div>

                {isRejectOpen ? (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    <Textarea
                      autoFocus
                      placeholder={m("rejectReason")}
                      value={rejectReasons[item.id] || ""}
                      onChange={(e) => setRejectReasons((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      className="min-h-20"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={closeReject}>
                        {m("cancel")}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleAction(item.id, "reject")}
                        disabled={isActioning || !rejectReasons[item.id]?.trim()}
                      >
                        {isActioning ? <Loader2 className="animate-spin" /> : <XCircle />}
                        {m("confirmReject")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                    <Button
                      variant="destructive-soft"
                      size="sm"
                      onClick={() => setRejectOpen((prev) => new Set(prev).add(item.id))}
                      disabled={isActioning}
                    >
                      <XCircle />
                      {m("reject")}
                    </Button>
                    <Button size="sm" onClick={() => handleAction(item.id, "approve")} disabled={isActioning}>
                      {isActioning ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                      {m("approve")}
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={setPage} />
    </div>
  );
}
