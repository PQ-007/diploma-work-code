"use client";

import type { ComponentType, Dispatch, RefObject, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, Eye, Github, Globe, ImagePlus, Loader2, Play, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Chip } from "@/components/common/Chip";
import { Field } from "@/components/common/Form";
import { StatusBadge } from "@/components/common/StatusBadge";
import { UserChip } from "@/components/common/UserChip";
import { TagInputWithSuggestions } from "@/components/form/TagInputWithSuggestions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ProjectCategory, ProjectDifficulty, ProjectType } from "@/app/project/types";

const CATEGORIES: ProjectCategory[] = ["web_dev", "mobile_dev", "ai", "game_dev", "hardware_iot", "creative_design", "other"];
const TYPES: ProjectType[] = ["private", "diploma", "contest", "intership"];
const DIFFICULTIES: ProjectDifficulty[] = ["beginner", "intermediate", "advanced"];

interface ProjectInfoSidebarProps {
  authorAvatar: string;
  authorName: string;
  user: { email?: string | null } | null;
  repositoryUrl: string;
  setRepositoryUrl: Dispatch<SetStateAction<string>>;
  demoUrl: string;
  setDemoUrl: Dispatch<SetStateAction<string>>;
  videoUrl: string;
  setVideoUrl: Dispatch<SetStateAction<string>>;
  youTubeId: string | null;
  thumbnailInputRef: RefObject<HTMLInputElement | null>;
  thumbnailUrl: string;
  projectType: ProjectType;
  setProjectType: Dispatch<SetStateAction<ProjectType>>;
  category: ProjectCategory | "";
  setCategory: Dispatch<SetStateAction<ProjectCategory | "">>;
  tags: string[];
  setTags: Dispatch<SetStateAction<string[]>>;
  createdAt: string | null;
  progress: number;
  setProgress: Dispatch<SetStateAction<number>>;
  difficulty: ProjectDifficulty;
  setDifficulty: Dispatch<SetStateAction<ProjectDifficulty>>;
  isPublished: boolean;
  setIsPublished: Dispatch<SetStateAction<boolean>>;
  editSlug: string | null;
  saving: boolean;
  deleting: boolean;
  saveSuccess: boolean;
  saveLabel: string;
  SaveIcon: ComponentType<{ className?: string }>;
  router: ReturnType<typeof useRouter>;
  handleSave: () => void;
  handleDeleteProject: () => void;
}

export function ProjectInfoSidebar({
  authorAvatar,
  authorName,
  user,
  repositoryUrl,
  setRepositoryUrl,
  demoUrl,
  setDemoUrl,
  videoUrl,
  setVideoUrl,
  youTubeId,
  thumbnailInputRef,
  thumbnailUrl,
  projectType,
  setProjectType,
  category,
  setCategory,
  tags,
  setTags,
  createdAt,
  progress,
  setProgress,
  difficulty,
  setDifficulty,
  isPublished,
  setIsPublished,
  editSlug,
  saving,
  deleting,
  saveLabel,
  SaveIcon,
  router,
  handleSave,
  handleDeleteProject,
}: ProjectInfoSidebarProps) {
  const { t } = useTranslation();
  const f = (k: string) => t(`project.form.${k}`);

  return (
    // Below xl this stacks under the main column; from xl it is a sticky right column.
    <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
      {/* Visibility + save */}
      <Card className="gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{isPublished ? f("published") : f("draft")}</p>
            <p className="text-xs text-muted-foreground">{isPublished ? f("publishedHint") : f("draftHint")}</p>
          </div>
          <Switch checked={isPublished} onCheckedChange={setIsPublished} aria-label={f("visibility")} />
        </div>
        <Button onClick={handleSave} disabled={saving || deleting} className="w-full">
          <SaveIcon className={saving ? "size-4 animate-spin" : "size-4"} />
          {saveLabel}
        </Button>
        {editSlug && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/project/${editSlug}`)}>
              <Eye />
              {t("common.view")}
            </Button>
            <Button variant="destructive-soft" size="sm" onClick={handleDeleteProject} disabled={deleting}>
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {t("common.delete")}
            </Button>
          </div>
        )}
      </Card>

      {/* Details */}
      <Card className="gap-5 p-4">
        <h2 className="text-sm font-semibold">{f("details")}</h2>

        <button
          type="button"
          onClick={() => thumbnailInputRef.current?.click()}
          className="group overflow-hidden rounded-lg border"
          aria-label={f("changeThumbnail")}
        >
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className="aspect-video w-full object-cover transition-opacity group-hover:opacity-80" />
          ) : (
            <span className="flex aspect-video w-full flex-col items-center justify-center gap-1 bg-muted/50 text-xs text-muted-foreground group-hover:text-primary">
              <ImagePlus className="size-5" />
              {f("uploadThumbnail")}
            </span>
          )}
        </button>

        <Field label={f("type")}>
          <Select value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((v) => (
                <SelectItem key={v} value={v}>
                  <span className="font-medium">{t(`project.typeValue.${v}`)}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">{f(`type_${v}`)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={f("category")}>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((v) => (
              <Chip key={v} selected={category === v} onClick={() => setCategory(category === v ? "" : v)}>
                {t(`project.categoryValue.${v}`)}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label={f("tags")}>
          <TagInputWithSuggestions tags={tags} onTagsChange={setTags} maxTags={8} placeholder={f("tagsPlaceholder")} />
        </Field>

        <Field label={f("difficulty")}>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as ProjectDifficulty)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((v) => (
                <SelectItem key={v} value={v}>
                  <StatusBadge kind="difficulty" value={v} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={<span className="flex w-full justify-between">{f("progress")}<span className="font-semibold tabular-nums">{progress}%</span></span>}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            aria-label={f("progress")}
            className="h-2 w-full cursor-pointer accent-primary"
          />
        </Field>

        {createdAt && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{f("created")}</span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Calendar className="size-3.5" />
              {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </Card>

      {/* Links */}
      <Card className="gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{f("links")}</h2>
          <UserChip name={authorName || user?.email?.split("@")[0] || "—"} avatarUrl={authorAvatar} />
        </div>
        <Field label={<span className="inline-flex items-center gap-1.5"><Github className="size-3.5" />{f("repository")}</span>} htmlFor="repo">
          <Input id="repo" type="url" placeholder="https://github.com/…" value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} />
        </Field>
        <Field label={<span className="inline-flex items-center gap-1.5"><Globe className="size-3.5" />{f("demoUrl")}</span>} htmlFor="demo">
          <Input id="demo" type="url" placeholder="https://…" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} />
        </Field>
        <Field
          label={<span className="inline-flex items-center gap-1.5"><Play className="size-3.5" />{f("videoUrl")}</span>}
          htmlFor="video"
          hint={youTubeId ? <span className="inline-flex items-center gap-1 text-success"><Check className="size-3" />{f("embedActive")}</span> : undefined}
        >
          <Input id="video" type="url" placeholder="https://youtu.be/…" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        </Field>
      </Card>
    </aside>
  );
}
