"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Brain, Plus, Compass, Library, Target, ChevronRight, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import DeckCard from "@/components/flashcards/DeckCard";
import DeckFormDialog from "@/components/flashcards/DeckFormDialog";
import FlashcardFormDialog from "@/components/flashcards/FlashcardFormDialog";
import type { Deck, DeckWithCount } from "@/lib/flashcards/types";

type Filter = "all" | "private" | "public";

export default function FlashcardsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState<DeckWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeckWithCount | null>(null);
  const [dueToday, setDueToday] = useState<number>(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/decks");
      if (res.ok) {
        const json = await res.json();
        setDecks(json.items || []);
      }
    } catch {
      toast.error("Failed to load decks");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDueCount = useCallback(async () => {
    try {
      const res = await fetch("/api/flashcards/stats");
      if (res.ok) {
        const json = await res.json();
        setDueToday(json.due_today ?? 0);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/signin");
      return;
    }
    fetchDecks();
    fetchDueCount();
  }, [user, authLoading, router, fetchDecks, fetchDueCount]);

  const filtered = decks.filter((d) => {
    if (filter === "private") return !d.is_public;
    if (filter === "public") return d.is_public;
    return true;
  });

  const tabCount = (v: Filter) => {
    if (v === "all") return decks.length;
    if (v === "private") return decks.filter((d) => !d.is_public).length;
    return decks.filter((d) => d.is_public).length;
  };

  const handleDeckSaved = (deck: Deck) => {
    setDecks((prev) => {
      const existing = prev.findIndex((d) => d.id === deck.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { ...copy[existing], ...deck };
        return copy;
      }
      return [{ ...deck, card_count: 0 }, ...prev];
    });
  };

  const handleToggleVisibility = async (deck: DeckWithCount) => {
    const prev = decks;
    setDecks((list) =>
      list.map((d) =>
        d.id === deck.id ? { ...d, is_public: !d.is_public } : d,
      ),
    );
    try {
      const res = await fetch(`/api/decks/${deck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !deck.is_public }),
      });
      if (!res.ok) {
        setDecks(prev);
        toast.error("Failed to update visibility");
      }
    } catch {
      setDecks(prev);
      toast.error("Failed to update visibility");
    }
  };

  const handleTomlImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/decks/import-toml", {
        method: "POST",
        headers: { "Content-Type": "application/toml" },
        body: text,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || "Import failed");
        return;
      }
      const skippedMsg = json.skipped ? ` (${json.skipped} skipped)` : "";
      toast.success(`Imported ${json.imported} card${json.imported !== 1 ? "s" : ""}${skippedMsg}`);
      fetchDecks();
    } catch {
      toast.error("Failed to read file");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    const prev = decks;
    setDecks((list) => list.filter((d) => d.id !== target.id));
    try {
      const res = await fetch(`/api/decks/${target.id}`, { method: "DELETE" });
      if (!res.ok) {
        setDecks(prev);
        toast.error("Failed to delete deck");
      } else {
        toast.success("Deck deleted");
      }
    } catch {
      setDecks(prev);
      toast.error("Failed to delete deck");
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-7 max-w-6xl px-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(59,130,246,.1)", color: "#60a5fa" }}
            >
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">My Flashcards</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Spaced-repetition decks · pulled from your dictionary saves,
                articles, and custom cards.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 h-7 text-[11px]">
              <Link href="/flashcards/browse">
                <Compass className="h-3 w-3" />
                Browse public decks
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-[11px]"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3" />
              {importing ? "Importing…" : "Import TOML"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".toml,text/plain,application/toml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleTomlImport(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-[11px]"
              onClick={() => {
                setEditingDeck(null);
                setDeckDialogOpen(true);
              }}
            >
              <Library className="h-3 w-3" />
              New deck
            </Button>
            <Button
              size="sm"
              className="gap-1.5 h-7 text-[11px]"
              onClick={() => setCardDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              New flashcard
            </Button>
          </div>
        </div>

        {/* Due now callout */}
        {dueToday > 0 && (
          <div
            className="rounded-xl mb-6 p-4 flex items-center gap-4 flex-wrap"
            style={{
              background: "var(--card)",
              border: "1px solid color-mix(in oklab, var(--border) 40%, transparent)",
            }}
          >
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
              style={{ background: "rgba(59,130,246,.1)", color: "#60a5fa" }}
            >
              <Target className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold">
                {dueToday} card{dueToday !== 1 ? "s" : ""} due for review
              </div>
              <div className="text-[11px] text-muted-foreground">
                Stay consistent — reviewing now keeps your streak alive.
              </div>
            </div>
            <Button asChild size="sm" className="gap-1 h-7 text-[11px]">
              <Link href="/flashcards/stats">
                Start review
                <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="tab-rail">
            {(["all", "private", "public"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`tab${filter === tab ? " active" : ""}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}{" "}
                <span className="text-muted-foreground">{tabCount(tab)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 && decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Brain className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              You don&apos;t have any decks yet
            </p>
            <p className="text-xs text-muted-foreground/60 mb-6 max-w-sm">
              Create a deck to start grouping flashcards, or browse public decks
              made by other learners.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setEditingDeck(null);
                  setDeckDialogOpen(true);
                }}
              >
                Create your first deck
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/flashcards/browse">Browse public decks</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onEdit={() => {
                  setEditingDeck(deck);
                  setDeckDialogOpen(true);
                }}
                onToggleVisibility={() => handleToggleVisibility(deck)}
                onDelete={() => setDeleteTarget(deck)}
              />
            ))}

            {/* New deck tile */}
            <button
              onClick={() => {
                setEditingDeck(null);
                setDeckDialogOpen(true);
              }}
              className="flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              style={{
                minHeight: 200,
                background: "color-mix(in oklab, var(--card) 60%, transparent)",
                border: "1px dashed color-mix(in oklab, var(--border) 40%, transparent)",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "color-mix(in oklab, var(--muted) 60%, transparent)" }}
              >
                <Plus className="h-4 w-4" />
              </div>
              <div className="text-[13px] font-medium">New deck</div>
              <div className="text-[11px] text-center text-muted-foreground">
                Group cards by topic, JLPT level, or course chapter.
              </div>
            </button>
          </div>
        )}
      </div>

      <DeckFormDialog
        open={deckDialogOpen}
        onOpenChange={setDeckDialogOpen}
        initial={editingDeck}
        onSaved={handleDeckSaved}
      />

      <FlashcardFormDialog
        open={cardDialogOpen}
        onOpenChange={setCardDialogOpen}
        onSaved={() => fetchDecks()}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deck?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the deck &ldquo;{deleteTarget?.name}
              &rdquo; and all {deleteTarget?.card_count ?? 0} cards in it. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
