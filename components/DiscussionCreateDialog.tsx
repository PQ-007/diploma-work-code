"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Loader2, MessageSquare, BarChart2, X, Plus } from "lucide-react";

type Mode = "question" | "poll";

interface DiscussionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const MAX_OPTIONS = 6;

export default function DiscussionCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: DiscussionCreateDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollEndDate, setPollEndDate] = useState("");
  const [creating, setCreating] = useState(false);

  const reset = () => {
    setTitle("");
    setBody("");
    setTagInput("");
    setTags([]);
    setPollOptions(["", ""]);
    setPollEndDate("");
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    reset();
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleOptionChange = (i: number, value: string) => {
    const next = [...pollOptions];
    next[i] = value;
    setPollOptions(next);
  };

  const handleAddOption = () => {
    if (pollOptions.length < MAX_OPTIONS) setPollOptions([...pollOptions, ""]);
  };

  const handleRemoveOption = (i: number) => {
    if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, idx) => idx !== i));
  };

  const filledOptions = pollOptions.filter((o) => o.trim()).length;
  const isPollValid = title.trim().length > 0 && filledOptions >= 2;
  const isQuestionValid = title.trim().length > 0;
  const canSubmit = mode === "question" ? isQuestionValid : isPollValid;

  const handleCreate = async () => {
    if (!canSubmit || creating) return;
    setCreating(true);
    try {
      const payload =
        mode === "poll"
          ? {
              title,
              body,
              tags,
              type: "poll",
              poll_options: pollOptions.filter((o) => o.trim()),
              poll_end_date: pollEndDate || null,
            }
          : { title, body, tags, type: "question" };

      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        reset();
        onOpenChange(false);
        onCreated?.();
      }
    } catch {
      // ignore
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
            {mode === "poll" ? (
              <BarChart2 className="h-5 w-5" />
            ) : (
              <MessageSquare className="h-5 w-5" />
            )}
            {mode === "question"
              ? t("discussions.create.titleQuestion")
              : t("discussions.create.titlePoll")}
          </DialogTitle>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => handleModeChange("question")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "question"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {t("discussions.create.tabs.question")}
          </button>
          <button
            onClick={() => handleModeChange("poll")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "poll"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            {t("discussions.create.tabs.poll")}
          </button>
        </div>

        {/* ── Question mode ── */}
        {mode === "question" && (
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
        )}

        {/* ── Poll mode ── */}
        {mode === "poll" && (
          <div className="space-y-4 py-1">
            {/* Question field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">
                {t("discussions.create.pollQuestion")}
              </label>
              <Input
                placeholder={t("discussions.create.pollQuestionPlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                {t("discussions.create.pollOptions")}
              </label>
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder={t("discussions.create.optionPlaceholder", { n: i + 1 })}
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="flex-1"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(i)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {pollOptions.length < MAX_OPTIONS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="w-full gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("discussions.create.addOption")}
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                {t("discussions.create.optionsCount", {
                  current: pollOptions.length,
                  max: MAX_OPTIONS,
                })}
              </p>
            </div>

            {/* End date */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">
                {t("discussions.create.pollEndDate")}
              </label>
              <Input
                type="datetime-local"
                value={pollEndDate}
                onChange={(e) => setPollEndDate(e.target.value)}
              />
            </div>

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
        )}

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
            ) : mode === "poll" ? (
              <BarChart2 className="h-4 w-4 mr-1.5" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-1.5" />
            )}
            {mode === "question"
              ? t("discussions.create.postQuestion")
              : t("discussions.create.postPoll")}
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
