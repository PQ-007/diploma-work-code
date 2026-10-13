"use client";

import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Deck } from "@/lib/flashcards/types";

interface DeckFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Deck | null;
  onSaved: (deck: Deck) => void;
}

export default function DeckFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: DeckFormDialogProps) {
  const isEdit = !!initial;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setDescription(initial?.description || "");
      setIsPublic(initial?.is_public || false);
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit ? `/api/decks/${initial!.id}` : "/api/decks";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to save deck");
        return;
      }
      toast.success(isEdit ? "Deck updated" : "Deck created");
      onSaved(json.deck);
      onOpenChange(false);
    } catch {
      toast.error("Failed to save deck");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit deck" : "Create deck"}</DialogTitle>
          <DialogDescription>
            A deck groups related flashcards. Public decks can be cloned by
            other learners.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="deck-name">Name</Label>
            <Input
              id="deck-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kanji N5, React hooks"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deck-description">Description (optional)</Label>
            <Textarea
              id="deck-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this deck cover?"
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
            <div>
              <Label htmlFor="deck-public" className="text-sm">
                Make public
              </Label>
              <p className="text-xs text-muted-foreground">
                Public decks appear in <span className="font-medium">Browse</span> and can be cloned.
              </p>
            </div>
            <Switch
              id="deck-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {isEdit ? "Save changes" : "Create deck"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
