"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, MessageSquare, X } from "lucide-react";

interface DiscussionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function DiscussionCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: DiscussionCreateDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const reset = () => {
    setTitle("");
    setBody("");
    setTagInput("");
    setTags([]);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const canSubmit = title.trim().length > 0;

  const handleCreate = async () => {
    if (!canSubmit || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, tags }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || t("discussions.create.failed", "Failed to post"));
        return;
      }
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch {
      toast.error(t("discussions.create.failed", "Failed to post"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!creating) {
          if (!v) reset();
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("discussions.create.titleQuestion")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <Input
            placeholder={t("discussions.create.titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder={t("discussions.create.bodyPlaceholder")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[100px]"
          />
          <TagRow
            tagInput={tagInput}
            tags={tags}
            onTagInputChange={setTagInput}
            onAddTag={handleAddTag}
            onRemoveTag={(tag) => setTags(tags.filter((t) => t !== tag))}
            addLabel={t("discussions.create.addTag")}
            placeholder={t("discussions.create.tagPlaceholder")}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            disabled={creating}
          >
            {t("discussions.create.cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={!canSubmit || creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-1.5" />
            )}
            {t("discussions.create.postQuestion")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagRow({
  tagInput,
  tags,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  addLabel,
  placeholder,
}: {
  tagInput: string;
  tags: string[];
  onTagInputChange: (v: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  addLabel: string;
  placeholder: string;
}) {
  return (
    <div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={tagInput}
          onChange={(e) => onTagInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddTag();
            }
          }}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onAddTag}
          disabled={!tagInput.trim() || tags.length >= 5}
        >
          {addLabel}
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
              {tag}
              <button onClick={() => onRemoveTag(tag)} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
