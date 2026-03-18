"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
} from "react";
import { useSearchParams } from "next/navigation";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";

type ViewMode = "split" | "editor" | "preview";
type ContentLang = "en" | "es" | "mn" | "jp";

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
  // article operations state
  articleId: string | null;
  isSaving: boolean;
  isPublishing: boolean;
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
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mdx, setMdx] = useState(`# Hello MDX Editor

This is a **Zenn/Qiita-style** editor for technical writing.

## Code Blocks

`);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [contentLang, setContentLang] = useState<ContentLang>("en");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [articleId, setArticleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditHydrating, setIsEditHydrating] = useState(false);
  const [isEditAccessDenied, setIsEditAccessDenied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null!);

  const articleIdFromQuery = searchParams.get("id");

  useEffect(() => {
    if (!articleIdFromQuery) return;

    const loadArticleForEdit = async () => {
      setIsEditHydrating(true);
      setIsEditAccessDenied(false);
      setSaveError(null);
      try {
        const res = await fetch(
          `/api/articles/${encodeURIComponent(articleIdFromQuery)}?mode=edit`,
        );
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setIsEditAccessDenied(true);
          }
          throw new Error(data?.error || "Failed to load article");
        }

        setArticleId(data?.id ? String(data.id) : articleIdFromQuery);
        setTitle(typeof data?.title === "string" ? data.title : "");
        setSubtitle(typeof data?.sub_title === "string" ? data.sub_title : "");
        setMdx(typeof data?.body === "string" ? data.body : "");
        setTags(Array.isArray(data?.tags) ? data.tags.filter(Boolean) : []);

        const lang =
          typeof data?.language_code === "string" ? data.language_code : "en";
        if (lang === "en" || lang === "es" || lang === "mn" || lang === "jp") {
          setContentLang(lang);
        }
      } catch (err) {
        setArticleId(null);
        setTitle("");
        setSubtitle("");
        setMdx("");
        setTags([]);
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
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sub_title: subtitle,
          body: mdx,
          tags,
          language_code: contentLang,
          status: "draft",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { article_id: string };
      setArticleId(data.article_id);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
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
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
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
        articleId,
        isSaving,
        isPublishing,
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
