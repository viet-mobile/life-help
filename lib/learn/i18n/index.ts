import { languages, locales, type Locale } from "@/messages/registry";
import { ko, type MessageKey } from "./ko";

/**
 * Learner UI locales = the canonical LIFE.HELP locale registry (messages/registry.ts), never a second hand-kept list.
 * Every registry locale has a learning dictionary (ko.ts is canonical; lib/learn/i18n/locales/<code>.json carry the same keys,
 * verified by scripts/verify_i18n_completeness.py). The learner locale only changes presentation: answer keys, ids, progress and
 * XP are locale-independent.
 */
export const LOCALES = locales;
export type LearnLocale = Locale;
export type { MessageKey };

export const DEFAULT_LOCALE: LearnLocale = "ko";
/** The learner's language choice. Browser-level preference (no DB column): it survives refresh, navigation and sign out / in on this browser. */
export const LOCALE_COOKIE = "learn_lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is LearnLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
/** Unknown / missing values fall back to the site's default locale (Korean for math / english, the existing guest behaviour). */
export function parseLocale(value: unknown, fallback: LearnLocale = DEFAULT_LOCALE): LearnLocale {
  if (value === "sg") return "fr"; // Retired Sango preferences migrate to French.
  return isLocale(value) ? value : fallback;
}

const META = new Map(languages.map((l) => [l.code, l]));
/** Text direction of a locale, from the registry (ar, arz, fa, he, ur are rtl). */
export function localeDir(locale: LearnLocale): "ltr" | "rtl" {
  return META.get(locale)?.dir === "rtl" ? "rtl" : "ltr";
}
/** The language's own name (autonym) for the language picker. */
export function nativeName(locale: LearnLocale): string {
  return META.get(locale)?.nativeName ?? locale;
}

export type Messages = Partial<Record<MessageKey, string>>;
export type Translator = (key: MessageKey, vars?: Record<string, string | number>) => string;

/**
 * Translator over ONE resolved dictionary. The server resolves locale -> English -> Korean (lib/learn/i18n/catalog.ts) and sends the
 * browser only the dictionary of the learner's locale. Without a dictionary it is the canonical Korean translator.
 */
export function createTranslator(messages: Messages = ko): Translator {
  return (key, vars) => {
    let text: string = messages[key] ?? ko[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
    return text;
  };
}

/** Korean translator for places that have no request (the web manifest, the staff-only admin page). Request-scoped code uses getServerT(). */
export const t: Translator = createTranslator(ko);
