"use client";

import type { ProjectMilestone } from "@/app/project/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectGanttChartProps {
  milestones: ProjectMilestone[];
}

interface GanttTask {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: "todo" | "in_progress" | "done";
}

function startOfDay(input: Date) {
  return new Date(input.getFullYear(), input.getMonth(), input.getDate());
}

function addDays(input: Date, days: number) {
  const out = new Date(input);
  out.setDate(out.getDate() + days);
  return out;
}

function diffDays(a: Date, b: Date) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function buildTasks(milestones: ProjectMilestone[]): GanttTask[] {
  return (milestones || []).map((milestone) => {
    const milestoneStart = milestone.created_at
      ? startOfDay(new Date(milestone.created_at))
      : startOfDay(new Date());

    let start = milestoneStart;
    let end = addDays(milestoneStart, 6);

    if (milestone.due_date) {
      end = startOfDay(new Date(milestone.due_date));
      start = addDays(end, -6);
    }

    if (end.getTime() < start.getTime()) {
      end = start;
    }

    const status =
      milestone.kanban_status || (milestone.completed ? "done" : "todo");

    return {
      id: milestone.id,
      title: milestone.title,
      start,
      end,
      status,
    };
  });
}

function statusClass(status: GanttTask["status"]) {
  if (status === "done") return "bg-primary";
  if (status === "in_progress") return "bg-primary/70";
  return "bg-muted-foreground/40";
}

export default function ProjectGanttChart({
  milestones,
}: ProjectGanttChartProps) {
  const { t } = useLanguage();
  const tasks = buildTasks(milestones);

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        {t("project.noTimelineData") || "No timeline data yet."}
      </div>
    );
  }

  const projectStart = tasks
    .map((task) => task.start)
    .reduce((min, current) => (current < min ? current : min));
  const projectEnd = tasks
    .map((task) => task.end)
    .reduce((max, current) => (current > max ? current : max));

  const totalDays = Math.max(diffDays(projectEnd, projectStart) + 1, 1);

  const ticks = Array.from({ length: 5 }).map((_, index) => {
    const dayOffset = Math.round((index / 4) * (totalDays - 1));
    const date = addDays(projectStart, dayOffset);
    return {
      label: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      left: `${(dayOffset / totalDays) * 100}%`,
    };
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card/80 p-3 sm:p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground mb-2">
          {t("project.timelineWindow") || "Timeline window"}
        </p>
        <p className="text-sm font-medium text-foreground">
          {projectStart.toLocaleDateString()} -{" "}
          {projectEnd.toLocaleDateString()}
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card/80">
        <div className="relative border-b border-border bg-muted/30 h-10">
          {ticks.map((tick) => (
            <div
              key={`${tick.label}-${tick.left}`}
              className="absolute top-0 h-full"
              style={{ left: tick.left }}
            >
              <div className="h-full border-l border-border/70" />
              <span className="absolute top-1 right-1 translate-x-1/2 text-[10px] text-muted-foreground">
                {tick.label}
              </span>
            </div>
          ))}
        </div>

        <div className="divide-y divide-border">
          {tasks.map((task) => {
            const offset = diffDays(task.start, projectStart);
            const duration = Math.max(diffDays(task.end, task.start) + 1, 1);
            const left = (offset / totalDays) * 100;
            const width = Math.max((duration / totalDays) * 100, 4);

            return (
              <div
                key={task.id}
                className="grid grid-cols-[minmax(180px,240px)_1fr] items-center gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.start.toLocaleDateString()} -{" "}
                    {task.end.toLocaleDateString()}
                  </p>
                </div>

                <div className="relative h-8 rounded bg-muted/40">
                  <div
                    className={`absolute top-1.5 h-5 rounded ${statusClass(task.status)}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={task.title}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
