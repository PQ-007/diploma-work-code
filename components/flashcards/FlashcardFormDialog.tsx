"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Loader2,
  Sparkles,
  X,
  Zap,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import type {
  DeckWithCount,
  Flashcard,
  FlashcardFront,
  FlashcardBack,
} from "@/lib/flashcards/types";
import { parseFront, parseBack } from "@/lib/flashcards/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "pick" | "detailed" | "quick";
type Lang = "mn" | "ja" | "en";

interface FlashcardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If set, this is an edit. The card's source determines which form opens. */
  initial?: Flashcard | null;
  defaultDeckId?: number;
  /** Pre-fill term (used from article capture or capture popover). */
  defaultFront?: string;
  defaultBack?: string;
  sourceType?: string;
  sourceId?: number;
  onSaved: (card: Flashcard) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FlashcardFormDialog({
  open,
  onOpenChange,
  initial,
  defaultDeckId,
  defaultFront,
  defaultBack,
  sourceType,
  sourceId,
  onSaved,
}: FlashcardFormDialogProps) {
  const isEdit = !!initial;

  // ── UI state ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>(isEdit ? "detailed" : "pick");
  const [decks, setDecks] = useState<DeckWithCount[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Deck selection ────────────────────────────────────────────────────────
  const [deckId, setDeckId] = useState<number | null>(null);

  // ── Detailed card fields ───────────────────────────────────────────────
  const [lang, setLang] = useState<Lang>("en");
  const [term, setTerm] = useState("");
  const [reading, setReading] = useState("");
  const [partsOfSpeech, setPartsOfSpeech] = useState<string[]>([]);
  const [definition, setDefinition] = useState("");
  const [translations, setTranslations] = useState<
    Record<Lang, string>
  >({ mn: "", ja: "", en: "" });

  // ── Jisho lookup state ────────────────────────────────────────────────────
  const [jishoLoading, setJishoLoading] = useState(false);

  // ── Quick card fields ─────────────────────────────────────────────────────
  const [quickFront, setQuickFront] = useState("");
  const [quickBack, setQuickBack] = useState("");

  // ── Init ──────────────────────────────────────────────────────────────────
  const loadDecks = useCallback(async () => {
    setLoadingDecks(true);
    try {
      const res = await fetch("/api/decks");
      if (res.ok) {
        const json = await res.json();
        setDecks(json.items || []);
      }
    } finally {
      setLoadingDecks(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadDecks();

    if (isEdit && initial) {
      // Parse front/back — handles both object (JSONB) and string (text column) forms
      const eff = parseFront(initial.custom_front ?? initial.front);
      const effBack = parseBack(initial.custom_back ?? initial.back);
      setMode("detailed");
      setLang(((eff?.language) ?? "en") as Lang);
      setTerm(eff?.term ?? "");
      setReading(eff?.reading ?? "");
      setPartsOfSpeech(eff?.partsOfSpeech ?? []);
      setDefinition(effBack?.definition ?? "");
      const trans: Record<Lang, string> = { mn: "", ja: "", en: "" };
      (effBack?.translations ?? []).forEach((t) => {
        if (t.language in trans) trans[t.language as Lang] = t.term;
      });
      setTranslations(trans);
      setDeckId(initial.deck_id ?? defaultDeckId ?? null);
    } else {
      setMode("pick");
      setLang("en");
      setTerm(defaultFront ?? "");
      setReading("");
      setPartsOfSpeech([]);
      setDefinition(defaultBack ?? "");
      setTranslations({ mn: "", ja: "", en: "" });
      setQuickFront(defaultFront ?? "");
      setQuickBack(defaultBack ?? "");
      setDeckId(defaultDeckId ?? null);
    }
  }, [open, isEdit, initial, defaultDeckId, defaultFront, defaultBack, loadDecks]);

  // After decks load, fall back to first deck
  useEffect(() => {
    if (deckId == null && decks.length > 0) setDeckId(decks[0].id);
  }, [decks, deckId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleJishoLookup = async () => {
    if (!term.trim()) {
      toast.error("Enter a term first");
      return;
    }
    setJishoLoading(true);
    try {
      const res = await fetch(
        `/api/flashcards/jisho?q=${encodeURIComponent(term.trim())}`,
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "No results found on Jisho");
        return;
      }
      setTerm(json.term ?? term);
      setReading(json.reading ?? "");
      setPartsOfSpeech(json.partsOfSpeech ?? []);
      setDefinition(json.definition ?? "");
      toast.success("Jisho data filled in — review and save");
    } catch {
      toast.error("Jisho lookup failed");
    } finally {
      setJishoLoading(false);
    }
  };

  const handleCreateDeck = async () => {
    const name = window.prompt("New deck name:");
    if (!name?.trim()) return;
    const res = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) { toast.error("Failed to create deck"); return; }
    const json = await res.json();
    setDecks((prev) => [{ ...json.deck, card_count: 0 }, ...prev]);
    setDeckId(json.deck.id);
    toast.success("Deck created");
  };

  const handleSave = async () => {
    if (!deckId) {
      toast.error("Please select or create a deck");
      return;
    }
    setSaving(true);

    try {
      if (mode === "quick") {
        // Quick card: plain text
        if (!quickFront.trim() || !quickBack.trim()) {
          toast.error("Front and back are required");
          return;
        }
        const front: FlashcardFront = { term: quickFront.trim(), language: lang };
        const back: FlashcardBack = { definition: quickBack.trim(), translations: [] };
        await saveCard(front, back, "custom", undefined);
        return;
      }

      // Detailed card
      if (!term.trim()) { toast.error("Term is required"); return; }
      if (!definition.trim()) { toast.error("Definition is required"); return; }

      const front: FlashcardFront = {
        term: term.trim(),
        reading: reading.trim() || undefined,
        language: lang,
        partsOfSpeech: partsOfSpeech.length ? partsOfSpeech : undefined,
      };

      const transArr: FlashcardBack["translations"] = (
        Object.entries(translations) as [Lang, string][]
      )
        .filter(([l, v]) => v.trim() && l !== lang)
        .map(([l, v]) => ({ language: l, term: v.trim() }));

      const back: FlashcardBack = {
        definition: definition.trim(),
        translations: transArr,
      };

      await saveCard(front, back, sourceType || "custom", sourceId);
    } finally {
      setSaving(false);
    }
  };

  const saveCard = async (
    front: FlashcardFront,
    back: FlashcardBack,
    srcType: string,
    srcId?: number,
  ) => {
    const url = isEdit ? `/api/flashcards/${initial!.id}` : "/api/flashcards";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        front,
        back,
        deckId,
        ...(isEdit ? {} : { sourceType: srcType, sourceId: srcId }),
      }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Failed to save"); return; }
    toast.success(isEdit ? "Flashcard updated" : "Flashcard created");
    onSaved(json.flashcard);
    onOpenChange(false);
  };

  // ── Deck selector shared UI ───────────────────────────────────────────────
  const DeckSelector = () => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Deck</Label>
      {decks.length === 0 && !loadingDecks ? (
        <Button variant="outline" size="sm" className="w-full" onClick={handleCreateDeck}>
          Create your first deck
        </Button>
      ) : (
        <div className="flex gap-2">
          <Select
            value={deckId ? String(deckId) : undefined}
            onValueChange={(v) => setDeckId(Number(v))}
            disabled={loadingDecks}
          >
            <SelectTrigger className="flex-1 h-8 text-sm">
              <SelectValue placeholder="Select deck" />
            </SelectTrigger>
            <SelectContent>
              {decks.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}{" "}
                  <span className="text-muted-foreground text-xs">({d.card_count})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8" onClick={handleCreateDeck}>
            + New
          </Button>
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* ── Mode picker ──────────────────────────────────────────── */}
        {mode === "pick" && (
          <>
            <DialogHeader>
              <DialogTitle>Add flashcard</DialogTitle>
              <DialogDescription>
                Choose how you want to create this card.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-2">
              <button
                onClick={() => setMode("detailed")}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/40 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Detailed card</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Structured with term, reading, definition, and translations.
                    Japanese terms can be filled from Jisho.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode("quick")}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/40 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Quick card</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Simple front &amp; back text. Fast to add, no structure
                    required.
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── Quick card ──────────────────────────────────────────── */}
        {mode === "quick" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode("pick")}
                  className="text-muted-foreground hover:text-foreground -ml-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <DialogTitle>Quick card</DialogTitle>
              </div>
              <DialogDescription>Simple front / back text.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <DeckSelector />
              <div className="space-y-1.5">
                <Label htmlFor="qf">Front</Label>
                <Textarea
                  id="qf"
                  value={quickFront}
                  onChange={(e) => setQuickFront(e.target.value)}
                  placeholder="Question or term"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qb">Back</Label>
                <Textarea
                  id="qb"
                  value={quickBack}
                  onChange={(e) => setQuickBack(e.target.value)}
                  placeholder="Answer or definition"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !deckId}>
                {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create flashcard
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Detailed card ───────────────────────────────────────── */}
        {mode === "detailed" && (
          <>
            <DialogHeader>
              {!isEdit && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMode("pick")}
                    className="text-muted-foreground hover:text-foreground -ml-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <DialogTitle>Detailed card</DialogTitle>
                </div>
              )}
              {isEdit && <DialogTitle>Edit flashcard</DialogTitle>}
              <DialogDescription>
                Structured card with term, reading, and translations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Language + Term + Reading */}
              <div className="grid grid-cols-[120px_1fr] gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lang" className="text-xs">Language</Label>
                  <Select
                    value={lang}
                    onValueChange={(v) => setLang(v as Lang)}
                  >
                    <SelectTrigger id="lang" className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="mn">🇲🇳 Mongolian</SelectItem>
                      <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="term" className="text-xs">Term</Label>
                  <Input
                    id="term"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Word or phrase"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Reading (Japanese only) + Jisho button */}
              {lang === "ja" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reading" className="text-xs">Reading (furigana)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[11px] gap-1 px-2"
                      onClick={handleJishoLookup}
                      disabled={jishoLoading || !term.trim()}
                    >
                      {jishoLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      Look up in Jisho
                    </Button>
                  </div>
                  <Input
                    id="reading"
                    value={reading}
                    onChange={(e) => setReading(e.target.value)}
                    placeholder="e.g. ねこ"
                    className="h-8 text-sm"
                  />
                </div>
              )}

              {/* Parts of speech */}
              {partsOfSpeech.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {partsOfSpeech.map((p) => (
                    <Badge key={p} variant="secondary" className="text-[11px] gap-1">
                      {p}
                      <button
                        onClick={() =>
                          setPartsOfSpeech((prev) => prev.filter((x) => x !== p))
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Definition */}
              <div className="space-y-1.5">
                <Label htmlFor="def" className="text-xs">Definition (English)</Label>
                <Textarea
                  id="def"
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  placeholder="Primary definition in English"
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Translations */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Translations (optional)
                </Label>
                {(["mn", "ja", "en"] as Lang[])
                  .filter((l) => l !== lang)
                  .map((l) => (
                    <div key={l} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-6 shrink-0">
                        {l === "mn" ? "MN" : l === "ja" ? "JA" : "EN"}
                      </span>
                      <Input
                        value={translations[l]}
                        onChange={(e) =>
                          setTranslations((prev) => ({ ...prev, [l]: e.target.value }))
                        }
                        placeholder={
                          l === "mn"
                            ? "Mongolian translation"
                            : l === "ja"
                            ? "Japanese translation"
                            : "English translation"
                        }
                        className="h-7 text-sm"
                      />
                    </div>
                  ))}
              </div>

              <Separator />

              {/* Deck selector */}
              <DeckSelector />

            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !deckId}>
                {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {isEdit ? "Save changes" : "Create flashcard"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
