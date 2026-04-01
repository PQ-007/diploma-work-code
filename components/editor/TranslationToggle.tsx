import React from "react";
import { Button } from "@/components/ui/button";
import { Languages, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useArticleEditor } from "@/app/article/create/ArticleEditorContext";
import { LANGUAGE_NAMES } from "@/lib/validation/translation";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * TranslationStatus component shows visual indicators for translation completeness
 */
const TranslationStatus: React.FC<{
  lang: "mn" | "en" | "jp";
  hasContent: boolean;
  completeness: number;
  isActive: boolean;
  errors: string[];
}> = ({ lang, hasContent, completeness, isActive, errors }) => {
  const { t } = useLanguage();
  const getStatusIcon = () => {
    if (completeness >= 80) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }

    if (hasContent) {
      return (
        <div className="relative">
          <Circle className="w-4 h-4 text-muted-foreground" />
          <div
            className="absolute inset-0.5 rounded-full bg-yellow-500"
            style={{
              clipPath: `polygon(0 0, ${completeness}% 0, ${completeness}% 100%, 0 100%)`,
            }}
          />
        </div>
      );
    }

    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (errors.length > 0) return t("articles.create.notAdded");
    if (completeness >= 80) return t("articles.create.complete");
    if (hasContent) return `${completeness}%`;
    return t("articles.create.empty");
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{lang.toUpperCase()}</span>
        <span className="text-xs text-muted-foreground">
          {LANGUAGE_NAMES[lang]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{getStatusText()}</span>
        {getStatusIcon()}
        {isActive && <div className="w-2 h-2 rounded-full bg-primary ml-1" />}
      </div>
    </div>
  );
};

/**
 * Enhanced TranslationToggle component with visual status indicators
 */
export const TranslationToggle: React.FC = () => {
  const { t } = useLanguage();
  const {
    contentLang,
    langMenuOpen,
    setLangMenuOpen,
    handleLanguageSwitch,
    getTranslationStatus,
    translationSyncInProgress,
    translationCompleteness,
  } = useArticleEditor();

  const languages: Array<"mn" | "en" | "jp"> = ["mn", "en", "jp"];

  // Calculate overall translation status
  const completedCount = translationCompleteness.filter(
    (tc) => tc.completeness >= 80,
  ).length;
  const hasContentCount = translationCompleteness.filter(
    (tc) => tc.hasContent,
  ).length;

  const getButtonVariant = () => {
    if (translationSyncInProgress) return "secondary";
    if (completedCount === 3) return "default";
    if (hasContentCount > 1) return "secondary";
    return "outline";
  };

  const getButtonIconColor = () => {
    if (completedCount === 3) return "text-green-500";
    if (hasContentCount > 1) return "text-yellow-500";
    return "";
  };

  return (
    <div className="relative">
      <Button
        variant={getButtonVariant()}
        size="icon"
        className="h-10 w-10 rounded-full relative"
        onClick={() => setLangMenuOpen(!langMenuOpen)}
        disabled={translationSyncInProgress}
        aria-label={t("articles.create.switchLanguage", { lang: contentLang })}
      >
        <Languages size={16} className={getButtonIconColor()} />

        {/* Status indicator badge */}
        {completedCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">
              {completedCount}
            </span>
          </div>
        )}

        {/* Sync indicator */}
        {translationSyncInProgress && (
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
      </Button>

      {langMenuOpen && (
        <div className="absolute right-14 top-1/2 -translate-y-1/2 z-20 w-64 rounded-lg border border-border/80 bg-card/95 shadow-lg shadow-black/15 py-2 px-2">
          {/* Header */}
          <div className="px-3 py-2 border-b border-border/60 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("articles.create.translations")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("articles.create.translationProgress", {
                  completed: completedCount,
                  total: languages.length,
                })}
              </span>
            </div>
          </div>

          {/* Language options */}
          <div className="flex flex-col gap-1">
            {languages.map((lang) => {
              const status = getTranslationStatus(lang);
              const completeness = translationCompleteness.find(
                (tc) => tc.language === lang,
              );

              return (
                <button
                  key={lang}
                  className={`flex items-center justify-between rounded-md px-3 py-3 text-sm transition-colors ${
                    contentLang === lang
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleLanguageSwitch(lang)}
                  disabled={translationSyncInProgress}
                  aria-label={t("articles.create.switchToLanguage", {
                    language: LANGUAGE_NAMES[lang],
                  })}
                >
                  <TranslationStatus
                    lang={lang}
                    hasContent={status.hasContent}
                    completeness={completeness?.completeness || 0}
                    isActive={contentLang === lang}
                    errors={status.errors}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationToggle;
