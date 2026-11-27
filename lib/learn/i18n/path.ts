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
 * - "/vi/ko+en/dashboard" -> { locale: "vi", secondaryLocale: "ko", secondaryLocales: ["ko", "en"], rest: "/dashboard" }
 * - "/vi/ko+en" -> { locale: "vi", secondaryLocale: "ko", secondaryLocales: ["ko", "en"], rest: "/" }
 * - "/vi/ko/dashboard" -> { locale: "vi", secondaryLocale: "ko", secondaryLocales: ["ko"], rest: "/dashboard" }
 * - "/vi/ko" -> { locale: "vi", secondaryLocale: "ko", secondaryLocales: ["ko"], rest: "/" }
 * - "/en/lesson/x" -> { locale: "en", secondaryLocale: null, rest: "/lesson/x" }
 * - "/en" -> { locale: "en", secondaryLocale: null, rest: "/" }
 * - "/lesson/x" -> { locale: null, secondaryLocale: null, rest: "/lesson/x" }
 */
export function splitLocalePrefix(pathname: string): {
  locale: Locale | null;
  secondaryLocale?: Locale | null;
  secondaryLocales?: Locale[];
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

  // Check if second segment contains valid secondary locale(s):
  // single: /vi/ko, duplicate /vi/vi
  // multi: /vi/ko+en, /vi/ko,en, /vi/ko+en+ja
  if (segments.length >= 2) {
    const candidateParts = segments[1].split(/[,+]/).filter(Boolean);
    const validSeconds: Locale[] = [];
    let hasDuplicateFirst = false;
    for (const part of candidateParts) {
      const parsed = localeFromSegment(part);
      if (parsed) {
        if (parsed === firstLocale) {
          hasDuplicateFirst = true;
        } else if (!validSeconds.includes(parsed)) {
          validSeconds.push(parsed);
        }
      }
    }
    const allValid = candidateParts.length > 0 && candidateParts.every((p) => localeFromSegment(p) !== null);
    if (allValid && (validSeconds.length > 0 || hasDuplicateFirst)) {
      const remainingSegments = segments.slice(2);
      const rest = remainingSegments.length > 0 ? "/" + remainingSegments.join("/") : "/";
      return {
        locale: firstLocale,
        secondaryLocale: validSeconds[0] ?? null,
        secondaryLocales: validSeconds,
        rest,
      };
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
  secOrBase?: Locale | Locale[] | string | null,
  maybeBase = ""
): string {
  let secondaryLocales: Locale[] = [];
  let base = "";

  if (Array.isArray(secOrBase)) {
    secondaryLocales = secOrBase;
    base = maybeBase;
  } else if (typeof secOrBase === "string") {
    if (secOrBase.startsWith("/")) {
      base = secOrBase;
    } else {
      const parts = secOrBase.split(/[,+]/).filter(Boolean);
      const parsed = parts.map((p) => localeFromSegment(p)).filter((l): l is Locale => l !== null);
      if (parsed.length > 0 && parsed.length === parts.length) {
        secondaryLocales = parsed;
        base = maybeBase;
      } else {
        base = secOrBase;
      }
    }
  } else if (secOrBase === null) {
    base = maybeBase;
  }

  const inner = base && pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
  const { rest } = splitLocalePrefix(inner);
  const secPart = secondaryLocales.length > 0 ? `/${secondaryLocales.join("+")}` : "";
  const prefix = `${base}/${locale}${secPart}`;
  return `${prefix}${rest === "/" ? "" : rest}`;
}
