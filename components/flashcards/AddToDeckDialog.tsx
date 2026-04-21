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
import type { DeckWithCount } from "@/lib/flashcards/types";

interface AddToDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user confirms. Receives deckId (or null if creating a new one by name). */
  onConfirm: (args: { deckId?: number; deckName?: string }) => Promise<void>;
  title?: string;
  description?: string;
}

export default function AddToDeckDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Add to flashcards",
  description = "Choose a deck, or create a new one.",
}: AddToDeckDialogProps) {
  const [decks, setDecks] = useState<DeckWithCount[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [deckId, setDeckId] = useState<number | null>(null);
  const [newDeckName, setNewDeckName] = useState("");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [saving, setSaving] = useState(false);

  const loadDecks = useCallback(async () => {
    setLoadingDecks(true);
    try {
      const res = await fetch("/api/decks");
      if (res.ok) {
        const json = await res.json();
        const items: DeckWithCount[] = json.items || [];
        setDecks(items);
        if (items.length === 0) {
          setMode("new");
          setNewDeckName("Dictionary");
        } else {
          setMode("existing");
          setDeckId(items[0].id);
        }
      }
    } catch {
      toast.error("Failed to load decks");
    } finally {
      setLoadingDecks(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadDecks();
  }, [open, loadDecks]);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      if (mode === "new") {
        const name = newDeckName.trim();
        if (!name) {
          toast.error("Deck name is required");
          return;
        }
        await onConfirm({ deckName: name });
      } else {
        if (!deckId) {
          toast.error("Please select a deck");
          return;
        }
        await onConfirm({ deckId });
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-1 p-1 bg-muted rounded-md text-xs">
            <button
              onClick={() => setMode("existing")}
              disabled={decks.length === 0}
              className={`flex-1 py-1.5 rounded transition-colors disabled:opacity-40 ${
                mode === "existing"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Existing deck
            </button>
            <button
              onClick={() => setMode("new")}
              className={`flex-1 py-1.5 rounded transition-colors ${
                mode === "new"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              New deck
            </button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-2">
              <Label>Deck</Label>
              <Select
                value={deckId ? String(deckId) : undefined}
                onValueChange={(v) => setDeckId(Number(v))}
                disabled={loadingDecks || decks.length === 0}
              >
                <SelectTrigger>
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
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="new-deck-name">New deck name</Label>
              <Input
                id="new-deck-name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="e.g. Dictionary, Kanji N5"
                autoFocus
              />
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
          <Button onClick={handleConfirm} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
