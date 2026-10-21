import { COUNTRY_TO_LANGUAGE_MAP, SITE_METADATA } from "@/lib/i18n/siteMetadata";

const PORTALS = new Set(["tech", "chat", "sys"]);

/** Allowlisted query inputs only: lang must be a known locale key, country a known slug, portal one of tech/chat/sys. Anything else is dropped. */
export function sanitizeShortcutParams(params: URLSearchParams): { lang: string | undefined; search: URLSearchParams } {
  const rawLang = (params.get("lang") ?? "").trim();
  const lang = Object.keys(SITE_METADATA).find((k) => k.toLowerCase() === rawLang.toLowerCase());
  const search = new URLSearchParams();
  const portal = (params.get("portal") ?? "").trim().toLowerCase();
  if (PORTALS.has(portal)) search.set("portal", portal);
  const country = (params.get("country") ?? "").trim().toLowerCase();
  if (Object.hasOwn(COUNTRY_TO_LANGUAGE_MAP, country)) search.set("country", country);
  return { lang, search };
}
