"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { DeckWithCount, Flashcard } from "@/lib/flashcards/types";

interface FlashcardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Flashcard | null;
  defaultDeckId?: number;
  defaultFront?: string;
  defaultBack?: string;
  sourceType?: string;
  sourceId?: number;
  onSaved: (card: Flashcard) => void;
}

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
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [deckId, setDeckId] = useState<number | null>(null);
  const [decks, setDecks] = useState<DeckWithCount[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setFront(initial?.front ?? defaultFront ?? "");
    setBack(initial?.back ?? defaultBack ?? "");
    setDeckId(initial?.deck_id ?? defaultDeckId ?? null);
  }, [open, initial, defaultDeckId, defaultFront, defaultBack, loadDecks]);

  // After decks load, fall back to first deck if no default
  useEffect(() => {
    if (deckId == null && decks.length > 0) {
      setDeckId(decks[0].id);
    }
  }, [decks, deckId]);

  const handleCreateDeck = async () => {
    const name = window.prompt("New deck name:");
    if (!name?.trim()) return;
    const res = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      toast.error("Failed to create deck");
      return;
    }
    const json = await res.json();
    setDecks((prev) => [{ ...json.deck, card_count: 0 }, ...prev]);
    setDeckId(json.deck.id);
    toast.success("Deck created");
  };

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) {
      toast.error("Front and back are required");
      return;
    }
    if (!deckId) {
      toast.error("Please select or create a deck");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/flashcards/${initial!.id}`
        : "/api/flashcards";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: front.trim(),
          back: back.trim(),
          deckId,
          ...(isEdit ? {} : { sourceType, sourceId }),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to save flashcard");
        return;
      }
      toast.success(isEdit ? "Flashcard updated" : "Flashcard created");
      onSaved(json.flashcard);
      onOpenChange(false);
    } catch {
      toast.error("Failed to save flashcard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit flashcard" : "New flashcard"}
          </DialogTitle>
          <DialogDescription>
            Front is the prompt; back is what you want to recall.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="card-deck">Deck</Label>
            {decks.length === 0 && !loadingDecks ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleCreateDeck}
              >
                Create your first deck
              </Button>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={deckId ? String(deckId) : undefined}
                  onValueChange={(v) => setDeckId(Number(v))}
                  disabled={loadingDecks}
                >
                  <SelectTrigger id="card-deck" className="flex-1">
                    <SelectValue placeholder="Select deck" />
                  </SelectTrigger>
                  <SelectContent>
                    {decks.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name} ({d.card_count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleCreateDeck}>
                  + New
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-front">Front</Label>
            <Textarea
              id="card-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Question or term"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-back">Back</Label>
            <Textarea
              id="card-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Answer or definition"
              rows={5}
            />
          </div>
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
      </DialogContent>
    </Dialog>
  );
}
