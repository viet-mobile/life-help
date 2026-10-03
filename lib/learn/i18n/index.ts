import { ko, type MessageKey } from "./ko";
import { vi } from "./vi";

export const LOCALES = ["ko", "vi"] as const;
export type LearnLocale = (typeof LOCALES)[number];
export type { MessageKey };

export const DEFAULT_LOCALE: LearnLocale = "ko";
/** The learner's language choice. Browser-level preference (no DB column): it survives refresh, navigation and sign out / in on this browser. */
export const LOCALE_COOKIE = "learn_lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is LearnLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
/** Unknown / missing values fall back to Korean (the existing behaviour for guests). */
export function parseLocale(value: unknown): LearnLocale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

const dictionaries: Record<LearnLocale, Record<MessageKey, string>> = { ko, vi };

export type Translator = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function createTranslator(locale: LearnLocale = DEFAULT_LOCALE): Translator {
  const dict = dictionaries[locale] ?? ko;
  return (key, vars) => {
    let text: string = dict[key] ?? ko[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
    return text;
  };
}

/** Korean translator for places that have no request (the web manifest). Request-scoped code uses getServerT() from ./server. */
export const t: Translator = createTranslator("ko");
