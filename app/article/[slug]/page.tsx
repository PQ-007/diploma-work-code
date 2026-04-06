"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { components as mdxComponents } from "@/mdx/mdx-components";
import { compileMdx } from "@/mdx/mdx-editor/MdxCompiler";
import {
  Bookmark,
  Boxes,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  Hash,
  Heart,
  Languages,
  Link as LinkIcon,
  Pencil,
  MessageSquare,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import BackToTopButton from "../components/BackToTopButton";

import RightPanelCard from "../components/RightPanelCard";
import TocItem from "../components/TocItem";
import { ArticlePayload, RelatedLink, TocEntry } from "../type";
import AuthorBox from "../components/AuthorBox";
import ArticleCommentSection from "../components/ArticleCommentSection";
import type { ArticleCommentSectionHandle } from "../components/ArticleCommentSection";
import { useArticleInteractions } from "@/hooks/useArticleInteractions";

type ArticleLangCode = "mn" | "en" | "jp";
type TocNode = { item: TocEntry; children: TocNode[] };

const ARTICLE_LANGS: Array<{ code: ArticleLangCode; label: string }> = [
  { code: "mn", label: "MN" },
  { code: "en", label: "EN" },
  { code: "jp", label: "JP" },
];

const normalizeLanguageCode = (raw: string | null | undefined) => {
  const code = (raw || "").trim().toLowerCase();
  if (code === "ja") return "jp";
  if (code === "mn" || code === "en" || code === "jp") return code;
  return "";
};

const extractRelatedLinks = (body: string): RelatedLink[] => {
  const matches = [...body.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)];
  const seen = new Set<string>();

  return matches
    .map(([, label, href]) => ({ label: label.trim(), href }))
    .filter(({ href }) => {
      if (seen.has(href)) return false;
      seen.add(href);
      return true;
    })
    .slice(0, 10);
};

// --- Main Page ---

export default function ModernArticlePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("");
  const [article, setArticle] = useState<ArticlePayload | null>(null);
  const [MdxContent, setMdxContent] = useState<React.ComponentType<any> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tocItems, setTocItems] = useState<TocEntry[]>([]);
  const [collapsedTocGroups, setCollapsedTocGroups] = useState<
    Record<string, boolean>
  >({});
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<ArticleLangCode>("mn");
  const [isDesktopLanguageMenuOpen, setIsDesktopLanguageMenuOpen] =
    useState(false);
  const [availableTranslations, setAvailableTranslations] = useState<
    ArticleLangCode[]
  >([]);
  const [activeMoreAction, setActiveMoreAction] = useState<
    "request-translation" | "report-article" | "report-author" | null
  >(null);
  const [moreActionMessage, setMoreActionMessage] = useState("");
  const articleRef = useRef<HTMLDivElement | null>(null);
  const desktopLanguageMenuRef = useRef<HTMLDivElement | null>(null);

  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  // Redirect to create page if slug is "create" to prevent routing conflict
  useEffect(() => {
    if (slug === "create") {
      window.location.href = "/article/create";
      return;
    }
  }, [slug]);

  // Early return if slug is "create" to prevent API calls and errors
  if (slug === "create") {
    return <div>{t("articles.detail.redirecting")}</div>;
  }

  const articleNumericId = article?.id ? Number(article.id) : null;
  const commentRef = useRef<ArticleCommentSectionHandle>(null);
  const { isLiked, likesCount, toggleLike, isBookmarked, toggleBookmark } =
    useArticleInteractions({ articleId: articleNumericId });

  // Sidebar demo content (wireframe: Definitions + Related links)
  const definitions = useMemo(
    () =>
      article?.definitions?.map((def) => ({
        term: def.term,
        meaning: def.definition,
      })) || [],
    [article?.definitions],
  );

  const relatedLinks = useMemo(
    () => extractRelatedLinks(article?.body || ""),
    [article?.body],
  );

  const visibleRelatedLinks = useMemo(
    () => (showAllLinks ? relatedLinks : relatedLinks.slice(0, 2)),
    [relatedLinks, showAllLinks],
  );

  const tocTree = useMemo<TocNode[]>(() => {
    const roots: TocNode[] = [];
    const stack: TocNode[] = [];

    tocItems.forEach((item) => {
      const node: TocNode = { item, children: [] };

      while (
        stack.length > 0 &&
        stack[stack.length - 1].item.level >= item.level
      ) {
        stack.pop();
      }

      if (stack.length === 0) {
        roots.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }

      stack.push(node);
    });

    return roots;
  }, [tocItems]);

  const collapsibleNodeIds = useMemo(() => {
    const ids: string[] = [];

    const visit = (nodes: TocNode[]) => {
      nodes.forEach((node) => {
        if (node.children.length > 0 && node.item.level <= 3) {
          ids.push(node.item.id);
        }
        if (node.children.length > 0) {
          visit(node.children);
        }
      });
    };

    visit(tocTree);
    return ids;
  }, [tocTree]);

  const hasExpandableTocGroups = useMemo(
    () => collapsibleNodeIds.length > 0,
    [collapsibleNodeIds],
  );

  const hasCollapsedTocGroups = useMemo(
    () => collapsibleNodeIds.some((id) => collapsedTocGroups[id]),
    [collapsibleNodeIds, collapsedTocGroups],
  );

  useEffect(() => {
    if (!isDesktopLanguageMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!desktopLanguageMenuRef.current?.contains(target)) {
        setIsDesktopLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDesktopLanguageMenuOpen]);

  useEffect(() => {
    setCollapsedTocGroups((previous) => {
      const next: Record<string, boolean> = {};

      collapsibleNodeIds.forEach((id) => {
        next[id] = previous[id] ?? false;
      });

      return next;
    });
  }, [collapsibleNodeIds]);

  const PageSkeleton = () => (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[84px_minmax(0,1fr)] xl:grid-cols-[84px_minmax(0,1fr)_320px] gap-6">
          {/* Left rail skeleton */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <div className="flex flex-col items-center gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton
                    key={idx}
                    className="h-10 w-10 rounded-full bg-muted"
                  />
                ))}
                <div className="h-px w-10 bg-border my-1" />
                <Skeleton className="h-4 w-12 bg-muted" />
              </div>
            </div>
          </aside>

          {/* Article column skeleton */}
          <main className="min-w-0 space-y-6">
            <Card className="bg-card/50 border-border/60 shadow-sm">
              <div className="px-6 sm:px-8 space-y-6 py-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Skeleton className="h-4 w-20 bg-muted" />
                  <Skeleton className="h-4 w-16 bg-muted" />
                  <Skeleton className="h-4 w-20 bg-muted" />
                </div>
                <Skeleton className="h-9 w-3/4 bg-muted" />
                <Skeleton className="h-6 w-2/3 bg-muted" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-6 w-16 bg-muted" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-muted" />
                    <Skeleton className="h-3 w-24 bg-muted" />
                  </div>
                </div>
              </div>
              <div className="px-6 sm:px-8 pb-8 space-y-3">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-4 w-full bg-muted" />
                ))}
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton
                    key={`wide-${idx}`}
                    className="h-4 w-11/12 bg-muted"
                  />
                ))}
              </div>
            </Card>

            <Card className="bg-card/50 border-border/60 shadow-sm">
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-40 bg-muted" />
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-4 w-full bg-muted" />
                ))}
              </div>
            </Card>
          </main>

          {/* Right sidebar skeleton */}
          <aside className="hidden xl:block">
            <div className="sticky top-6 space-y-6">
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-muted" />
                    <Skeleton className="h-3 w-20 bg-muted" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 bg-muted" />
                  <Skeleton className="h-6 w-12 bg-muted" />
                </div>
              </Card>

              <Card className="p-4 space-y-2">
                <Skeleton className="h-4 w-24 bg-muted" />
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-3 w-full bg-muted" />
                ))}
              </Card>

              <Card className="p-4 space-y-2">
                <Skeleton className="h-4 w-32 bg-muted" />
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-3 w-full bg-muted" />
                ))}
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );

  // Load and serialize MDX content
  useEffect(() => {
    const loadMDX = async () => {
      try {
        if (!slug) {
          setError(t("articles.detail.missingArticleId"));
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/articles/${encodeURIComponent(slug)}?lang=${selectedLanguage}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || `Failed to load article: ${response.statusText}`,
          );
        }

        const activeLanguage = normalizeLanguageCode(data?.language_code);
        const apiAvailableLanguages = Array.isArray(
          data?.available_translations,
        )
          ? data.available_translations
              .map((code: string) => normalizeLanguageCode(code))
              .filter(Boolean)
          : [];

        const nextAvailable = Array.from(
          new Set([
            ...(apiAvailableLanguages as ArticleLangCode[]),
            activeLanguage,
          ]),
        ).filter(Boolean) as ArticleLangCode[];

        setAvailableTranslations(nextAvailable);

        if (
          activeLanguage &&
          (activeLanguage === "mn" ||
            activeLanguage === "en" ||
            activeLanguage === "jp") &&
          activeLanguage !== selectedLanguage
        ) {
          setSelectedLanguage(activeLanguage);
        }

        const body =
          (data?.body as string | undefined)?.replace(
            /^---[\s\S]*?---\s*/,
            "",
          ) || "";
        const compiled = await compileMdx(body);

        setArticle({
          id: data?.id,
          status: data?.status,
          title: data?.title || t("articles.untitled"),
          sub_title: data?.sub_title,
          is_serial: data?.is_serial,
          definitions: data?.definitions,
          body,
          tags: Array.isArray(data?.tags) ? data.tags : [],
          language_code: activeLanguage || "mn",
          base_lang_code: data?.base_lang_code || null,
          available_translations: nextAvailable,
          published_at: data?.published_at || null,
          edited_at: data?.edited_at || null,
          author: data?.author || null,
          views: typeof data?.views === "number" ? data.views : 0,
        });
        setMdxContent(() => compiled.default);
      } catch (e) {
        console.error("Error loading MDX:", e);
        setError(t("articles.detail.failedToLoadContent"));
        setMdxContent(null);
      } finally {
        setLoading(false);
      }
    };

    loadMDX();
  }, [slug, selectedLanguage, t]);

  const publishedAtText = article?.published_at
    ? new Date(article.published_at).toLocaleDateString()
    : t("articles.detail.noDate");

  const editedAtText = article?.edited_at
    ? new Date(article.edited_at).toLocaleDateString()
    : null;

  const displayTitle = article?.title || t("articles.untitled");
  const displaySubtitle = article?.sub_title || null;
  const displayTags = article?.tags ?? [];

  const articleData = useMemo(() => {
    const wordCount = (article?.body || "").split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    return {
      readTime,
      views: article?.views ?? 0,
      author: {
        id: article?.author?.id || "",
        username: article?.author?.user_name || "",
        displayName:
          article?.author?.display_name || article?.author?.user_name || "",
        avatar: article?.author?.avatar_url || "",
        ranking: article?.author?.ranking_point || 0,
        bio: article?.author?.bio ?? "",
      },
    };
  }, [article]);

  const currentUsername =
    typeof user?.user_metadata?.username === "string"
      ? user.user_metadata.username
      : typeof user?.user_metadata?.user_name === "string"
        ? user.user_metadata.user_name
        : "";

  const normalizedCurrentUsername = currentUsername
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const normalizedAuthorUsername = (articleData.author.username || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

  const isOwnArticle =
    (Boolean(user?.id) &&
      Boolean(articleData.author.id) &&
      user?.id === articleData.author.id) ||
    (Boolean(normalizedCurrentUsername) &&
      Boolean(normalizedAuthorUsername) &&
      normalizedCurrentUsername === normalizedAuthorUsername);
  const articleEditHref = article?.id
    ? `/article/create?id=${encodeURIComponent(String(article.id))}`
    : "#";

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const sharePayload = {
      title: displayTitle,
      text: displaySubtitle || displayTitle,
      url,
    };

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(sharePayload);
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success(t("articles.detail.shareLinkCopied"));
        return;
      }
    } catch {
      // no-op, fallback below
    }

    toast.error(t("articles.detail.shareFailed"));
  };

  const getMoreActionText = () => {
    if (activeMoreAction === "request-translation") {
      return {
        title: t("articles.detail.requestTranslation"),
        description: t("articles.detail.requestTranslationDescription"),
      };
    }
    if (activeMoreAction === "report-article") {
      return {
        title: t("articles.detail.reportArticle"),
        description: t("articles.detail.reportArticleDescription"),
      };
    }
    return {
      title: t("articles.detail.reportAuthor"),
      description: t("articles.detail.reportAuthorDescription"),
    };
  };

  const submitMoreAction = () => {
    if (!activeMoreAction) return;
    toast.success(t("articles.detail.requestSubmitted"));
    setActiveMoreAction(null);
    setMoreActionMessage("");
  };

  const headingSelector = "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]";

  // Build TOC from rendered headings (scoped)
  useEffect(() => {
    if (!MdxContent || !articleRef.current) return;

    const headings = Array.from(
      articleRef.current.querySelectorAll<HTMLElement>(headingSelector),
    );

    const slugCounts = new Map<string, number>();

    const items = headings
      .map((h, index) => {
        const level = Number(h.tagName.replace("H", ""));
        const text = h.textContent?.trim() || "";
        const rawId = h.id || text || `heading-${index}`;
        const baseId = encodeURIComponent(rawId);
        const count = slugCounts.get(baseId) ?? -1;
        const nextCount = count + 1;
        slugCounts.set(baseId, nextCount);
        const id = nextCount === 0 ? baseId : `${baseId}-${nextCount}`;

        h.id = id; // ensure uniqueness even if original ids collide

        return { id, text, level } as TocEntry;
      })
      .filter((x) => x.text.length > 0);

    setTocItems(items);
  }, [MdxContent]);

  // Intersection Observer for active TOC section
  useEffect(() => {
    if (!MdxContent || !articleRef.current) return;

    const headings = Array.from(
      articleRef.current.querySelectorAll<HTMLElement>(headingSelector),
    );
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((e) => e.isIntersecting);
        if (entry) {
          setActiveSection((entry.target as HTMLElement).id);
          return;
        }

        const topVisible = headings
          .map((h) => ({ id: h.id, top: h.getBoundingClientRect().top }))
          .filter((x) => x.top < 200)
          .sort((a, b) => b.top - a.top)[0];

        if (topVisible) setActiveSection(topVisible.id);
      },
      { rootMargin: "-100px 0% -80% 0%" },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [MdxContent]);

  if (loading) {
    return <PageSkeleton />;
  }

  const toggleTocGroup = (groupId: string) => {
    setCollapsedTocGroups((previous) => ({
      ...previous,
      [groupId]: !previous[groupId],
    }));
  };

  const setAllTocGroupsCollapsed = (collapsed: boolean) => {
    setCollapsedTocGroups(() => {
      const next: Record<string, boolean> = {};
      collapsibleNodeIds.forEach((id) => {
        next[id] = collapsed;
      });
      return next;
    });
  };

  const renderTocNode = (node: TocNode) => {
    const isExpandable = node.children.length > 0;
    const canCollapse = isExpandable && node.item.level <= 3;
    const isCollapsed = collapsedTocGroups[node.item.id] ?? false;

    return (
      <div key={node.item.id} className="space-y-0.5">
        <div className="flex items-start gap-0.5">
          <div className="min-w-0 flex-1">
            <TocItem item={node.item} activeId={activeSection} />
          </div>

          {canCollapse && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={
                isCollapsed
                  ? t("articles.detail.expandSection")
                  : t("articles.detail.collapseSection")
              }
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => toggleTocGroup(node.item.id)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {(!canCollapse || !isCollapsed) &&
          node.children.map((child) => renderTocNode(child))}
      </div>
    );
  };

  const renderToc = () => (
    <nav className="flex flex-col gap-0.5">
      {tocTree.length ? (
        <>
          {hasExpandableTocGroups && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mb-1 h-6 justify-start px-2 text-xs text-muted-foreground"
              onClick={() => setAllTocGroupsCollapsed(false)}
              disabled={!hasCollapsedTocGroups}
            >
              {t("articles.detail.expandAll")}
            </Button>
          )}

          {tocTree.map((node) => renderTocNode(node))}
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          {t("articles.detail.noHeadingsFound")}
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 selection:text-primary">
      {/* Main layout: Left rail / Article / Right panels */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[84px_minmax(0,1fr)] xl:grid-cols-[84px_minmax(0,1fr)_320px] gap-6">
          {/* Left rail (wireframe “Left sidebar”) */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <div className="flex">
                {/* Action stack */}
                <div className="flex flex-col items-center gap-3">
                  {/* Like action */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full border ${
                      isLiked
                        ? "text-destructive border-destructive/40 bg-destructive/10"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={toggleLike}
                    aria-label={t("feed.actions.like")}
                  >
                    <Heart
                      className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`}
                    />
                  </Button>

                  {/* Bookmark action */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full border ${
                      isBookmarked
                        ? "text-primary border-primary/40 bg-primary/10 "
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={toggleBookmark}
                    aria-label={t("feed.actions.bookmark")}
                  >
                    <Bookmark
                      className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`}
                    />
                  </Button>

                  {/* Comment action */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-border hover:bg-muted"
                    aria-label={t("feed.actions.comment")}
                    onClick={() => commentRef.current?.focus()}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>

                  {/* Language selector */}
                  <div className="relative" ref={desktopLanguageMenuRef}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full border border-border hover:bg-muted"
                      aria-label={t("articles.detail.languageSelector")}
                      onClick={() =>
                        setIsDesktopLanguageMenuOpen((prev) => !prev)
                      }
                    >
                      <Languages className="h-5 w-5" />
                    </Button>

                    {isDesktopLanguageMenuOpen && (
                      <div className="absolute left-14 top-1/2 z-50 w-28 -translate-y-1/2 rounded-2xl border border-border/70 bg-background/95 p-2 shadow-2xl backdrop-blur-md">
                        <div className="space-y-1">
                          {ARTICLE_LANGS.map((lang) => {
                            const isAvailable = availableTranslations.includes(
                              lang.code,
                            );
                            const isSelected = selectedLanguage === lang.code;

                            return (
                              <Button
                                key={lang.code}
                                type="button"
                                variant="ghost"
                                className={`h-8 w-full justify-between rounded-lg px-3 text-sm font-semibold ${
                                  isSelected
                                    ? "bg-blue-600 text-white hover:bg-blue-600"
                                    : "text-foreground hover:bg-muted"
                                } ${
                                  !isAvailable
                                    ? "opacity-50 text-muted-foreground cursor-not-allowed hover:bg-transparent"
                                    : ""
                                }`}
                                disabled={!isAvailable || loading}
                                onClick={() => {
                                  if (isAvailable && !loading && !isSelected) {
                                    setSelectedLanguage(lang.code);
                                    setLoading(true);
                                  }
                                  setIsDesktopLanguageMenuOpen(false);
                                }}
                              >
                                <span>{lang.label}</span>
                                {isSelected && <Check className="h-4 w-4" />}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Share action */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-border hover:bg-muted"
                    aria-label={t("common.share")}
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>

                  {isOwnArticle && (
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="rounded-full border border-border hover:bg-muted"
                      aria-label={t("common.edit")}
                    >
                      <Link href={articleEditHref}>
                        <Pencil className="h-5 w-5" />
                      </Link>
                    </Button>
                  )}

                  {/* More action */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full border border-border hover:bg-muted"
                        aria-label={t("articles.detail.moreActions")}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem
                        onClick={() =>
                          setActiveMoreAction("request-translation")
                        }
                      >
                        {t("articles.detail.requestTranslation")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setActiveMoreAction("report-article")}
                      >
                        {t("articles.detail.reportArticle")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setActiveMoreAction("report-author")}
                      >
                        {t("articles.detail.reportAuthor")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="h-px w-10 bg-border my-1" />

                  <div className="text-[11px] text-muted-foreground text-center">
                    <div className="font-semibold text-foreground/80">
                      {likesCount}
                    </div>
                    <div>{t("feed.stats.likes")}</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Article column */}
          <main className="min-w-0">
            {/* Title header block (wireframe: title/subtitle/meta) */}
            <Card className="bg-card/50 border-border/60 shadow-sm">
              <div className="px-6 sm:px-8 space-y-6">
                {error && <div className="text-sm text-red-500">{error}</div>}

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {publishedAtText}
                  </span>
                  <span>•</span>
                  {editedAtText && (
                    <span className="flex items-center gap-1">
                      {t("articles.detail.editedOn", { date: editedAtText })}
                    </span>
                  )}
                  {editedAtText && <span>•</span>}
                  <span>
                    {t("articles.detail.readTime", {
                      minutes: articleData.readTime,
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    {t("articles.detail.views", { count: articleData.views })}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-foreground">
                  {displayTitle}
                </h1>
                {displaySubtitle && (
                  <h2 className="text-lg sm:text-xl text-muted-foreground">
                    {displaySubtitle}
                  </h2>
                )}

                <div className="flex flex-wrap gap-2">
                  {displayTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Article body (wireframe: big center area) */}
              <div className="px-6  sm:px-8" ref={articleRef}>
                {MdxContent ? (
                  <article className="max-w-none overflow-hidden text-foreground [overflow-wrap:anywhere] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <MdxContent components={{ ...mdxComponents }} />
                  </article>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    {t("articles.detail.failedToLoadContent")}
                  </div>
                )}
              </div>
            </Card>

            {/* Mobile TOC (because your right sidebar disappears) */}
            <div className="xl:hidden mt-6">
              <RightPanelCard title={t("articles.detail.tableOfContents")}>
                {renderToc()}
              </RightPanelCard>
            </div>

            {/* Comment section */}
            {articleNumericId && (
              <div className="mt-6">
                <ArticleCommentSection
                  ref={commentRef}
                  articleId={articleNumericId}
                />
              </div>
            )}
          </main>

          {/* Right panels (wireframe: Author data, TOC, Definitions, Related links) */}
          <aside className="hidden xl:block">
            <AuthorBox author={articleData.author} />
            <div className="sticky top-6 mt-6 space-y-6">
              <RightPanelCard title={t("articles.detail.tableOfContents")}>
                {renderToc()}
              </RightPanelCard>
              {definitions && definitions.length > 0 && (
                <RightPanelCard title={t("articles.detail.definitions")}>
                  <div className="space-y-3">
                    {definitions.map((d) => (
                      <div key={d.term} className="text-sm">
                        <div className="font-semibold flex items-center gap-2">
                          <span className="inline-flex h-5 items-center rounded-md border bg-muted px-2 text-xs">
                            {d.term}
                          </span>
                        </div>
                        <div className="text-muted-foreground mt-1">
                          {d.meaning}
                        </div>
                      </div>
                    ))}
                  </div>
                </RightPanelCard>
              )}
              {relatedLinks && relatedLinks.length > 0 && (
                <RightPanelCard title={t("articles.detail.relatedLinks")}>
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {visibleRelatedLinks.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-1.5 text-sm">
                          <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                          <span className="text-muted-foreground group-hover:text-foreground max-w-[220px] truncate block">
                            {l.label}
                          </span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                      </a>
                    ))}
                    {relatedLinks.length > 4 && (
                      <div className="pt-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllLinks((prev) => !prev)}
                          className="h-6 w-full justify-start px-2 text-xs text-muted-foreground"
                        >
                          {showAllLinks
                            ? t("articles.detail.showLess")
                            : t("articles.detail.showMoreLinks", {
                                count: relatedLinks.length - 4,
                              })}
                        </Button>
                      </div>
                    )}
                  </div>
                </RightPanelCard>
              )}
            </div>
          </aside>
        </div>
      </div>

      <BackToTopButton />

      <Dialog
        open={Boolean(activeMoreAction)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveMoreAction(null);
            setMoreActionMessage("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getMoreActionText().title}</DialogTitle>
            <DialogDescription>
              {getMoreActionText().description}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={moreActionMessage}
            onChange={(event) => setMoreActionMessage(event.target.value)}
            placeholder={t("articles.detail.actionMessagePlaceholder")}
            className="min-h-[110px]"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActiveMoreAction(null);
                setMoreActionMessage("");
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={submitMoreAction}>
              {t("articles.detail.submitRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
