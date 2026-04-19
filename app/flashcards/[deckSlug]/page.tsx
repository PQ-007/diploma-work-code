"use client";

export const dynamic = "force-dynamic";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  Brain,
  Plus,
  Globe,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
  BookOpen,
  Download,
  Upload,
  BarChart2,
  BookMarked,
  List,
  Sparkles,
  Calendar,
  LinkIcon,
  Layers,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import FlashcardFormDialog from "@/components/flashcards/FlashcardFormDialog";
import FlashcardView from "@/components/flashcards/FlashcardView";
import type { Deck, Flashcard } from "@/lib/flashcards/types";
import { effectiveFront, effectiveBack } from "@/lib/flashcards/types";

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

type StudyMode = "list" | "review";

function sourceStyle(sourceType: string | null) {
  switch (sourceType) {
    case "dictionary":
      return {
        background: "rgba(37,99,235,.16)",
        color: "#60a5fa",
        border: "1px solid rgba(37,99,235,.3)",
      };
    case "article":
      return {
        background: "rgba(168,85,247,.16)",
        color: "#c084fc",
        border: "1px solid rgba(168,85,247,.3)",
      };
    default:
      return {
        background: "rgba(245,158,11,.16)",
        color: "#fbbf24",
        border: "1px solid rgba(245,158,11,.3)",
      };
  }
}

function sourceLabel(sourceType: string | null) {
  switch (sourceType) {
    case "dictionary": return "Dictionary";
    case "article": return "Article";
    default: return "Custom";
  }
}

export default function DeckDetailPage() {
  const params = useParams<{ deckSlug: string }>();
  const deckSlug = params?.deckSlug ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<DeckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState<StudyMode>(
    (searchParams.get("mode") === "study" ? "study" : "list") as StudyMode,
  );
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deleteCard, setDeleteCard] = useState<Flashcard | null>(null);
  const [clonedFromDeck, setClonedFromDeck] = useState<{
    name: string;
    slug: string;
    owner_name: string | null;
  } | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const fetchDeck = useCallback(async () => {
    if (!deckSlug) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/decks/${encodeURIComponent(deckSlug)}`);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error("Failed");
      const json: DeckResponse = await res.json();
      setData(json);

      if (json.deck.cloned_from_deck_id) {
        const sourceRes = await fetch(`/api/decks/${json.deck.cloned_from_deck_id}`);
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

  useEffect(() => { fetchDeck(); }, [fetchDeck]);

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
      const res = await fetch(`/api/flashcards/${target.id}`, { method: "DELETE" });
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

  const handleExport = (format: "csv" | "json") => {
    if (!data) return;
    window.location.href = `/api/decks/${data.deck.id}/export?format=${format}`;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    e.target.value = "";
    setImportLoading(true);
    try {
      const isJson = file.name.endsWith(".json");
      const text = await file.text();
      let body: string;
      let contentType: string;
      if (isJson) {
        const parsed = JSON.parse(text);
        body = JSON.stringify(Array.isArray(parsed) ? { cards: parsed } : parsed);
        contentType = "application/json";
      } else {
        body = text;
        contentType = "text/plain";
      }
      const res = await fetch(`/api/decks/${data.deck.id}/import`, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Import failed"); return; }
      toast.success(`Imported ${json.imported} cards${json.skipped ? ` (${json.skipped} skipped)` : ""}`);
      fetchDeck();
    } catch {
      toast.error("Import failed — check file format");
    } finally {
      setImportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto py-6 max-w-6xl px-6 space-y-5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-72" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
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
            Back to My Flashcards
          </Button>
        </div>
      </div>
    );
  }

  const { deck, cards, isOwner } = data;
  const now = new Date().toISOString();
  const dueCards = cards.filter((c) => c.sm2_due_at <= now);
  const dueCount = dueCards.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-7 max-w-6xl px-6 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link href="/flashcards" className="hover:text-foreground transition-colors">
            My Flashcards
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{deck.name}</span>
        </div>

        {/* Cloned banner */}
        {clonedFromDeck && (
          <div
            className="rounded-lg p-3 flex items-center gap-3 text-[12px]"
            style={{
              background: "rgba(37,99,235,.08)",
              border: "1px solid rgba(37,99,235,.25)",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(37,99,235,.2)", color: "#60a5fa" }}
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1">
              Cloned from{" "}
              {clonedFromDeck.owner_name && (
                <span className="text-[#60a5fa]">@{clonedFromDeck.owner_name}&apos;s </span>
              )}
              <Link
                href={`/flashcards/${encodeURIComponent(clonedFromDeck.slug)}`}
                className="text-[#60a5fa] hover:underline"
              >
                {clonedFromDeck.name}
              </Link>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold tracking-tight">{deck.name}</h1>
            {deck.description && (
              <p className="text-[12px] text-muted-foreground mt-1 max-w-2xl">
                {deck.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {cards.length} cards
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                {deck.is_public ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {deck.is_public ? "Public" : "Private"}
              </span>
              {dueCount > 0 && (
                <>
                  <span>·</span>
                  <span>
                    <span className="text-primary font-medium">{dueCount}</span> due now
                  </span>
                </>
              )}
              {!isOwner && data.owner && (
                <>
                  <span>·</span>
                  <span>by {data.owner.display_name}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOwner && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Public</span>
                <Switch checked={deck.is_public} onCheckedChange={handleToggleVisibility} />
              </div>
            )}

            {/* Segmented control */}
            <div className="inline-flex items-center p-0.5 rounded-lg gap-0.5" style={{ background: "var(--muted)" }}>
              {([
                { key: "list"   as StudyMode, icon: List,     label: "List",                                disabled: false },
                { key: "review" as StudyMode, icon: Calendar, label: dueCount > 0 ? `Review (${dueCount})` : "Review", disabled: cards.length === 0 },
              ] as Array<{ key: StudyMode; icon: React.ComponentType<{ className?: string }>; label: string; disabled: boolean }>).map(({ key, icon: Icon, label, disabled }) => (
                <button
                  key={key}
                  onClick={() => !disabled && setMode(key)}
                  disabled={disabled}
                  className={`h-[26px] px-3 text-[11px] rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                    mode === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/flashcards/stats">
                    <BarChart2 className="h-3.5 w-3.5 mr-2" />
                    Stats
                  </Link>
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Export CSV (Anki)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("json")}>
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Export JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        {importLoading ? "Importing…" : "Import cards (CSV/JSON)"}
                        <input
                          type="file"
                          accept=".csv,.txt,.json"
                          className="hidden"
                          onChange={handleImport}
                        />
                      </label>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        { mode === "review" ? (
          <FlashcardView cards={dueCards.length > 0 ? dueCards : cards} sm2Mode />
        ) : cards.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {isOwner ? "This deck has no cards yet" : "No cards in this deck yet"}
            </p>
            {isOwner && (
              <Button size="sm" className="mt-4" onClick={() => setCardDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add first card
              </Button>
            )}
          </div>
        ) : (
          /* Card grid (list mode) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cards.map((card) => {
              const front = effectiveFront(card);
              const back = effectiveBack(card);
              const isDue = card.sm2_due_at <= now;
              const isJapanese = front.language === "ja";
              const ss = sourceStyle(card.source_type);
              // Japanese translation to show as main if card is English/MN
              const jaTrans = !isJapanese
                ? back.translations?.find((t) => t.language === "ja")
                : null;
              return (
                <div
                  key={card.id}
                  className="group transition-colors"
                  style={{
                    background: "var(--card)",
                    border: "1px solid color-mix(in oklab, var(--border) 40%, transparent)",
                    borderRadius: 10,
                    padding: "16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    {/* Term + Japanese secondary + reading */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {/* Main term */}
                      <span
                        className={isJapanese ? "font-jp-serif" : ""}
                        style={{ fontSize: 22, fontWeight: 500, lineHeight: 1 }}
                      >
                        {front.term}
                      </span>
                      {/* Japanese translation shown next to English term */}
                      {jaTrans && (
                        <span
                          className="font-jp-serif text-muted-foreground"
                          style={{ fontSize: 20, fontWeight: 400, lineHeight: 1 }}
                        >
                          {jaTrans.term}
                        </span>
                      )}
                      {/* Reading (furigana) for Japanese front */}
                      {front.reading && (
                        <span className="font-jp text-[12px] text-muted-foreground italic">
                          {front.reading}
                        </span>
                      )}
                      {isDue && (
                        <span
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(59,130,246,.15)",
                            color: "#60a5fa",
                            border: "1px solid rgba(59,130,246,.3)",
                          }}
                        >
                          due
                        </span>
                      )}
                    </div>

                    {/* Definition */}
                    <div className="text-[11.5px] text-muted-foreground mt-1.5 line-clamp-1">
                      {back.definition}
                    </div>

                    {/* Source badge + parts of speech */}
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={ss}
                      >
                        {sourceLabel(card.source_type)}
                      </span>
                      {card.source_type === "dictionary" && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{
                            border: "1px solid var(--border)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          Linked
                        </span>
                      )}
                      {(card.custom_front || card.custom_back) && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{
                            border: "1px solid var(--border)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          customized
                        </span>
                      )}
                      {front.partsOfSpeech?.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded"
                          style={{ background: "var(--secondary)" }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions — visible on hover */}
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => { setEditingCard(card); setCardDialogOpen(true); }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {card.source_type === "dictionary" && card.source_id && (
                          <DropdownMenuItem asChild>
                            <Link href="/dictionary">
                              <BookMarked className="h-3.5 w-3.5 mr-2" />
                              View in dictionary
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(!card.source_type || card.source_type === "custom") && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/dictionary/create?fromFlashcard=${card.id}`)}
                          >
                            <BookOpen className="h-3.5 w-3.5 mr-2" />
                            Propose as dictionary entry
                          </DropdownMenuItem>
                        )}
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
              );
            })}

            {/* Add card tile */}
            {isOwner && (
              <button
                onClick={() => { setEditingCard(null); setCardDialogOpen(true); }}
                className="flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                style={{
                  minHeight: 120,
                  background: "color-mix(in oklab, var(--card) 60%, transparent)",
                  border: "1px dashed color-mix(in oklab, var(--border) 40%, transparent)",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <Plus className="h-4.5 w-4.5" />
                <span className="text-[12px] font-medium">Add card</span>
              </button>
            )}
          </div>
        )}
      </div>

      <FlashcardFormDialog
        open={cardDialogOpen}
        onOpenChange={(o) => { setCardDialogOpen(o); if (!o) setEditingCard(null); }}
        initial={editingCard}
        defaultDeckId={deck.id}
        onSaved={handleCardSaved}
      />

      <AlertDialog open={!!deleteCard} onOpenChange={(o) => !o && setDeleteCard(null)}>
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
