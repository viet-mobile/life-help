"use client";

import React, { useMemo } from "react";
import { useLocale, resolveLocaleFromPath } from "@/lib/i18n/LocaleContext";
import { type Locale, languages, isValidLocale, formatLanguageName, getSortedLanguages } from "@/messages/registry";
import { isDualScriptLocale, DUAL_SCRIPT_LANGUAGES } from "@/lib/i18n/scriptConverter";

interface LanguageSwitcherProps {
  locale?: Locale;
  onChange?: (locale: Locale) => void;
  className?: string;
}

export function LanguageSwitcher({
  locale: propLocale,
  onChange: propOnChange,
  className = "",
}: LanguageSwitcherProps) {
  const context = useLocale();

  const currentLocale = propLocale ?? context.locale;
  const isBilingual = context.displayMode === "bilingual";
  const isDualScript = isDualScriptLocale(currentLocale);
  const scriptMeta = isDualScript ? DUAL_SCRIPT_LANGUAGES[currentLocale] : null;

  const sortedLanguages = useMemo(() => {
    return getSortedLanguages(currentLocale);
  }, [currentLocale]);
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (isValidLocale(val)) {
      if (propOnChange) {
        propOnChange(val);
      }
      context.setLocale(val);
      if (typeof window !== "undefined") {
        const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname);
        if (isIp) {
          // On local LAN IP access, avoid URL prefix rewrites; context.setLocale re-renders instantly
          return;
        }
        const pathname = window.location.pathname;
        const currentUrlLang = resolveLocaleFromPath(pathname);
        const search = window.location.search || "";
        const hash = window.location.hash || "";

        if (currentUrlLang) {
          const stripped = pathname.replace(new RegExp(`^/${currentUrlLang}(?=/|$)`, "i"), "") || "/";
          const targetPath = val === "ko" ? stripped : `/${val}${stripped === "/" ? "" : stripped}`;
          window.location.href = `${targetPath}${search}${hash}`;
        } else if (val !== "ko") {
          const targetPath = `/${val}${pathname === "/" ? "" : pathname}`;
          window.location.href = `${targetPath}${search}${hash}`;
        } else {
          window.location.href = `${pathname}${search}${hash}`;
        }
      }
    }
  };

  return (
    <div dir="ltr" className={`inline-flex items-center gap-1 sm:gap-1.5 shrink-0 max-w-full ${className}`}>
      <div
        dir="ltr"
        className="droplet-pill relative inline-flex items-center border border-slate-200 bg-white/95 min-h-11 px-1.5 py-0 sm:px-2 shadow-sm transition hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 max-w-[72px] xs:max-w-[85px] sm:max-w-[120px] md:max-w-[145px] lg:max-w-[170px] min-w-0 shrink-0"
        aria-label="Language selection"
      >
        <span className="mr-0.5 text-xs sm:text-sm select-none shrink-0" aria-hidden="true">
          🌐
        </span>
        <select
          value={currentLocale}
          onChange={handleChange}
          dir="ltr"
          className="cursor-pointer bg-transparent pr-0 text-[11px] font-bold text-slate-800 sm:text-xs md:text-sm w-full min-w-0 min-h-11 truncate focus-visible:outline-none text-left"
          aria-label="Select system language"
        >
          {sortedLanguages.map((lang) => (
            <option
              key={lang.code}
              value={lang.code}
              dir="ltr"
              className="text-slate-900 bg-white text-left whitespace-pre py-1"
            >
              {formatLanguageName(lang, currentLocale, isBilingual)}
            </option>
          ))}
        </select>
      </div>

      {isDualScript && scriptMeta && (
        <div
          dir="ltr"
          className="droplet-pill inline-flex p-0.5 bg-slate-100 border border-slate-200 text-xs font-bold shadow-2xs shrink-0"
          role="group"
          aria-label="Script selection"
        >
          <button
            type="button"
            onClick={() => context.setScript(scriptMeta.script1)}
            className={`droplet-btn min-h-11 min-w-9 px-2 py-1 transition text-xs flex items-center justify-center gap-1 shrink-0 ${
              context.script === scriptMeta.script1
                ? "bg-white text-blue-700 shadow-xs font-black ring-1 ring-slate-300/60"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
            title={scriptMeta.script1Name}
            aria-label={scriptMeta.script1Name}
            aria-pressed={context.script === scriptMeta.script1}
          >
            <span className="font-mono text-xs sm:text-sm font-black">{scriptMeta.script1Icon}</span>
            {scriptMeta.script1Label ? (
              <span className="text-[11px] sm:text-xs">{scriptMeta.script1Label}</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => context.setScript(scriptMeta.script2)}
            className={`droplet-btn min-h-11 min-w-9 px-2 py-1 transition text-xs flex items-center justify-center gap-1 shrink-0 ${
              context.script === scriptMeta.script2
                ? "bg-white text-blue-700 shadow-xs font-black ring-1 ring-slate-300/60"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
            title={scriptMeta.script2Name}
            aria-label={scriptMeta.script2Name}
            aria-pressed={context.script === scriptMeta.script2}
          >
            <span className="font-mono text-xs sm:text-sm font-black">{scriptMeta.script2Icon}</span>
            {scriptMeta.script2Label ? (
              <span className="text-[11px] sm:text-xs">{scriptMeta.script2Label}</span>
            ) : null}
          </button>
        </div>
      )}

      {/* Compact Bilingual Secondary Language Dropdown */}
      <div
        dir="ltr"
        className="droplet-pill relative inline-flex items-center border border-slate-200 bg-white/95 min-h-11 px-1.5 py-0 sm:px-2 shadow-sm transition hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 max-w-[85px] xs:max-w-[100px] sm:max-w-[130px] md:max-w-[155px] min-w-0 shrink-0"
        aria-label="Bilingual display mode selection"
      >
        <span className="mr-0.5 text-xs sm:text-sm select-none shrink-0" aria-hidden="true">
          {context.secondaryLocale ? "🈁" : "📄"}
        </span>
        <select
          value={context.secondaryLocale ?? "none"}
          onChange={(e) => {
            const val = e.target.value;
            context.setSecondaryLocale(val === "none" ? null : (val as Locale));
          }}
          dir="ltr"
          className="cursor-pointer bg-transparent pr-0 text-[11px] font-bold text-slate-800 sm:text-xs md:text-sm w-full min-w-0 min-h-11 truncate focus-visible:outline-none text-left"
          aria-label="Select bilingual secondary language"
        >
          <option value="none" className="text-slate-900 bg-white py-1">
            {currentLocale === "ko" ? "단일 언어 표기" : "단일 언어 (Single)"}
          </option>
          <optgroup label={currentLocale === "ko" ? "병기 언어 선택" : "병기 언어 (Bilingual)"}>
            {sortedLanguages
              .filter((lang) => lang.code !== currentLocale)
              .map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  className="text-slate-900 bg-white py-1"
                >
                  + {formatLanguageName(lang, currentLocale, false)}
                </option>
              ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
}
