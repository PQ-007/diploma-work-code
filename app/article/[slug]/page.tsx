"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { components as mdxComponents } from "@/mdx/mdx-components";
import {
  Bookmark,
  Boxes,
  Calendar,
  Check,
  ExternalLink,
  Globe,
  Hash,
  Heart,
  Languages,
  Link as LinkIcon,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import BackToTopButton from "../components/BackToTopButton";

import RightPanelCard from "../components/RightPanelCard";
import TocItem from "../components/TocItem";
import { ArticlePayload, RelatedLink, TocEntry } from "../type";
import AuthorBox from "../components/AuthorBox";
import ArticleCommentSection from "../components/ArticleCommentSection";
import type { ArticleCommentSectionHandle } from "../components/ArticleCommentSection";
import { useArticleInteractions } from "@/hooks/useArticleInteractions";

type ArticleLangCode = "mn" | "en" | "jp";

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
  const [activeSection, setActiveSection] = useState("");
  const [article, setArticle] = useState<ArticlePayload | null>(null);
  const [mdxSource, setMdxSource] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tocItems, setTocItems] = useState<TocEntry[]>([]);
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<ArticleLangCode>("mn");
  const [isDesktopLanguageMenuOpen, setIsDesktopLanguageMenuOpen] =
    useState(false);
  const [availableTranslations, setAvailableTranslations] = useState<
    ArticleLangCode[]
  >([]);
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
    return <div>Redirecting...</div>;
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
          setError("Missing article id.");
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
        const serialized = await serialize(body);

        setArticle({
          id: data?.id,
          status: data?.status,
          title: data?.title || "Untitled article",
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
        setMdxSource(serialized);
      } catch (e) {
        console.error("Error loading MDX:", e);
        setError("Failed to load article content.");
      } finally {
        setLoading(false);
      }
    };

    loadMDX();
  }, [slug, selectedLanguage]);

  const publishedAtText = article?.published_at
    ? new Date(article.published_at).toLocaleDateString()
    : "No date";

  const editedAtText = article?.edited_at
    ? new Date(article.edited_at).toLocaleDateString()
    : null;

  const displayTitle = article?.title || "Untitled article";
  const displaySubtitle = article?.sub_title || null;
  const displayTags = article?.tags ?? [];

  const articleData = useMemo(() => {
    const wordCount = (article?.body || "").split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    const authorName = article?.author?.user_name || "Unknown";

    return {
      readTime,
      views: article?.views ?? 0,
      author: {
        username: article?.author?.user_name || "",
        avatar: article?.author?.avatar_url || "",
        ranking: article?.author?.ranking_point || 0,
        bio: article?.author?.bio ?? "",
      },
    };
  }, [article]);

  const headingSelector = "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]";

  // Build TOC from rendered headings (scoped)
  useEffect(() => {
    if (!mdxSource || !articleRef.current) return;

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
  }, [mdxSource]);

  // Intersection Observer for active TOC section
  useEffect(() => {
    if (!mdxSource || !articleRef.current) return;

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
  }, [mdxSource]);

  if (loading) {
    return <PageSkeleton />;
  }

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
                        ? "text-red-500 border-red-200 bg-red-50"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={toggleLike}
                    aria-label="Like"
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
                        ? "text-blue-500 border-blue-200 bg-blue-50"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={toggleBookmark}
                    aria-label="Bookmark"
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
                    aria-label="Comment"
                    onClick={() => commentRef.current?.focus()}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>

                  {/* Language selector */}
                  <div className="relative" ref={desktopLanguageMenuRef}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full border border-border hover:bg-muted"
                      aria-label="Language selector"
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
                    aria-label="Share"
                    onClick={() => commentRef.current?.focus()}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>

                  {/* More action */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-border hover:bg-muted"
                    aria-label="Share"
                    onClick={() => commentRef.current?.focus()}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>

                  <div className="h-px w-10 bg-border my-1" />

                  <div className="text-[11px] text-muted-foreground text-center">
                    <div className="font-semibold text-foreground/80">
                      {likesCount}
                    </div>
                    <div>likes</div>
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
                      Edited {editedAtText}
                    </span>
                  )}
                  {editedAtText && <span>•</span>}
                  <span>{articleData.readTime} min read</span>
                  <span>•</span>
                  <span>{articleData.views} views</span>
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
                {mdxSource ? (
                  <article
                    className="prose dark:prose-invert prose-headings:font-semibold prose-h2:mt-10 prose-h3:mt-8
                    prose-p:text-[15px] prose-p:leading-7 prose-li:text-[15px] prose-li:leading-7 max-w-none
                    prose-a:break-all overflow-hidden"
                  >
                    <MDXRemote
                      {...mdxSource}
                      components={{ ...mdxComponents }}
                    />
                  </article>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    Failed to load article content
                  </div>
                )}
              </div>
            </Card>

            {/* Mobile TOC (because your right sidebar disappears) */}
            <div className="xl:hidden mt-6">
              <RightPanelCard title="Table of Contents">
                <nav className="flex flex-col gap-1">
                  {tocItems.length ? (
                    tocItems.map((item) => (
                      <TocItem
                        key={item.id}
                        item={item}
                        activeId={activeSection}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No headings found.
                    </div>
                  )}
                </nav>
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
              <RightPanelCard title="Table of Contents">
                <nav className="flex flex-col gap-1">
                  {tocItems.length ? (
                    tocItems.map((item) => (
                      <TocItem
                        key={item.id}
                        item={item}
                        activeId={activeSection}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No headings found.
                    </div>
                  )}
                </nav>
              </RightPanelCard>
              {definitions && definitions.length > 0 && (
                <RightPanelCard title="Definitions">
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
                <RightPanelCard title="Related links">
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {visibleRelatedLinks.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                          <span className="text-muted-foreground group-hover:text-foreground max-w-[220px] truncate block">
                            {l.label}
                          </span>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                      </a>
                    ))}
                    {relatedLinks.length > 4 && (
                      <div className="pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllLinks((prev) => !prev)}
                          className="w-full justify-start text-xs text-muted-foreground"
                        >
                          {showAllLinks
                            ? "Show less"
                            : `Show ${relatedLinks.length - 4} more links`}
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
    </div>
  );
}
