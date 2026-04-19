"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Brain,
  Plus,
  Play,
  List,
  Globe,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
  BookOpen,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import FlashcardFormDialog from "@/components/flashcards/FlashcardFormDialog";
import FlashcardView from "@/components/flashcards/FlashcardView";
import type { Deck, Flashcard } from "@/lib/flashcards/types";

interface DeckResponse {
  deck: Deck & { owner_id: string };
  cards: Flashcard[];
  owner: {
    id: string;
    display_name: string;
    user_name: string;
    avatar_url: string | null;
  } | null;
  isOwner: boolean;
}

export default function DeckDetailPage() {
  const params = useParams<{ deckSlug: string }>();
  const deckSlug = params?.deckSlug ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<DeckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState<"list" | "study">(
    (searchParams.get("mode") === "study" ? "study" : "list") as "list" | "study",
  );
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deleteCard, setDeleteCard] = useState<Flashcard | null>(null);
  const [clonedFromDeck, setClonedFromDeck] = useState<
    { name: string; slug: string; owner_name: string | null } | null
  >(null);

  const fetchDeck = useCallback(async () => {
    if (!deckSlug) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(
        `/api/decks/${encodeURIComponent(deckSlug)}`,
      );
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const json: DeckResponse = await res.json();
      setData(json);

      // If the deck was cloned, fetch the source deck/owner for the banner
      if (json.deck.cloned_from_deck_id) {
        const sourceRes = await fetch(
          `/api/decks/${json.deck.cloned_from_deck_id}`,
        );
        if (sourceRes.ok) {
          const sj = await sourceRes.json();
          setClonedFromDeck({
            name: sj.deck.name,
            slug: sj.deck.slug,
            owner_name: sj.owner?.display_name || null,
          });
        }
      } else {
        setClonedFromDeck(null);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [deckSlug]);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  const handleToggleVisibility = async () => {
    if (!data) return;
    const next = !data.deck.is_public;
    const prev = data;
    setData({ ...data, deck: { ...data.deck, is_public: next } });
    try {
      const res = await fetch(`/api/decks/${data.deck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) {
        setData(prev);
        toast.error("Failed to update visibility");
      } else {
        toast.success(next ? "Deck is now public" : "Deck is now private");
      }
    } catch {
      setData(prev);
    }
  };

  const handleCardSaved = (card: Flashcard) => {
    setData((d) =>
      d
        ? {
            ...d,
            cards: editingCard
              ? d.cards.map((c) => (c.id === card.id ? card : c))
              : [card, ...d.cards],
          }
        : d,
    );
    setEditingCard(null);
  };

  const handleDeleteCard = async () => {
    if (!deleteCard || !data) return;
    const target = deleteCard;
    setDeleteCard(null);
    const prev = data.cards;
    setData({ ...data, cards: data.cards.filter((c) => c.id !== target.id) });
    try {
      const res = await fetch(`/api/flashcards/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setData({ ...data, cards: prev });
        toast.error("Failed to delete card");
      } else {
        toast.success("Card deleted");
      }
    } catch {
      setData({ ...data, cards: prev });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto py-6 max-w-5xl px-4 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold">Deck not found</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            This deck doesn&apos;t exist or isn&apos;t shared with you.
          </p>
          <Button onClick={() => router.push("/flashcards")} size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to My Flashcards
          </Button>
        </div>
      </div>
    );
  }

  const { deck, cards, isOwner } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 max-w-5xl px-4 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/flashcards"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Brain className="h-4 w-4" />
            My Flashcards
          </Link>
          <span>/</span>
          <span className="text-foreground">{deck.name}</span>
        </div>

        {/* Cloned banner */}
        {clonedFromDeck && (
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5" />
            <span>
              Cloned from{" "}
              {clonedFromDeck.owner_name ? (
                <span className="font-medium text-foreground">
                  {clonedFromDeck.owner_name}&apos;s
                </span>
              ) : (
                "another user's"
              )}{" "}
              <span className="font-medium text-foreground">
                {clonedFromDeck.name}
              </span>
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground">{deck.name}</h1>
            {deck.description && (
              <p className="text-sm text-muted-foreground mt-1.5">
                {deck.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="secondary" className="text-xs gap-1">
                <BookOpen className="h-3 w-3" />
                {cards.length} {cards.length === 1 ? "card" : "cards"}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-xs gap-1 ${
                  deck.is_public
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {deck.is_public ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {deck.is_public ? "Public" : "Private"}
              </Badge>
              {!isOwner && data.owner && (
                <span className="text-xs text-muted-foreground">
                  by {data.owner.display_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isOwner && (
              <div className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Public</span>
                <Switch
                  checked={deck.is_public}
                  onCheckedChange={handleToggleVisibility}
                />
              </div>
            )}
            {isOwner && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setEditingCard(null);
                  setCardDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add card
              </Button>
            )}
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          <button
            onClick={() => setMode("list")}
            className={`relative px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
              mode === "list"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
            {mode === "list" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t" />
            )}
          </button>
          <button
            onClick={() => setMode("study")}
            disabled={cards.length === 0}
            className={`relative px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === "study"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            Study
            {mode === "study" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t" />
            )}
          </button>
        </div>

        {/* Body */}
        {mode === "study" ? (
          <FlashcardView cards={cards} />
        ) : cards.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {isOwner
                ? "This deck has no cards yet"
                : "No cards in this deck yet"}
            </p>
            {isOwner && (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setCardDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add first card
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cards.map((card) => (
              <Card
                key={card.id}
                className="border-border/60 bg-card/50 hover:bg-card transition-colors"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm whitespace-pre-wrap flex-1">
                      {card.front}
                    </p>
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mr-1 -mt-1"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingCard(card);
                              setCardDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/dictionary/create?fromFlashcard=${card.id}`,
                              )
                            }
                          >
                            <BookOpen className="h-3.5 w-3.5 mr-2" />
                            Propose as dictionary entry
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteCard(card)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap border-t border-border/40 pt-2">
                    {card.back}
                  </div>
                  {card.source_type && card.source_type !== "custom" && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {card.source_type}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FlashcardFormDialog
        open={cardDialogOpen}
        onOpenChange={(o) => {
          setCardDialogOpen(o);
          if (!o) setEditingCard(null);
        }}
        initial={editingCard}
        defaultDeckId={deck.id}
        onSaved={handleCardSaved}
      />

      <AlertDialog
        open={!!deleteCard}
        onOpenChange={(o) => !o && setDeleteCard(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete card?</AlertDialogTitle>
            <AlertDialogDescription>
              This card will be permanently removed from the deck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
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
