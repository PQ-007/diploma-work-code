"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

type Tone = "neutral" | "brand" | "sky" | "success" | "warning" | "danger";

/** One mapping from domain values to badge tone + label (docs/design-system.md → Labels). */
const MAP: Record<string, Record<string, { tone: Tone; key: string }>> = {
  article: {
    draft: { tone: "neutral", key: "articles.status.draft" },
    published: { tone: "success", key: "articles.status.published" },
    archieved: { tone: "neutral", key: "articles.status.archieved" },
  },
  term: {
    draft: { tone: "neutral", key: "dictionary.status.draft" },
    pending_review: { tone: "warning", key: "dictionary.status.pending_review" },
    approved: { tone: "success", key: "dictionary.status.approved" },
    rejected: { tone: "danger", key: "dictionary.status.rejected" },
  },
  project: {
    draft: { tone: "neutral", key: "project.status.draft" },
    in_progress: { tone: "brand", key: "project.status.in_progress" },
    completed: { tone: "success", key: "project.status.completed" },
    archived: { tone: "neutral", key: "project.status.archived" },
  },
  difficulty: {
    beginner: { tone: "success", key: "project.difficulty.beginner" },
    intermediate: { tone: "warning", key: "project.difficulty.intermediate" },
    advanced: { tone: "danger", key: "project.difficulty.advanced" },
  },
  projectType: {
    diploma: { tone: "brand", key: "project.typeValue.diploma" },
    contest: { tone: "danger", key: "project.typeValue.contest" },
    intership: { tone: "sky", key: "project.typeValue.intership" },
    private: { tone: "neutral", key: "project.typeValue.private" },
  },
};

export type StatusKind = keyof typeof MAP;

export function StatusBadge({
  kind,
  value,
  className,
}: {
  kind: StatusKind;
  value: string | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!value) return null;
  const entry = MAP[kind]?.[value];
  return (
    <Badge variant={entry?.tone ?? "neutral"} className={className}>
      {entry ? t(entry.key) : value.replace(/_/g, " ")}
    </Badge>
  );
}
