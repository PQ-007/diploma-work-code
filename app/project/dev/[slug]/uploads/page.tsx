"use client";

import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import type { ProjectFile, ProjectPayload } from "@/app/project/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function UploadsSkeleton() {
  return (
    <div className="min-h-screen pb-16 -mx-4 lg:-mx-8">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-52 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function ProjectUploadsPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState("");

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

        setFiles(data.files || []);
      } catch {
        router.replace(`/project/${slug}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, slug]);

  const handleCloudinaryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const image = event.target.files?.[0];
    if (!image) return;

    setUploadingImage(true);
    setError("");

    try {
      const uploaded = await uploadImageToCloudinary(image);
      setFileUrl(uploaded.secureUrl);
      setFileName((prev) => prev || image.name);
      setFileType((prev) => prev || image.type || "image");
      setFileSize((prev) => prev || String(image.size));
      setSuccess(
        t("project.imageUploadedNowRegister") ||
          "Image uploaded. Click Add file to register metadata.",
      );
    } catch {
      setError(
        t("project.updateImageUploadFailed") || "Failed to upload image.",
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleAddFile = useCallback(async () => {
    if (!fileName.trim() || !fileUrl.trim()) {
      setError(
        t("project.fileNameUrlRequired") || "File name and URL are required.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/projects/${slug}/files`, {
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
      setSuccess(t("project.fileSaved") || "File saved.");
    } finally {
      setSaving(false);
    }
  }, [fileName, fileSize, fileType, fileUrl, slug, t]);

  const handleDelete = useCallback(
    async (id: number) => {
      const ok = window.confirm(
        t("project.confirmDeleteFile") || "Delete this file?",
      );
      if (!ok) return;

      const snapshot = files;
      setFiles((prev) => prev.filter((file) => file.id !== id));

      try {
        const res = await fetch(`/api/projects/${slug}/files`, {
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
    [files, slug, t],
  );

  if (loading) return <UploadsSkeleton />;

  return (
    <div className="relative min-h-screen pb-16 -mx-4 lg:-mx-8 bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Card className="border-border/80 bg-card/90 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {t("project.workspace") || "Workspace"}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold mt-1 flex items-center gap-2">
                <Upload className="h-6 w-6" />
                {t("project.uploadsPage") || "Upload Endpoint Manager"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/project/dev/${slug}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("common.back") || "Back"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/project/dev/${slug}/config`)}
              >
                {t("project.configPage") || "Config"}
              </Button>
            </div>
          </div>
        </Card>

        {(error || success) && (
          <Card
            className={`p-3 text-sm ${error ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary"}`}
          >
            {error || success}
          </Card>
        )}

        <Card className="border-border/80 bg-card/90 p-5 space-y-4">
          <h2 className="text-lg font-semibold">
            {t("project.addFile") || "Add File Metadata"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder={t("project.fileName") || "File name"}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
            <Input
              placeholder={t("project.fileType") || "File type (optional)"}
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
                t("project.fileSizeBytes") || "File size in bytes (optional)"
              }
              value={fileSize}
              onChange={(e) =>
                setFileSize(e.target.value.replace(/[^0-9]/g, ""))
              }
            />
            <label className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
              {uploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              <span className="text-sm">
                {uploadingImage
                  ? t("common.uploading") || "Uploading..."
                  : t("project.uploadImage") || "Upload Image"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCloudinaryUpload}
                disabled={uploadingImage}
              />
            </label>
          </div>

          <Button onClick={handleAddFile} disabled={saving || uploadingImage}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {saving
              ? t("common.saving") || "Saving..."
              : t("common.add") || "Add"}
          </Button>
        </Card>

        <Card className="border-border/80 bg-card/90 p-5 space-y-3">
          <h2 className="text-lg font-semibold">
            {t("project.files") || "Files"}
          </h2>

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
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(file.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
