"use client";

import type {
  ProjectMember,
  ProjectMilestone,
  ProjectUpdate,
  ProjectUpdateType,
} from "@/app/project/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import ProjectLogTimeline from "@/app/project/components/ProjectLogTimeline";

interface ProjectUpdatesPanelProps {
  slug: string;
  updates: ProjectUpdate[];
  canEdit: boolean;
  milestones: ProjectMilestone[];
  members: ProjectMember[];
  createdAt: string;
  projectTitle?: string;
  heroImageUrl?: string | null;
  onUpdatesChange: (updates: ProjectUpdate[]) => void;
}

const UPDATE_TYPES: ProjectUpdateType[] = [
  "regular",
  "milestone",
  "release",
  "announcement",
];

function sortUpdates(items: ProjectUpdate[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.published_at || b.created_at).getTime() -
      new Date(a.published_at || a.created_at).getTime(),
  );
}

export default function ProjectUpdatesPanel({
  slug,
  updates,
  canEdit,
  milestones,
  members,
  createdAt,
  projectTitle,
  heroImageUrl,
  onUpdatesChange,
}: ProjectUpdatesPanelProps) {
  const { t } = useLanguage();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [updateType, setUpdateType] = useState<ProjectUpdateType>("regular");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const sortedUpdates = useMemo(() => sortUpdates(updates || []), [updates]);

  const resetForm = useCallback(() => {
    setTitle("");
    setBody("");
    setImageUrl("");
    setUpdateType("regular");
    setError("");
  }, []);

  const handleCreateUpdate = useCallback(async () => {
    if (!title.trim() || !body.trim()) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${slug}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl.trim() || null,
          update_type: updateType,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || t("project.updateCreateFailed") || "Failed to publish update.");
        return;
      }

      const data = await res.json();
      onUpdatesChange(sortUpdates([data.update, ...(updates || [])]));
      setCreating(false);
      resetForm();
    } catch {
      setError(t("project.updateCreateFailed") || "Failed to publish update.");
    } finally {
      setSaving(false);
    }
  }, [body, imageUrl, onUpdatesChange, resetForm, slug, t, title, updateType, updates]);

  const handleDeleteUpdate = useCallback(
    async (id: number) => {
      const confirmed = window.confirm(
        t("project.confirmDeleteUpdate") ||
          "Delete this update permanently?",
      );
      if (!confirmed) return;

      setDeletingId(id);
      setError("");

      try {
        const res = await fetch(`/api/projects/${slug}/updates`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error || t("project.updateDeleteFailed") || "Failed to delete update.");
          return;
        }

        onUpdatesChange((updates || []).filter((update) => update.id !== id));
      } catch {
        setError(t("project.updateDeleteFailed") || "Failed to delete update.");
      } finally {
        setDeletingId(null);
      }
    },
    [onUpdatesChange, slug, t, updates],
  );

  return (
    <div className="space-y-5">
      {canEdit && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-4 space-y-3">
          {!creating ? (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("project.addUpdate") || "Add update"}
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("project.updateTitlePlaceholder") || "Update title"}
              />

              <Select
                value={updateType}
                onValueChange={(value) => setUpdateType(value as ProjectUpdateType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UPDATE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`project.updateType.${type}`) || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t("project.updateImageUrlPlaceholder") || "Optional image URL"}
              />

              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  t("project.updateBodyPlaceholder") ||
                  "Write your project update details..."
                }
                className="min-h-[130px]"
              />

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleCreateUpdate}
                  disabled={saving || !title.trim() || !body.trim()}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {saving
                    ? t("project.publishingUpdate") || "Publishing..."
                    : t("project.publishUpdate") || "Publish update"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCreating(false);
                    resetForm();
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t("common.cancel") || "Cancel"}
                </Button>
              </div>
            </div>
          )}

          {!creating && error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}

      {canEdit && sortedUpdates.length > 0 && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("project.manageUpdates") || "Manage updates"}
          </p>
          {sortedUpdates.map((update) => (
            <div
              key={update.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{update.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(update.published_at || update.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={deletingId === update.id}
                onClick={() => handleDeleteUpdate(update.id)}
              >
                {deletingId === update.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      <ProjectLogTimeline
        milestones={milestones}
        members={members}
        createdAt={createdAt}
        projectTitle={projectTitle}
        heroImageUrl={heroImageUrl}
        updates={sortedUpdates}
      />
    </div>
  );
}
