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
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white/95 px-2.5 py-1.5 shadow-sm transition hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
        aria-label="Language selection"
      >
        <span className="mr-1.5 text-base select-none" aria-hidden="true">
          🌐
        </span>
        <select
          value={currentLocale}
          onChange={handleChange}
          className="cursor-pointer bg-transparent pr-2 text-xs font-bold text-slate-800 outline-none sm:text-sm"
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
        <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => context.setDisplayMode("monolingual")}
            className={`px-2.5 py-1.5 rounded-lg transition text-xs ${
              context.displayMode === "monolingual"
                ? "bg-white text-blue-700 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
            title={context.t("common.monolingualToggleHint") || "단일 언어 모드"}
          >
            🌐 {context.t("common.monolingualMode") || "Single Language"}
          </button>
          <button
            type="button"
            onClick={() => context.setDisplayMode("bilingual")}
            className={`px-2.5 py-1.5 rounded-lg transition text-xs ${
              context.displayMode === "bilingual"
                ? "bg-blue-700 text-white shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
            title={context.t("common.bilingualToggleHint") || "한국어 병기 모드"}
          >
            🇰🇷 {context.t("common.bilingualMode") || "Bilingual (Korean)"}
          </button>
        </div>
      )}
    </div>
  );
}
