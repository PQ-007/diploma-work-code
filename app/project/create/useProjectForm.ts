"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import type {
  ProjectCategory,
  ProjectDifficulty,
  ProjectFile,
  ProjectMemberRole,
  ProjectType,
} from "@/app/project/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

export function isImageUrl(url: string, fileType?: string | null) {
  if (fileType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url);
}

export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

export interface PendingImage {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface MemberEntry {
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
/*  Form state + handlers for the project create / edit page           */
/* ------------------------------------------------------------------ */

export function useProjectForm() {
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

  return {
    // refs
    titleRef,
    thumbnailInputRef,
    galleryInputRef,
    fileAttachInputRef,
    // core fields
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    projectType,
    setProjectType,
    difficulty,
    setDifficulty,
    tags,
    setTags,
    repositoryUrl,
    setRepositoryUrl,
    demoUrl,
    setDemoUrl,
    videoUrl,
    setVideoUrl,
    thumbnailUrl,
    setThumbnailUrl,
    isPublished,
    setIsPublished,
    progress,
    setProgress,
    // media
    selectedMediaId,
    setSelectedMediaId,
    pendingImages,
    setPendingImages,
    uploadingGallery,
    // file attachments
    fileName,
    setFileName,
    fileUrl,
    setFileUrl,
    fileType,
    setFileType,
    // members
    members,
    memberUsername,
    setMemberUsername,
    memberRole,
    setMemberRole,
    addingMember,
    memberError,
    // author meta
    authorName,
    authorAvatar,
    createdAt,
    // UI states
    loading,
    saving,
    deleting,
    saveSuccess,
    uploadingThumbnail,
    uploadingAttach,
    savingFile,
    error,
    setError,
    // auth / routing
    user,
    authLoading,
    editSlug,
    router,
    // helpers
    resizeTitle,
    // handlers
    handleThumbnailUpload,
    handleGalleryUpload,
    handleSave,
    handleDeleteProject,
    handleAddMember,
    handleRemoveMember,
    handleChangeRole,
    handleAttachUpload,
    handleAddFile,
    handleDeleteFile,
    // derived
    youTubeId,
    nonImageFiles,
    galleryStripItems,
    activeGalleryUrl,
  };
}
