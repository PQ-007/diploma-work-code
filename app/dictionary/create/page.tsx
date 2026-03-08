"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Send,
  Save,
  Languages,
  MessageSquareQuote,
  X,
} from "lucide-react";

// --- Types ---
interface TranslationInput {
  language_code: string;
  translated_term: string;
  explanation: string;
}

interface ExampleInput {
  example_text: string;
  source: string;
  context: string;
  language_code: string;
}

interface DuplicateMatch {
  id: number;
  term: string;
  slug: string;
  language_code: string;
  status: string;
  similarity: number | null;
}

const LANG_OPTIONS = [
  { value: "mn", label: "Монгол" },
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];

export default function DictionaryCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const editSlug = searchParams.get("edit");
  const isEditMode = !!editSlug;

  // Form state
  const [term, setTerm] = useState("");
  const [reading, setReading] = useState("");
  const [languageCode, setLanguageCode] = useState("en");
  const [definition, setDefinition] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [translations, setTranslations] = useState<TranslationInput[]>([]);
  const [examples, setExamples] = useState<ExampleInput[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [authLoading, user, router]);

  // Load entry data when in edit mode
  const loadEntry = useCallback(async () => {
    if (!editSlug) return;
    setLoadingEntry(true);
    try {
      const res = await fetch(
        `/api/dictionary/${encodeURIComponent(editSlug)}`,
      );
      if (!res.ok) {
        setError("Entry not found or you don't have permission to edit it.");
        return;
      }
      const data = await res.json();
      const entry = data.entry;
      if (entry.status !== "draft") {
        setError("Only draft entries can be edited.");
        return;
      }
      setTerm(entry.term);
      setReading(entry.reading || "");
      setLanguageCode(entry.language_code);
      setDefinition(entry.definition);
      setTags(entry.tags || []);
      setTranslations(
        (data.translations || []).map(
          (t: {
            language_code: string;
            translated_term: string;
            explanation: string | null;
          }) => ({
            language_code: t.language_code,
            translated_term: t.translated_term,
            explanation: t.explanation || "",
          }),
        ),
      );
      setExamples(
        (data.examples || []).map(
          (e: {
            example_text: string;
            source: string | null;
            context: string | null;
            language_code: string;
          }) => ({
            example_text: e.example_text,
            source: e.source || "",
            context: e.context || "",
            language_code: e.language_code,
          }),
        ),
      );
    } catch {
      setError("Failed to load entry.");
    } finally {
      setLoadingEntry(false);
    }
  }, [editSlug]);

  useEffect(() => {
    if (isEditMode) loadEntry();
  }, [isEditMode, loadEntry]);

  // Duplicate check (debounced on term change)
  useEffect(() => {
    if (!term.trim() || term.length < 2) {
      setDuplicates([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const res = await fetch("/api/dictionary/duplicate-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            term: term.trim(),
            language_code: languageCode,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setDuplicates(data.matches || []);
        }
      } catch {
        // ignore
      } finally {
        setCheckingDuplicates(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [term, languageCode]);

  // Tag handling
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/^#/, "");
      if (newTag && !tags.includes(newTag) && tags.length < 10) {
        setTags([...tags, newTag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Translation management
  const addTranslation = () => {
    setTranslations([
      ...translations,
      { language_code: "mn", translated_term: "", explanation: "" },
    ]);
  };

  const updateTranslation = (
    idx: number,
    field: keyof TranslationInput,
    value: string,
  ) => {
    const updated = [...translations];
    updated[idx] = { ...updated[idx], [field]: value };
    setTranslations(updated);
  };

  const removeTranslation = (idx: number) => {
    setTranslations(translations.filter((_, i) => i !== idx));
  };

  // Example management
  const addExample = () => {
    setExamples([
      ...examples,
      {
        example_text: "",
        source: "",
        context: "",
        language_code: languageCode,
      },
    ]);
  };

  const updateExample = (
    idx: number,
    field: keyof ExampleInput,
    value: string,
  ) => {
    const updated = [...examples];
    updated[idx] = { ...updated[idx], [field]: value };
    setExamples(updated);
  };

  const removeExample = (idx: number) => {
    setExamples(examples.filter((_, i) => i !== idx));
  };

  // Save / Submit
  const handleSave = async (submitForReview: boolean) => {
    setError(null);

    if (!term.trim()) {
      setError("Term is required.");
      return;
    }
    if (!definition.trim()) {
      setError("Definition is required.");
      return;
    }

    const setter = submitForReview ? setSubmitting : setSaving;
    setter(true);

    const payload = {
      term: term.trim(),
      reading: reading.trim() || null,
      language_code: languageCode,
      definition: definition.trim(),
      translations: translations.filter((t) => t.translated_term.trim()),
      examples: examples.filter((e) => e.example_text.trim()),
      tags,
      submit: submitForReview,
    };

    try {
      const url = isEditMode
        ? `/api/dictionary/${encodeURIComponent(editSlug!)}`
        : "/api/dictionary";
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save entry.");
        return;
      }

      const data = await res.json();
      router.push(`/dictionary/${data.slug || editSlug}`);
    } catch {
      setError("Failed to save entry. Please try again.");
    } finally {
      setter(false);
    }
  };

  if (authLoading || loadingEntry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-3xl px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <BookOpen className="h-4 w-4" />
          <Link
            href="/dictionary"
            className="hover:text-foreground transition-colors"
          >
            Dictionary
          </Link>
          <span>/</span>
          <span className="text-foreground">
            {isEditMode ? "Edit Draft" : "Create Entry"}
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {isEditMode ? "Edit Draft Entry" : "Create Dictionary Entry"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving || submitting}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving || submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Submit for Review
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-red-500/30 bg-red-500/5 mb-6">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-8">
          {/* === Basic Info === */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Basic Information
            </h2>

            {/* Term */}
            <div className="space-y-2">
              <Label htmlFor="term">Term *</Label>
              <Input
                id="term"
                placeholder="e.g. Machine Learning, 機械学習, Машин сургалт"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
              {/* Duplicate warnings */}
              {checkingDuplicates && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking for duplicates...
                </p>
              )}
              {duplicates.length > 0 && (
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-yellow-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Similar terms already exist:
                    </p>
                    <div className="space-y-1">
                      {duplicates.map((d) => (
                        <Link
                          key={d.id}
                          href={`/dictionary/${d.slug}`}
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <span className="font-medium">{d.term}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {d.language_code}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {d.status}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Reading */}
            <div className="space-y-2">
              <Label htmlFor="reading">
                Reading / Pronunciation (optional)
              </Label>
              <Input
                id="reading"
                placeholder="e.g. きかいがくしゅう"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For Japanese terms, enter the furigana/hiragana reading.
              </p>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>Primary Language *</Label>
              <Select value={languageCode} onValueChange={setLanguageCode}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANG_OPTIONS.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Definition */}
            <div className="space-y-2">
              <Label htmlFor="definition">Definition *</Label>
              <Textarea
                id="definition"
                placeholder="Write a clear, concise definition..."
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (max 10)</Label>
              <Input
                id="tags"
                placeholder="Type a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                disabled={tags.length >= 10}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs gap-1"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* === Translations === */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Translations
              </h2>
              <Button variant="outline" size="sm" onClick={addTranslation}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Translation
              </Button>
            </div>

            {translations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No translations added yet. Add translations in other languages.
              </p>
            ) : (
              <div className="space-y-4">
                {translations.map((tr, idx) => (
                  <Card key={idx} className="border-border/40">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Select
                          value={tr.language_code}
                          onValueChange={(v) =>
                            updateTranslation(idx, "language_code", v)
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LANG_OPTIONS.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTranslation(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Translated term"
                        value={tr.translated_term}
                        onChange={(e) =>
                          updateTranslation(
                            idx,
                            "translated_term",
                            e.target.value,
                          )
                        }
                      />
                      <Textarea
                        placeholder="Explanation (optional)"
                        value={tr.explanation}
                        onChange={(e) =>
                          updateTranslation(idx, "explanation", e.target.value)
                        }
                        className="min-h-[60px]"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* === Examples === */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5" />
                Examples
              </h2>
              <Button variant="outline" size="sm" onClick={addExample}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Example
              </Button>
            </div>

            {examples.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No examples added yet. Add usage examples to help learners.
              </p>
            ) : (
              <div className="space-y-4">
                {examples.map((ex, idx) => (
                  <Card key={idx} className="border-border/40">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Select
                          value={ex.language_code}
                          onValueChange={(v) =>
                            updateExample(idx, "language_code", v)
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LANG_OPTIONS.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeExample(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Example text / sentence"
                        value={ex.example_text}
                        onChange={(e) =>
                          updateExample(idx, "example_text", e.target.value)
                        }
                        className="min-h-[80px]"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Source (optional)"
                          value={ex.source}
                          onChange={(e) =>
                            updateExample(idx, "source", e.target.value)
                          }
                        />
                        <Input
                          placeholder="Context (optional)"
                          value={ex.context}
                          onChange={(e) =>
                            updateExample(idx, "context", e.target.value)
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Bottom action bar */}
          <div className="flex items-center justify-between pb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving || submitting}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={saving || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                Submit for Review
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
