"use client";

import { useRouter } from "next/navigation";
import { useTransition, useMemo } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale, nativeName, type LearnLocale } from "@/lib/learn/i18n";
import { splitLocalePrefix } from "@/lib/learn/i18n/path";
import { getLanguageNameInLocale, formatLanguageName, type Locale } from "@/messages/registry";
import { useSite } from "./LearnerProvider";
import { LearnMultilingualPopover } from "./LearnMultilingualPopover";
import { MenuChevronUpDown } from "./MenuChevronUpDown";

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

    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const { secondaryLocales, rest } = splitLocalePrefix(pathname);

      let nextSecs: Locale[] = [];
      if (secondaryLocales && secondaryLocales.length > 0) {
        nextSecs = secondaryLocales.map((sec) => (sec === next ? (locale as Locale) : sec));
        nextSecs = nextSecs.filter((sec) => sec !== next);
      } else if (locale === "ko" && next !== "ko") {
        nextSecs = ["ko"];
      }

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
        className="l-locale droplet-pill inline-flex items-center justify-between shrink-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer px-2 sm:px-2.5 h-[34px] min-w-[72px] max-w-[125px] sm:max-w-[155px]"
        data-compact={compact || undefined}
        aria-busy={pending}
        style={{ height: "34px", boxSizing: "border-box" }}
      >
        <div className="flex items-center gap-1 min-w-0 overflow-hidden flex-1">
          <span aria-hidden="true" className="text-xs shrink-0 select-none">🌐</span>
          <select
            className="l-locale-select bg-transparent text-slate-800 dark:text-slate-100 font-bold text-[0.8rem] cursor-pointer outline-none appearance-none [appearance:none] [-webkit-appearance:none] truncate w-full"
            data-testid="locale-select"
            value={locale}
            aria-label={t("locale.label")}
            onChange={(e) => { if (isLocale(e.target.value)) choose(e.target.value); }}
            style={{
              border: 0,
              paddingRight: 0,
              paddingLeft: 0,
              background: "transparent",
            }}
          >
            {sortedLocales.map((code) => (
              <option key={code} value={code} lang={code} dir="ltr" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                {formatLanguageName({ code: code as Locale, name: getLanguageNameInLocale(code, locale), nativeName: nativeName(code) }, locale)}
              </option>
            ))}
          </select>
        </div>

        {/* 동일한 규격의 상하 화살표(ChevronUpDown) */}
        <MenuChevronUpDown className="ml-1" />
      </label>

      {/* Multilingual Secondary Languages Selector */}
      <LearnMultilingualPopover currentLocale={locale as Locale} compact={compact} />
    </div>
  );
}
