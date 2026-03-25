"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import {
  buildArticleSaveRequest,
  type ArticleSavePayload,
  type ArticleStatus,
} from "./articleSave.utils";
import {
  type PartialTranslation,
  type TranslationCompleteness,
  validateTranslation,
  calculateTranslationCompleteness,
  hasTranslationContent,
  createEmptyTranslation,
} from "@/lib/validation/translation";

type ViewMode = "split" | "editor" | "preview";
type ContentLang = "mn" | "en" | "jp";

export interface ArticleSettings {
  series?: string | null;
  baseLangCode?: ContentLang;
  tags?: string[];
  isSerial?: boolean;
}

type TranslationInfo = {
  lang: string;
  title?: string;
  subTitle?: string;
};

function getFriendlyApiError(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = JSON.parse(trimmed) as {
      error?: unknown;
      message?: unknown;
    };
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
  // Series management
  seriesName: string | null;
  isSerial: boolean;
  // Auto-save state
  isAutoSaving: boolean;
  lastAutoSave: Date | null;
  autoSaveEnabled: boolean;
  hasUnsavedChanges: boolean;
  // Translation management
  translations: Record<ContentLang, PartialTranslation>;
  hasUnsavedTranslations: boolean;
  translationSyncInProgress: boolean;
  translationCompleteness: TranslationCompleteness[];
  // UI state
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
  // Enhanced language switching with translation management
  setContentLang: (v: ContentLang) => void;
  handleLanguageSwitch: (newLang: ContentLang) => Promise<void>;
  // Translation management
  getCurrentTranslation: () => PartialTranslation;
  updateTranslation: (
    lang: ContentLang,
    translation: Partial<PartialTranslation>,
  ) => void;
  getTranslationStatus: (lang: ContentLang) => {
    hasContent: boolean;
    completeness: number;
    errors: string[];
  };
  // Settings management
  handleSettingsChange: (settings: ArticleSettings) => Promise<void>;
  updateSeriesSettings: (isSerial: boolean, seriesName?: string) => void;
  // Auto-save management
  toggleAutoSave: (enabled: boolean) => void;
  performManualSave: () => Promise<void>;
  getAutoSaveStatus: () => {
    isAutoSaving: boolean;
    lastAutoSave: Date | null;
    hasUnsavedChanges: boolean;
    autoSaveEnabled: boolean;
  };
  // UI actions
  setViewMode: (v: ViewMode) => void;
  setViewMenuOpen: (v: boolean) => void;
  setLangMenuOpen: (v: boolean) => void;
  // Article operations
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

export function useArticleEditor() {
  const context = useContext(ArticleEditorContext);
  if (!context) {
    throw new Error(
      "useArticleEditor must be used within an ArticleEditorProvider",
    );
  }
  return context;
}

export function ArticleEditorProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Core content state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mdx, setMdx] = useState(`# Hello MDX Editor

This is a **Zenn/Qiita-style** editor for technical writing.

## Code Blocks

`);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [contentLang, setContentLang] = useState<ContentLang>("mn");

  // Series management state
  const [seriesName, setSeriesName] = useState<string | null>(null);
  const [isSerial, setIsSerial] = useState(false);

  // Auto-save state
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Translation management state
  const [translations, setTranslations] = useState<
    Record<ContentLang, PartialTranslation>
  >({
    mn: createEmptyTranslation(),
    en: createEmptyTranslation(),
    jp: createEmptyTranslation(),
  });
  const [hasUnsavedTranslations, setHasUnsavedTranslations] = useState(false);

  // Function ref for save draft to avoid forward reference issues
  const saveDraftRef = useRef<(() => Promise<void>) | null>(null);
  const [translationSyncInProgress, setTranslationSyncInProgress] =
    useState(false);
  const [translationCompleteness, setTranslationCompleteness] = useState<
    TranslationCompleteness[]
  >([]);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [status, setStatus] = useState<ArticleStatus>("draft");

  // Article operations state
  const [articleId, setArticleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditHydrating, setIsEditHydrating] = useState(false);
  const [isEditAccessDenied, setIsEditAccessDenied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null!);
  const isSavingRef = useRef(false);
  const isPublishingRef = useRef(false);
  const isDeletingRef = useRef(false);

  const articleIdFromQuery = searchParams.get("id");
  const isEditMode = Boolean(articleIdFromQuery);

  // Translation management functions
  const updateTranslationCompleteness = useCallback(() => {
    const completeness = calculateTranslationCompleteness(translations);
    setTranslationCompleteness(completeness);
  }, [translations]);

  const getCurrentTranslation = useCallback(
    (): PartialTranslation => ({
      title,
      subtitle,
      body: mdx,
      lastModified: new Date(),
      wordCount: mdx.split(/\s+/).filter((word) => word.length > 0).length,
      isComplete: Boolean(title.trim() && mdx.trim()),
    }),
    [title, subtitle, mdx],
  );

  const updateTranslation = useCallback(
    (lang: ContentLang, translation: Partial<PartialTranslation>) => {
      setTranslations((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          ...translation,
          lastModified: new Date(),
        },
      }));
      setHasUnsavedTranslations(true);
    },
    [],
  );

  const getTranslationStatus = useCallback(
    (lang: ContentLang) => {
      const translation = translations[lang];
      const validation = validateTranslation(translation);
      const completeness =
        translationCompleteness.find((tc) => tc.language === lang)
          ?.completeness || 0;

      return {
        hasContent: hasTranslationContent(translation),
        completeness,
        errors: validation.errors,
      };
    },
    [translations, translationCompleteness],
  );

  const handleLanguageSwitch = useCallback(
    async (newLang: ContentLang) => {
      if (newLang === contentLang) return;

      setTranslationSyncInProgress(true);

      try {
        // Save current language content to translations state
        const currentTranslation = getCurrentTranslation();
        setTranslations((prev) => ({
          ...prev,
          [contentLang]: currentTranslation,
        }));

        // Load content for new language
        const existingTranslation = translations[newLang];
        if (hasTranslationContent(existingTranslation)) {
          setTitle(existingTranslation.title || "");
          setSubtitle(existingTranslation.subtitle || "");
          setMdx(existingTranslation.body || "");
        } else {
          // Clear fields for empty translation
          setTitle("");
          setSubtitle("");
          setMdx("");
        }

        // Update current language
        setContentLang(newLang);
        setLangMenuOpen(false);

        // Mark as having unsaved changes if there are translations
        const hasAnyContent = Object.values(translations).some(
          hasTranslationContent,
        );
        if (hasAnyContent) {
          setHasUnsavedTranslations(true);
        }
      } catch (error) {
        console.error("Error switching languages:", error);
        setSaveError("Failed to switch languages. Please try again.");
      } finally {
        setTranslationSyncInProgress(false);
      }
    },
    [contentLang, getCurrentTranslation, translations],
  );

  // Settings management functions
  const handleSettingsChange = useCallback(
    async (settings: ArticleSettings) => {
      try {
        if (settings.series !== undefined) {
          setSeriesName(settings.series);
        }

        if (settings.isSerial !== undefined) {
          setIsSerial(settings.isSerial);
        }

        if (settings.baseLangCode && settings.baseLangCode !== contentLang) {
          await handleLanguageSwitch(settings.baseLangCode);
        }

        if (settings.tags) {
          setTags(settings.tags);
        }

        // Mark as having unsaved changes
        setHasUnsavedTranslations(true);
      } catch (error) {
        console.error("Error applying settings changes:", error);
        setSaveError("Failed to apply settings changes");
      }
    },
    [contentLang, handleLanguageSwitch],
  );

  const updateSeriesSettings = useCallback(
    (isSerialUpdate: boolean, seriesNameUpdate?: string) => {
      setIsSerial(isSerialUpdate);
      if (seriesNameUpdate !== undefined) {
        setSeriesName(seriesNameUpdate);
      }
    },
    [],
  );

  const handleTranslationSave = useCallback(
    async (savedTranslations: TranslationInfo[]) => {
      try {
        // Update translations state with the saved translations
        const updatedTranslations = { ...translations };

        savedTranslations.forEach((translation) => {
          const lang = translation.lang as ContentLang;
          if (lang === "mn" || lang === "en" || lang === "jp") {
            updatedTranslations[lang] = {
              ...updatedTranslations[lang],
              title: translation.title || "",
              subtitle: translation.subTitle || "",
              lastModified: new Date(),
            };
          }
        });

        setTranslations(updatedTranslations);
        setHasUnsavedTranslations(true);

        // If current language translation was updated, sync to main editor
        const currentLangTranslation = savedTranslations.find(
          (t) => t.lang === contentLang,
        );
        if (currentLangTranslation) {
          setTitle(currentLangTranslation.title || "");
          setSubtitle(currentLangTranslation.subTitle || "");
        }
      } catch (error) {
        console.error("Error saving translations:", error);
        setSaveError("Failed to save translations");
      }
    },
    [translations, contentLang],
  );

  // Auto-save functionality - simplified version without full validation
  const performAutoSave = useCallback(async () => {
    if (!autoSaveEnabled || !hasUnsavedChanges || isSaving || isAutoSaving) {
      return;
    }

    // Don't auto-save if content is too short or no tags provided
    if (
      !title.trim() ||
      !mdx.trim() ||
      mdx.trim().length < 10 ||
      tags.length === 0
    ) {
      return;
    }

    setIsAutoSaving(true);

    try {
      // Simplified auto-save payload (less validation than manual save)
      const autoSavePayload = {
        title: title.trim(),
        sub_title: subtitle,
        body: mdx.trim(),
        tags: Array.from(
          new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
        ),
        language_code: contentLang,
        status: "draft", // Auto-save always saves as draft
      };

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(autoSavePayload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Auto-save API error:", res.status, errorText);
        throw new Error(`Auto-save failed: ${res.status}`);
      }

      const result = await res.json();
      if (result.article_id) {
        setArticleId(result.article_id);
        setLastAutoSave(new Date());
        setHasUnsavedChanges(false);
      } else {
        console.error(
          "Auto-save succeeded but no article_id returned:",
          result,
        );
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      // Don't show error for auto-save failure to user
      // They can manually save if needed
    } finally {
      setIsAutoSaving(false);
    }
  }, [
    autoSaveEnabled,
    hasUnsavedChanges,
    isSaving,
    isAutoSaving,
    title,
    subtitle,
    mdx,
    tags,
    contentLang,
  ]);

  const toggleAutoSave = useCallback((enabled: boolean) => {
    setAutoSaveEnabled(enabled);
  }, []);

  const performManualSave = useCallback(async () => {
    if (saveDraftRef.current) {
      await saveDraftRef.current();
      setHasUnsavedChanges(false);
    } else {
      throw new Error("Save function not yet initialized");
    }
  }, []);

  const getAutoSaveStatus = useCallback(
    () => ({
      isAutoSaving,
      lastAutoSave,
      hasUnsavedChanges,
      autoSaveEnabled,
    }),
    [isAutoSaving, lastAutoSave, hasUnsavedChanges, autoSaveEnabled],
  );

  // Auto-save timer with debouncing
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      performAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [autoSaveEnabled, hasUnsavedChanges, performAutoSave]);

  // Track content changes for unsaved changes
  useEffect(() => {
    if (title || subtitle || mdx || tags.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [title, subtitle, mdx, tags]);

  // Update translation completeness when translations change
  useEffect(() => {
    updateTranslationCompleteness();
  }, [translations, updateTranslationCompleteness]);

  // Sync current content to translations on content changes
  useEffect(() => {
    if (!translationSyncInProgress) {
      const currentTranslation = getCurrentTranslation();
      setTranslations((prev) => ({
        ...prev,
        [contentLang]: currentTranslation,
      }));
    }
  }, [
    title,
    subtitle,
    mdx,
    contentLang,
    getCurrentTranslation,
    translationSyncInProgress,
  ]);

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

        // Initialize translations state with all available translations
        const initialTranslations: Record<ContentLang, PartialTranslation> = {
          mn: createEmptyTranslation(),
          en: createEmptyTranslation(),
          jp: createEmptyTranslation(),
        };

        // Populate with actual translation data
        translations.forEach((translation) => {
          const langCode = translation.language_code;
          if (langCode === "mn" || langCode === "en" || langCode === "jp") {
            initialTranslations[langCode] = {
              title: translation.title || "",
              subtitle: translation.sub_title || "",
              body: translation.body || "",
              lastModified: new Date(),
              wordCount:
                translation.body?.split(/\s+/).filter((word) => word.length > 0)
                  .length || 0,
              isComplete: Boolean(
                translation.title?.trim() && translation.body?.trim(),
              ),
            };
          }
        });

        setTranslations(initialTranslations);

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
    // Use ref as synchronous guard to prevent double-submission
    if (isSavingRef.current || isSaving) return;

    isSavingRef.current = true;
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
        throw new Error(
          getFriendlyApiError(errorText, "Failed to save article."),
        );
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
      setSaveError(
        err instanceof Error ? err.message : "Failed to save article.",
      );
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  // Assign the save function to ref for use by manual save
  saveDraftRef.current = handleSaveDraft;

  const handlePublish = async () => {
    if (!articleId || isPublishingRef.current || isPublishing) return;

    isPublishingRef.current = true;
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
      isPublishingRef.current = false;
      setIsPublishing(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!articleId || isDeletingRef.current || isDeleting) return;

    const confirmed = window.confirm(
      "Delete this article permanently? This action cannot be undone.",
    );
    if (!confirmed) return;

    isDeletingRef.current = true;
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
      isDeletingRef.current = false;
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
        // Core content state
        title,
        subtitle,
        mdx,
        tags,
        tagInput,
        contentLang,
        // Series management state
        seriesName,
        isSerial,
        // Auto-save state
        isAutoSaving,
        lastAutoSave,
        autoSaveEnabled,
        hasUnsavedChanges,
        // Translation management state
        translations,
        hasUnsavedTranslations,
        translationSyncInProgress,
        translationCompleteness,
        // UI state
        viewMode,
        viewMenuOpen,
        langMenuOpen,
        imageUploading,
        imageError,
        status,
        isEditMode,
        // Article operations state
        articleId,
        isSaving,
        isPublishing,
        isDeleting,
        justSaved,
        saveError,
        isEditHydrating,
        isEditAccessDenied,
        fileInputRef,
        // Core actions
        setTitle,
        setSubtitle,
        setMdx,
        setTags,
        setTagInput,
        setContentLang, // Keep for backward compatibility
        // Enhanced language switching
        handleLanguageSwitch, // New enhanced language switching
        // Translation management actions
        getCurrentTranslation,
        updateTranslation,
        getTranslationStatus,
        // Settings management actions
        handleSettingsChange,
        updateSeriesSettings,
        // Auto-save management actions
        toggleAutoSave,
        performManualSave,
        getAutoSaveStatus,
        // UI actions
        setViewMode,
        setViewMenuOpen,
        setLangMenuOpen,
        // Article operations
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
