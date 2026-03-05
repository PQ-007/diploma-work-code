"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
  Languages,
  MessageSquareQuote,
  History,
  CreditCard,
  Flag,
  Newspaper,
} from "lucide-react";

// --- Types ---
interface Author {
  id: string;
  display_name: string;
  user_name: string;
  avatar_url: string;
}

interface Translation {
  id: number;
  language_code: string;
  translated_term: string;
  explanation: string | null;
  created_by: string;
  created_at: string;
}

interface Example {
  id: number;
  example_text: string;
  source: string | null;
  context: string | null;
  language_code: string;
  created_by: string;
  created_at: string;
}

interface Revision {
  id: number;
  revision_number: number;
  change_summary: string | null;
  status: string;
  author: string;
  created_at: string;
}

interface ModerationAction {
  action: string;
  reason: string | null;
  moderator: string;
  created_at: string;
}

interface RelatedEntry {
  id: number;
  term: string;
  slug: string;
  language_code: string;
}

interface RelatedArticle {
  article_id: string;
  title: string;
  language_code: string;
  tags: string[];
}

interface EntryDetail {
  id: number;
  term: string;
  slug: string;
  reading: string | null;
  language_code: string;
  definition: string;
  status: string;
  views: number;
  saves: number;
  created_at: string;
  updated_at: string;
  author: Author;
  tags: string[];
  saved: boolean;
}

interface EntryResponse {
  entry: EntryDetail;
  translations: Translation[];
  examples: Example[];
  revisions: Revision[];
  moderationActions: ModerationAction[];
  relatedEntries: RelatedEntry[];
}

// --- Helpers ---
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  approved: {
    label: "APPROVED",
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

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.color} hover:${cfg.color}`}>
      <Icon className="h-3.5 w-3.5 mr-1" />
      {cfg.label}
    </Badge>
  );
}

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

  const slug = params?.slug ?? "";

  const [data, setData] = useState<EntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingFlashcard, setSavingFlashcard] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [mnScript, setMnScript] = useState<string | null>(null);

  const fetchEntry = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
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

  // --- Convert Cyrillic MN term → traditional Mongolian script via KiMo API ---
  useEffect(() => {
    const cyrillicTerm =
      data?.entry.language_code === "mn"
        ? data.entry.term
        : data?.entry
          ? (data.translations.find((t) => t.language_code === "mn")
              ?.translated_term ?? null)
          : null;
    if (!cyrillicTerm) return;
    fetch("https://api.kimo.mn/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: cyrillicTerm }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.output) setMnScript(json.output as string);
      })
      .catch(() => {});
  }, [data]);

  // --- Save toggle ---
  const handleSave = async () => {
    if (!user) return router.push("/signin");
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      const res = await fetch("/api/dictionary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: data?.entry.id }),
      });
      if (!res.ok) setIsSaved(prev);
    } catch {
      setIsSaved(prev);
    }
  };

  // --- Flashcard creation ---
  const handleCreateFlashcard = async () => {
    if (!user) return router.push("/signin");
    setSavingFlashcard(true);
    try {
      const res = await fetch("/api/dictionary/flashcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: data?.entry.id }),
      });
      const json = await res.json();
      if (!res.ok) alert(json.error || "Failed to create flashcard");
      else alert("Flashcard created!");
    } catch {
      alert("Failed to create flashcard");
    } finally {
      setSavingFlashcard(false);
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
            <h1 className="text-xl font-bold mb-2">Term Not Found</h1>
            <p className="text-sm text-muted-foreground mb-6">
              The term you&apos;re looking for doesn&apos;t exist in the
              dictionary yet.
            </p>
            <Button size="sm" onClick={() => router.push("/dictionary")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dictionary
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

  // Sort translation sections so the entry's OWN language always appears first,
  // then UI language, then the rest. The own-language section is rendered as a
  // synthetic row (from entry.term / entry.definition) so filter it out from the
  // dynamic list to avoid duplication.
  const sortedTranslationEntries = Object.entries(translationsByLang)
    .filter(([lang]) => lang !== entry.language_code)
    .sort(([a], [b]) => {
      if (a === language) return -1;
      if (b === language) return 1;
      return 0;
    });

  // Mongolian term for the vertical script accent (native MN entry OR has MN translation)
  const mnTerm =
    entry.language_code === "mn"
      ? entry.term
      : (translationsByLang["mn"]?.[0]?.translated_term ?? null);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-7xl px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <BookOpen className="h-4 w-4" />
          <Link
            href="/dictionary"
            className="hover:text-foreground transition-colors"
          >
            Dictionary
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">
            {entry.term}
          </span>
        </div>

        <div className="flex gap-4 xl:gap-8 justify-center">
          {/* MN vertical script accent — shown when a Mongolian term is available */}
          {mnTerm && (
            <div className="hidden xl:flex items-start pt-3 w-7 flex-shrink-0 select-none">
              <span
                className="text-[13px] font-bold text-violet-400/50 tracking-widest"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  letterSpacing: "0.18em",
                }}
                title={`Mongolian: ${mnTerm}`}
              >
                {mnScript || mnTerm}
              </span>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 max-w-3xl space-y-6">
            {/* Title + Meta */}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-foreground">
                  {displayTranslation ? displayTranslation.translated_term : entry.term}
                </h1>
                {displayTranslation && (
                  <span className="text-lg text-muted-foreground font-normal">
                    {entry.term}
                  </span>
                )}
                <StatusBadge status={entry.status} />
                <Badge variant="outline" className="text-xs">
                  {LANG_LABELS[entry.language_code] || entry.language_code}
                </Badge>
              </div>
              {entry.reading && (
                <p className="text-lg text-muted-foreground mt-1">
                  {entry.reading}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <Link
                  href={`/profile/${entry.author.user_name}`}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={entry.author.avatar_url} />
                    <AvatarFallback className="text-[10px]">
                      {entry.author.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{entry.author.display_name}</span>
                </Link>
                <span>·</span>
                <span>Updated {formatDate(entry.updated_at)}</span>
                <span>·</span>
                <span>{entry.views} views</span>
              </div>
            </div>

            {/* Rejection notice */}
            {entry.status === "rejected" && latestRejection && (
              <Card className="border-red-500/30 bg-red-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">
                        Entry Rejected
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {latestRejection.reason || "No reason provided."}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        By {latestRejection.moderator} on{" "}
                        {formatDate(latestRejection.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {entry.status === "approved" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    router.push(`/dictionary/${entry.slug}/suggest-edit`)
                  }
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Suggest Edit
                </Button>
              )}
              {isOwner && entry.status === "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    router.push(`/dictionary/create?edit=${entry.slug}`)
                  }
                >
                  <FileEdit className="h-3.5 w-3.5 mr-1.5" />
                  Edit Draft
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleShare}
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Share
              </Button>
              <Button
                variant={isSaved ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={handleSave}
              >
                <Bookmark
                  className={`h-3.5 w-3.5 mr-1.5 ${isSaved ? "fill-current" : ""}`}
                />
                {isSaved ? "Saved" : "Save"}
              </Button>
              {entry.status === "approved" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleCreateFlashcard}
                  disabled={savingFlashcard}
                >
                  {savingFlashcard ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Flashcard
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
              >
                <Flag className="h-3.5 w-3.5 mr-1.5" />
                Report
              </Button>
            </div>

            {/* Tags */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* Tabbed Content */}
            <Tabs defaultValue="definition" className="w-full">
              <TabsList className="bg-muted/50 mb-4">
                <TabsTrigger value="definition" className="text-xs gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Definition
                </TabsTrigger>
                <TabsTrigger value="translations" className="text-xs gap-1.5">
                  <Languages className="h-3.5 w-3.5" />
                  Translations ({translations.length})
                </TabsTrigger>
                <TabsTrigger value="examples" className="text-xs gap-1.5">
                  <MessageSquareQuote className="h-3.5 w-3.5" />
                  Examples ({examples.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  History ({revisions.length})
                </TabsTrigger>
              </TabsList>

              {/* --- Definition Tab --- */}
              <TabsContent value="definition" className="space-y-4">
                {displayTranslation?.explanation ? (
                  <>
                    <section>
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary rounded-full" />
                        {LANG_LABELS[language] || language}
                      </h2>
                      <p className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {displayTranslation.explanation}
                      </p>
                    </section>
                    <Separator />
                    <section>
                      <h2 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                        <span className="w-1 h-4 bg-muted-foreground/40 rounded-full" />
                        Original ({LANG_LABELS[entry.language_code] || entry.language_code})
                      </h2>
                      <p className="text-[15px] text-muted-foreground/70 leading-relaxed whitespace-pre-wrap">
                        {entry.definition}
                      </p>
                    </section>
                  </>
                ) : (
                  <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full" />
                      Definition
                    </h2>
                    <p className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {entry.definition}
                    </p>
                    {displayTranslation && !displayTranslation.explanation && (
                      <p className="text-xs text-muted-foreground mt-4 italic">
                        No {LANG_LABELS[language] || language} explanation available yet.
                      </p>
                    )}
                  </section>
                )}
              </TabsContent>

              {/* --- Translations Tab --- */}
              <TabsContent value="translations" className="space-y-6">
                {/* Original / canonical entry — always first */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    {LANG_LABELS[entry.language_code] || entry.language_code}
                    <Badge variant="outline" className="text-[10px] normal-case tracking-normal ml-1">original</Badge>
                  </h3>
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <p className="font-medium text-foreground">{entry.term}</p>
                      <p className="text-sm text-muted-foreground mt-1">{entry.definition}</p>
                    </CardContent>
                  </Card>
                </section>

                {sortedTranslationEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No translations available yet.
                  </p>
                ) : (
                  sortedTranslationEntries.map(([lang, items]) => (
                    <section key={lang}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        {LANG_LABELS[lang] || lang}
                      </h3>
                      <div className="space-y-3">
                        {items.map((tr) => (
                          <Card key={tr.id} className="border-border/40">
                            <CardContent className="p-4">
                              <p className="font-medium text-foreground">
                                {tr.translated_term}
                              </p>
                              {tr.explanation && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {tr.explanation}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Added {formatDate(tr.created_at)}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </section>
                  ))
                )}
              </TabsContent>

              {/* --- Examples Tab --- */}
              <TabsContent value="examples" className="space-y-4">
                {examples.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No examples available yet.
                  </p>
                ) : (
                  examples.map((ex) => (
                    <Card key={ex.id} className="border-border/40">
                      <CardContent className="p-4">
                        <p className="text-[15px] text-foreground leading-relaxed">
                          {ex.example_text}
                        </p>
                        {ex.context && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {ex.context}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          {ex.source && <span>Source: {ex.source}</span>}
                          <Badge variant="outline" className="text-[10px]">
                            {LANG_LABELS[ex.language_code] || ex.language_code}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* --- History Tab --- */}
              <TabsContent value="history" className="space-y-1">
                {revisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No revision history available.
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
                                Revision {rev.revision_number}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {rev.status.replace("_", " ")}
                              </Badge>
                            </div>
                            {rev.change_summary && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {rev.change_summary}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              by {rev.author} · {formatDate(rev.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[320px] space-y-6 sticky top-8 h-fit">
            {/* Related Content */}
            {relatedArticles.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3 uppercase text-muted-foreground">
                  <Newspaper className="h-4 w-4" />
                  Related Content
                </h3>
                <Card className="border-border/40">
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
                                <Badge
                                  key={t}
                                  variant="secondary"
                                  className="text-[10px] font-normal px-1.5 py-0"
                                >
                                  #{t}
                                </Badge>
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
                <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3 uppercase text-muted-foreground">
                  <LinkIcon className="h-4 w-4" />
                  Related Terms
                </h3>
                <Card className="border-border/40">
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
                          <Badge variant="outline" className="text-[10px]">
                            {LANG_LABELS[related.language_code] ||
                              related.language_code}
                          </Badge>
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
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3 uppercase text-muted-foreground">
                <FileText className="h-4 w-4" />
                Entry Info
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={entry.status} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Language</span>
                    <span className="font-medium">
                      {LANG_LABELS[entry.language_code] || entry.language_code}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Views</span>
                    <span className="font-medium">{entry.views}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Saves</span>
                    <span className="font-medium">{entry.saves}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Translations</span>
                    <span className="font-medium">{translations.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Examples</span>
                    <span className="font-medium">{examples.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
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
                <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3 uppercase text-muted-foreground">
                  <Flag className="h-4 w-4" />
                  Moderation History
                </h3>
                <Card className="border-border/40">
                  <CardContent className="p-0">
                    {moderationActions.map((action, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 border-b border-border/20 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          {action.action === "approve" ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {action.action}ed
                          </span>
                        </div>
                        {action.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {action.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          by {action.moderator} ·{" "}
                          {formatDate(action.created_at)}
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
