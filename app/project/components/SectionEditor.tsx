"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Pencil,
  Save,
  X,
  BookOpen,
  Target,
  Cpu,
  Code2,
  BarChart3,
  Lightbulb,
  FileText,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ProjectSection } from "@/app/project/types";

interface SectionEditorProps {
  slug: string;
  sections: ProjectSection[];
  canEdit: boolean;
  onSectionsChange: (sections: ProjectSection[]) => void;
}

const sectionMeta: Record<string, { icon: React.ElementType; color: string }> = {
  overview:        { icon: BookOpen,   color: "text-blue-500" },
  goals:           { icon: Target,     color: "text-green-500" },
  architecture:    { icon: Cpu,        color: "text-purple-500" },
  implementation:  { icon: Code2,      color: "text-orange-500" },
  results:         { icon: BarChart3,  color: "text-cyan-500" },
  lessons_learned: { icon: Lightbulb,  color: "text-yellow-500" },
  custom:          { icon: FileText,   color: "text-muted-foreground" },
};

export default function SectionEditor({
  slug,
  sections,
  canEdit,
  onSectionsChange,
}: SectionEditorProps) {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState<number | null>(sections[0]?.id ?? null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftContent, setDraftContent] = useState("");

  const sectionLabel = useCallback(
    (section: ProjectSection) => {
      const labels: Record<string, string> = {
        overview:        t("project.section.overview")       || "Overview",
        goals:           t("project.section.goals")          || "Goals",
        architecture:    t("project.section.architecture")   || "Architecture / Design",
        implementation:  t("project.section.implementation") || "Implementation",
        results:         t("project.section.results")        || "Results",
        lessons_learned: t("project.section.lessonsLearned") || "Lessons Learned",
        custom:          section.title,
      };
      return labels[section.section_type] || section.title;
    },
    [t],
  );

  const handleSave = useCallback(
    async (sectionId: number, content: string) => {
      const updated = sections.map((s) => (s.id === sectionId ? { ...s, content } : s));
      onSectionsChange(updated);
      setEditingId(null);
      try {
        await fetch(`/api/projects/${slug}/sections`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections: [{ id: sectionId, content }] }),
        });
      } catch {
        onSectionsChange(sections);
      }
    },
    [slug, sections, onSectionsChange],
  );

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0] ?? null;
  const filledCount = sections.filter((s) => s.content && s.content.trim().length > 0).length;

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t("project.noSections") || "No sections yet."}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-0 rounded-xl border border-border overflow-hidden min-h-[400px]">
      {/* Left: Section navigation */}
      <nav className="border-r border-border bg-muted/20 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("project.sections") || "Sections"}
          </span>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {filledCount}/{sections.length}
          </Badge>
        </div>

        {/* Section list */}
        <div className="flex-1 overflow-y-auto py-1">
          {sections.map((section) => {
            const meta = sectionMeta[section.section_type] ?? sectionMeta.custom;
            const Icon = meta.icon;
            const hasContent = !!(section.content && section.content.trim().length > 0);
            const isActive = section.id === (activeSection?.id ?? null);

            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveId(section.id);
                  if (editingId && editingId !== section.id) setEditingId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left group
                  ${isActive
                    ? "bg-background border-r-2 border-primary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? meta.color : ""}`} />
                <span className="flex-1 truncate">{sectionLabel(section)}</span>
                {hasContent ? (
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-500 opacity-70" />
                ) : (
                  <Circle className="h-3 w-3 flex-shrink-0 opacity-20" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right: Content panel */}
      <div className="flex flex-col bg-background">
        {activeSection ? (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                {(() => {
                  const meta = sectionMeta[activeSection.section_type] ?? sectionMeta.custom;
                  const Icon = meta.icon;
                  return <Icon className={`h-4 w-4 ${meta.color}`} />;
                })()}
                <span className="font-semibold text-sm">{sectionLabel(activeSection)}</span>
              </div>
              {canEdit && editingId !== activeSection.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1 text-xs"
                  onClick={() => {
                    setDraftContent(activeSection.content || "");
                    setEditingId(activeSection.id);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                  {t("common.edit") || "Edit"}
                </Button>
              )}
            </div>

            {/* Panel body */}
            <div className="flex-1 p-5">
              {editingId === activeSection.id ? (
                <div className="space-y-3 h-full flex flex-col">
                  <Textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder={t("project.writeContent") || "Write content in Markdown..."}
                    className="flex-1 min-h-[300px] font-mono text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(activeSection.id, draftContent)}>
                      <Save className="h-3 w-3 mr-1" />
                      {t("common.save") || "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t("common.cancel") || "Cancel"}
                    </Button>
                  </div>
                </div>
              ) : activeSection.content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {activeSection.content}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center gap-3">
                  {(() => {
                    const meta = sectionMeta[activeSection.section_type] ?? sectionMeta.custom;
                    const Icon = meta.icon;
                    return <Icon className="h-10 w-10 text-muted-foreground/20" />;
                  })()}
                  <p className="text-sm text-muted-foreground italic">
                    {canEdit
                      ? t("project.clickToEdit") || "Click Edit to add content..."
                      : t("project.noContent") || "No content yet."}
                  </p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDraftContent("");
                        setEditingId(activeSection.id);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      {t("project.addContent") || "Add Content"}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Navigation footer */}
            {sections.length > 1 && (
              <>
                <Separator />
                <div className="flex items-center justify-between px-5 py-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 h-7"
                    disabled={sections[0].id === activeSection.id}
                    onClick={() => {
                      const idx = sections.findIndex((s) => s.id === activeSection.id);
                      if (idx > 0) setActiveId(sections[idx - 1].id);
                    }}
                  >
                    ← {t("common.previous") || "Previous"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {sections.findIndex((s) => s.id === activeSection.id) + 1} / {sections.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 h-7"
                    disabled={sections[sections.length - 1].id === activeSection.id}
                    onClick={() => {
                      const idx = sections.findIndex((s) => s.id === activeSection.id);
                      if (idx < sections.length - 1) setActiveId(sections[idx + 1].id);
                    }}
                  >
                    {t("common.next") || "Next"} →
                  </Button>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}