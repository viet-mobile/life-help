import vi from "./vi.json";
import ko from "./ko.json";
import en from "./en.json";

export * from "./registry";
import { type Locale, defaultLocale, isValidLocale } from "./registry";

export const dictionaries: Record<string, Record<string, unknown>> = {
  vi: vi as Record<string, unknown>,
  ko: ko as Record<string, unknown>,
  en: en as Record<string, unknown>,
};

export function registerDictionary(locale: string, dict: Record<string, unknown>): void {
  if (locale && dict && typeof dict === "object") {
    dictionaries[locale] = dict;
  }
}

export function detectDeviceLocale(preferredLanguages?: readonly string[]): Locale {
  let langs: readonly string[] = [];
  if (preferredLanguages && preferredLanguages.length > 0) {
    langs = preferredLanguages;
  } else if (typeof navigator !== "undefined") {
    langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  }

  for (const raw of langs) {
    if (!raw) continue;
    const tag = raw.toLowerCase().trim();

    if (tag.startsWith("zh-hk") || tag.startsWith("zh-mo") || tag.startsWith("yue")) return "yue";
    if (tag.startsWith("zh-tw") || tag.includes("hant")) return "zh-Hant";
    if (tag.startsWith("arz") || tag === "ar-eg") return "arz";
    if (tag.startsWith("zh")) return "zh-Hans";
    if (tag.startsWith("no") || tag.startsWith("nb") || tag.startsWith("nn")) return "no";
    if (tag.startsWith("tet") || tag.startsWith("dtp") || tag.startsWith("tdt")) return "tet";
    if (tag.startsWith("fa")) return "fa";
    if (tag.startsWith("he") || tag.startsWith("iw")) return "he";
    if (tag.startsWith("id") || tag.startsWith("in")) return "id";
    if (tag.startsWith("el")) return "el";
    if (tag.startsWith("pt")) return "pt";

    const prefix = tag.split("-")[0];
    if (isValidLocale(prefix)) return prefix;
  }

  return defaultLocale;
}

export function translate(locale: Locale, key: string): string {
  const getFromDict = (d: Record<string, unknown> | undefined): string | undefined => {
    if (!d) return undefined;
    const val = key
      .split(".")
      .reduce<unknown>(
        (current, segment) =>
          typeof current === "object" && current !== null && segment in current
            ? (current as Record<string, unknown>)[segment]
            : undefined,
        d,
      );
    return typeof val === "string" ? val : undefined;
  };

  // 1. Target locale (if loaded)
  const val = getFromDict(dictionaries[locale]);
  if (val !== undefined) return val;

  // 2. English fallback
  const enVal = getFromDict(dictionaries.en);
  if (enVal !== undefined) return enVal;

  // 3. Korean fallback
  const koVal = getFromDict(dictionaries.ko);
  if (koVal !== undefined) return koVal;

  return key;
}
