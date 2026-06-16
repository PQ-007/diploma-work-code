"use client";

import type {
  ComponentType,
  Dispatch,
  RefObject,
  SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInputWithSuggestions } from "@/components/form/TagInputWithSuggestions";
import {
  Calendar,
  Check,
  Eye,
  Github,
  Globe,
  ImagePlus,
  Loader2,
  Play,
  Trash2,
} from "lucide-react";
import type {
  ProjectCategory,
  ProjectDifficulty,
  ProjectType,
} from "@/app/project/types";

const CATEGORY_OPTIONS: { value: ProjectCategory; label: string }[] = [
  { value: "web_dev", label: "Web Dev" },
  { value: "mobile_dev", label: "Mobile Dev" },
  { value: "ai", label: "AI" },
  { value: "game_dev", label: "Game Dev" },
  { value: "hardware_iot", label: "Hardware / IoT" },
  { value: "creative_design", label: "Creative Design" },
  { value: "other", label: "Other" },
];

const TYPE_OPTIONS: { value: ProjectType; label: string; desc: string }[] = [
  { value: "private", label: "Private", desc: "Personal / side project" },
  { value: "diploma", label: "Diploma", desc: "Thesis or graduation project" },
  { value: "contest", label: "Contest", desc: "Hackathon or competition" },
  {
    value: "intership",
    label: "Internship",
    desc: "Internship or work placement",
  },
];

const difficultyColors: Record<ProjectDifficulty, string> = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-500 border-red-500/20",
};

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
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
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
  description,
  setDescription,
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
  saveSuccess,
  saveLabel,
  SaveIcon,
  router,
  handleSave,
  handleDeleteProject,
}: ProjectInfoSidebarProps) {
  return (
    <aside className="hidden xl:flex xl:flex-col gap-4 sticky top-[84px] self-start">
      {/* ── Contributor Spotlight (top) ── */}
      <Card className="border-border/80 bg-card/90 p-4 text-card-foreground space-y-3">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Contributor Spotlight
        </p>
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={authorAvatar || undefined} />
            <AvatarFallback>
              {(authorName || user?.email?.split("@")[0] || "U")
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {authorName || user?.email?.split("@")[0] || "You"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lead contributor
            </p>
          </div>
        </div>

        {/* Repo URL */}
        <div className="space-y-1">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Github className="h-3 w-3" /> Repository
          </p>
          <Input
            placeholder="https://github.com/…"
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            className="h-7 text-xs bg-muted/30 border-border/60"
          />
        </div>

        {/* Demo URL */}
        <div className="space-y-1">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Globe className="h-3 w-3" /> Demo URL
          </p>
          <Input
            placeholder="https://live-demo.com"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            className="h-7 text-xs bg-muted/30 border-border/60"
          />
        </div>

        {/* Video URL */}
        <div className="space-y-1">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Play className="h-3 w-3" /> Video URL
          </p>
          <Input
            placeholder="YouTube link"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="h-7 text-xs bg-muted/30 border-border/60"
          />
          {youTubeId && (
            <p className="text-[10px] text-primary/70 flex items-center gap-1">
              <Check className="h-2.5 w-2.5" />
              Embed active in preview
            </p>
          )}
        </div>

        {/* Preview link buttons */}
        {(repositoryUrl || demoUrl) && (
          <div className="grid grid-cols-1 gap-2 pt-1">
            {repositoryUrl && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start border-border bg-muted/30 hover:bg-accent h-8"
              >
                <a href={repositoryUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="h-3.5 w-3.5 mr-2" />
                  Repository
                </a>
              </Button>
            )}
            {demoUrl && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start border-border bg-muted/30 hover:bg-accent h-8"
              >
                <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-3.5 w-3.5 mr-2" />
                  Live Demo
                </a>
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* ── Project info card ── */}
      <Card className="border-border/80 bg-card/90 p-4 text-card-foreground space-y-4">
        {/* Thumbnail preview (click to change) */}
        <div
          className="rounded-md overflow-hidden border border-border cursor-pointer group"
          onClick={() => thumbnailInputRef.current?.click()}
          title="Click to change thumbnail"
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Thumbnail"
              className="w-full aspect-video object-cover transition-opacity group-hover:opacity-75"
            />
          ) : (
            <div className="w-full aspect-video bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
              <ImagePlus className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Brief description (single editable line) */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Brief
          </p>
          <Input
            placeholder="One-line description…"
            value={description.split("\n")[0].slice(0, 120)}
            onChange={(e) => {
              const rest = description.includes("\n")
                ? description.slice(description.indexOf("\n"))
                : "";
              setDescription(e.target.value + rest);
            }}
            className="h-7 text-xs bg-muted/30 border-border/60"
            maxLength={120}
          />
        </div>

        {/* Type selector */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Project Type
          </p>
          <Select
            value={projectType}
            onValueChange={(v) => setProjectType(v as ProjectType)}
          >
            <SelectTrigger className="h-7 text-xs bg-muted/30 border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="font-medium">{opt.label}</span>
                  <span className="ml-1.5 text-muted-foreground text-[11px]">
                    — {opt.desc}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category selector */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Category
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  setCategory(category === opt.value ? "" : opt.value)
                }
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  category === opt.value
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Tags
          </p>
          <TagInputWithSuggestions
            tags={tags}
            onTagsChange={setTags}
            maxTags={8}
            placeholder="Add tags…"
          />
        </div>

        {/* Dates + team */}
        {createdAt && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Created</span>
            <span className="text-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Progress
            </p>
            <span className="text-xs font-semibold">{progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full h-1.5 rounded-full cursor-pointer accent-primary"
          />
        </div>

        {/* Difficulty */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Difficulty
          </p>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as ProjectDifficulty)}
          >
            <SelectTrigger
              className={`h-7 text-xs border ${difficultyColors[difficulty]}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Published toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div>
            <p className="text-xs font-medium">
              {isPublished ? "Published" : "Draft"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isPublished ? "Visible to everyone" : "Only visible to you"}
            </p>
          </div>
          <button
            onClick={() => setIsPublished((p) => !p)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPublished ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isPublished ? "translate-x-[18px]" : "translate-x-[3px]"}`}
            />
          </button>
        </div>
      </Card>

      {/* Save + View */}
      <Button
        onClick={handleSave}
        disabled={saving || deleting}
        className={`w-full transition-colors ${saveSuccess ? "bg-green-600 hover:bg-green-700" : ""}`}
      >
        <SaveIcon className={`h-4 w-4 mr-2 ${saving ? "animate-spin" : ""}`} />
        {saveLabel}
      </Button>

      {editSlug && (
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleDeleteProject}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Delete Project
        </Button>
      )}

      {editSlug && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/project/${editSlug}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Project Page
        </Button>
      )}
    </aside>
  );
}
