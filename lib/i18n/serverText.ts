import type { Metadata } from "next";
import { headers } from "next/headers";
import { translate, type Locale, isValidLocale } from "@/messages";
import { getLocale as getLearnLocale } from "@/lib/learn/i18n/server";
import { resolveCountryFromHeaders, resolveLanguageFromHeaders } from "@/lib/i18n/siteMetadata";
import { brandName, ogLocaleFor } from "@/lib/i18n/seo";

/**
 * Server-side dictionary access for pages that have no client locale context yet (metadata, 404): the language of the request
 * (learning sites: URL / cookie language; everything else: host + path language), with the usual en -> ko fallback of translate().
 */
export async function getServerText(): Promise<{ lang: Locale; t: (key: string) => string; country: string | null; learnBase: string | null }> {
  const h = await headers();
  const learn = h.get("x-life-portal") === "learn";
  const raw = learn ? await getLearnLocale() : resolveLanguageFromHeaders(h);
  const lang: Locale = isValidLocale(raw) ? raw : "ko";
  return {
    lang,
    t: (key: string) => translate(lang, key),
    country: learn ? null : resolveCountryFromHeaders(h),
    learnBase: learn ? (h.get("x-learn-base") ?? "") : null,
  };
}

/** Per-page metadata: "<page title> · LIFE.HELP[ COUNTRY]" with matching Open Graph / Twitter text (canonical/hreflang come from the root layout). */
export async function pageMetadata(titleKey: string, descriptionKey?: string): Promise<Metadata> {
  const { lang, t, country } = await getServerText();
  const page = t(titleKey);
  const title = `${page} · ${brandName(country)}`;
  const description = descriptionKey ? t(descriptionKey) : undefined;
  return {
    title,
    ...(description ? { description } : {}),
    openGraph: { title, ...(description ? { description } : {}), siteName: brandName(country), type: "website", locale: ogLocaleFor(lang, country) },
    twitter: { card: "summary_large_image", title, ...(description ? { description } : {}) },
  };
}
