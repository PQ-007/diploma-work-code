"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Loader2,
  Search,
  Sparkles,
  X,
  Zap,
  ChevronLeft,
  RotateCcw,
  BookMarked,
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

type Mode = "pick" | "dict" | "quick";
type Lang = "mn" | "ja" | "en";

interface DictLookupEntry {
  id: number;
  term: string;
  reading?: string;
  language_code: string;
  definition: string;
  status: string;
  slug: string;
  translations: Array<{ language_code: string; translated_term: string }>;
}

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
  const [mode, setMode] = useState<Mode>(isEdit ? "dict" : "pick");
  const [decks, setDecks] = useState<DeckWithCount[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Deck selection ────────────────────────────────────────────────────────
  const [deckId, setDeckId] = useState<number | null>(null);

  // ── Dictionary style fields ───────────────────────────────────────────────
  const [lang, setLang] = useState<Lang>("en");
  const [term, setTerm] = useState("");
  const [reading, setReading] = useState("");
  const [partsOfSpeech, setPartsOfSpeech] = useState<string[]>([]);
  const [definition, setDefinition] = useState("");
  const [translations, setTranslations] = useState<
    Record<Lang, string>
  >({ mn: "", ja: "", en: "" });

  // ── Dictionary / Jisho lookup state ──────────────────────────────────────
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<DictLookupEntry[]>([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [linkedEntry, setLinkedEntry] = useState<DictLookupEntry | null>(null);
  const [jishoLoading, setJishoLoading] = useState(false);
  const [proposeToDict, setProposeToDict] = useState(false);

  // ── Quick card fields ─────────────────────────────────────────────────────
  const [quickFront, setQuickFront] = useState("");
  const [quickBack, setQuickBack] = useState("");

  const lookupDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setMode("dict");
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
      setLinkedEntry(null);
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
      setLinkedEntry(null);
      setLookupQuery("");
      setLookupResults([]);
      setProposeToDict(false);
    }
  }, [open, isEdit, initial, defaultDeckId, defaultFront, defaultBack, loadDecks]);

  // After decks load, fall back to first deck
  useEffect(() => {
    if (deckId == null && decks.length > 0) setDeckId(decks[0].id);
  }, [decks, deckId]);

  // ── Live lookup debounce ──────────────────────────────────────────────────
  useEffect(() => {
    const q = lookupQuery.trim();
    if (!q || q.length < 2) {
      setLookupResults([]);
      return;
    }
    if (lookupDebounce.current) clearTimeout(lookupDebounce.current);
    lookupDebounce.current = setTimeout(async () => {
      setLookingUp(true);
      try {
        const res = await fetch(
          `/api/flashcards/lookup?q=${encodeURIComponent(q)}&lang=${lang}`,
        );
        if (res.ok) {
          const json = await res.json();
          setLookupResults(json.entries ?? []);
        }
      } finally {
        setLookingUp(false);
      }
    }, 300);
    return () => {
      if (lookupDebounce.current) clearTimeout(lookupDebounce.current);
    };
  }, [lookupQuery, lang]);

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

  const handleLinkEntry = (entry: DictLookupEntry) => {
    setLinkedEntry(entry);
    setTerm(entry.term);
    setReading(entry.reading ?? "");
    setLang((entry.language_code as Lang) ?? "en");
    setDefinition(entry.definition);
    const trans: Record<Lang, string> = { mn: "", ja: "", en: "" };
    (entry.translations ?? []).forEach((t) => {
      if (t.language_code in trans) trans[t.language_code as Lang] = t.translated_term;
    });
    setTranslations(trans);
    setLookupResults([]);
    setLookupQuery("");
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

      // Dictionary style
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

      // Determine source type/id
      let finalSourceType = sourceType || "custom";
      let finalSourceId = sourceId;

      if (linkedEntry) {
        finalSourceType = "dictionary";
        finalSourceId = linkedEntry.id;
      }

      // Propose to dictionary if no linked entry and checkbox is checked
      if (proposeToDict && !linkedEntry) {
        const propRes = await fetch("/api/dictionary/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            term: term.trim(),
            definition: definition.trim(),
            languageCode: lang,
            reading: reading.trim() || undefined,
            createFlashcard: false,
          }),
        });
        if (propRes.ok) {
          const propJson = await propRes.json();
          finalSourceType = "dictionary";
          finalSourceId = propJson.entry?.id;
          toast.info("Entry proposed to dictionary — pending review");
        }
      }

      if (isEdit && initial) {
        // Save as custom override (preserves dict link)
        if (initial.source_type === "dictionary" && !linkedEntry) {
          await saveCustomOverride(initial.id, front, back);
        } else {
          await saveCard(front, back, finalSourceType, finalSourceId);
        }
      } else {
        await saveCard(front, back, finalSourceType, finalSourceId);
      }
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

  const saveCustomOverride = async (
    cardId: number,
    customFront: FlashcardFront,
    customBack: FlashcardBack,
  ) => {
    const res = await fetch(`/api/flashcards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customFront, customBack }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Failed to save"); return; }
    toast.success("Customization saved");
    onSaved(json.flashcard);
    onOpenChange(false);
  };

  const handleResetToDict = async () => {
    if (!initial) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/flashcards/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetCustom: true }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed"); return; }
      toast.success("Reset to dictionary content");
      onSaved(json.flashcard);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
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
                onClick={() => setMode("dict")}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/40 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Dictionary style</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Structured with term, reading, definition, and translations.
                    Link to dictionary or Jisho.
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

        {/* ── Dictionary style ────────────────────────────────────── */}
        {mode === "dict" && (
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
                  <DialogTitle>Dictionary style</DialogTitle>
                </div>
              )}
              {isEdit && <DialogTitle>Edit flashcard</DialogTitle>}
              <DialogDescription>
                {linkedEntry ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <BookMarked className="h-3.5 w-3.5" />
                    Linked to dictionary:{" "}
                    <span className="font-medium">{linkedEntry.term}</span>
                    <button
                      onClick={() => setLinkedEntry(null)}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  "Structured card with term, reading, and translations."
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Dict lookup search */}
              {!isEdit && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Look up in dictionary
                  </Label>
                  <div className="relative">
                    <Input
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                      placeholder="Search term..."
                      className="h-8 text-sm pr-8"
                    />
                    {lookingUp && (
                      <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {lookupResults.length > 0 && (
                    <div className="rounded-md border border-border/60 bg-popover shadow-sm divide-y divide-border/40 max-h-40 overflow-y-auto">
                      {lookupResults.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => handleLinkEntry(e)}
                          className="w-full flex items-start gap-3 p-2.5 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{e.term}</span>
                              {e.reading && (
                                <span className="text-xs text-muted-foreground">
                                  ({e.reading})
                                </span>
                              )}
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {e.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {e.definition}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {lookupQuery.length >= 2 && !lookingUp && lookupResults.length === 0 && (
                    <p className="text-xs text-muted-foreground px-1">
                      Not in dictionary — fill form below to create a new card.
                    </p>
                  )}
                </div>
              )}

              <Separator />

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

              {/* Propose to dictionary (only new cards, no linked entry) */}
              {!isEdit && !linkedEntry && (
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="propose"
                    checked={proposeToDict}
                    onCheckedChange={(v) => setProposeToDict(!!v)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="propose" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                    Also propose this term to the dictionary
                    <br />
                    <span className="text-muted-foreground/60">
                      Creates a draft entry pending moderator review.
                    </span>
                  </Label>
                </div>
              )}

              {/* Reset to dictionary (edit mode, dict-linked) */}
              {isEdit && initial?.source_type === "dictionary" && (
                <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Editing stores a custom override. The dictionary link is preserved.
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 ml-2"
                    onClick={handleResetToDict}
                    disabled={saving}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                </div>
              )}
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
