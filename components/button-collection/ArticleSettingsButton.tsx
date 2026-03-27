"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings2, Plus, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Lang = "en" | "jp" | "mn";

type TranslationInfo = {
  lang: string;
  title?: string;
  subTitle?: string;
};

type ArticleSettingsButtonProps = {
  title?: string;
  subTitle?: string;
  status?: string;
  language?: Lang;
  tags?: string[];
  wordCount?: number;
  views?: number;
  lastEdited?: string;
  createdAt?: string;
  publishedAt?: string;
  likes?: number;
  comments?: number;
  translations?: TranslationInfo[];
  seriesName?: string | null;
  isSerial?: boolean;
  onSaveTranslations?: (translations: TranslationInfo[]) => void;
  onSettingsChange?: (settings: {
    isSerial: boolean;
    seriesName?: string | null;
    baseLangCode?: Lang;
  }) => void;
};

const LANGS: Lang[] = ["en", "jp", "mn"];
const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  jp: "Japanese",
  mn: "Mongolian",
};

function normalize(
  baseLang: Lang,
  title: string,
  subTitle: string,
  translations: TranslationInfo[],
) {
  const filtered = translations.filter((t) => LANGS.includes(t.lang as Lang));

  const hasBase = filtered.some((t) => t.lang === baseLang);
  const withBase = hasBase
    ? filtered
    : [{ lang: baseLang, title, subTitle }, ...filtered];

  const seen = new Set<string>();
  const deduped: TranslationInfo[] = [];
  for (const t of withBase) {
    if (seen.has(t.lang)) continue;
    seen.add(t.lang);
    deduped.push(t);
  }

  return deduped;
}

export function ArticleSettingsButton({
  title = "Untitled article",
  subTitle = "",
  status = "draft",
  language = "en",
  tags = [],
  wordCount,
  views,
  lastEdited,
  createdAt,
  publishedAt,
  likes,
  comments,
  translations = [],
  seriesName,
  isSerial: initialIsSerial = false,
  onSaveTranslations,
  onSettingsChange,
}: ArticleSettingsButtonProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const initial = useMemo(
    () => normalize(language, title, subTitle, translations),
    [language, title, subTitle, translations],
  );

  const [draftTranslations, setDraftTranslations] =
    useState<TranslationInfo[]>(initial);

  const [activeLang, setActiveLang] = useState<Lang>(language);
  const [isSerial, setIsSerial] = useState(initialIsSerial);
  const [serialOptions, setSerialOptions] = useState<string[]>([
    "Season 1",
    "Season 2",
  ]);
  const [serialInput, setSerialInput] = useState("");
  const [selectedSerial, setSelectedSerial] = useState<string | null>(
    seriesName || null,
  );
  const [originalSettings, setOriginalSettings] = useState({
    isSerial: initialIsSerial,
    seriesName,
    language,
  });
  const prevOpen = useRef(open);

  useEffect(() => {
    if (prevOpen.current && !open) {
      const reset = normalize(language, title, subTitle, translations);
      setDraftTranslations(reset);
      setActiveLang(language);
      setIsSerial(originalSettings.isSerial);
      setSelectedSerial(originalSettings.seriesName || null);
      setSerialInput("");
    }
    prevOpen.current = open;
  }, [open, language, title, subTitle, translations, originalSettings]);

  useEffect(() => {
    if (!isSerial) {
      setSelectedSerial(null);
    }
  }, [isSerial]);

  const existingLangs = useMemo(() => {
    return new Set<Lang>(
      draftTranslations
        .map((t) => t.lang)
        .filter((l): l is Lang => LANGS.includes(l as Lang))
        .map((l) => l as Lang),
    );
  }, [draftTranslations]);

  const visibleLangs = useMemo(() => {
    const seen = new Set<Lang>();
    const ordered: Lang[] = [];
    for (const lang of draftTranslations
      .map((t) => t.lang)
      .filter((l): l is Lang => LANGS.includes(l as Lang))) {
      if (seen.has(lang)) continue;
      seen.add(lang);
      ordered.push(lang);
    }
    return ordered;
  }, [draftTranslations]);

  useEffect(() => {
    if (visibleLangs.length === 0) return;
    if (!visibleLangs.includes(activeLang)) {
      setActiveLang(visibleLangs[0]);
    }
  }, [visibleLangs, activeLang]);

  const remainingLangs = useMemo(() => {
    return LANGS.filter((l) => !existingLangs.has(l));
  }, [existingLangs]);

  const activeTranslation = useMemo(() => {
    return draftTranslations.find((t) => t.lang === activeLang);
  }, [draftTranslations, activeLang]);

  const upsert = (lang: Lang, field: "title" | "subTitle", value: string) => {
    setDraftTranslations((prev) => {
      const idx = prev.findIndex((t) => t.lang === lang);
      if (idx === -1) {
        return [...prev, { lang, [field]: value }];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addTranslation = (langToAdd: Lang) => {
    setDraftTranslations((prev) => {
      if (prev.some((t) => t.lang === langToAdd)) return prev;
      return [...prev, { lang: langToAdd }];
    });
    setActiveLang(langToAdd);
  };

  const handleAddSerial = () => {
    const next = serialInput.trim();
    if (!next) return;
    if (serialOptions.includes(next)) {
      setSelectedSerial(next);
      setSerialInput("");
      return;
    }
    setSerialOptions((prev) => [...prev, next]);
    setSelectedSerial(next);
    setSerialInput("");
  };

  const hasSettingsChanged = () => {
    return (
      isSerial !== originalSettings.isSerial ||
      selectedSerial !== originalSettings.seriesName ||
      language !== originalSettings.language
    );
  };

  const handleSaveAll = () => {
    // Save translations
    onSaveTranslations?.(draftTranslations);

    // Save settings if changed
    if (hasSettingsChanged() && onSettingsChange) {
      onSettingsChange({
        isSerial,
        seriesName: selectedSerial,
        baseLangCode: language,
      });

      // Update original settings to new state
      setOriginalSettings({
        isSerial,
        seriesName: selectedSerial,
        language,
      });
    }

    setOpen(false);
  };

  const statusTone =
    status === "published"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : status === "archived"
        ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"
        : "bg-amber-500/15 text-amber-600 dark:text-amber-400";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          aria-label={t("articles.create.articleSettings")}
        >
          <Settings2 size={16} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("articles.create.articleSettings")}</DialogTitle>
          <DialogDescription>
            {t("articles.create.settingsDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 pl-6 border-b ">
          <div className="min-w-0">
            <DialogTitle className="text-lg truncate">
              {t("articles.create.articleSettings")}
            </DialogTitle>
          </div>
        </div>

        <div className="p-6 pt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {visibleLangs.map((l) => {
                const exists = existingLangs.has(l);
                const isActive = activeLang === l;

                return (
                  <Button
                    key={l}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`h-8 rounded-full px-3 ${isActive ? "ring-1 ring-border" : ""}`}
                    onClick={() => setActiveLang(l)}
                  >
                    <span className="text-xs uppercase">{l}</span>
                  </Button>
                );
              })}
            </div>

            {remainingLangs.length > 0 ? (
              <div className="flex items-center gap-2">
                <Select onValueChange={(v) => addTranslation(v as Lang)}>
                  <SelectTrigger className="h-8 w-auto rounded-full">
                    <SelectValue placeholder={t("articles.create.addTranslation")} />
                  </SelectTrigger>
                  <SelectContent>
                    {remainingLangs.map((l) => (
                      <SelectItem key={l} value={l}>
                        {LANG_LABEL[l]} ({l})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Badge variant="secondary" className="rounded-full">
                {t("articles.create.allTranslationsAdded")}
              </Badge>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 space-y-3">
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{t("articles.create.series")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("articles.create.seriesDescription")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {t("articles.create.serial")}
                    </span>
                    <Switch checked={isSerial} onCheckedChange={setIsSerial} />
                  </div>
                </div>

                <Collapsible open={isSerial}>
                  <CollapsibleContent className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {t("articles.create.selectEntry")}
                      </p>
                      <Select
                        value={selectedSerial ?? ""}
                        onValueChange={(v) => setSelectedSerial(v)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder={t("articles.create.chooseOrAddSeries")} />
                        </SelectTrigger>
                        <SelectContent>
                          {serialOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={serialInput}
                        onChange={(e) => setSerialInput(e.target.value)}
                        placeholder={t("articles.create.customSeriesName")}
                        className="sm:flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddSerial}
                      >
                        {t("articles.create.add")}
                      </Button>
                    </div>

                    {selectedSerial && (
                      <p className="text-xs text-muted-foreground">
                        {t("articles.create.selectedSeries", { series: selectedSerial })}
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {t("articles.create.languageTranslation", { language: LANG_LABEL[activeLang] })}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase">
                    {activeLang}
                  </p>
                </div>

                {!activeTranslation ? (
                  <div className="rounded-lg border border-dashed p-4">
                    <p className="text-sm font-medium">{t("articles.create.notAddedYet")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("articles.create.addTranslationHelp")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">{t("articles.create.title")}</p>
                      <Input
                        value={activeTranslation.title ?? ""}
                        onChange={(e) =>
                          upsert(activeLang, "title", e.target.value)
                        }
                        placeholder={t("articles.create.translatedTitle")}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">{t("articles.create.subtitle")}</p>
                      <Input
                        value={activeTranslation.subTitle ?? ""}
                        onChange={(e) =>
                          upsert(activeLang, "subTitle", e.target.value)
                        }
                        placeholder={t("articles.create.translatedSubtitle")}
                      />
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {t("articles.create.translationSaveFlow")}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-2">
                <p className="text-sm font-semibold">{t("articles.create.tags")}</p>
                {tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="rounded-full"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("articles.create.noTagsSet")}</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3 ">
              <div className="p-2 pl-4 text-xl items-center space-between border rounded-lg bg-card">
                {t("articles.create.stats")}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{t("articles.create.wordCount")}</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {wordCount ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{t("articles.create.views")}</p>
                  <p className="mt-2 text-2xl font-semibold">{views ?? "—"}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{t("articles.create.likes")}</p>
                  <p className="mt-2 text-2xl font-semibold">{likes ?? "—"}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{t("articles.create.comments")}</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {comments ?? "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold">{t("articles.create.timestamps")}</p>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{t("articles.create.lastEdited")}</p>
                  <p className="text-sm font-medium text-right">
                    {lastEdited || "—"}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{t("articles.create.created")}</p>
                  <p className="text-sm font-medium text-right">
                    {createdAt || "—"}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{t("articles.create.published")}</p>
                  <p className="text-sm font-medium text-right">
                    {publishedAt || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center text-xs text-muted-foreground">
              {hasSettingsChanged() && (
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  {t("articles.create.settingsChanged")}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {t("articles.create.close")}
              </Button>
              <Button onClick={handleSaveAll}>
                {hasSettingsChanged() ? t("articles.create.saveSettings") : t("articles.create.save")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ArticleSettingsButton;
