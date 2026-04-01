"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  HelpCircle,
  FolderKanban,
  Brain,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Library as LibraryIcon,
  Clock,
  MessageSquare,
} from "lucide-react";

// ── Types ──

interface LibraryItem {
  id: string;
  type: "article" | "question" | "project" | "flashcard";
  title: string;
  body: string;
  preview: string;
  tags: string[];
  createdAt: string;
  editUrl: string;
  status?: string;
}

const TAB_CONFIG = [
  { value: "all", label: "All", icon: LibraryIcon },
  { value: "articles", label: "Article", icon: FileText },
  { value: "questions", label: "Q&A", icon: HelpCircle },
  { value: "projects", label: "Projects", icon: FolderKanban },
  { value: "flashcards", label: "Flashcards", icon: Brain },
] as const;

const TYPE_COLORS: Record<string, string> = {
  article: "bg-blue-500/20 text-blue-400",
  question: "bg-orange-500/20 text-orange-400",
  project: "bg-green-500/20 text-green-400",
  flashcard: "bg-purple-500/20 text-purple-400",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  article: FileText,
  question: MessageSquare,
  project: FolderKanban,
  flashcard: Brain,
};

const TYPE_LABELS: Record<string, string> = {
  article: "Article",
  question: "Discussion",
  project: "Project",
  flashcard: "Flashcard",
};

// ── Helpers ──

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return `${diffMonth}mo ago`;
}

// ── Component ──

export default function LibraryPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftsOnly, setDraftsOnly] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // draftsOnly toggle only affects articles (discussions have no draft status)
  const showDraftFilter =
    activeTab === "all" || activeTab === "articles";

  // ── Fetch library items ──
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === "all" ? "all" : activeTab;
      const statusParam = showDraftFilter && draftsOnly ? "draft" : "all";
      const res = await fetch(
        `/api/library?type=${typeParam}&status=${statusParam}`,
      );
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [activeTab, draftsOnly, showDraftFilter]);

  useEffect(() => {
    if (user) fetchItems();
    else setLoading(false);
  }, [user, fetchItems]);

  // ── Delete item ──
  const handleDelete = useCallback(
    async (item: LibraryItem) => {
      if (deleting) return;
      setDeleting(item.id);

      const prevItems = items;
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (selectedId === item.id) setSelectedId(null);

      try {
        const res = await fetch("/api/library", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, type: item.type }),
        });
        if (!res.ok) setItems(prevItems);
      } catch {
        setItems(prevItems);
      } finally {
        setDeleting(null);
      }
    },
    [items, selectedId, deleting],
  );

  // ── Filter based on tab ──
  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "articles") return item.type === "article";
    if (activeTab === "questions") return item.type === "question";
    if (activeTab === "projects") return item.type === "project";
    if (activeTab === "flashcards") return item.type === "flashcard";
    return true;
  });

  const selectedItem = items.find((i) => i.id === selectedId) || null;

  // ── Not logged in state ──
  if (!user && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <LibraryIcon className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Sign in to view your library
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-5 max-w-7xl px-4">
        {/* ── Header ── */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-foreground">Drafts List</h1>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => setDraftsOnly((p) => !p)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {draftsOnly ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              Show only unposted drafts
            </button>
          </div>
        </div>

        {/* ── Underline Tabs ── */}
        <div className="flex items-center gap-0 border-b border-border mb-0">
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setSelectedId(null);
                }}
                className={`relative px-5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex border-x border-b border-border overflow-hidden bg-card min-h-[72vh]">
          {/* ─── Left Panel: Item List ─── */}
          <div className="w-full md:w-[440px] lg:w-[480px] border-r border-border flex-shrink-0">
            <ScrollArea className="h-[72vh]">
              {loading ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-20 rounded" />
                        <Skeleton className="h-3.5 w-20 rounded" />
                      </div>
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3.5 w-full rounded" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-8 w-20 rounded" />
                        <Skeleton className="h-8 w-28 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
                  <LibraryIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No drafts found
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    Create an article, question, or project to see it here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredItems.map((item) => {
                    const isSelected = selectedId === item.id;
                    const Icon = TYPE_ICONS[item.type] || FileText;
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(item.id)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setSelectedId(item.id)
                        }
                        className={`w-full text-left p-4 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-emerald-500/10"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        {/* Type badge + time */}
                        <div className="flex items-center gap-2.5 mb-2">
                          <Badge
                            variant="secondary"
                            className={`text-[11px] px-2 py-0.5 font-medium gap-1 ${TYPE_COLORS[item.type] || ""}`}
                          >
                            <Icon className="h-3 w-3" />
                            {TYPE_LABELS[item.type] || item.type}
                          </Badge>
                          {item.status === "published" && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 font-medium bg-emerald-500/15 text-emerald-500"
                            >
                              Published
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {relativeTime(item.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-1 mb-1">
                          {item.title || (
                            <span className="text-muted-foreground font-normal">
                              Title not set
                            </span>
                          )}
                        </h3>

                        {/* Preview */}
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                          {item.preview || (
                            <span className="text-muted-foreground/50">
                              Body not set
                            </span>
                          )}
                        </p>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-4 gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = item.editUrl;
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-4 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/40"
                            disabled={deleting === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                          >
                            {deleting === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Delete Draft
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ─── Right Panel: Preview ─── */}
          <div className="hidden md:flex flex-1 flex-col">
            {selectedItem ? (
              <ScrollArea className="h-[72vh]">
                <div className="p-8">
                  {/* Type badge */}
                  <div className="mb-5">
                    <Badge
                      variant="secondary"
                      className={`text-xs px-2.5 py-1 font-medium gap-1.5 ${TYPE_COLORS[selectedItem.type] || ""}`}
                    >
                      {(() => {
                        const Icon =
                          TYPE_ICONS[selectedItem.type] || FileText;
                        return <Icon className="h-3.5 w-3.5" />;
                      })()}
                      {TYPE_LABELS[selectedItem.type] || selectedItem.type}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-bold text-foreground leading-tight mb-5">
                    {selectedItem.title || "Untitled"}
                  </h1>

                  {/* Tags */}
                  {selectedItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedItem.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs px-3 py-1 rounded-md"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Separator className="mb-6" />

                  {/* Body content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {selectedItem.body ? (
                      <MarkdownPreview content={selectedItem.body} />
                    ) : (
                      <p className="text-muted-foreground italic">
                        No content yet
                      </p>
                    )}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-6">
                <div>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Select an item to preview
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Simple Markdown Preview ──

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="text-lg font-bold mt-6 mb-2">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="text-xl font-bold mt-6 mb-2">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={i} className="text-2xl font-bold mt-6 mb-2">
              {trimmed.slice(2)}
            </h1>
          );
        }

        if (trimmed.startsWith("```")) {
          return (
            <div
              key={i}
              className="bg-muted/60 rounded px-3 py-1 text-xs font-mono text-muted-foreground"
            >
              {trimmed.slice(3) || "code"}
            </div>
          );
        }

        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground italic"
            >
              {trimmed.slice(2)}
            </blockquote>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li key={i} className="ml-4 list-disc">
              {trimmed.slice(2)}
            </li>
          );
        }

        if (!trimmed) {
          return <div key={i} className="h-2" />;
        }

        return (
          <p key={i} className="leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
