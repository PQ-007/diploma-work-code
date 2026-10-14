/** Interface languages and how the server picks one (shared by server + client). */
export const LANGUAGES = ["en", "mn", "ja"] as const;
export type Language = (typeof LANGUAGES)[number];

/** Cookie holding the visitor's choice, so the server renders the same language the client shows. */
export const LANG_COOKIE = "lang";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

/** Cookie first, then the browser's Accept-Language, then English. */
export function resolveLanguage(cookieValue: string | undefined, acceptLanguage: string | null): Language {
  if (isLanguage(cookieValue)) return cookieValue;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const code = part.trim().split(/[-;]/)[0]?.toLowerCase();
    if (isLanguage(code)) return code;
  }
  return "en";
}
