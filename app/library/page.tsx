"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  MessageSquare,
  Layers,
  Globe,
  Lock,
  ArrowRight,
  BookOpen,
  Plus,
  SwatchBook,
} from "lucide-react";

// ── Types ──

interface LibraryItem {
  id: string;
  type: "article" | "question" | "project" | "deck";
  title: string;
  body: string;
  preview: string;
  tags: string[];
  createdAt: string;
  editUrl: string;
  status?: string;
  cardCount?: number;
  deckSlug?: string;
  cardPreviews?: Array<{ front: string; back: string }>;
}

const TAB_CONFIG = [
  { value: "all", label: "All", icon: LibraryIcon },
  { value: "articles", label: "Articles", icon: FileText },
  { value: "questions", label: "Q&A", icon: HelpCircle },
  { value: "projects", label: "Projects", icon: FolderKanban },
  { value: "decks", label: "Decks", icon: SwatchBook },
] as const;

const TYPE_COLORS: Record<string, string> = {
  article: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  question: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  project: "bg-green-500/15 text-green-400 border-green-500/20",
  deck: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  article: FileText,
  question: MessageSquare,
  project: FolderKanban,
  deck: SwatchBook,
};

const TYPE_LABELS: Record<string, string> = {
  article: "Article",
  question: "Discussion",
  project: "Project",
  deck: "Deck",
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
  const [draftsOnly, setDraftsOnly] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryItem | null>(null);

  const showDraftFilter = activeTab === "all" || activeTab === "articles";

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
    async () => {
      if (!deleteTarget || deleting) return;
      const item = deleteTarget;
      setDeleteTarget(null);
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
    [items, selectedId, deleting, deleteTarget],
  );

  // ── Filter based on tab ──
  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "articles") return item.type === "article";
    if (activeTab === "questions") return item.type === "question";
    if (activeTab === "projects") return item.type === "project";
    if (activeTab === "decks") return item.type === "deck";
    return true;
  });

  const selectedItem = items.find((i) => i.id === selectedId) || null;

  // ── Counts per type ──
  const counts = {
    all: items.length,
    articles: items.filter((i) => i.type === "article").length,
    questions: items.filter((i) => i.type === "question").length,
    projects: items.filter((i) => i.type === "project").length,
    flashcards: items.filter((i) => i.type === "deck").length,
  };

  // ── Not logged in ──
  if (!user && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <LibraryIcon className="h-12 w-12 mx-auto text-muted-foreground/40" />
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
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <LibraryIcon className="h-6 w-6" />
              My Library
            </h1>
            
          </div>
          <div className="flex items-center gap-2">
            {showDraftFilter && (
              <button
                onClick={() => setDraftsOnly((p) => !p)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  draftsOnly
                    ? "bg-muted border-border text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {draftsOnly ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                Drafts only
              </button>
            )}
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/flashcards">
                <Brain className="h-3.5 w-3.5" />
                Flashcards
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Tabs ── */}
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
                className={`relative flex items-center gap-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
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

          {/* ─── Left Panel ─── */}
          <div className="w-full md:w-[420px] lg:w-[460px] border-r border-border flex-shrink-0">
            <ScrollArea className="h-[72vh]">
              {loading ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded" />
                        <Skeleton className="h-3.5 w-24 rounded" />
                      </div>
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3.5 w-full rounded" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-7 w-16 rounded" />
                        <Skeleton className="h-7 w-16 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <EmptyState tab={activeTab} />
              ) : (
                <div className="divide-y divide-border">
                  {filteredItems.map((item) => (
                    <LibraryListItem
                      key={item.id}
                      item={item}
                      isSelected={selectedId === item.id}
                      deleting={deleting === item.id}
                      onSelect={() => setSelectedId(item.id)}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ─── Right Panel: Preview ─── */}
          <div className="hidden md:flex flex-1 flex-col overflow-hidden">
            {selectedItem ? (
              <ScrollArea className="h-[72vh]">
                <RightPanel item={selectedItem} />
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-6">
                <div>
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Select an item to preview
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Click any item on the left
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.deleteItemTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.deleteItemDescription", {
                title: deleteTarget?.title?.trim() || t("common.untitled"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── List Item ──

function LibraryListItem({
  item,
  isSelected,
  deleting,
  onSelect,
  onDelete,
}: {
  item: LibraryItem;
  isSelected: boolean;
  deleting: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICONS[item.type] || FileText;
  const isDeck = item.type === "deck";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`w-full text-left p-4 cursor-pointer transition-colors ${
        isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/40 border-l-2 border-l-transparent"
      }`}
    >
      {/* Top row: badge + time */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="secondary"
            className={`text-[10px] px-2 py-0.5 font-semibold gap-1 shrink-0 border ${TYPE_COLORS[item.type] || ""}`}
          >
            <Icon className="h-3 w-3" />
            {TYPE_LABELS[item.type] || item.type}
          </Badge>
          {item.status === "published" && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
              Published
            </Badge>
          )}
          {isDeck && item.status === "public" && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-sky-500/15 text-sky-400 border border-sky-500/20 gap-0.5">
              <Globe className="h-2.5 w-2.5" />
              Public
            </Badge>
          )}
          {isDeck && item.status === "private" && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border border-border gap-0.5">
              <Lock className="h-2.5 w-2.5" />
              Private
            </Badge>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {relativeTime(item.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1 mb-1">
        {item.title || <span className="text-muted-foreground font-normal italic">Untitled</span>}
      </h3>

      {/* Deck card count or preview text */}
      {isDeck ? (
        <div className="flex items-center gap-1.5 mb-3">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {item.cardCount ?? 0} {item.cardCount === 1 ? "card" : "cards"}
          </span>
          {item.cardPreviews && item.cardPreviews.length > 0 && (
            <span className="text-xs text-muted-foreground/60 line-clamp-1 ml-1">
              · {item.cardPreviews.map((p) => p.front).join(", ")}
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
          {item.preview || <span className="italic text-muted-foreground/50">No preview</span>}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          asChild={!isDeck}
          variant="outline"
          size="sm"
          className="h-7 text-xs px-3 gap-1"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDeck) return;
            window.location.href = item.editUrl;
          }}
        >
          {isDeck ? (
            <span className="flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              Open
            </span>
          ) : (
            <Link href={item.editUrl} onClick={(e) => e.stopPropagation()}>
              <Pencil className="h-3 w-3" />
              Edit
            </Link>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-3 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={deleting}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          {deleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Delete
        </Button>
      </div>
    </div>
  );
}

// ── Right Panel ──

function RightPanel({ item }: { item: LibraryItem }) {
  const Icon = TYPE_ICONS[item.type] || FileText;
  const isDeck = item.type === "deck";

  return (
    <div className="p-8">
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-5">
        <Badge
          variant="secondary"
          className={`text-xs px-2.5 py-1 font-semibold gap-1.5 border ${TYPE_COLORS[item.type] || ""}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {TYPE_LABELS[item.type] || item.type}
        </Badge>
        {isDeck && (
          item.status === "public" ? (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/20 gap-1">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-muted text-muted-foreground border border-border gap-1">
              <Lock className="h-3 w-3" />
              Private
            </Badge>
          )
        )}
        {item.status === "published" && !isDeck && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
            Published
          </Badge>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">
        {item.title || "Untitled"}
      </h1>

      {/* Deck stats */}
      {isDeck && (
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span className="font-medium text-foreground">{item.cardCount ?? 0}</span>
            {(item.cardCount ?? 0) === 1 ? "card" : "cards"}
          </div>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-sm text-muted-foreground">
            Updated {relativeTime(item.createdAt)}
          </span>
        </div>
      )}

      {/* Tags (non-deck) */}
      {!isDeck && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-2.5 py-1">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Separator className="mb-6" />

      {/* Deck card previews */}
      {isDeck && (
        <div>
          {item.body && (
            <p className="text-sm text-muted-foreground mb-5">{item.body}</p>
          )}

          {item.cardPreviews && item.cardPreviews.length > 0 ? (
            <div className="space-y-3 mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sample Cards
              </p>
              {item.cardPreviews.map((card, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground">{card.front}</p>
                  <p className="text-sm text-muted-foreground mt-1.5 pt-1.5 border-t border-border/50">
                    {card.back}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border border-dashed border-border">
              <Brain className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No cards yet</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Open the deck to add your first card</p>
            </div>
          )}

          <Button asChild className="w-full gap-2" size="sm">
            <Link href={item.editUrl}>
              <ArrowRight className="h-4 w-4" />
              Open Deck
            </Link>
          </Button>
        </div>
      )}

      {/* Article / Discussion body */}
      {!isDeck && (
        <div>
          {item.body ? (
            <MarkdownPreview content={item.body} />
          ) : (
            <p className="text-muted-foreground italic text-sm">No content yet</p>
          )}
          <div className="mt-6">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={item.editUrl}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty State ──

function EmptyState({ tab }: { tab: string }) {
  const configs: Record<string, { icon: React.ElementType; title: string; sub: string; href?: string; cta?: string }> = {
    all: {
      icon: LibraryIcon,
      title: "Your library is empty",
      sub: "Create an article, ask a question, or start a flashcard deck.",
    },
    articles: {
      icon: FileText,
      title: "No articles yet",
      sub: "Write your first article to share knowledge.",
      href: "/article/create",
      cta: "Write an article",
    },
    questions: {
      icon: MessageSquare,
      title: "No discussions yet",
      sub: "Ask a question to get the conversation going.",
      href: "/discussions",
      cta: "Ask a question",
    },
    projects: {
      icon: FolderKanban,
      title: "No projects yet",
      sub: "Showcase your work by creating a project.",
    },
    flashcards: {
      icon: Brain,
      title: "No flashcard decks yet",
      sub: "Create a deck to start studying with flashcards.",
      href: "/flashcards",
      cta: "Go to Flashcards",
    },
  };

  const cfg = configs[tab] ?? configs.all;
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
      <Icon className="h-10 w-10 text-muted-foreground/25 mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">{cfg.title}</p>
      <p className="text-xs text-muted-foreground/70 max-w-xs">{cfg.sub}</p>
      {cfg.href && cfg.cta && (
        <Button asChild size="sm" variant="outline" className="mt-4 gap-1.5">
          <Link href={cfg.href}>
            <Plus className="h-3.5 w-3.5" />
            {cfg.cta}
          </Link>
        </Button>
      )}
    </div>
  );
}

// ── Simple Markdown Preview ──

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        if (trimmed.startsWith("### "))
          return <h3 key={i} className="text-base font-bold mt-5 mb-1">{trimmed.slice(4)}</h3>;
        if (trimmed.startsWith("## "))
          return <h2 key={i} className="text-lg font-bold mt-5 mb-1">{trimmed.slice(3)}</h2>;
        if (trimmed.startsWith("# "))
          return <h1 key={i} className="text-xl font-bold mt-5 mb-1">{trimmed.slice(2)}</h1>;
        if (trimmed.startsWith("```"))
          return (
            <div key={i} className="bg-muted/60 rounded px-3 py-1 text-xs font-mono text-muted-foreground">
              {trimmed.slice(3) || "code"}
            </div>
          );
        if (trimmed.startsWith("> "))
          return (
            <blockquote key={i} className="border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground italic">
              {trimmed.slice(2)}
            </blockquote>
          );
        if (trimmed.startsWith("- ") || trimmed.startsWith("* "))
          return <li key={i} className="ml-4 list-disc text-muted-foreground">{trimmed.slice(2)}</li>;
        if (!trimmed)
          return <div key={i} className="h-2" />;

        return <p key={i} className="leading-relaxed text-muted-foreground">{trimmed}</p>;
      })}
    </div>
  );
}
