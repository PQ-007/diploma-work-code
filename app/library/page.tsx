"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

const TAB_CONFIG = [
  { value: "all", label: "All", icon: LibraryIcon },
  { value: "articles", label: "Articles", icon: FileText },
  { value: "questions", label: "Questions", icon: HelpCircle },
  { value: "projects", label: "Projects", icon: FolderKanban },
  { value: "flashcards", label: "Flashcards", icon: Brain },
] as const;

const TYPE_COLORS: Record<string, string> = {
  article: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  question: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  project: "bg-green-500/15 text-green-600 dark:text-green-400",
  flashcard: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
};

const TYPE_LABELS: Record<string, string> = {
  article: "Article",
  question: "Question",
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
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unpublishedOnly, setUnpublishedOnly] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Fetch library items ──
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === "all" ? "all" : activeTab;
      const res = await fetch(`/api/library?type=${typeParam}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (user) fetchItems();
    else setLoading(false);
  }, [user, fetchItems]);

  // ── Delete item ──
  const handleDelete = useCallback(
    async (item: LibraryItem) => {
      if (deleting) return;
      setDeleting(item.id);

      // Optimistic removal
      const prevItems = items;
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (selectedId === item.id) setSelectedId(null);

      try {
        const res = await fetch("/api/library", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, type: item.type }),
        });
        if (!res.ok) {
          setItems(prevItems);
        }
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
      <div className="mx-auto py-6 lg:py-3 max-w-7xl">
        {/* Page Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-foreground">Draft List</h1>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => setUnpublishedOnly((p) => !p)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {unpublishedOnly ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              Show unpublished drafts only
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-5">
          <TabsList className="h-9 bg-muted/40 backdrop-blur-sm gap-1">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const count =
                tab.value === "all"
                  ? items.length
                  : items.filter((i) =>
                      tab.value === "articles"
                        ? i.type === "article"
                        : tab.value === "questions"
                          ? i.type === "question"
                          : tab.value === "projects"
                            ? i.type === "project"
                            : i.type === "flashcard",
                    ).length;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1 text-xs"
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 text-[10px] bg-muted-foreground/15 rounded-full px-1.5">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Two-column layout */}
        <div className="flex gap-0 border border-border rounded-lg overflow-hidden bg-card min-h-[70vh]">
          {/* ─── Left Panel: Item List ─── */}
          <div className="w-full md:w-[420px] lg:w-[460px] border-r border-border flex-shrink-0">
            <ScrollArea className="h-[70vh]">
              {loading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-full rounded" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-7 w-20 rounded" />
                        <Skeleton className="h-7 w-28 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
                  <LibraryIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No drafts found
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Create an article, question, or project to see it here
                  </p>
                </div>
              ) : (
                <div>
                  {filteredItems.map((item, idx) => (
                    <div key={item.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(item.id)}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedId(item.id)}
                        className={`w-full text-left p-4 transition-colors hover:bg-muted/50 cursor-pointer ${
                          selectedId === item.id
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "border-l-2 border-l-transparent"
                        }`}
                      >
                        {/* Type badge + time */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 font-medium ${TYPE_COLORS[item.type] || ""}`}
                          >
                            {TYPE_LABELS[item.type] || item.type}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {relativeTime(item.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                          {item.title || "Untitled"}
                        </h3>

                        {/* Preview */}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {item.preview || "No content yet"}
                        </p>

                        {/* Tags */}
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 font-normal"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = item.editUrl;
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-3 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                            disabled={deleting === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                          >
                            {deleting === item.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            Delete Draft
                          </Button>
                        </div>
                      </div>
                      {idx < filteredItems.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ─── Right Panel: Preview ─── */}
          <div className="hidden md:flex flex-1 flex-col">
            {selectedItem ? (
              <ScrollArea className="h-[70vh]">
                <div className="p-6 lg:p-8">
                  {/* Type badge */}
                  <div className="mb-4">
                    <Badge
                      variant="secondary"
                      className={`text-xs px-2 py-0.5 ${TYPE_COLORS[selectedItem.type] || ""}`}
                    >
                      {TYPE_LABELS[selectedItem.type] || selectedItem.type}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-bold text-foreground leading-tight mb-4">
                    {selectedItem.title || "Untitled"}
                  </h1>

                  {/* Tags */}
                  {selectedItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {selectedItem.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Separator className="mb-6" />

                  {/* Body content rendered as simple markdown-like text */}
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
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
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
// Renders markdown body with basic formatting for preview purposes

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Headings
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

        // Code block markers
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

        // Blockquote
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

        // List items
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li key={i} className="ml-4 list-disc">
              {trimmed.slice(2)}
            </li>
          );
        }

        // Empty line
        if (!trimmed) {
          return <div key={i} className="h-2" />;
        }

        // Regular paragraph
        return (
          <p key={i} className="leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
