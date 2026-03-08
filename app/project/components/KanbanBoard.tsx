"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Calendar,
  Loader2,
  Circle,
  Clock,
  CheckCircle2,
  GripVertical,
  X,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ProjectMilestone, KanbanStatus } from "@/app/project/types";

interface KanbanBoardProps {
  slug: string;
  milestones: ProjectMilestone[];
  progress: number;
  canEdit: boolean;
  onMilestonesChange: (milestones: ProjectMilestone[]) => void;
}

const COLUMNS: { status: KanbanStatus; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { status: "todo",        label: "To Do",       icon: Circle,        color: "text-muted-foreground", bg: "bg-muted/40" },
  { status: "in_progress", label: "In Progress",  icon: Clock,         color: "text-blue-500",         bg: "bg-blue-500/5" },
  { status: "done",        label: "Done",         icon: CheckCircle2,  color: "text-green-500",        bg: "bg-green-500/5" },
];

function getStatus(m: ProjectMilestone): KanbanStatus {
  if (m.kanban_status) return m.kanban_status;
  return m.completed ? "done" : "todo";
}

interface AddCardProps {
  onAdd: (title: string, dueDate: string) => Promise<void>;
  onCancel: () => void;
}

function AddCard({ onAdd, onCancel }: AddCardProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onAdd(title.trim(), dueDate);
    setSaving(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2 shadow-sm">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("project.taskTitle") || "Task title…"}
        className="h-8 text-sm"
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onCancel(); }}
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
      />
      <div className="flex gap-1.5">
        <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSubmit} disabled={saving || !title.trim()}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : (t("common.add") || "Add")}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function KanbanBoard({
  slug,
  milestones,
  progress,
  canEdit,
  onMilestonesChange,
}: KanbanBoardProps) {
  const { t } = useLanguage();
  const [addingIn, setAddingIn] = useState<KanbanStatus | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const handleAdd = useCallback(
    async (status: KanbanStatus, title: string, dueDate: string) => {
      try {
        const res = await fetch(`/api/projects/${slug}/milestones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            due_date: dueDate || null,
            sort_order: milestones.length,
            kanban_status: status,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          onMilestonesChange([...milestones, data.milestone]);
        }
      } finally {
        setAddingIn(null);
      }
    },
    [slug, milestones, onMilestonesChange],
  );

  const handleMove = useCallback(
    async (id: number, newStatus: KanbanStatus) => {
      const updated = milestones.map((m) =>
        m.id === id ? { ...m, kanban_status: newStatus, completed: newStatus === "done" } : m,
      );
      onMilestonesChange(updated);
      try {
        await fetch(`/api/projects/${slug}/milestones`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, kanban_status: newStatus }),
        });
      } catch {
        onMilestonesChange(milestones);
      }
    },
    [slug, milestones, onMilestonesChange],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      onMilestonesChange(milestones.filter((m) => m.id !== id));
      await fetch(`/api/projects/${slug}/milestones`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    [slug, milestones, onMilestonesChange],
  );

  const handleDragStart = (id: number) => setDragging(id);
  const handleDragEnd = () => setDragging(null);

  const handleDrop = (e: React.DragEvent, status: KanbanStatus) => {
    e.preventDefault();
    if (dragging !== null) handleMove(dragging, status);
    setDragging(null);
  };

  const doneCount = milestones.filter((m) => getStatus(m) === "done").length;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("project.progress") || "Progress"}</span>
          <span className="font-medium">{doneCount}/{milestones.length} {t("project.tasksCompleted") || "tasks done"} · {progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(({ status, label, icon: Icon, color, bg }) => {
          const cards = milestones.filter((m) => getStatus(m) === status);
          const isOver = dragging !== null && getStatus(milestones.find(m => m.id === dragging)!) !== status;

          return (
            <div
              key={status}
              className={`rounded-xl border border-border flex flex-col transition-colors ${isOver ? "border-primary/50 bg-primary/5" : bg}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-sm font-semibold">{label}</span>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5 min-w-[20px] justify-center">
                    {cards.length}
                  </Badge>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setAddingIn(status)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                {addingIn === status && (
                  <AddCard
                    onAdd={(title, dueDate) => handleAdd(status, title, dueDate)}
                    onCancel={() => setAddingIn(null)}
                  />
                )}

                {cards.map((card) => (
                  <div
                    key={card.id}
                    draggable={canEdit}
                    onDragStart={() => handleDragStart(card.id)}
                    onDragEnd={handleDragEnd}
                    className={`group rounded-lg border border-border bg-card p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing active:shadow-md active:scale-[0.98] ${dragging === card.id ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {canEdit && (
                        <GripVertical className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/30 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className={`text-sm font-medium leading-snug ${status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {card.title}
                        </p>
                        {card.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
                        )}
                        {card.due_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(card.due_date).toLocaleDateString()}
                          </div>
                        )}
                        {/* Quick move buttons */}
                        {canEdit && (
                          <div className="flex gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {COLUMNS.filter((c) => c.status !== status).map((col) => (
                              <button
                                key={col.status}
                                onClick={() => handleMove(card.id, col.status)}
                                className={`text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-muted transition-colors ${col.color}`}
                              >
                                → {col.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => handleDelete(card.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {cards.length === 0 && addingIn !== status && (
                  <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/50 border border-dashed border-border rounded-lg">
                    {canEdit ? (t("project.dropHere") || "Drop here or click +") : (t("project.empty") || "Empty")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}