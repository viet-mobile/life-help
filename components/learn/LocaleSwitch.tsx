"use client";

import { useRouter } from "next/navigation";
import { useTransition, useMemo } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale, nativeName, type LearnLocale } from "@/lib/learn/i18n";
import { splitLocalePrefix } from "@/lib/learn/i18n/path";
import { getLanguageNameInLocale, formatLanguageName, type Locale } from "@/messages/registry";
import { useSite } from "./LearnerProvider";
import { LearnMultilingualPopover } from "./LearnMultilingualPopover";

/**
 * Language picker over registry locales, each named in its own script so a learner can always find their language.
 * Pairs with MultilingualPopover to provide comprehensive multi-secondary language support across all study pages.
 */
export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useSite();
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

    // On a language URL (/en/..., /vi/ko+en/...) or un-prefixed URL, always navigate to include the new prefix
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const { secondaryLocales, rest } = splitLocalePrefix(pathname);

      let nextSecs: Locale[] = [];
      if (secondaryLocales && secondaryLocales.length > 0) {
        // If next primary was among the secondary locales, flip: replace next with previous locale (e.g. ko <-> vi flip)
        nextSecs = secondaryLocales.map((sec) => (sec === next ? (locale as Locale) : sec));
        nextSecs = nextSecs.filter((sec) => sec !== next);
      } else if (locale === "ko" && next !== "ko") {
        // If transitioning from Korean to a foreign language, default secondary to Korean to preserve Korean context
        nextSecs = ["ko"];
      }

      // If we have secondary locales, persist to cookies and localStorage
      if (nextSecs.length > 0) {
        try {
          localStorage.setItem("life_help_display_mode", "bilingual");
          localStorage.setItem("life_help_secondary_locale", nextSecs[0]);
          localStorage.setItem("life_help_secondary_locales", nextSecs.join(","));
        } catch {}
        document.cookie = `life_help_display_mode=bilingual; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
        document.cookie = `life_help_secondary_locale=${nextSecs[0]}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
        document.cookie = `life_help_secondary_locales=${nextSecs.join(",")}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
        window.dispatchEvent(new Event("life_help_secondary_locale_change"));
        window.dispatchEvent(new Event("life_help_display_mode_change"));
      }

      const secPart = nextSecs.length > 0 ? `/${nextSecs.join("+")}` : "";
      const targetPath = `/${next}${secPart}${rest === "/" ? "" : rest}`;
      window.location.assign(`${targetPath}${window.location.search}${window.location.hash}`);
      return;
    }
    start(() => router.refresh());
  };

  return (
    <div dir="ltr" className="inline-flex items-center gap-1.5 shrink-0 max-w-full">
      <label
        className="l-locale droplet-pill inline-flex items-center shrink-0 border border-slate-200 bg-white shadow-2xs hover:border-blue-400 transition cursor-pointer"
        data-compact={compact || undefined}
        aria-busy={pending}
      >
        <span aria-hidden="true" className="text-xs mr-1 shrink-0">🌐</span>
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
