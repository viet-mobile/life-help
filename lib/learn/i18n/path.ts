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

/** 
 * Splits locale prefixes from pathname:
 * - "/vi/ko/dashboard" -> { locale: "vi", secondaryLocale: "ko", rest: "/dashboard" }
 * - "/vi/ko" -> { locale: "vi", secondaryLocale: "ko", rest: "/" }
 * - "/en/lesson/x" -> { locale: "en", secondaryLocale: null, rest: "/lesson/x" }
 * - "/en" -> { locale: "en", secondaryLocale: null, rest: "/" }
 * - "/lesson/x" -> { locale: null, secondaryLocale: null, rest: "/lesson/x" }
 */
export function splitLocalePrefix(pathname: string): {
  locale: Locale | null;
  secondaryLocale?: Locale | null;
  rest: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { locale: null, rest: "/" };
  }

  const firstLocale = localeFromSegment(segments[0]);
  if (!firstLocale) {
    return { locale: null, rest: pathname || "/" };
  }

  // Check if second segment is also a valid locale (bilingual URL: /vi/ko)
  if (segments.length >= 2) {
    const secondLocale = localeFromSegment(segments[1]);
    if (secondLocale && secondLocale !== firstLocale) {
      const remainingSegments = segments.slice(2);
      const rest = remainingSegments.length > 0 ? "/" + remainingSegments.join("/") : "/";
      return { locale: firstLocale, secondaryLocale: secondLocale, rest };
    }
  }

  const remainingSegments = segments.slice(1);
  const rest = remainingSegments.length > 0 ? "/" + remainingSegments.join("/") : "/";
  return { locale: firstLocale, rest };
}

/** The same page in another language: swaps / adds / removes the prefix of `pathname`. */
export function withLocalePrefix(
  pathname: string,
  locale: Locale,
  secOrBase?: Locale | string | null,
  maybeBase = ""
): string {
  let secondaryLocale: Locale | null = null;
  let base = "";

  if (typeof secOrBase === "string") {
    if (secOrBase.startsWith("/")) {
      base = secOrBase;
    } else {
      secondaryLocale = secOrBase as Locale;
      base = maybeBase;
    }
  } else if (secOrBase === null) {
    base = maybeBase;
  }

  const inner = base && pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
  const { rest } = splitLocalePrefix(inner);
  const prefix = secondaryLocale ? `${base}/${locale}/${secondaryLocale}` : `${base}/${locale}`;
  return `${prefix}${rest === "/" ? "" : rest}`;
}
