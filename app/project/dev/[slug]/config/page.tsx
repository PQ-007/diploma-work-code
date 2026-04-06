"use client";

import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import type {
  ProjectDifficulty,
  ProjectPayload,
  ProjectStatus,
  ProjectType,
} from "@/app/project/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Save,
  Settings,
  Upload,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function ConfigSkeleton() {
  return (
    <div className="min-h-screen pb-16 -mx-4 lg:-mx-8">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-[680px] w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function ProjectDevConfigPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const router = useRouter();
  const { t } = useLanguage();

  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("coding");
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>("beginner");
  const [status, setStatus] = useState<ProjectStatus>("draft");
  const [isPublic, setIsPublic] = useState(false);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [technologies, setTechnologies] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!slug) return;

    (async () => {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (!res.ok) {
          router.replace(`/project/${slug}`);
          return;
        }

        const data: ProjectPayload = await res.json();
        if (!data.isOwner && !data.isMember) {
          router.replace(`/project/${slug}`);
          return;
        }

        setProject(data);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "");
        setProjectType(data.project_type || "coding");
        setDifficulty(data.difficulty || "beginner");
        setStatus(data.status || "draft");
        setIsPublic(data.is_public || false);
        setRepositoryUrl(data.repository_url || "");
        setDemoUrl(data.demo_url || "");
        setThumbnailUrl(data.thumbnail_url || "");
        setTechnologies(data.technologies || []);
        setTags(data.tags || []);
      } catch {
        router.replace(`/project/${slug}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, slug]);

  const addTechnology = () => {
    const trimmed = techInput.trim();
    if (trimmed && !technologies.includes(trimmed)) {
      setTechnologies([...technologies, trimmed]);
    }
    setTechInput("");
  };

  const removeTechnology = (item: string) => {
    setTechnologies((prev) => prev.filter((tech) => tech !== item));
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (item: string) => {
    setTags((prev) => prev.filter((tag) => tag !== item));
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    setError("");

    try {
      const uploaded = await uploadImageToCloudinary(file);
      setThumbnailUrl(uploaded.secureUrl);
    } catch {
      setError(t("project.updateImageUploadFailed") || "Failed to upload image.");
    } finally {
      setUploadingThumbnail(false);
      e.target.value = "";
    }
  };

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError(t("project.titleRequired") || "Title is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title,
        description,
        category,
        project_type: projectType,
        difficulty,
        status,
        is_public: isPublic,
        repository_url: repositoryUrl,
        demo_url: demoUrl,
        thumbnail_url: thumbnailUrl,
        technologies,
        tags,
      };

      const res = await fetch(`/api/projects/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to save project config");
        return;
      }

      setSuccess(t("project.configSaved") || "Config saved successfully.");
      setProject((prev) => (prev ? { ...prev, ...payload } : prev));
    } finally {
      setSaving(false);
    }
  }, [
    title,
    description,
    category,
    projectType,
    difficulty,
    status,
    isPublic,
    repositoryUrl,
    demoUrl,
    thumbnailUrl,
    technologies,
    tags,
    slug,
    t,
  ]);

  if (loading) return <ConfigSkeleton />;
  if (!project) return null;

  return (
    <div className="relative min-h-screen pb-16 -mx-4 lg:-mx-8 bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Card className="border-border/80 bg-card/90 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {t("project.workspace") || "Workspace"}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold mt-1 flex items-center gap-2">
                <Settings className="h-6 w-6" />
                {t("project.configPage") || "Static Intro Config"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push(`/project/dev/${slug}`)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("common.back") || "Back"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push(`/project/dev/${slug}/uploads`)}>
                <Upload className="h-4 w-4 mr-1" />
                {t("project.uploadsPage") || "Uploads"}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                {saving ? (t("common.saving") || "Saving...") : (t("common.save") || "Save")}
              </Button>
            </div>
          </div>
        </Card>

        {(error || success) && (
          <Card className={`p-3 text-sm ${error ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary"}`}>
            {error || success}
          </Card>
        )}

        <Card className="border-border/80 bg-card/90 p-5 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("project.title") || "Title"}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("project.description") || "Description"}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("project.type") || "Project Type"}</label>
              <Select value={projectType} onValueChange={(value) => setProjectType(value as ProjectType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coding">{t("project.type.coding") || "Coding"}</SelectItem>
                  <SelectItem value="research">{t("project.type.research") || "Research"}</SelectItem>
                  <SelectItem value="design">{t("project.type.design") || "Design"}</SelectItem>
                  <SelectItem value="other">{t("project.type.other") || "Other"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("project.difficulty") || "Difficulty"}</label>
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as ProjectDifficulty)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t("project.difficulty.beginner") || "Beginner"}</SelectItem>
                  <SelectItem value="intermediate">{t("project.difficulty.intermediate") || "Intermediate"}</SelectItem>
                  <SelectItem value="advanced">{t("project.difficulty.advanced") || "Advanced"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("project.status") || "Status"}</label>
              <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("project.status.draft") || "Draft"}</SelectItem>
                  <SelectItem value="in_progress">{t("project.status.in_progress") || "In Progress"}</SelectItem>
                  <SelectItem value="completed">{t("project.status.completed") || "Completed"}</SelectItem>
                  <SelectItem value="archived">{t("project.status.archived") || "Archived"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("project.category") || "Category"}</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("project.visibility") || "Visibility"}</label>
              <Select value={isPublic ? "public" : "private"} onValueChange={(value) => setIsPublic(value === "public")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">{t("project.private") || "Private"}</SelectItem>
                  <SelectItem value="public">{t("project.public") || "Public (Showcase)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("project.thumbnail") || "Thumbnail"}</label>
            {thumbnailUrl ? (
              <div className="relative aspect-video w-full max-w-xl rounded-md overflow-hidden border border-border">
                <img src={thumbnailUrl} alt={title || "thumbnail"} className="h-full w-full object-cover" />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => setThumbnailUrl("")}
                >
                  <X className="h-4 w-4 mr-1" />
                  {t("common.delete") || "Delete"}
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border p-6 cursor-pointer hover:bg-muted/40 transition-colors">
                {uploadingThumbnail ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                <span className="text-sm text-muted-foreground">
                  {uploadingThumbnail ? (t("common.uploading") || "Uploading...") : (t("project.uploadThumbnail") || "Upload thumbnail")}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploadingThumbnail} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("project.repositoryUrl") || "Repository URL"}</label>
              <Input value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("project.demoUrl") || "Demo URL"}</label>
              <Input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("project.technologies") || "Technologies"}</label>
            <div className="flex gap-2">
              <Input value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTechnology())} />
              <Button type="button" variant="outline" onClick={addTechnology}>{t("common.add") || "Add"}</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {technologies.map((item) => (
                <Badge key={item} variant="secondary" className="gap-1">
                  {item}
                  <button type="button" onClick={() => removeTechnology(item)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("project.tags") || "Tags"}</label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
              <Button type="button" variant="outline" onClick={addTag}>{t("common.add") || "Add"}</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((item) => (
                <Badge key={item} variant="outline" className="gap-1">
                  #{item}
                  <button type="button" onClick={() => removeTag(item)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
