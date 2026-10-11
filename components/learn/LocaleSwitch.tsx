"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale, localeDir, nativeName, type LearnLocale } from "@/lib/learn/i18n";
import { localeFromSegment } from "@/lib/learn/i18n/path";
import { useSite } from "./LearnerProvider";

/**
 * Language picker over every registry locale (47), each named in its own script so a learner can always find their language.
 * The choice is a browser-level cookie (no account column, no second identity): it survives refresh, navigation and sign out / in on
 * this browser, and the server renders every page and API answer in that language. Progress is keyed by canonical ids, so switching
 * language never changes or forks it.
 */
export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, t, base } = useSite();
  const router = useRouter();
  const [pending, start] = useTransition();

  const choose = (next: LearnLocale) => {
    if (next === locale) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
    // On a language URL (/en/...) the URL itself carries the language: move to the same page under the new prefix
    // (otherwise the old prefix would keep overriding the cookie). Everywhere else the cookie + refresh is enough.
    const last = base.split("/").pop() ?? "";
    if (base && localeFromSegment(last)) {
      const root = base.slice(0, base.length - last.length - 1);
      const path = window.location.pathname.startsWith(base) ? window.location.pathname.slice(base.length) : "";
      // a full navigation: the proxy rewrites every /<locale>/... to the same route, so a client-side push would keep the previous
      // language's layout (and metadata); the browser must fetch the new language's document
      window.location.assign(`${root}/${next}${path}${window.location.search}${window.location.hash}`);
      return;
    }
    start(() => router.refresh());
  };

  return (
    <label className="l-locale" data-compact={compact || undefined} aria-busy={pending}>
      <span aria-hidden="true">🌐</span>
      <select
        className="l-locale-select"
        data-testid="locale-select"
        value={locale}
        aria-label={t("locale.label")}
        onChange={(e) => { if (isLocale(e.target.value)) choose(e.target.value); }}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={code} dir={localeDir(code)}>
            {nativeName(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
