"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAuth } from "@/contexts/AuthContext";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import { TagInputWithSuggestions } from "@/components/form/TagInputWithSuggestions";
import type {
  ProjectCategory,
  ProjectDifficulty,
  ProjectFile,
  ProjectMemberRole,
  ProjectType,
} from "@/app/project/types";
import {
  ArrowLeft,
  Calendar,
  Check,
  ExternalLink,
  Eye,
  Github,
  Globe,
  ImagePlus,
  Loader2,
  Play,
  Plus,
  Save,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function isImageUrl(url: string, fileType?: string | null) {
  if (fileType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url);
}

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

interface PendingImage {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface MemberEntry {
  user_id: string;
  role: ProjectMemberRole;
  joined_at: string;
  profile?: {
    id: string;
    user_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function CreateProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");
  const { user, loading: authLoading } = useAuth();

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileAttachInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  /* ─── core project fields ─── */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProjectCategory | "">("");
  const [projectType, setProjectType] = useState<ProjectType>("private");
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>("beginner");
  const [tags, setTags] = useState<string[]>([]);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [progress, setProgress] = useState(0);

  /* ─── media viewer ─── */
  const [selectedMediaId, setSelectedMediaId] = useState<string>("thumbnail");

  /* ─── gallery ─── */
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  /* ─── file attachments ─── */
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState("");

  /* ─── members ─── */
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [memberUsername, setMemberUsername] = useState("");
  const [memberRole, setMemberRole] = useState<ProjectMemberRole>("viewer");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  /* ─── author meta ─── */
  const [authorName, setAuthorName] = useState("");
  const [authorAvatar, setAuthorAvatar] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  /* ─── UI states ─── */
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [error, setError] = useState("");

  /* ─── auto-resize title ─── */
  const resizeTitle = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  useEffect(() => {
    resizeTitle();
  }, [title, resizeTitle]);

  /* ─── load project on edit ─── */
  useEffect(() => {
    if (!editSlug) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/projects/${editSlug}?mode=edit`);
        if (!res.ok) return;
        const data = await res.json();
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setCategory((data.category as ProjectCategory) ?? "");
        setProjectType((data.type as ProjectType) ?? "private");
        setDifficulty(data.difficulty ?? "beginner");
        setTags(data.tags ?? []);
        setRepositoryUrl(data.repository_url ?? "");
        setDemoUrl(data.demo_url ?? "");
        setVideoUrl(data.video_url ?? "");
        setThumbnailUrl(data.thumbnail_url ?? "");
        setIsPublished(data.is_public ?? false);
        setProgress(data.progress ?? 0);
        setFiles(data.files ?? []);
        setMembers(data.members ?? []);
        setCreatedAt(data.created_at ?? null);
        if (data.author) {
          setAuthorName(
            data.author.display_name ?? data.author.user_name ?? "",
          );
          setAuthorAvatar(data.author.avatar_url ?? "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [editSlug]);

  /* ─── auth redirect ─── */
  useEffect(() => {
    if (!authLoading && !user) router.push("/signin?redirect=/project/create");
  }, [user, authLoading, router]);

  /* ─── thumbnail upload ─── */
  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumbnail(true);
    setError("");
    try {
      const r = await uploadImageToCloudinary(file);
      setThumbnailUrl(r.secureUrl);
    } catch {
      setError("Failed to upload thumbnail.");
    } finally {
      setUploadingThumbnail(false);
      e.target.value = "";
    }
  };

  /* ─── gallery image upload ─── */
  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGallery(true);
    setError("");
    try {
      const r = await uploadImageToCloudinary(file);
      if (editSlug) {
        const res = await fetch(`/api/projects/${editSlug}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: file.name,
            file_url: r.secureUrl,
            file_type: file.type,
            file_size: file.size,
          }),
        });
        if (res.ok) {
          const d = await res.json();
          setFiles((p) => [...p, d.file]);
        }
      } else {
        setPendingImages((p) => [
          ...p,
          {
            url: r.secureUrl,
            name: file.name,
            type: file.type,
            size: file.size,
          },
        ]);
      }
    } catch {
      setError("Failed to upload image.");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  /* ─── save project ─── */
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setError("About content is required.");
      return;
    }
    const cleanedTags = tags.map((tag) => tag.trim()).filter(Boolean);
    if (cleanedTags.length === 0) {
      setError("At least one tag is required.");
      return;
    }
    setSaving(true);
    setError("");
    setSaveSuccess(false);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category || undefined,
        type: projectType,
        difficulty,
        tags: cleanedTags,
        repository_url: repositoryUrl.trim() || undefined,
        demo_url: demoUrl.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
        thumbnail_url: thumbnailUrl || undefined,
        status: isPublished ? "in_progress" : "draft",
        is_public: isPublished,
        progress,
      };

      const res = editSlug
        ? await fetch(`/api/projects/${editSlug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        const data = await res.json();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        if (!editSlug && data.slug) {
          await Promise.all(
            pendingImages.map((img) =>
              fetch(`/api/projects/${data.slug}/files`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  file_name: img.name,
                  file_url: img.url,
                  file_type: img.type,
                  file_size: img.size,
                }),
              }),
            ),
          );
          router.replace(`/project/create?edit=${data.slug}`);
        }
      } else {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "Failed to save.");
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
    tags,
    repositoryUrl,
    demoUrl,
    videoUrl,
    thumbnailUrl,
    isPublished,
    progress,
    editSlug,
    pendingImages,
    router,
  ]);

  const handleDeleteProject = useCallback(async () => {
    if (!editSlug) return;
    if (!window.confirm("Delete this project? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${editSlug}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to delete project.");
        return;
      }
      router.push("/project");
    } finally {
      setDeleting(false);
    }
  }, [editSlug, router]);

  /* ─── members ─── */
  const handleAddMember = useCallback(async () => {
    if (!editSlug) {
      setMemberError("Save the project first.");
      return;
    }
    if (!memberUsername.trim()) {
      setMemberError("Enter a username.");
      return;
    }
    setAddingMember(true);
    setMemberError("");
    try {
      const res = await fetch(`/api/projects/${editSlug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: memberUsername.trim(),
          role: memberRole,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setMembers((p) => [...p, d.member]);
        setMemberUsername("");
      } else {
        const d = await res.json().catch(() => null);
        setMemberError(d?.error ?? "Failed to add member.");
      }
    } finally {
      setAddingMember(false);
    }
  }, [editSlug, memberUsername, memberRole]);

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      if (!editSlug) return;
      const snapshot = members;
      setMembers((p) => p.filter((m) => m.user_id !== userId));
      const res = await fetch(`/api/projects/${editSlug}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        setMembers(snapshot);
        setMemberError("Failed to remove member.");
      }
    },
    [editSlug, members],
  );

  const handleChangeRole = useCallback(
    async (userId: string, role: ProjectMemberRole) => {
      if (!editSlug) return;
      setMembers((p) =>
        p.map((m) => (m.user_id === userId ? { ...m, role } : m)),
      );
      await fetch(`/api/projects/${editSlug}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role }),
      });
    },
    [editSlug],
  );

  /* ─── file attachments ─── */
  const handleAttachUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAttach(true);
    try {
      const r = await uploadImageToCloudinary(file);
      setFileUrl(r.secureUrl);
      setFileName((p) => p || file.name);
      setFileType((p) => p || file.type || "image");
      setFileSize((p) => p || String(file.size));
    } catch {
      setError("Upload failed.");
    } finally {
      setUploadingAttach(false);
      e.target.value = "";
    }
  };

  const handleAddFile = useCallback(async () => {
    if (!editSlug) {
      setError("Save the project first.");
      return;
    }
    if (!fileName.trim() || !fileUrl.trim()) {
      setError("File name and URL required.");
      return;
    }
    setSavingFile(true);
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
      if (res.ok) {
        const d = await res.json();
        setFiles((p) => [d.file, ...p]);
        setFileName("");
        setFileUrl("");
        setFileType("");
        setFileSize("");
      } else {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "Failed to add file.");
      }
    } finally {
      setSavingFile(false);
    }
  }, [editSlug, fileName, fileUrl, fileType, fileSize]);

  const handleDeleteFile = useCallback(
    async (id: number) => {
      if (!editSlug) return;
      const snap = files;
      setFiles((p) => p.filter((f) => f.id !== id));
      const res = await fetch(`/api/projects/${editSlug}/files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setFiles(snap);
        setError("Failed to delete file.");
      }
    },
    [editSlug, files],
  );

  /* ─── derived ─── */
  const seedKey = editSlug ?? "new";
  const heroImage = thumbnailUrl;
  const youTubeId = getYouTubeId(videoUrl);

  const imageFiles = files.filter((f) => isImageUrl(f.file_url, f.file_type));
  const nonImageFiles = files.filter(
    (f) => !isImageUrl(f.file_url, f.file_type),
  );

  // Media strip items (all uploadable images, not counting thumbnail which is separate)
  const galleryStripItems = [
    ...imageFiles.map((f) => ({
      url: f.file_url,
      id: `file-${f.id}`,
      fileId: f.id as number | null,
      isPending: false,
    })),
    ...pendingImages.map((p, i) => ({
      url: p.url,
      id: `pending-${i}`,
      fileId: null as number | null,
      isPending: true,
    })),
  ];

  // Current main viewer url (for gallery items)
  const activeGalleryUrl =
    galleryStripItems.find((g) => g.id === selectedMediaId)?.url ?? null;

  if (authLoading || loading) {
    return (
      <div className="relative min-h-screen pb-16 -mx-4 lg:-mx-8 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          <div className="h-14 w-1/2 bg-muted animate-pulse rounded" />
          <div className="aspect-video bg-muted animate-pulse rounded-md" />
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  const SaveIcon = saving ? Loader2 : saveSuccess ? Check : Save;
  const saveLabel = saving
    ? "Saving…"
    : saveSuccess
      ? "Saved!"
      : editSlug
        ? "Save Changes"
        : "Create Project";

  return (
    <div className="relative min-h-screen pb-16 -mx-4 lg:-mx-8 bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,hsl(var(--primary)/0.12),transparent_34%),radial-gradient(circle_at_90%_2%,hsl(var(--primary)/0.08),transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        {/* ═══ Main content ═══ */}
        <main className="space-y-8 min-w-0">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/project")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {editSlug && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  title="Delete project"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || deleting}
                size="sm"
              >
                <SaveIcon
                  className={`h-4 w-4 mr-1 ${saving ? "animate-spin" : ""}`}
                />
                {saveLabel}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span>{error}</span>
              <button onClick={() => setError("")} className="ml-3">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Title ── */}
          <div className="space-y-0.5">
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                resizeTitle();
              }}
              placeholder="YOUR PROJECT TITLE"
              rows={1}
              className="w-full resize-none overflow-hidden bg-transparent p-0 border-0 outline-none ring-0 focus:ring-0 text-3xl md:text-4xl lg:text-[46px] leading-[1.05] font-black uppercase tracking-tight text-foreground placeholder:text-foreground/20"
              style={{ minHeight: "1.05em" }}
            />
            <p className="text-[10px] text-muted-foreground/40 pl-0.5">
              Click above to edit title
            </p>
          </div>

          {/* ── Steam-style media viewer ── */}
          <div className="space-y-2">
            {/* Main viewer */}
            <div
              className={`relative w-full aspect-[16/9] rounded-md overflow-hidden border border-border bg-muted/30 shadow-[0_22px_40px_rgba(0,0,0,0.2)] ${selectedMediaId === "thumbnail" || !activeGalleryUrl ? "group cursor-pointer" : ""}`}
              onClick={() => {
                if (
                  selectedMediaId === "thumbnail" ||
                  (!activeGalleryUrl && selectedMediaId !== "youtube")
                ) {
                  thumbnailInputRef.current?.click();
                }
              }}
            >
              {uploadingThumbnail ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : selectedMediaId === "youtube" && youTubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1`}
                  title="Project preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : activeGalleryUrl ? (
                <img
                  src={activeGalleryUrl}
                  alt="gallery"
                  className="w-full h-full object-cover"
                />
              ) : thumbnailUrl ? (
                <>
                  <img
                    src={thumbnailUrl}
                    alt={title || "thumbnail"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors flex flex-col items-center justify-center gap-2">
                    <ImagePlus className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                      Change Thumbnail
                    </span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-sm font-medium">Upload Thumbnail</span>
                  <span className="text-xs opacity-60">Recommended 16:9</span>
                </div>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
                disabled={uploadingThumbnail}
              />
            </div>

            {/* Horizontal strip */}
            <div
              className="flex gap-2 overflow-x-auto pb-1 scroll-smooth"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {/* YouTube thumbnail card */}
              {youTubeId && (
                <button
                  type="button"
                  onClick={() => setSelectedMediaId("youtube")}
                  style={{ scrollSnapAlign: "start" }}
                  className={`relative flex-shrink-0 w-32 aspect-video rounded-sm overflow-hidden border-2 transition-all ${selectedMediaId === "youtube" ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]" : "border-border/60 hover:border-border"}`}
                >
                  <img
                    src={`https://img.youtube.com/vi/${youTubeId}/mqdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-black/70 flex items-center justify-center">
                      <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </button>
              )}

              {/* Thumbnail card */}
              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => setSelectedMediaId("thumbnail")}
                  style={{ scrollSnapAlign: "start" }}
                  className={`relative flex-shrink-0 w-32 aspect-video rounded-sm overflow-hidden border-2 transition-all ${selectedMediaId === "thumbnail" ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]" : "border-border/60 hover:border-border"}`}
                >
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </button>
              )}

              {/* Gallery image cards */}
              {galleryStripItems.map(({ url, id, fileId, isPending }) => (
                <div
                  key={id}
                  style={{ scrollSnapAlign: "start" }}
                  className={`group/gal relative flex-shrink-0 w-32 aspect-video rounded-sm overflow-hidden border-2 transition-all cursor-pointer ${selectedMediaId === id ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]" : "border-border/60 hover:border-border"}`}
                  onClick={() => setSelectedMediaId(id)}
                >
                  <img
                    src={url}
                    alt="gallery"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (selectedMediaId === id)
                        setSelectedMediaId("thumbnail");
                      if (fileId) {
                        await handleDeleteFile(fileId);
                      } else {
                        setPendingImages((p) => p.filter((x) => x.url !== url));
                      }
                    }}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover/gal:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                  {isPending && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white/80 text-center py-0.5">
                      unsaved
                    </div>
                  )}
                </div>
              ))}

              {/* Add photo slot */}
              <label
                style={{ scrollSnapAlign: "start" }}
                className="flex-shrink-0 w-32 aspect-video rounded-sm border-2 border-dashed border-border/60 hover:border-primary/50 flex flex-col items-center justify-center gap-1 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
              >
                {uploadingGallery ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span className="text-[10px] font-medium">Add Photo</span>
                  </>
                )}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleGalleryUpload}
                  disabled={uploadingGallery}
                />
              </label>
            </div>

            {/* Hint row */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/50">
              {thumbnailUrl ? (
                <button
                  onClick={() => {
                    setThumbnailUrl("");
                    if (selectedMediaId === "thumbnail")
                      setSelectedMediaId("youtube");
                  }}
                  className="hover:text-destructive transition-colors"
                >
                  Remove thumbnail
                </button>
              ) : (
                <span />
              )}
              {pendingImages.length > 0 && !editSlug && (
                <span className="text-amber-500/70">
                  {pendingImages.length} photo
                  {pendingImages.length > 1 ? "s" : ""} pending save
                </span>
              )}
            </div>
          </div>

          {/* ── About card ── */}
          <Card className="border-border/80 bg-card/90 text-card-foreground p-5 sm:p-6 space-y-5">
            <h2 className="text-xl font-black uppercase tracking-tight">
              About The Project
            </h2>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, its goals, and what makes it unique…"
              rows={6}
              className="w-full resize-none bg-transparent rounded-md border border-dashed border-border/40 hover:border-border/70 focus:border-primary/50 p-2 -mx-2 text-sm sm:text-[15px] leading-7 text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:text-foreground transition-colors"
            />
          </Card>

          {/* ── Team / Members ── */}
          <Card className="border-border/80 bg-card/90 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Team Members</h3>
            </div>

            {/* Current members */}
            {members.length > 0 && (
              <div className="space-y-2 mb-4">
                {members.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center gap-3 rounded-md border border-border p-3"
                  >
                    <Avatar className="h-7 w-7 border border-border flex-shrink-0">
                      <AvatarImage src={m.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(
                          m.profile?.display_name ||
                          m.profile?.user_name ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {m.profile?.display_name ||
                          m.profile?.user_name ||
                          "Unknown"}
                      </p>
                      {m.profile?.user_name && (
                        <p className="text-xs text-muted-foreground">
                          @{m.profile.user_name}
                        </p>
                      )}
                    </div>
                    <Select
                      value={m.role}
                      onValueChange={(v) =>
                        handleChangeRole(m.user_id, v as ProjectMemberRole)
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="contributor">Contributor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => handleRemoveMember(m.user_id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add member */}
            {memberError && (
              <p className="text-xs text-destructive mb-2">{memberError}</p>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="@username"
                value={memberUsername}
                onChange={(e) => setMemberUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                className="h-8 text-xs flex-1"
              />
              <Select
                value={memberRole}
                onValueChange={(v) => setMemberRole(v as ProjectMemberRole)}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={handleAddMember}
                disabled={addingMember}
              >
                {addingMember ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            {!editSlug && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Save the project first to add team members.
              </p>
            )}
          </Card>

          {/* ── Attachments (non-image files) ── */}
          <Card className="border-border/80 bg-card/90 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Attachments</h3>
            </div>

            {nonImageFiles.length > 0 && (
              <div className="space-y-2 mb-4">
                {nonImageFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 rounded-md border border-border p-3"
                  >
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 min-w-0 flex-1 text-sm hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{file.file_name}</span>
                    </a>
                    {file.file_size && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {(file.file_size / 1024).toFixed(0)} KB
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {editSlug ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-4 space-y-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Add File
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="File name"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="File type (optional)"
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Input
                  placeholder="File URL"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
                    {uploadingAttach ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5" />
                    )}
                    {uploadingAttach ? "Uploading…" : "Upload Image"}
                    <input
                      ref={fileAttachInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAttachUpload}
                      disabled={uploadingAttach}
                    />
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={handleAddFile}
                    disabled={savingFile || uploadingAttach}
                  >
                    {savingFile ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : null}
                    {savingFile ? "Adding…" : "Add File"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Save the project first to attach files.
              </p>
            )}
          </Card>
        </main>

        {/* ═══ Right sidebar ═══ */}
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
                    <a
                      href={repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
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
            <SaveIcon
              className={`h-4 w-4 mr-2 ${saving ? "animate-spin" : ""}`}
            />
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
      </div>
    </div>
  );
}
