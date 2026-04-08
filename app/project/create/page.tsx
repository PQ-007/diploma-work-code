"use client";

// Force dynamic rendering for pages using search params
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Trash2,
  Upload,
  X,
  Save,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import type {
  ProjectFile,
  ProjectType,
  ProjectDifficulty,
  ProjectStatus,
} from "@/app/project/types";

export default function CreateProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("coding");
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>("beginner");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("draft");
  const [isPublic, setIsPublic] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [error, setError] = useState("");

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [savingFile, setSavingFile] = useState(false);
  const [uploadingFileImage, setUploadingFileImage] = useState(false);
  const [fileMessage, setFileMessage] = useState("");

  // Load project data when editing
  useEffect(() => {
    if (!editSlug) return;
    (async () => {
      const res = await fetch(`/api/projects/${editSlug}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "");
        setProjectType(data.project_type || "coding");
        setDifficulty(data.difficulty || "beginner");
        setTechnologies(data.technologies || []);
        setRepositoryUrl(data.repository_url || "");
        setDemoUrl(data.demo_url || "");
        setThumbnailUrl(data.thumbnail_url || "");
        setTags(data.tags || []);
        setStatus(data.status || "draft");
        setIsPublic(data.is_public || false);
        setFiles(data.files || []);
      }
    })();
  }, [editSlug]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?redirect=/project/create");
    }
  }, [user, authLoading, router]);

  const addTechnology = () => {
    const trimmed = techInput.trim();
    if (trimmed && !technologies.includes(trimmed)) {
      setTechnologies([...technologies, trimmed]);
    }
    setTechInput("");
  };

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumbnail(true);
    try {
      const result = await uploadImageToCloudinary(file);
      setThumbnailUrl(result.secureUrl);
    } catch {
      setError("Failed to upload thumbnail");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setError(t("project.titleRequired") || "Title is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        title,
        description,
        category: category || undefined,
        project_type: projectType,
        difficulty,
        technologies,
        repository_url: repositoryUrl || undefined,
        demo_url: demoUrl || undefined,
        thumbnail_url: thumbnailUrl || undefined,
        tags,
        status,
        is_public: isPublic,
      };

      let res: Response;

      if (editSlug) {
        res = await fetch(`/api/projects/${editSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (editSlug) {
          router.push(`/project/${editSlug}`);
        } else {
          router.push(`/project/create?edit=${data.slug}`);
        }
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  }, [
    title,
    description,
    category,
    projectType,
    difficulty,
    technologies,
    repositoryUrl,
    demoUrl,
    thumbnailUrl,
    tags,
    status,
    isPublic,
    editSlug,
    router,
    t,
  ]);

  const handleFileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const image = e.target.files?.[0];
    if (!image) return;

    setUploadingFileImage(true);
    setFileMessage("");
    setError("");

    try {
      const uploaded = await uploadImageToCloudinary(image);
      setFileUrl(uploaded.secureUrl);
      setFileName((prev) => prev || image.name);
      setFileType((prev) => prev || image.type || "image");
      setFileSize((prev) => prev || String(image.size));
      setFileMessage(
        t("project.imageUploadedNowRegister") ||
          "Image uploaded. Click Add file to register metadata.",
      );
    } catch {
      setError(
        t("project.updateImageUploadFailed") || "Failed to upload image.",
      );
    } finally {
      setUploadingFileImage(false);
      e.target.value = "";
    }
  };

  const handleAddFile = useCallback(async () => {
    if (!editSlug) {
      setError(
        t("project.saveBeforeUploads") ||
          "Save the project first, then add attachments.",
      );
      return;
    }

    if (!fileName.trim() || !fileUrl.trim()) {
      setError(
        t("project.fileNameUrlRequired") || "File name and URL are required.",
      );
      return;
    }

    setSavingFile(true);
    setError("");
    setFileMessage("");

    try {
      const res = await fetch(`/api/projects/${editSlug}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: fileName.trim(),
          file_url: fileUrl.trim(),
          file_type: fileType.trim() || null,
          file_size: fileSize ? Number(fileSize) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to add file");
        return;
      }

      const data = await res.json();
      setFiles((prev) => [data.file, ...prev]);
      setFileName("");
      setFileUrl("");
      setFileType("");
      setFileSize("");
      setFileMessage(t("project.fileSaved") || "File saved.");
    } finally {
      setSavingFile(false);
    }
  }, [editSlug, fileName, fileSize, fileType, fileUrl, t]);

  const handleDeleteFile = useCallback(
    async (id: number) => {
      if (!editSlug) return;
      const ok = window.confirm(
        t("project.confirmDeleteFile") || "Delete this file?",
      );
      if (!ok) return;

      const snapshot = files;
      setFiles((prev) => prev.filter((file) => file.id !== id));

      try {
        const res = await fetch(`/api/projects/${editSlug}/files`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!res.ok) {
          setFiles(snapshot);
          const data = await res.json().catch(() => null);
          setError(data?.error || "Failed to delete file");
        }
      } catch {
        setFiles(snapshot);
        setError("Failed to delete file");
      }
    },
    [editSlug, files, t],
  );

  if (authLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-1/3 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/project")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {editSlug
              ? t("project.editProject") || "Edit Project"
              : t("project.createProject") || "Create Project"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit()}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-1" />
            {saving
              ? t("common.saving") || "Saving..."
              : editSlug
                ? t("common.save") || "Save"
                : t("project.createDraft") || "Create Draft"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("project.title") || "Title"} *
          </label>
          <Input
            placeholder={
              t("project.titlePlaceholder") ||
              "e.g., AI-Powered Student Dashboard"
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("project.description") || "Description"}
          </label>
          <Textarea
            placeholder={
              t("project.descriptionPlaceholder") ||
              "Describe your project, its goals, and what makes it unique..."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        {/* Thumbnail */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("project.thumbnail") || "Thumbnail"}
          </label>
          {thumbnailUrl ? (
            <div className="relative aspect-video max-w-md rounded-xl overflow-hidden border border-border group">
              <img
                src={thumbnailUrl}
                alt="Thumbnail"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setThumbnailUrl("")}
                >
                  <X className="h-4 w-4 mr-1" />
                  {t("common.remove") || "Remove"}
                </Button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-border px-4 py-10 hover:bg-muted/50 hover:border-primary/30 transition-colors">
              {uploadingThumbnail ? (
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              ) : (
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium">
                  {uploadingThumbnail
                    ? t("common.uploading") || "Uploading..."
                    : t("project.uploadThumbnail") ||
                      "Click to upload thumbnail"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 5MB. Recommended 16:9 ratio.
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
                disabled={uploadingThumbnail}
              />
            </label>
          )}
        </div>

        <Separator />

        {/* Type & Difficulty & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("project.type") || "Project Type"}
            </label>
            <Select
              value={projectType}
              onValueChange={(v) => setProjectType(v as ProjectType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coding">
                  {t("project.type.coding") || "Coding"}
                </SelectItem>
                <SelectItem value="research">
                  {t("project.type.research") || "Research"}
                </SelectItem>
                <SelectItem value="design">
                  {t("project.type.design") || "Design"}
                </SelectItem>
                <SelectItem value="other">
                  {t("project.type.other") || "Other"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("project.difficulty") || "Difficulty"}
            </label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as ProjectDifficulty)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">
                  {t("project.difficulty.beginner") || "Beginner"}
                </SelectItem>
                <SelectItem value="intermediate">
                  {t("project.difficulty.intermediate") || "Intermediate"}
                </SelectItem>
                <SelectItem value="advanced">
                  {t("project.difficulty.advanced") || "Advanced"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("project.category") || "Category"}
            </label>
            <Input
              placeholder={
                t("project.categoryPlaceholder") || "e.g., Web Development"
              }
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>

        {/* Status (edit only) */}
        {editSlug && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("project.status") || "Status"}
              </label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as ProjectStatus);
                  if (v !== "completed") setIsPublic(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    {t("project.status.draft") || "Draft"}
                  </SelectItem>
                  <SelectItem value="in_progress">
                    {t("project.status.in_progress") || "In Progress"}
                  </SelectItem>
                  <SelectItem value="completed">
                    {t("project.status.completed") || "Completed"}
                  </SelectItem>
                  <SelectItem value="archived">
                    {t("project.status.archived") || "Archived"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "completed" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("project.visibility") || "Visibility"}
                </label>
                <Select
                  value={isPublic ? "public" : "private"}
                  onValueChange={(v) => setIsPublic(v === "public")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      {t("project.private") || "Private"}
                    </SelectItem>
                    <SelectItem value="public">
                      {t("project.public") || "Public (Showcase)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Technologies */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("project.technologies") || "Technologies"}
          </label>
          <div className="flex gap-2">
            <Input
              placeholder={t("project.addTechnology") || "Add technology..."}
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTechnology();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={addTechnology}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {technologies.map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="gap-1 rounded-full"
                >
                  {tech}
                  <button
                    onClick={() => removeTechnology(tech)}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("project.tags") || "Tags"}
          </label>
          <div className="flex gap-2">
            <Input
              placeholder={t("project.addTag") || "Add tag..."}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="gap-1 rounded-full"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("project.repositoryUrl") || "Repository URL (optional)"}
            </label>
            <Input
              placeholder="https://github.com/..."
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("project.demoUrl") || "Demo URL (optional)"}
            </label>
            <Input
              placeholder="https://..."
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Attachments */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">
              {t("project.files") || "Files / Attachments"}
            </h2>
          </div>

          {!editSlug ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {t("project.saveBeforeUploads") ||
                "Save this project first. You will be redirected to edit mode where attachments can be uploaded."}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder={t("project.fileName") || "File name"}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
                <Input
                  placeholder={
                    t("project.fileType") || "File type (optional)"
                  }
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                />
              </div>

              <Input
                placeholder={t("project.fileUrl") || "File URL"}
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
                <Input
                  placeholder={
                    t("project.fileSizeBytes") ||
                    "File size in bytes (optional)"
                  }
                  value={fileSize}
                  onChange={(e) =>
                    setFileSize(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
                <label className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
                  {uploadingFileImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {uploadingFileImage
                      ? t("common.uploading") || "Uploading..."
                      : t("project.uploadImage") || "Upload Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileImageUpload}
                    disabled={uploadingFileImage}
                  />
                </label>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddFile}
                disabled={savingFile || uploadingFileImage}
              >
                {savingFile ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {savingFile
                  ? t("common.saving") || "Saving..."
                  : t("common.add") || "Add"}
              </Button>

              {fileMessage && (
                <p className="text-xs text-primary">{fileMessage}</p>
              )}

              <div className="space-y-2">
                {files.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("project.noFilesYet") || "No files added yet."}
                  </p>
                )}

                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 rounded-md border border-border p-3"
                  >
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 min-w-0 flex-1 text-sm hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{file.file_name}</span>
                    </a>

                    {file.file_size && (
                      <span className="text-xs text-muted-foreground">
                        {(file.file_size / 1024).toFixed(0)} KB
                      </span>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Submit buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={() => router.push("/project")}>
          {t("common.cancel") || "Cancel"}
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          {saving
            ? t("common.saving") || "Saving..."
            : editSlug
              ? t("common.saveChanges") || "Save Changes"
              : t("project.createProject") || "Create Project"}
        </Button>
      </div>
    </div>
  );
}
