"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
  GripVertical,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ProjectMilestone } from "@/app/project/types";

interface MilestoneTrackerProps {
  slug: string;
  milestones: ProjectMilestone[];
  progress: number;
  canEdit: boolean;
  onMilestonesChange: (milestones: ProjectMilestone[]) => void;
}

export default function MilestoneTracker({
  slug,
  milestones,
  progress,
  canEdit,
  onMilestonesChange,
}: MilestoneTrackerProps) {
  const { t } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${slug}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || null,
          due_date: newDueDate || null,
          sort_order: milestones.length,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onMilestonesChange([...milestones, data.milestone]);
        setNewTitle("");
        setNewDescription("");
        setNewDueDate("");
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (milestone: ProjectMilestone) => {
    if (!canEdit) return;

    // Optimistic update
    const updated = milestones.map((m) =>
      m.id === milestone.id ? { ...m, completed: !m.completed } : m,
    );
    onMilestonesChange(updated);

    try {
      await fetch(`/api/projects/${slug}/milestones`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: milestone.id,
          completed: !milestone.completed,
        }),
      });
    } catch {
      // Revert on error
      onMilestonesChange(milestones);
    }
  };

  const handleDelete = async (id: number) => {
    const updated = milestones.filter((m) => m.id !== id);
    onMilestonesChange(updated);

    await fetch(`/api/projects/${slug}/milestones`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const completedCount = milestones.filter((m) => m.completed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {t("project.milestones") || "Milestones"}
        </h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{milestones.length}{" "}
          {t("project.completed") || "completed"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("project.progress") || "Progress"}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Milestones list */}
      <div className="space-y-2">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={`flex items-start gap-3 rounded-lg border border-border p-3 transition-colors ${
              milestone.completed
                ? "bg-muted/30 border-green-500/20"
                : "bg-card"
            }`}
          >
            {canEdit && (
              <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0 cursor-grab" />
            )}

            <button
              onClick={() => handleToggle(milestone)}
              disabled={!canEdit}
              className="mt-0.5 flex-shrink-0"
            >
              {milestone.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  milestone.completed
                    ? "line-through text-muted-foreground"
                    : ""
                }`}
              >
                {milestone.title}
              </p>
              {milestone.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {milestone.description}
                </p>
              )}
              {milestone.due_date && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(milestone.due_date).toLocaleDateString()}
                </div>
              )}
            </div>

            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(milestone.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add milestone */}
      {canEdit && !adding && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("project.addMilestone") || "Add Milestone"}
        </Button>
      )}

      {canEdit && adding && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <Input
            placeholder={t("project.milestoneTitle") || "Milestone title"}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Textarea
            placeholder={
              t("project.milestoneDescription") || "Description (optional)"
            }
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="min-h-[60px]"
          />
          <Input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              {saving
                ? t("common.saving") || "Saving..."
                : t("common.add") || "Add"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              {t("common.cancel") || "Cancel"}
            </Button>
          </div>
        </div>
      )}

      {milestones.length === 0 && !adding && (
        <p className="text-center text-sm text-muted-foreground py-4">
          {t("project.noMilestones") || "No milestones yet"}
        </p>
      )}
    </div>
  );
}
