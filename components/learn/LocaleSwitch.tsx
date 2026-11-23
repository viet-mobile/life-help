"use client";

import { useRouter } from "next/navigation";
import { useTransition, useMemo } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale, nativeName, type LearnLocale } from "@/lib/learn/i18n";
import { localeFromSegment, splitLocalePrefix } from "@/lib/learn/i18n/path";
import { getLanguageNameInLocale, formatLanguageName, type Locale } from "@/messages/registry";
import { useSite } from "./LearnerProvider";
import { LearnMultilingualPopover } from "./LearnMultilingualPopover";

/**
 * Language picker over registry locales, each named in its own script so a learner can always find their language.
 * Pairs with MultilingualPopover to provide comprehensive multi-secondary language support across all study pages.
 */
export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, t, base } = useSite();
  const router = useRouter();
  const [pending, start] = useTransition();

  const sortedLocales = useMemo(() => {
    const current = locale;
    const others = LOCALES.filter((c) => c !== current);
    const collator = new Intl.Collator(current);
    others.sort((a, b) => {
      const nameA = getLanguageNameInLocale(a, current);
      const nameB = getLanguageNameInLocale(b, current);
      return collator.compare(nameA, nameB);
    });
    return [current, ...others];
  }, [locale]);

  const choose = (next: LearnLocale) => {
    if (next === locale) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
    document.cookie = `life_help_locale=${next}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;

    // On a language URL (/en/..., /vi/ko+en/...) the URL itself carries the language: move to the same page under the new prefix
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const { locale: currentUrlLocale, secondaryLocales, rest } = splitLocalePrefix(pathname);
      if (currentUrlLocale) {
        const secPart = secondaryLocales && secondaryLocales.length > 0 ? `/${secondaryLocales.join("+")}` : "";
        const targetPath = next === "ko" ? (secPart ? `/ko${secPart}${rest === "/" ? "" : rest}` : rest) : `/${next}${secPart}${rest === "/" ? "" : rest}`;
        window.location.assign(`${targetPath}${window.location.search}${window.location.hash}`);
        return;
      }
    }
    start(() => router.refresh());
  };

  return (
    <div dir="ltr" className="inline-flex items-center gap-1.5 shrink-0 max-w-full">
      <label className="l-locale shrink-0" data-compact={compact || undefined} aria-busy={pending}>
        <span aria-hidden="true">🌐</span>
        <select
          className="l-locale-select"
          data-testid="locale-select"
          value={locale}
          aria-label={t("locale.label")}
          onChange={(e) => { if (isLocale(e.target.value)) choose(e.target.value); }}
        >
          {sortedLocales.map((code) => (
            <option key={code} value={code} lang={code} dir="ltr">
              {formatLanguageName({ code: code as Locale, name: getLanguageNameInLocale(code, locale), nativeName: nativeName(code) }, locale)}
            </option>
          ))}
        </select>
      </label>

      {/* Multilingual Secondary Languages Selector */}
      <LearnMultilingualPopover currentLocale={locale as Locale} compact={compact} />
    </div>
  );
}
