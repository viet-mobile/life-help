import "server-only";
import { cookies, headers } from "next/headers";
import { createTranslator, isLocale, LOCALE_COOKIE, parseLocale, type LearnLocale, type Messages, type Translator } from "./index";
import { loadMessages } from "./catalog";
import { siteConfig } from "@/lib/learn/sites";
import { isSite } from "@/lib/learn/types";

/** The site's default learner locale for this request (Korean for math / english, English for study.korean). */
async function siteDefault(): Promise<LearnLocale> {
  try {
    const site = (await headers()).get("x-life-site");
    return isSite(site) ? siteConfig(site).defaultLocale : "ko";
  } catch {
    return "ko";
  }
}

/**
 * The learner's locale for this request: the language in the URL (/en), else the language-switch cookie when it names a registry locale,
 * otherwise the site default.
 * Deterministic (no Accept-Language guessing), so the same request always renders the same language.
 */
export async function getLocale(): Promise<LearnLocale> {
  const fallback = await siteDefault();
  try {
    // 1. the language in the URL (set by the proxy from /en, /vi/..., validated against the registry there)
    const fromUrl = (await headers()).get("x-learn-locale");
    if (fromUrl && isLocale(fromUrl)) return fromUrl;
  } catch { /* no request context */ }
  try {
    return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value, fallback);
  } catch {
    return fallback;
  }
}

/**
 * The secondary locale for bilingual display, if specified in the URL (/vi/ko) or cookies.
 */
export async function getSecondaryLocale(): Promise<LearnLocale | null> {
  const all = await getSecondaryLocales();
  return all.length > 0 ? all[0] : null;
}

/**
 * The secondary locales for multilingual display, if specified in the URL (/vi/ko+en) or cookies.
 */
export async function getSecondaryLocales(): Promise<LearnLocale[]> {
  try {
    const fromUrlMulti = (await headers()).get("x-learn-secondary-locales");
    if (fromUrlMulti) {
      const parts = fromUrlMulti.split(/[,+]/).filter(isLocale);
      if (parts.length > 0) return parts;
    }
    const fromUrl = (await headers()).get("x-learn-secondary-locale");
    if (fromUrl) {
      const parts = fromUrl.split(/[,+]/).filter(isLocale);
      if (parts.length > 0) return parts;
    }
  } catch { /* no request context */ }
  try {
    const fromCookieMulti = (await cookies()).get("life_help_secondary_locales")?.value;
    if (fromCookieMulti) {
      const parts = fromCookieMulti.split(/[,+]/).filter(isLocale);
      if (parts.length > 0) return parts;
    }
    const fromCookie = (await cookies()).get("life_help_secondary_locale")?.value;
    if (fromCookie) {
      const parts = fromCookie.split(/[,+]/).filter(isLocale);
      if (parts.length > 0) return parts;
    }
  } catch {
    return [];
  }
  return [];
}

export async function getServerT(customLocale?: LearnLocale): Promise<{ locale: LearnLocale; t: Translator; messages: Messages }> {
  const locale = customLocale ?? (await getLocale());
  const messages = await loadMessages(locale);
  return { locale, t: createTranslator(messages), messages };
}
