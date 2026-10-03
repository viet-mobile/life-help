"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type LearnLocale } from "@/lib/learn/i18n";
import { useSite } from "./LearnerProvider";

/**
 * Language switch: 한국어 | Tiếng Việt. The choice is a browser-level cookie (no account column, no second identity): it survives refresh,
 * navigation and sign out / in on this browser, and the server renders every page and API answer in that language.
 */
export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useSite();
  const router = useRouter();
  const [pending, start] = useTransition();

  const choose = (next: LearnLocale) => {
    if (next === locale) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
    start(() => router.refresh());
  };

  return (
    <div role="radiogroup" aria-label={t("locale.label")} className="l-locale" data-compact={compact || undefined} aria-busy={pending}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          role="radio"
          lang={code}
          aria-checked={locale === code}
          data-selected={locale === code}
          className="l-locale-btn"
          onClick={() => choose(code)}
        >
          {t(`locale.${code}` as never)}
        </button>
      ))}
    </div>
  );
}
