"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { components as mdxComponents } from "@/mdx/mdx-components";
import { compileMdx } from "@/mdx/mdx-editor/MdxCompiler";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Hash,
  Link as LinkIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BackToTop } from "@/components/common/BackToTop";

import RightPanelCard from "../components/RightPanelCard";
import TocItem from "../components/TocItem";
import { ArticlePayload, RelatedLink, TocEntry } from "../type";
import AuthorBox from "../components/AuthorBox";
import ArticleCommentSection from "../components/ArticleCommentSection";
import type { ArticleCommentSectionHandle } from "../components/ArticleCommentSection";
import ArticleActionRail from "./ArticleActionRail";
import type { ArticleLangCode } from "./articleLang";
import { useArticleEngagement } from "@/lib/hooks/mutations/useArticleEngagement";
import { LogoLoader } from "@/components/brand/LogoLoader";

type TocNode = { item: TocEntry; children: TocNode[] };

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
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("");
  const [article, setArticle] = useState<ArticlePayload | null>(null);
  const [MdxContent, setMdxContent] = useState<React.ComponentType<Record<string, unknown>> | null>(
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
  const [availableTranslations, setAvailableTranslations] = useState<
    ArticleLangCode[]
  >([]);
  const articleRef = useRef<HTMLDivElement | null>(null);

  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const articleNumericId = article?.id ? Number(article.id) : null;
  const commentRef = useRef<ArticleCommentSectionHandle>(null);
  const { isLiked, likesCount, toggleLike, isBookmarked, toggleBookmark } =
    useArticleEngagement({ articleId: articleNumericId });

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
    setCollapsedTocGroups((previous) => {
      const next: Record<string, boolean> = {};

      collapsibleNodeIds.forEach((id) => {
        next[id] = previous[id] ?? false;
      });

      return next;
    });
  }, [collapsibleNodeIds]);


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
          created_at: data?.created_at || null,
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

  const shownDate = article?.published_at || article?.created_at;
  const publishedAtText = shownDate
    ? new Date(shownDate).toLocaleDateString(language, { year: "numeric", month: "short", day: "numeric" })
    : t("articles.detail.noDate");

  const editedAtText = article?.edited_at
    ? new Date(article.edited_at).toLocaleDateString(language, { year: "numeric", month: "short", day: "numeric" })
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
    return <LogoLoader />;
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
          <ArticleActionRail
            isLiked={isLiked}
            onToggleLike={toggleLike}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
            likesCount={likesCount}
            onCommentClick={() => commentRef.current?.focus()}
            availableTranslations={availableTranslations}
            selectedLanguage={selectedLanguage}
            loading={loading}
            onSelectLanguage={(code) => {
              setSelectedLanguage(code);
              setLoading(true);
            }}
            onShare={handleShare}
            isOwnArticle={isOwnArticle}
            articleEditHref={articleEditHref}
          />

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

      <BackToTop />

    </div>
  );
}
