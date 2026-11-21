"use client";

import { useRef, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormActions, FormAlert, FormSection } from "@/components/common/Form";
import { categoryLabel } from "@/components/competition/EntryList";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import {
  COMPETITION_KINDS,
  COMPETITION_STATUSES,
  type CompetitionDetail,
  type CompetitionKind,
  type CompetitionStatus,
  type LocalizedText,
} from "@/lib/types/competition";

const LANGS = ["mn", "en", "ja"] as const;
type Lang = (typeof LANGS)[number];
const CATEGORY_RE = /^[a-z0-9_-]+$/;
const DATE_FIELDS = ["signup_opens_at", "signup_closes_at", "starts_at", "ends_at"] as const;
type DateField = (typeof DATE_FIELDS)[number];

/** ISO → value for <input type="datetime-local"> in the organizer's local time. */
function isoToLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const localToIso = (v: string) => (v ? new Date(v).toISOString() : null);

/** Body for POST /api/competitions (create) or PUT /api/competitions/[slug] (edit). */
export type CompetitionFormBody = Record<string, unknown>;

/**
 * Create / edit a competition (organizers). Texts per language in tabs (mn required), cover via the
 * existing Cloudinary upload, categories as removable chips, dates in local time.
 */
export function CompetitionForm({
  initial,
  submitting,
  error,
  onSubmit,
}: {
  /** Absent = create (starts as draft); present = edit, including status. */
  initial?: CompetitionDetail;
  submitting: boolean;
  error?: string | null;
  onSubmit: (body: CompetitionFormBody) => void;
}) {
  const { t } = useTranslation();
  const editing = Boolean(initial);

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [kind, setKind] = useState<CompetitionKind>(initial?.kind ?? "bot");
  const [status, setStatus] = useState<CompetitionStatus>(initial?.status ?? "draft");
  const [texts, setTexts] = useState<Record<"title" | "summary" | "rules", LocalizedText>>({
    title: { ...(initial?.i18n.title ?? {}) },
    summary: { ...(initial?.i18n.summary ?? {}) },
    rules: { ...(initial?.i18n.rules ?? {}) },
  });
  const [lang, setLang] = useState<Lang>("mn");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(initial?.categories ?? []);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [maxTeamSize, setMaxTeamSize] = useState(String(initial?.max_team_size ?? 3));
  const [dates, setDates] = useState<Record<DateField, string>>(() =>
    Object.fromEntries(DATE_FIELDS.map((f) => [f, isoToLocal(initial?.[f])])) as Record<DateField, string>,
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const setText = (field: "title" | "summary" | "rules", value: string) =>
    setTexts((prev) => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));
  const hasText = (l: Lang) => Boolean(texts.title[l] || texts.summary[l] || texts.rules[l]);

  const addCategory = () => {
    const value = newCategory.trim().toLowerCase();
    if (!value) return;
    if (!CATEGORY_RE.test(value)) {
      setCategoryError(t("competition.manage.form.invalidCategory"));
      return;
    }
    setCategories((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setNewCategory("");
    setCategoryError(null);
  };

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { secureUrl } = await uploadImageToCloudinary(file);
      setCoverUrl(secureUrl);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!texts.title.mn?.trim()) {
      setLang("mn");
      setLocalError(t("competition.manage.form.mnRequired"));
      return;
    }
    setLocalError(null);
    const clean = (x: LocalizedText) => Object.fromEntries(Object.entries(x).filter(([, v]) => v && v.trim())) as LocalizedText;
    onSubmit({
      slug: slug.trim(),
      kind,
      ...(editing ? { status } : {}),
      title: clean(texts.title),
      summary: clean(texts.summary),
      rules: clean(texts.rules),
      cover_url: coverUrl || null,
      categories,
      max_team_size: Number(maxTeamSize),
      ...Object.fromEntries(DATE_FIELDS.map((f) => [f, localToIso(dates[f])])),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <FormSection title={t("competition.manage.form.basics")}>
        <Field label={t("competition.manage.form.slug")} htmlFor="c-slug" required hint={t("competition.manage.form.slugHint")}>
          <Input id="c-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("competition.manage.form.kind")} htmlFor="c-kind">
            <Select value={kind} onValueChange={(v) => setKind(v as CompetitionKind)}>
              <SelectTrigger id="c-kind" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMPETITION_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>{t(`competition.kind.${k}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {editing && (
            <Field label={t("competition.manage.form.status")} htmlFor="c-status">
              <Select value={status} onValueChange={(v) => setStatus(v as CompetitionStatus)}>
                <SelectTrigger id="c-status" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPETITION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`competition.status.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
      </FormSection>

      <FormSection title={t("competition.manage.form.texts")} description={t("competition.manage.form.textsHint")}>
        <Tabs value={lang} onValueChange={(v) => setLang(v as Lang)}>
          <TabsList>
            {LANGS.map((l) => (
              <TabsTrigger key={l} value={l} className="gap-1.5 px-4 uppercase">
                {l}
                {hasText(l) && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Field label={t("competition.manage.form.title")} htmlFor="c-title" required={lang === "mn"}>
          <Input id="c-title" value={texts.title[lang] ?? ""} onChange={(e) => setText("title", e.target.value)} maxLength={160} />
        </Field>
        <Field label={t("competition.manage.form.summary")} htmlFor="c-summary">
          <Textarea id="c-summary" rows={2} value={texts.summary[lang] ?? ""} onChange={(e) => setText("summary", e.target.value)} />
        </Field>
        <Field label={t("competition.manage.form.rules")} htmlFor="c-rules" hint={t("competition.manage.form.rulesHint")}>
          <Textarea id="c-rules" rows={10} className="font-mono text-sm" value={texts.rules[lang] ?? ""} onChange={(e) => setText("rules", e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title={t("competition.manage.form.cover")}>
        {coverUrl ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="" className="aspect-[3/1] w-full rounded-lg border object-cover" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <ImagePlus /> {t("competition.manage.form.replaceCover")}
              </Button>
              <Button type="button" variant="destructive-soft" size="sm" onClick={() => setCoverUrl("")}>
                <Trash2 /> {t("competition.manage.form.removeCover")}
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {uploading ? t("competition.manage.form.uploading") : t("competition.manage.form.uploadCover")}
          </Button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadCover(e.target.files?.[0])} />
        {uploadError && <FormAlert>{uploadError}</FormAlert>}
      </FormSection>

      <FormSection title={t("competition.manage.form.categories")} description={t("competition.manage.form.categoriesHint")}>
        <div className="flex flex-wrap gap-1.5" aria-live="polite">
          {categories.map((c) => (
            <span key={c} className="glass inline-flex h-8 items-center gap-1 rounded-full pl-3 pr-1 text-[13px] font-medium">
              {categoryLabel(c)}
              <button
                type="button"
                aria-label={`${t("common.delete")} ${c}`}
                onClick={() => setCategories((prev) => prev.filter((x) => x !== c))}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
        <Field label={t("competition.manage.form.categories")} htmlFor="c-category" error={categoryError ?? undefined}>
          <div className="flex gap-2">
            <Input
              id="c-category"
              value={newCategory}
              placeholder={t("competition.manage.form.categoryPlaceholder")}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addCategory}>{t("competition.manage.form.addCategory")}</Button>
          </div>
        </Field>
        <Field label={t("competition.manage.form.teamSize")} htmlFor="c-team-size" className="max-w-40">
          <Input id="c-team-size" type="number" min={1} max={50} value={maxTeamSize} onChange={(e) => setMaxTeamSize(e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title={t("competition.manage.form.dates")} description={t("competition.manage.form.datesHint")}>
        <div className="grid gap-5 sm:grid-cols-2">
          {DATE_FIELDS.map((f) => {
            const labelKey = { signup_opens_at: "signupOpens", signup_closes_at: "signupCloses", starts_at: "startsAt", ends_at: "endsAt" }[f];
            return (
              <Field key={f} label={t(`competition.manage.form.${labelKey}`)} htmlFor={`c-${f}`}>
                <Input id={`c-${f}`} type="datetime-local" value={dates[f]} onChange={(e) => setDates((prev) => ({ ...prev, [f]: e.target.value }))} />
              </Field>
            );
          })}
        </div>
      </FormSection>

      {(localError || error) && <FormAlert>{localError || error}</FormAlert>}
      <FormActions>
        <Button type="submit" disabled={submitting || uploading}>
          {submitting
            ? t(editing ? "competition.manage.form.saving" : "competition.manage.form.creating")
            : t(editing ? "competition.manage.form.save" : "competition.manage.form.create")}
        </Button>
      </FormActions>
    </form>
  );
}
