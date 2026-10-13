"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LanguageBadge } from "@/components/common/LanguageBadge";
import { Tag } from "@/components/common/Tag";
import { UserChip } from "@/components/common/UserChip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Pencil,
  Share2,
  Bookmark,
  ChevronRight,
  FileText,
  Clock,
  LinkIcon,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileEdit,
  MessageSquareQuote,
  History,
  Flag,
  Newspaper,
} from "lucide-react";
import type {
  ConvertResponse,
  EntryResponse,
  RelatedArticle,
  Translation,
} from "./dictionaryDetail.types";

// --- Helpers ---
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  approved: {
    label: "Verified",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle,
  },
  pending_review: {
    label: "PENDING REVIEW",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: Clock,
  },
  draft: {
    label: "DRAFT",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: FileEdit,
  },
  rejected: {
    label: "REJECTED",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: AlertCircle,
  },
};

const LANG_LABELS: Record<string, string> = {
  mn: "Монгол",
  ja: "日本語",
  en: "English",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// --- Page Component ---
export default function DictionaryTermPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const slug = params?.slug ?? "";

  const [data, setData] = useState<EntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [mnScript, setMnScript] = useState<string | null>(null);

  const fetchEntry = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setMnScript(null);
    try {
      const res = await fetch(`/api/dictionary/${encodeURIComponent(slug)}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const json: EntryResponse = await res.json();
      setData(json);
      setIsSaved(json.entry.saved);

      // --- Convert Cyrillic MN term → traditional Mongolian script ---
      const cyrillicTerm =
        json.entry.language_code === "mn"
          ? json.entry.term
          : (json.translations.find((t) => t.language_code === "mn")
              ?.translated_term ?? null);
      if (cyrillicTerm) {
        try {
          const convRes = await fetch("/api/dictionary/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: cyrillicTerm }),
          });
          const convJson: ConvertResponse = await convRes.json();
          if (convJson?.result) setMnScript(convJson.result);
        } catch {
          // conversion failure is non-fatal
        }
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);
  // --- Fetch related articles by tag overlap ---
  useEffect(() => {
    if (!data?.entry.tags.length) return;
    const entryTagsLower = new Set(data.entry.tags.map((t) => t.toLowerCase()));
    fetch("/api/articles?status=published")
      .then((r) => r.json())
      .then((json) => {
        const matched: RelatedArticle[] = (json.items || [])
          .filter((a: RelatedArticle & { tags: string[] }) =>
            (a.tags || []).some((t) => entryTagsLower.has(t.toLowerCase())),
          )
          .slice(0, 5)
          .map((a: RelatedArticle) => ({
            article_id: a.article_id,
            title: a.title || "Untitled",
            language_code: a.language_code,
            tags: a.tags || [],
          }));
        setRelatedArticles(matched);
      })
      .catch(() => {});
  }, [data?.entry.tags]);

  // --- Save toggle ---
  const handleSave = async () => {
    if (!user) return router.push("/signin");
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      const res = await fetch("/api/dictionary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: data?.entry.id }),
      });
      if (!res.ok) setIsSaved(prev);
    } catch {
      setIsSaved(prev);
    }
  };

  // --- Share ---
  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // --- Not found state ---
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto py-6 lg:py-3 max-w-7xl">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-2">
              {t("dictionary.termNotFound")}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {t("dictionary.termNotFoundDesc")}
            </p>
            <Button size="sm" onClick={() => router.push("/dictionary")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("dictionary.backToDictionary")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const {
    entry,
    translations,
    examples,
    revisions,
    moderationActions,
    relatedEntries,
  } = data;
  const isOwner = user?.id === entry.author.id;
  const latestRejection = moderationActions.find((a) => a.action === "reject");

  // Group translations by language
  const translationsByLang = translations.reduce<Record<string, Translation[]>>(
    (acc, t) => {
      (acc[t.language_code] = acc[t.language_code] || []).push(t);
      return acc;
    },
    {},
  );

  // Pick the best translation for the current UI language (if the entry itself isn't in that language)
  const displayTranslation: Translation | null =
    language !== entry.language_code
      ? (translationsByLang[language]?.[0] ?? null)
      : null;

  // Show translations for all languages except English (the original) and the
  // current UI language (already displayed as the primary definition above).
  const sortedTranslationEntries = Object.entries(translationsByLang)
    .filter(([lang]) => lang !== entry.language_code && lang !== language)
    .sort(([a], [b]) => a.localeCompare(b));

  // Mongolian term for the vertical script accent (native MN entry OR has MN translation)
  const mnTerm =
    entry.language_code === "mn"
      ? entry.term
      : (translationsByLang["mn"]?.[0]?.translated_term ?? null);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div>
        <div className="flex justify-center gap-4 xl:gap-8">
          {/* MN vertical script accent — shown when a Mongolian term is available */}
          {mnTerm && (
            <div className="hidden xl:flex items-start pt-3 w-7 flex-shrink-0 select-none">
              <span
                className="mn-script text-2xl tracking-widest"
                style={{
                  writingMode: "vertical-lr",
                  letterSpacing: "0.18em",
                }}
                title={`Mongolian: ${mnScript ?? mnTerm}`}
              >
                {mnScript ?? mnTerm}
              </span>
            </div>
          )}

          {/* Main Content */}
          <div className="min-w-0 max-w-3xl flex-1 space-y-6">
            {/* Title + Meta */}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  {displayTranslation
                    ? displayTranslation.translated_term
                    : entry.term}
                </h1>
                {displayTranslation && (
                  <span className="text-lg text-muted-foreground font-normal">
                    {entry.term}
                  </span>
                )}
                <StatusBadge kind="term" value={entry.status} />
              </div>
              {entry.reading && (
                <p className="text-lg text-muted-foreground mt-1">
                  {entry.reading}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <UserChip
                  name={entry.author.display_name}
                  avatarUrl={entry.author.avatar_url}
                  username={entry.author.user_name}
                />
                <span>·</span>
                <span>
                  {t("dictionary.updatedAt", {
                    date: formatDate(entry.updated_at),
                  })}
                </span>
                <span>·</span>
                <span>{t("dictionary.views", { count: entry.views })}</span>
              </div>
            </div>

            {/* Rejection notice */}
            {entry.status === "rejected" && latestRejection && (
              <Card className="border-destructive/30 bg-destructive/5 py-4">
                <CardContent>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        {t("dictionary.entryRejected")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {latestRejection.reason ||
                          t("dictionary.noReasonProvided")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("dictionary.rejectedBy", {
                          moderator: latestRejection.moderator,
                          date: formatDate(latestRejection.created_at),
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {entry.status === "approved" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/dictionary/create?suggest=${entry.slug}`)
                  }
                >
                  <Pencil />
                  {t("dictionary.suggestEdit")}
                </Button>
              )}
              {isOwner && entry.status === "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/dictionary/create?edit=${entry.slug}`)
                  }
                >
                  <FileEdit />
                  {t("dictionary.editDraft")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 />
                {t("dictionary.share")}
              </Button>
              <Button
                variant={isSaved ? "secondary" : "outline"}
                size="sm"
                aria-pressed={isSaved}
                onClick={handleSave}
              >
                <Bookmark fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? t("dictionary.saved") : t("dictionary.save")}
              </Button>
            </div>

            {/* Tags */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <Tag key={tag} name={tag} />
                ))}
              </div>
            )}

            <Separator />

            {/* Tabbed Content */}
            <Tabs defaultValue="definition" className="w-full">
              <TabsList variant="underline" className="mb-2">
                <TabsTrigger value="definition">
                  <BookOpen />
                  {t("dictionary.definition")}
                </TabsTrigger>
                <TabsTrigger value="examples">
                  <MessageSquareQuote />
                  {t("dictionary.examples")} ({examples.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History />
                  {t("dictionary.history")} ({revisions.length})
                </TabsTrigger>
              </TabsList>

              {/* --- Definition + Translations Tab --- */}
              <TabsContent value="definition" className="space-y-0">
                {/* 1. UI-language block (shown first when not English) */}
                {language !== "en" && (
                  <section className="pb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full" />
                      {LANG_LABELS[language] || language}
                    </h2>
                    {displayTranslation ? (
                      <>
                        <p className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {displayTranslation.translated_term}
                        </p>
                        {displayTranslation.explanation && (
                          <p className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-wrap mt-2">
                            {displayTranslation.explanation}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {t("dictionary.noTranslationYet", {
                          lang: LANG_LABELS[language] || language,
                        })}
                      </p>
                    )}
                  </section>
                )}

                {/* 2. English */}
                {language !== "en" && <Separator className="mb-6" />}
                <section className="pb-6">
                  <h2
                    className={`mb-3 flex items-center gap-2 ${language === "en" ? "text-xl font-semibold" : "text-sm font-semibold text-muted-foreground"}`}
                  >
                    <span
                      className={`rounded-full ${language === "en" ? "w-1 h-6 bg-primary" : "w-1 h-4 bg-muted-foreground/40"}`}
                    />
                    {LANG_LABELS[entry.language_code] || entry.language_code}
                  </h2>
                  <p
                    className={`text-[15px] leading-relaxed whitespace-pre-wrap ${language === "en" ? "text-muted-foreground" : "text-muted-foreground/70"}`}
                  >
                    {entry.definition}
                  </p>
                </section>

                {/* 3. Remaining translations (neither UI lang nor English) */}
                {sortedTranslationEntries.map(([lang, items]) =>
                  items.map((tr) => (
                    <div key={tr.id}>
                      <Separator className="mb-6" />
                      <section className="pb-6">
                        <h2 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                          <span className="w-1 h-4 bg-muted-foreground/40 rounded-full" />
                          {LANG_LABELS[lang] || lang}
                        </h2>
                        <p className="text-[15px] text-muted-foreground/70 leading-relaxed whitespace-pre-wrap">
                          {tr.translated_term}
                        </p>
                        {tr.explanation && (
                          <p className="text-[15px] text-muted-foreground/70 leading-relaxed whitespace-pre-wrap mt-2">
                            {tr.explanation}
                          </p>
                        )}
                      </section>
                    </div>
                  )),
                )}
              </TabsContent>

              {/* --- Examples Tab --- */}
              <TabsContent value="examples" className="space-y-4">
                {examples.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    {t("dictionary.noExamples")}
                  </p>
                ) : (
                  examples.map((ex) => (
                    <figure key={ex.id} className="rounded-r-lg border-l-4 border-brand-sky bg-card py-3 pl-4 pr-4 shadow-xs">
                      <div>
                        <blockquote className="text-[15px] leading-relaxed text-foreground">
                          {ex.example_text}
                        </blockquote>
                        {ex.context && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {ex.context}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          {ex.source && (
                            <span>
                              {t("dictionary.source", { source: ex.source })}
                            </span>
                          )}
                          <LanguageBadge code={ex.language_code} />
                        </div>
                      </div>
                    </figure>
                  ))
                )}
              </TabsContent>

              {/* --- History Tab --- */}
              <TabsContent value="history" className="space-y-1">
                {revisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    {t("dictionary.noRevisions")}
                  </p>
                ) : (
                  <div className="relative pl-6 border-l-2 border-border/40 space-y-6">
                    {revisions.map((rev) => {
                      const revStatus = STATUS_CONFIG[rev.status];
                      const RevIcon = revStatus?.icon || History;
                      return (
                        <div key={rev.id} className="relative">
                          <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
                            <RevIcon className="h-2.5 w-2.5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">
                                {t("dictionary.revision", {
                                  number: rev.revision_number,
                                })}
                              </span>
                              <StatusBadge kind="term" value={rev.status} />
                            </div>
                            {rev.change_summary && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {rev.change_summary}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("dictionary.by", {
                                author: rev.author,
                                date: formatDate(rev.created_at),
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {relatedEntries.length > 0 && (
              <section className="space-y-2 xl:hidden">
                <h2 className="text-sm font-semibold">{t("dictionary.relatedTerms")}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {relatedEntries.map((related) => (
                    <Link
                      key={related.id}
                      href={`/dictionary/${related.slug}`}
                      className="inline-flex h-8 items-center rounded-full border bg-card px-3 text-[13px] font-medium hover:border-primary/40"
                    >
                      {related.term}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="sticky top-6 hidden h-fit w-72 shrink-0 space-y-6 xl:block">
            {/* Related Content */}
            {relatedArticles.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Newspaper className="h-4 w-4" />
                  {t("dictionary.relatedContent")}
                </h3>
                <Card className="py-0">
                  <CardContent className="p-0">
                    {relatedArticles.map((article) => (
                      <Link
                        key={article.article_id}
                        href={`/article/${article.article_id}`}
                        className="flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors group"
                      >
                        <Newspaper className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium group-hover:text-foreground transition-colors line-clamp-2 leading-snug">
                            {article.title}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {article.tags
                              .filter((t) =>
                                entry.tags
                                  .map((et) => et.toLowerCase())
                                  .includes(t.toLowerCase()),
                              )
                              .slice(0, 2)
                              .map((t) => (
                                <Tag key={t} name={t} />
                              ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Related Terms */}
            {relatedEntries.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <LinkIcon className="h-4 w-4" />
                  {t("dictionary.relatedTerms")}
                </h3>
                <Card className="py-0">
                  <CardContent className="p-0">
                    {relatedEntries.map((related) => (
                      <Link
                        key={related.id}
                        href={`/dictionary/${related.slug}`}
                        className="flex items-center justify-between px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                            {related.term}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Entry Info */}
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4" />
                {t("dictionary.entryInfoLabel")}
              </h3>
              <Card className="py-0">
                <CardContent className="p-4 space-y-3">
                  
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("dictionary.viewsLabel")}
                    </span>
                    <span className="font-medium">{entry.views}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("dictionary.savesLabel")}
                    </span>
                    <span className="font-medium">{entry.saves}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("dictionary.translationsLabel")}
                    </span>
                    <span className="font-medium">{translations.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("dictionary.examples")}
                    </span>
                    <span className="font-medium">{examples.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("dictionary.createdLabel")}
                    </span>
                    <span className="font-medium">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Moderation History */}
            {moderationActions.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Flag className="h-4 w-4" />
                  {t("dictionary.moderationHistory")}
                </h3>
                <Card className="py-0">
                  <CardContent className="p-0">
                    {moderationActions.map((action, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 border-b border-border/20 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          {action.action === "approve" ? (
                            <CheckCircle className="size-3.5 text-success" />
                          ) : (
                            <AlertCircle className="size-3.5 text-destructive" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {action.action === "approve"
                              ? t("dictionary.moderationApproved")
                              : t("dictionary.moderationRejected")}
                          </span>
                        </div>
                        {action.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {action.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("dictionary.by", {
                            author: action.moderator,
                            date: formatDate(action.created_at),
                          })}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
