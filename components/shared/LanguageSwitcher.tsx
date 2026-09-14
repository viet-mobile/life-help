"use client";

import React from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { type Locale, languages, isValidLocale } from "@/messages";

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
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (isValidLocale(val)) {
      if (propOnChange) {
        propOnChange(val);
      } else {
        context.setLocale(val);
      }
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 sm:gap-1.5 shrink-0 ${className}`}>
      <div
        className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white/95 px-2 py-1 sm:px-2.5 sm:py-1.5 shadow-sm transition hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 max-w-[105px] sm:max-w-[170px] min-w-0 shrink-0"
        aria-label="Language selection"
      >
        <span className="mr-1 sm:mr-1.5 text-xs sm:text-base select-none shrink-0" aria-hidden="true">
          🌐
        </span>
        <select
          value={currentLocale}
          onChange={handleChange}
          className="cursor-pointer bg-transparent pr-1 sm:pr-2 text-xs font-bold text-slate-800 outline-none sm:text-sm w-full min-w-0 truncate"
          aria-label="Select system language"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
              {lang.nativeName}
              {lang.name !== lang.nativeName ? ` (${lang.name})` : ""}
            </option>
          ))}
        </select>
      </div>

      {currentLocale !== "ko" && (
        <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-bold shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => context.setDisplayMode("monolingual")}
            className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg transition text-xs flex items-center justify-center gap-1 ${
              context.displayMode === "monolingual"
                ? "bg-white text-blue-700 shadow-xs font-black ring-1 ring-slate-300/60"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
            title={context.t("common.monolingualToggleHint") || "단일 언어 모드"}
            aria-label={context.t("common.monolingualMode") || "Single Language"}
          >
            <span>🌐</span>
            <span className="hidden sm:inline">
              {context.t("common.monolingualMode") || "Single Language"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => context.setDisplayMode("bilingual")}
            className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg transition text-xs flex items-center justify-center gap-1 ${
              context.displayMode === "bilingual"
                ? "bg-blue-700 text-white shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
            title={context.t("common.bilingualToggleHint") || "한국어 병기 모드"}
            aria-label={context.t("common.bilingualMode") || "Bilingual (Korean)"}
          >
            <span>🇰🇷</span>
            <span className="hidden sm:inline">
              {context.t("common.bilingualMode") || "Bilingual (Korean)"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
