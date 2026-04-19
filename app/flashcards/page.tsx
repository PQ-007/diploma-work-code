"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Brain, Plus, Compass, Library } from "lucide-react";
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/signin");
      return;
    }
    fetchDecks();
  }, [user, authLoading, router, fetchDecks]);

  const filtered = decks.filter((d) => {
    if (filter === "private") return !d.is_public;
    if (filter === "public") return d.is_public;
    return true;
  });

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
    return (
      <div className="min-h-screen bg-background" />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-5 max-w-7xl px-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="h-6 w-6" />
              My Flashcards
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organize your study cards into decks. Make decks public to share
              them.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Link href="/flashcards/browse">
                <Compass className="h-3.5 w-3.5" />
                Browse public decks
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setEditingDeck(null);
                setDeckDialogOpen(true);
              }}
            >
              <Library className="h-3.5 w-3.5" />
              New deck
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setCardDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New flashcard
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0 border-b border-border mb-6">
          {([
            { value: "all", label: "All" },
            { value: "private", label: "Private" },
            { value: "public", label: "Public" },
          ] as const).map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`relative px-5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t" />
                )}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Brain className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              {decks.length === 0
                ? "You don't have any decks yet"
                : "No decks match this filter"}
            </p>
            {decks.length === 0 && (
              <>
                <p className="text-xs text-muted-foreground/60 mb-6 max-w-sm">
                  Create a deck to start grouping flashcards, or browse public
                  decks made by other learners.
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
              </>
            )}
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
        onSaved={() => {
          // Refresh to update card counts
          fetchDecks();
        }}
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
