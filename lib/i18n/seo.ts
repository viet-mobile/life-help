import type { Metadata } from "next";
import { getCountryInfo, COUNTRIES } from "@/lib/region/countries";
import { canonicalCountrySlug } from "@/lib/region/hostAliases";
import { locales } from "@/messages/registry";

/** Facebook-style og:locale (language_TERRITORY) for each registry locale; country hosts refine a few (en, es, fr, pt, de, ar). */
const OG_LOCALE: Record<string, string> = {
  ko: "ko_KR", en: "en_US", vi: "vi_VN", "zh-Hans": "zh_CN", "zh-Hant": "zh_TW", mn: "mn_MN", ru: "ru_RU", uz: "uz_UZ", ne: "ne_NP",
  hi: "hi_IN", km: "km_KH", th: "th_TH", my: "my_MM", ja: "ja_JP", id: "id_ID", si: "si_LK", kk: "kk_KZ", bn: "bn_BD", ta: "ta_IN",
  fr: "fr_FR", de: "de_DE", tr: "tr_TR", uk: "uk_UA", tet: "tet_TL", ar: "ar_AR", it: "it_IT", arz: "ar_EG", es: "es_ES", fa: "fa_IR",
  nl: "nl_NL", pl: "pl_PL", am: "am_ET", sv: "sv_SE", he: "he_IL", da: "da_DK", no: "nb_NO", el: "el_GR", pt: "pt_PT", ur: "ur_PK",
  sw: "sw_KE", mr: "mr_IN", gu: "gu_IN", pa: "pa_IN", te: "te_IN", kn: "kn_IN", ml: "ml_IN",
};

const OG_LOCALE_BY_COUNTRY: Record<string, Record<string, string>> = {
  en: { uk: "en_GB", australia: "en_AU", canada: "en_CA", newzealand: "en_NZ", singapore: "en_SG", philippines: "en_PH", southafrica: "en_ZA", nigeria: "en_NG", ghana: "en_GH", malaysia: "en_MY" },
  es: { mexico: "es_MX", argentina: "es_AR", venezuela: "es_VE", elsalvador: "es_SV" },
  fr: { centralafrica: "fr_CF", congo: "fr_CG" },
  pt: { brazil: "pt_BR", mozambique: "pt_MZ" },
  de: { swiss: "de_CH" },
  ar: { uae: "ar_AE", saudiarabia: "ar_SA", yemen: "ar_YE", iraq: "ar_IQ" },
};

/** language_TERRITORY form for og:locale. Unknown languages fall back to the Korean default of the platform. */
export function ogLocaleFor(lang: string, country?: string | null): string {
  const key = locales.find((l) => l.toLowerCase() === lang.toLowerCase()) ?? "ko";
  const slug = country ? canonicalCountrySlug(country.toLowerCase()) : "";
  return OG_LOCALE_BY_COUNTRY[key]?.[slug] ?? OG_LOCALE[key] ?? "ko_KR";
}

/** The country's display name for titles and og:siteName ("UZBEKISTAN", not the host slug "UZBEK"). Upper-case English; null without a country. */
export function countryBrandName(country?: string | null): string {
  if (!country) return "";
  const slug = canonicalCountrySlug(country.toLowerCase());
  const info = COUNTRIES.find((c) => c.slug === slug);
  return (info ? info.nameEn : getCountryInfo(slug).nameEn).toUpperCase();
}

/** Brand name used in titles / siteName: "LIFE.HELP" or "LIFE.HELP UZBEKISTAN". */
export function brandName(country?: string | null): string {
  const name = countryBrandName(country);
  return name ? `LIFE.HELP ${name}` : "LIFE.HELP";
}

/** Path segment the proxy accepts for a registry locale (zh-Hans/zh-Hant are served as zs/zt). */
export function localePathSegment(locale: string): string {
  if (locale === "zh-Hans") return "zs";
  if (locale === "zh-Hant") return "zt";
  return locale;
}

export function originFromHost(rawHost: string | null | undefined): string {
  const host = (rawHost ?? "").split(":")[0].toLowerCase();
  if (!host) return "";
  const local = host === "localhost" || host.endsWith(".localhost") || host.startsWith("127.");
  return `${local ? "http" : "https"}://${(rawHost ?? "").toLowerCase()}`;
}

/**
 * canonical + hreflang alternates for a customer-portal page. `publicPath` is the page path WITHOUT the language prefix ("/visa"),
 * `urlLang` the language prefix of the requested URL (null on the host's default-language URL). Every registry locale has a path
 * (/<code>/visa) on every host, so all of them are listed; x-default is the host's default-language URL.
 */
export function buildAlternates(origin: string, publicPath: string, urlLang: string | null): NonNullable<Metadata["alternates"]> | undefined {
  if (!origin) return undefined;
  const path = publicPath === "/" ? "" : publicPath;
  const segment = urlLang ? `/${urlLang}` : "";
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${origin}/${localePathSegment(l)}${path}`;
  languages["x-default"] = `${origin}${path || "/"}`;
  return { canonical: `${origin}${segment}${path}` + (segment || path ? "" : "/"), languages };
}
