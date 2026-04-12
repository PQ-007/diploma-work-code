"use client";

import type {
  ProjectMember,
  ProjectMilestone,
  ProjectUpdate,
} from "@/app/project/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CheckCircle2,
  Clock,
  Layers,
  Megaphone,
  ScrollText,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

interface TimelineEntry {
  id?: number;
  date: string;
  icon: React.ElementType;
  color: string;
  title: string;
  description?: string;
  tag: string;
  body: string;
  imageUrl?: string | null;
}

interface ProjectLogTimelineProps {
  milestones: ProjectMilestone[];
  members: ProjectMember[];
  createdAt: string;
  projectTitle?: string;
  heroImageUrl?: string | null;
  updates?: ProjectUpdate[];
}

export default function ProjectLogTimeline({
  milestones,
  members,
  createdAt,
  projectTitle,
  heroImageUrl,
  updates = [],
}: ProjectLogTimelineProps) {
  const { t } = useLanguage();
  const [activeEntry, setActiveEntry] = useState<null | TimelineEntry>(null);

  const entries = useMemo<TimelineEntry[]>(() => {
    const resolvedUpdates = (updates || [])
      .map((update) => {
        const iconByType: Record<
          ProjectUpdate["update_type"],
          React.ElementType
        > = {
          regular: ScrollText,
          milestone: CheckCircle2,
          release: Layers,
          announcement: Megaphone,
        };

        const fallbackTypeLabel: Record<ProjectUpdate["update_type"], string> =
          {
            regular: t("project.regularUpdate") || "Regular Update",
            milestone: t("project.updateType.milestone") || "Milestone Update",
            release: t("project.updateType.release") || "Release Update",
            announcement:
              t("project.updateType.announcement") || "Announcement",
          };

        return {
          id: update.id,
          date: update.published_at || update.created_at,
          icon: iconByType[update.update_type] || ScrollText,
          color: "text-primary",
          title: update.title,
          description:
            update.author?.display_name ||
            update.author?.user_name ||
            undefined,
          tag:
            t(`project.updateType.${update.update_type}`) ||
            fallbackTypeLabel[update.update_type],
          body: update.body,
          imageUrl: update.image_url || heroImageUrl || null,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (resolvedUpdates.length > 0) {
      return resolvedUpdates;
    }

    const fallbackEntries: TimelineEntry[] = [];

    fallbackEntries.push({
      date: createdAt,
      icon: Layers,
      color: "text-primary",
      title: t("project.logCreated") || "Project created",
      tag: t("project.regularUpdate") || "Project Update",
      body:
        t("project.logCreatedBody") ||
        `${projectTitle || "This project"} has been published. This page provides a high-level overview, latest updates, and collaboration details for the team and community.`,
      imageUrl: heroImageUrl || null,
    });

    members.forEach((member) => {
      if (member.role !== "owner" && member.joined_at) {
        fallbackEntries.push({
          date: member.joined_at,
          icon: Users,
          color: "text-muted-foreground",
          title: `${member.profile?.display_name || member.profile?.user_name || "User"} ${t("project.logJoined") || "joined as"} ${member.role}`,
          tag: t("project.teamUpdate") || "Team Update",
          body:
            t("project.logJoinedBody") ||
            `${member.profile?.display_name || member.profile?.user_name || "A member"} joined the project as ${member.role}. Team responsibilities and collaboration flow were updated accordingly.`,
          imageUrl: heroImageUrl || null,
        });
      }
    });

    milestones
      .filter((milestone) => milestone.completed && milestone.completed_at)
      .forEach((milestone) => {
        fallbackEntries.push({
          date: milestone.completed_at!,
          icon: CheckCircle2,
          color: "text-primary",
          title: `${t("project.logCompleted") || "Completed:"} ${milestone.title}`,
          description: milestone.description || undefined,
          tag: t("project.regularUpdate") || "Regular Update",
          body:
            milestone.description ||
            `${t("project.logCompleted") || "Completed:"} ${milestone.title}. Implementation for this task is now done and reflected in current project progress.`,
          imageUrl: heroImageUrl || null,
        });
      });

    return fallbackEntries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [createdAt, heroImageUrl, members, milestones, projectTitle, t, updates]);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-8 text-sm text-muted-foreground text-center">
        <ScrollText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
        <p>{t("project.noLog") || "No activity logged yet."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative space-y-0">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

        {entries.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id ?? i}
              type="button"
              onClick={() => setActiveEntry(entry)}
              className="relative flex w-full gap-4 pb-6 last:pb-0 text-left group"
            >
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background ${entry.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  {entry.title}
                </p>
                {entry.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(entry.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog
        open={Boolean(activeEntry)}
        onOpenChange={(open) => {
          if (!open) setActiveEntry(null);
        }}
      >
        <DialogContent className="max-w-6xl p-0 overflow-hidden">
          {activeEntry && (
            <div className="bg-card text-card-foreground">
              <DialogHeader className="px-8 pt-8 pb-5 border-b border-border/70">
                <p className="text-xs uppercase tracking-[0.12em] text-primary font-semibold">
                  {activeEntry.tag}
                  <span className="text-muted-foreground font-normal ml-2">
                    {new Date(activeEntry.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
                <DialogTitle className="text-4xl leading-tight tracking-tight mt-2">
                  {activeEntry.title}
                </DialogTitle>
              </DialogHeader>

              {(activeEntry.imageUrl || heroImageUrl) && (
                <div className="px-8 pt-6">
                  <div className="overflow-hidden rounded-md border border-border/70">
                    <img
                      src={activeEntry.imageUrl || heroImageUrl || undefined}
                      alt={projectTitle || activeEntry.title}
                      className="w-full max-h-[560px] object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="px-8 py-6 space-y-5 text-[15px] leading-8 text-muted-foreground">
                {activeEntry.body.split("\n\n").map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
