"use client";

// Force dynamic rendering for pages using search params
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Languages, Loader2, MessageSquareQuote, Plus, Save, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Field, FormActions, FormAlert, FormSection } from "@/components/common/Form";
import { LanguageBadge } from "@/components/common/LanguageBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  LANG_OPTIONS,
  type DuplicateMatch,
  type ExampleInput,
  type TranslationInput,
} from "./dictionaryCreate.shared";

type Mode = "create" | "edit" | "suggest";

export default function DictionaryCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const f = (key: string) => t(`dictionary.form.${key}`);

  // ?edit=<slug> edits your own draft, ?suggest=<slug> proposes a change to a published entry.
  const editSlug = searchParams.get("edit");
  const suggestSlug = searchParams.get("suggest");
  const mode: Mode = suggestSlug ? "suggest" : editSlug ? "edit" : "create";
  const sourceSlug = suggestSlug || editSlug;
  const isEditMode = mode === "edit";

  // Form state
  const [entryId, setEntryId] = useState<number | null>(null);
  const [term, setTerm] = useState("");
  const [reading, setReading] = useState("");
  const languageCode = "en";
  const [definition, setDefinition] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [translations, setTranslations] = useState<TranslationInput[]>([]);
  const [examples, setExamples] = useState<ExampleInput[]>([]);
  const [changeSummary, setChangeSummary] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) router.push("/signin");
  }, [authLoading, user, router]);

  // Load the entry for edit / suggest mode
  const loadEntry = useCallback(async () => {
    if (!sourceSlug) return;
    setLoadingEntry(true);
    try {
      const res = await fetch(`/api/dictionary/${encodeURIComponent(sourceSlug)}`);
      if (!res.ok) {
        setError(f("notFound"));
        return;
      }
      const data = await res.json();
      const entry = data.entry;
      if (mode === "edit" && entry.status !== "draft") {
        setError(f("onlyDraft"));
        return;
      }
      if (mode === "suggest" && entry.status !== "approved") {
        setError(f("onlyApproved"));
        return;
      }
      setEntryId(entry.id);
      setTerm(entry.term);
      setReading(entry.reading || "");
      setDefinition(entry.definition);
      setTags(entry.tags || []);
      setTranslations(
        (data.translations || []).map((tr: { language_code: string; translated_term: string; explanation: string | null }) => ({
          language_code: tr.language_code,
          translated_term: tr.translated_term,
          explanation: tr.explanation || "",
        })),
      );
      setExamples(
        (data.examples || []).map((e: { example_text: string; source: string | null; context: string | null; language_code: string }) => ({
          example_text: e.example_text,
          source: e.source || "",
          context: e.context || "",
          language_code: e.language_code,
        })),
      );
    } catch {
      setError(f("saveFailed"));
    } finally {
      setLoadingEntry(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSlug, mode]);

  useEffect(() => {
    if (sourceSlug) loadEntry();
  }, [sourceSlug, loadEntry]);

  // Duplicate check (debounced on term change)
  useEffect(() => {
    if (mode !== "create" || !term.trim() || term.length < 2) {
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
  }, [term, languageCode, mode]);

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

  // Save / Submit / Suggest
  const handleSave = async (submitForReview: boolean) => {
    setError(null);
    const errs: Record<string, string> = {};
    if (!term.trim()) errs.term = f("termRequired");
    if (!definition.trim()) errs.definition = f("definitionRequired");
    if (mode === "suggest" && !changeSummary.trim()) errs.changeSummary = f("changeRequired");
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    const setter = submitForReview ? setSubmitting : setSaving;
    setter(true);

    const content = {
      term: term.trim(),
      reading: reading.trim() || null,
      language_code: languageCode,
      definition: definition.trim(),
      translations: translations.filter((tr) => tr.translated_term.trim()),
      examples: examples.filter((e) => e.example_text.trim()),
      tags,
    };

    try {
      const res =
        mode === "suggest"
          ? await fetch("/api/dictionary/propose-edit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ entry_id: entryId, ...content, change_summary: changeSummary.trim() }),
            })
          : await fetch(isEditMode ? `/api/dictionary/${encodeURIComponent(editSlug!)}` : "/api/dictionary", {
              method: isEditMode ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...content, submit: submitForReview }),
            });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || f("saveFailed"));
        return;
      }
      if (mode === "suggest") toast.success(f("suggestionSent"));
      router.push(`/dictionary/${data.slug || sourceSlug}`);
    } catch {
      setError(f("saveFailed"));
    } finally {
      setter(false);
    }
  };

  if (authLoading || loadingEntry) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  const busy = saving || submitting;
  const langSelect = (value: string, onChange: (v: string) => void) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-36">
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
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        className="!mb-1"
        title={f(mode === "suggest" ? "suggestTitle" : mode === "edit" ? "editTitle" : "createTitle")}
        subtitle={f(mode === "suggest" ? "suggestSubtitle" : "createSubtitle")}
      />

      {error && <FormAlert>{error}</FormAlert>}

      <FormSection title={f("basics")} description={f("language")}>
        <Field label={f("term")} htmlFor="term" required error={fieldErrors.term}>
          <Input id="term" placeholder={f("termPlaceholder")} value={term} onChange={(e) => setTerm(e.target.value)} />
          {checkingDuplicates && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              {f("checking")}
            </p>
          )}
          {duplicates.length > 0 && (
            <FormAlert tone="warning">
              <p className="mb-1.5 font-medium">{f("similar")}</p>
              <ul className="space-y-1">
                {duplicates.map((d) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <Link href={`/dictionary/${d.slug}`} className="font-medium text-foreground underline-offset-2 hover:underline">
                      {d.term}
                    </Link>
                    <LanguageBadge code={d.language_code} />
                  </li>
                ))}
              </ul>
            </FormAlert>
          )}
        </Field>

        <Field label={f("reading")} htmlFor="reading" hint={f("readingHint")}>
          <Input id="reading" placeholder="/ˌæplɪˈkeɪʃən/" value={reading} onChange={(e) => setReading(e.target.value)} />
        </Field>

        <Field label={f("definition")} htmlFor="definition" required error={fieldErrors.definition}>
          <Textarea
            id="definition"
            placeholder={f("definitionPlaceholder")}
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            className="min-h-32"
          />
        </Field>

        <Field label={f("tags")} htmlFor="tags" hint={f("tagsHint")}>
          <Input
            id="tags"
            placeholder={f("tagsPlaceholder")}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            disabled={tags.length >= 10}
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex h-7 items-center gap-1 rounded-md bg-secondary pl-2 pr-1 text-xs text-secondary-foreground">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`${f("remove")} ${tag}`}
                    className="flex size-5 items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Field>
      </FormSection>

      <FormSection
        title={<span className="inline-flex items-center gap-2"><Languages className="size-4 text-primary" />{f("translations")}</span>}
        description={f("translationsHint")}
        action={
          <Button variant="secondary" size="sm" onClick={addTranslation}>
            <Plus />
            <span className="hidden sm:inline">{f("addTranslation")}</span>
          </Button>
        }
      >
        {translations.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">{f("noTranslations")}</p>
        ) : (
          translations.map((tr, idx) => (
            <div key={idx} className="space-y-3 rounded-lg border bg-background/50 p-3">
              <div className="flex items-center justify-between gap-2">
                {langSelect(tr.language_code, (v) => updateTranslation(idx, "language_code", v))}
                <Button variant="ghost" size="icon-sm" aria-label={f("remove")} className="text-muted-foreground hover:text-destructive" onClick={() => removeTranslation(idx)}>
                  <Trash2 />
                </Button>
              </div>
              <Input placeholder={f("translatedTerm")} value={tr.translated_term} onChange={(e) => updateTranslation(idx, "translated_term", e.target.value)} />
              <Textarea placeholder={f("explanation")} value={tr.explanation} onChange={(e) => updateTranslation(idx, "explanation", e.target.value)} className="min-h-16" />
            </div>
          ))
        )}
      </FormSection>

      <FormSection
        title={<span className="inline-flex items-center gap-2"><MessageSquareQuote className="size-4 text-primary" />{f("examples")}</span>}
        description={f("examplesHint")}
        action={
          <Button variant="secondary" size="sm" onClick={addExample}>
            <Plus />
            <span className="hidden sm:inline">{f("addExample")}</span>
          </Button>
        }
      >
        {examples.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">{f("noExamples")}</p>
        ) : (
          examples.map((ex, idx) => (
            <div key={idx} className="space-y-3 rounded-lg border bg-background/50 p-3">
              <div className="flex items-center justify-between gap-2">
                {langSelect(ex.language_code, (v) => updateExample(idx, "language_code", v))}
                <Button variant="ghost" size="icon-sm" aria-label={f("remove")} className="text-muted-foreground hover:text-destructive" onClick={() => removeExample(idx)}>
                  <Trash2 />
                </Button>
              </div>
              <Textarea placeholder={f("exampleText")} value={ex.example_text} onChange={(e) => updateExample(idx, "example_text", e.target.value)} className="min-h-20" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder={f("source")} value={ex.source} onChange={(e) => updateExample(idx, "source", e.target.value)} />
                <Input placeholder={f("context")} value={ex.context} onChange={(e) => updateExample(idx, "context", e.target.value)} />
              </div>
            </div>
          ))
        )}
      </FormSection>

      {mode === "suggest" && (
        <FormSection title={f("changeSummary")}>
          <Field label={f("changeSummary")} htmlFor="change" required error={fieldErrors.changeSummary} className="[&>label]:sr-only">
            <Input id="change" placeholder={f("changeSummaryPlaceholder")} value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} />
          </Field>
        </FormSection>
      )}

      <FormActions>
        <Button variant="ghost" onClick={() => router.back()} disabled={busy} className="mr-auto">
          {f("cancel")}
        </Button>
        {mode === "suggest" ? (
          <Button onClick={() => handleSave(true)} disabled={busy}>
            {submitting ? <Loader2 className="animate-spin" /> : <Send />}
            {f("sendSuggestion")}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={busy}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {f("saveDraft")}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={busy}>
              {submitting ? <Loader2 className="animate-spin" /> : <Send />}
              {f("submit")}
            </Button>
          </>
        )}
      </FormActions>
    </div>
  );
}
