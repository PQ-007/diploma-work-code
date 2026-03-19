"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import {
  buildArticleSaveRequest,
  type ArticleSavePayload,
  type ArticleStatus,
} from "./articleSave.utils";

type ViewMode = "split" | "editor" | "preview";
type ContentLang = "mn" | "en" | "jp";

function getFriendlyApiError(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = JSON.parse(trimmed) as { error?: unknown; message?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // Not JSON, return plain text below.
  }

  return trimmed;
}

interface EditPayload {
  article?: {
    id: string;
    status?: ArticleStatus;
  };
  translations?: Array<{
    language_code?: string;
    title?: string;
    sub_title?: string;
    body?: string;
  }>;
  tags?: string[];
  settings?: {
    base_lang_code?: string | null;
  };
  error?: string;
}

interface ArticleEditorState {
  title: string;
  subtitle: string;
  mdx: string;
  tags: string[];
  tagInput: string;
  contentLang: ContentLang;
  viewMode: ViewMode;
  viewMenuOpen: boolean;
  langMenuOpen: boolean;
  imageUploading: boolean;
  imageError: string | null;
  status: ArticleStatus;
  isEditMode: boolean;
  // article operations state
  articleId: string | null;
  isSaving: boolean;
  isPublishing: boolean;
  isDeleting: boolean;
  justSaved: boolean;
  saveError: string | null;
  isEditHydrating: boolean;
  isEditAccessDenied: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

interface ArticleEditorActions {
  setTitle: (v: string) => void;
  setSubtitle: (v: string) => void;
  setMdx: (v: string) => void;
  setTags: (v: string[]) => void;
  setTagInput: (v: string) => void;
  setContentLang: (v: ContentLang) => void;
  setViewMode: (v: ViewMode) => void;
  setViewMenuOpen: (v: boolean) => void;
  setLangMenuOpen: (v: boolean) => void;
  handleSaveDraft: () => Promise<void>;
  handlePublish: () => Promise<void>;
  handleDeleteArticle: () => Promise<void>;
  handleExport: () => void;
  handleImageButtonClick: () => void;
  handleImageFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
}

const ArticleEditorContext = createContext<
  (ArticleEditorState & ArticleEditorActions) | null
>(null);

export function ArticleEditorProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mdx, setMdx] = useState(`# Hello MDX Editor

This is a **Zenn/Qiita-style** editor for technical writing.

## Code Blocks

`);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [contentLang, setContentLang] = useState<ContentLang>("mn");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [status, setStatus] = useState<ArticleStatus>("draft");

  const [articleId, setArticleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditHydrating, setIsEditHydrating] = useState(false);
  const [isEditAccessDenied, setIsEditAccessDenied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null!);

  const articleIdFromQuery = searchParams.get("id");
  const isEditMode = Boolean(articleIdFromQuery);

  useEffect(() => {
    if (!articleIdFromQuery) return;

    const loadArticleForEdit = async () => {
      setIsEditHydrating(true);
      setIsEditAccessDenied(false);
      setSaveError(null);
      try {
        const res = await fetch(
          `/api/articles/${encodeURIComponent(articleIdFromQuery)}/edit`,
        );
        const data = (await res.json()) as EditPayload;

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setIsEditAccessDenied(true);
          }
          throw new Error(data?.error || "Failed to load article");
        }

        const preferredLanguage =
          typeof data?.settings?.base_lang_code === "string" &&
          data.settings.base_lang_code
            ? data.settings.base_lang_code
            : "mn";

        const translations = Array.isArray(data?.translations)
          ? data.translations
          : [];

        const selectedTranslation =
          translations.find((t) => t.language_code === preferredLanguage) ||
          translations[0] ||
          null;

        setArticleId(
          data?.article?.id ? String(data.article.id) : articleIdFromQuery,
        );
        setTitle(
          typeof selectedTranslation?.title === "string"
            ? selectedTranslation.title
            : "",
        );
        setSubtitle(
          typeof selectedTranslation?.sub_title === "string"
            ? selectedTranslation.sub_title
            : "",
        );
        setMdx(
          typeof selectedTranslation?.body === "string"
            ? selectedTranslation.body
            : "",
        );
        setTags(Array.isArray(data?.tags) ? data.tags.filter(Boolean) : []);
        setStatus(
          data?.article?.status === "published" ? "published" : "draft",
        );

        const lang =
          typeof selectedTranslation?.language_code === "string"
            ? selectedTranslation.language_code
            : "mn";
        if (lang === "mn" || lang === "en" || lang === "jp") {
          setContentLang(lang);
        }
      } catch (err) {
        setArticleId(null);
        setTitle("");
        setSubtitle("");
        setMdx("");
        setTags([]);
        setStatus("draft");
        setSaveError(
          err instanceof Error ? err.message : "Failed to load article",
        );
      } finally {
        setIsEditHydrating(false);
      }
    };

    loadArticleForEdit();
  }, [articleIdFromQuery]);

  const handleSaveDraft = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const trimmedTitle = title.trim();
      const trimmedBody = mdx.trim();
      const cleanedTags = Array.from(
        new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
      );

      if (!trimmedTitle || !trimmedBody) {
        throw new Error("Please add both a title and content before saving.");
      }

      if (status === "draft" && cleanedTags.length < 1) {
        throw new Error("Draft article must contain at least one tag.");
      }

      const payload: ArticleSavePayload = {
        title: trimmedTitle,
        sub_title: subtitle,
        body: trimmedBody,
        tags: cleanedTags,
        language_code: contentLang,
        status,
      };

      const plan = buildArticleSaveRequest({ articleId, payload });

      const res = await fetch(plan.url, {
        method: plan.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan.body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(getFriendlyApiError(errorText, "Failed to save article."));
      }

      if (plan.method === "POST") {
        const data = (await res.json()) as { article_id: string };
        setArticleId(data.article_id);
        setStatus("draft");
      } else {
        const data = (await res.json()) as {
          id: string;
          status?: ArticleStatus;
        };
        setArticleId(data?.id ? String(data.id) : articleId);
        if (data?.status === "published" || data?.status === "draft") {
          setStatus(data.status);
        }
      }

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save article.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!articleId || isPublishing) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          getFriendlyApiError(errorText, "Failed to publish article."),
        );
      }
      setStatus("published");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to publish article.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!articleId || isDeleting) return;

    const confirmed = window.confirm(
      "Delete this article permanently? This action cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setSaveError(null);

    try {
      const res = await fetch(
        `/api/articles/${encodeURIComponent(articleId)}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          getFriendlyApiError(errorText, "Failed to delete article."),
        );
      }

      setArticleId(null);
      setStatus("draft");
      setTitle("");
      setSubtitle("");
      setMdx("");
      setTags([]);
      setTagInput("");

      router.push("/article");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to delete article.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([mdx], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "article.mdx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImageButtonClick = () => {
    setImageError(null);
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImageError(null);
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError("Image must be 10MB or smaller.");
      return;
    }
    setImageUploading(true);
    try {
      const { secureUrl, publicId } = await uploadImageToCloudinary(file);
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const finalUrl =
        cloudName && publicId
          ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1200/${publicId}`
          : secureUrl;
      setMdx((prev) => {
        const spacer =
          prev.trim().length === 0 ? "" : prev.endsWith("\n") ? "\n" : "\n\n";
        return `${prev}${spacer}![](${finalUrl})\n`;
      });
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <ArticleEditorContext.Provider
      value={{
        title,
        subtitle,
        mdx,
        tags,
        tagInput,
        contentLang,
        viewMode,
        viewMenuOpen,
        langMenuOpen,
        imageUploading,
        imageError,
        status,
        isEditMode,
        articleId,
        isSaving,
        isPublishing,
        isDeleting,
        justSaved,
        saveError,
        isEditHydrating,
        isEditAccessDenied,
        fileInputRef,
        setTitle,
        setSubtitle,
        setMdx,
        setTags,
        setTagInput,
        setContentLang,
        setViewMode,
        setViewMenuOpen,
        setLangMenuOpen,
        handleSaveDraft,
        handlePublish,
        handleDeleteArticle,
        handleExport,
        handleImageButtonClick,
        handleImageFileChange,
      }}
    >
      {children}
    </ArticleEditorContext.Provider>
  );
}

export function useArticleEditor() {
  const ctx = useContext(ArticleEditorContext);
  if (!ctx)
    throw new Error(
      "useArticleEditor must be used inside ArticleEditorProvider",
    );
  return ctx;
}
