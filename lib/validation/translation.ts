/**
 * Translation validation and management utilities
 */

type ContentLang = "mn" | "en" | "jp";

export interface PartialTranslation {
  title?: string;
  subtitle?: string;
  body?: string;
  lastModified?: Date;
  wordCount?: number;
  isComplete?: boolean;
}

export interface TranslationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TranslationCompleteness {
  language: ContentLang;
  completeness: number; // 0-100 percentage
  wordCount: number;
  lastModified: Date | null;
  hasTitle: boolean;
  hasContent: boolean;
}

/**
 * Validates a single translation for required fields and content quality
 */
export const validateTranslation = (
  translation: PartialTranslation,
): TranslationValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!translation.title?.trim()) {
    errors.push("Title is required for each language");
  }

  // Length validations
  if (translation.title && translation.title.length > 200) {
    errors.push("Title must be under 200 characters");
  }

  if (translation.subtitle && translation.subtitle.length > 300) {
    warnings.push(
      "Subtitle is quite long, consider shortening for better readability",
    );
  }

  // Content quality checks
  if (translation.body && translation.body.length < 50) {
    warnings.push(
      "Content is quite short, consider expanding for better engagement",
    );
  }

  if (translation.body && translation.body.length > 50000) {
    warnings.push(
      "Content is very long, consider breaking into multiple articles",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Calculates completeness percentage for a translation
 */
export const calculateCompleteness = (
  translation: PartialTranslation,
): number => {
  let score = 0;

  // Title (required) - 40 points
  if (translation.title?.trim()) {
    score += 40;
  }

  // Content (required) - 50 points
  if (translation.body?.trim() && translation.body.length >= 50) {
    score += 50;
  } else if (translation.body?.trim()) {
    score += 25; // Partial credit for short content
  }

  // Subtitle (optional) - 10 points
  if (translation.subtitle?.trim()) {
    score += 10;
  }

  return Math.min(100, score);
};

/**
 * Calculate translation completeness for multiple languages
 */
export const calculateTranslationCompleteness = (
  translations: Record<ContentLang, PartialTranslation>,
): TranslationCompleteness[] => {
  return Object.entries(translations).map(([lang, content]) => ({
    language: lang as ContentLang,
    completeness: calculateCompleteness(content),
    wordCount:
      content.body?.split(/\s+/).filter((word) => word.length > 0).length || 0,
    lastModified: content.lastModified || null,
    hasTitle: Boolean(content.title?.trim()),
    hasContent: Boolean(content.body?.trim() && content.body.length >= 50),
  }));
};

/**
 * Validates all translations and returns overview
 */
export const validateAllTranslations = (
  translations: Record<ContentLang, PartialTranslation>,
): {
  hasValidTranslations: boolean;
  completedLanguages: ContentLang[];
  incompleteLanguages: ContentLang[];
  totalErrors: number;
  totalWarnings: number;
} => {
  const results = Object.entries(translations).map(([lang, translation]) => ({
    language: lang as ContentLang,
    validation: validateTranslation(translation),
    completeness: calculateCompleteness(translation),
  }));

  const completedLanguages = results
    .filter((r) => r.validation.isValid && r.completeness >= 80)
    .map((r) => r.language);

  const incompleteLanguages = results
    .filter((r) => !r.validation.isValid || r.completeness < 80)
    .map((r) => r.language);

  const totalErrors = results.reduce(
    (sum, r) => sum + r.validation.errors.length,
    0,
  );
  const totalWarnings = results.reduce(
    (sum, r) => sum + r.validation.warnings.length,
    0,
  );

  return {
    hasValidTranslations: completedLanguages.length > 0,
    completedLanguages,
    incompleteLanguages,
    totalErrors,
    totalWarnings,
  };
};

/**
 * Checks if a translation has meaningful content
 */
export const hasTranslationContent = (
  translation: PartialTranslation,
): boolean => {
  return Boolean(
    translation.title?.trim() ||
    translation.subtitle?.trim() ||
    (translation.body?.trim() && translation.body.length > 10),
  );
};

/**
 * Creates an empty translation
 */
export const createEmptyTranslation = (): PartialTranslation => ({
  title: "",
  subtitle: "",
  body: "",
  lastModified: new Date(),
  wordCount: 0,
  isComplete: false,
});

/**
 * Language display names for UI
 */
export const LANGUAGE_NAMES: Record<ContentLang, string> = {
  mn: "Mongolian",
  en: "English",
  jp: "Japanese",
};

/**
 * Language codes in order of priority
 */
export const LANGUAGE_CODES: ContentLang[] = ["mn", "en", "jp"];
