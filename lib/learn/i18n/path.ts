import { locales, type Locale } from "@/messages/registry";

/**
 * Language in the URL of a learning site: https://math.life.help/en , /vi/dashboard , /zh-Hans , /ur/lesson/... The first path segment
 * names a registry locale (any case; zs / zt / zh are accepted for the Chinese variants like on the main site). Pure data so the proxy,
 * the server and the client language switcher all read the SAME rule. Locale codes can never collide with a learning route
 * (dashboard, lesson, onboarding, ...), which are all longer words.
 */
const ALIASES: Record<string, Locale> = { zs: "zh-Hans", zt: "zh-Hant", zh: "zh-Hans" };
const BY_LOWER = new Map<string, Locale>(locales.map((l) => [l.toLowerCase(), l]));

export function localeFromSegment(segment: string | undefined): Locale | null {
  if (!segment) return null;
  const s = segment.toLowerCase();
  return BY_LOWER.get(s) ?? ALIASES[s] ?? null;
}

/** "/en/lesson/x" -> { locale: "en", rest: "/lesson/x" }; "/lesson/x" -> { locale: null, rest: "/lesson/x" }; "/en" -> { "en", "/" } */
export function splitLocalePrefix(pathname: string): { locale: Locale | null; rest: string } {
  const m = pathname.match(/^\/([^/]+)(\/.*)?$/);
  const locale = m ? localeFromSegment(m[1]) : null;
  if (!locale) return { locale: null, rest: pathname || "/" };
  return { locale, rest: m![2] && m![2] !== "" ? m![2] : "/" };
}

/** The same page in another language: swaps / adds / removes the first-segment prefix of `pathname` (default language keeps its URL unprefixed only when `prefix` is false). */
export function withLocalePrefix(pathname: string, locale: Locale, base = ""): string {
  const inner = base && pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
  const { rest } = splitLocalePrefix(inner);
  return `${base}/${locale}${rest === "/" ? "" : rest}`;
}
