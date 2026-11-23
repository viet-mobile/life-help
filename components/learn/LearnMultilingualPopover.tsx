"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { type Locale, languages, formatLanguageName, getSortedLanguages } from "@/messages/registry";
import { splitLocalePrefix } from "@/lib/learn/i18n/path";
import { useSite } from "./LearnerProvider";
import { getCatalogI18n } from "@/lib/learn/dailyInsights/catalogI18n";

interface LearnMultilingualPopoverProps {
  currentLocale: Locale;
  compact?: boolean;
}

function getSecondaryLocalesFromCookie(): Locale[] {
  if (typeof document === "undefined") return [];
  const multi = document.cookie.match(/life_help_secondary_locales=([^;]+)/)?.[1];
  if (multi) {
    const list = multi.split(/[,+]/).filter(Boolean) as Locale[];
    if (list.length > 0) return list;
  }
  const single = document.cookie.match(/life_help_secondary_locale=([^;]+)/)?.[1];
  if (single) return [single as Locale];
  return [];
}

function getInitialActiveLocales(currentLocale: Locale, secondaryLocales?: Locale[], secondaryLocale?: Locale | null): Locale[] {
  if (secondaryLocales && secondaryLocales.length > 0) return secondaryLocales as Locale[];
  if (secondaryLocale) return [secondaryLocale as Locale];
  const fromCookie = getSecondaryLocalesFromCookie();
  if (fromCookie.length > 0) return fromCookie;
  if (typeof document !== "undefined") {
    const mode = document.cookie.match(/life_help_display_mode=([^;]+)/)?.[1];
    if (mode === "single") return [];
  }
  // Default on study pages for non-Korean learners: Korean is the default secondary language
  if (currentLocale !== "ko") {
    return ["ko" as Locale];
  }
  return [];
}

export function LearnMultilingualPopover({
  currentLocale,
  compact = false,
}: LearnMultilingualPopoverProps) {
  const { secondaryLocale, secondaryLocales = [] } = useSite();
  const [secOpen, setSecOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const secDropdownRef = useRef<HTMLDivElement>(null);

  const [activeSecLocales, setActiveSecLocales] = useState<Locale[]>(() => {
    return getInitialActiveLocales(currentLocale, secondaryLocales as Locale[], secondaryLocale as Locale);
  });
  const activeSecLocalesRef = useRef(activeSecLocales);
  activeSecLocalesRef.current = activeSecLocales;

  const applyLocales = (nextList: Locale[]) => {
    setActiveSecLocales(nextList);
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
    const maxAge = 31536000;
    if (nextList.length === 0) {
      document.cookie = `life_help_display_mode=single; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
      document.cookie = `life_help_secondary_locale=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
      document.cookie = `life_help_secondary_locales=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    } else {
      document.cookie = `life_help_display_mode=bilingual; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
      document.cookie = `life_help_secondary_locale=${nextList[0]}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
      document.cookie = `life_help_secondary_locales=${nextList.join("+")}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("life_help_secondary_locale_change"));
      window.dispatchEvent(new Event("life_help_display_mode_change"));
      const pathname = window.location.pathname;
      const { locale: currentUrlLocale, rest } = splitLocalePrefix(pathname);
      if (currentUrlLocale) {
        const secPart = nextList.length > 0 ? `/${nextList.join("+")}` : "";
        const targetPath = `/${currentUrlLocale}${secPart}${rest === "/" ? "" : rest}`;
        if (targetPath !== pathname) {
          window.location.assign(`${targetPath}${window.location.search}${window.location.hash}`);
          return;
        }
      }
    }
  };

  // Close secondary popover on outside click
  useEffect(() => {
    if (!secOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (secDropdownRef.current && !secDropdownRef.current.contains(e.target as Node)) {
        applyLocales(activeSecLocalesRef.current);
        setSecOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [secOpen]);

  const sortedLanguages = useMemo(() => {
    return getSortedLanguages(currentLocale);
  }, [currentLocale]);

  const filteredLanguages = useMemo(() => {
    const list = sortedLanguages.filter((lang) => lang.code !== currentLocale);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((lang) => {
      const formatted = formatLanguageName(lang, currentLocale, false).toLowerCase();
      return (
        lang.code.toLowerCase().includes(q) ||
        lang.name.toLowerCase().includes(q) ||
        (lang.nativeName && lang.nativeName.toLowerCase().includes(q)) ||
        formatted.includes(q)
      );
    });
  }, [sortedLanguages, currentLocale, searchQuery]);

  const toggleLocale = (code: Locale) => {
    setActiveSecLocales((prev) => {
      if (prev.includes(code)) {
        return prev.filter((l) => l !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const secondaryCount = activeSecLocales.length;
  const isKo = currentLocale === "ko";
  const catalogI18n = getCatalogI18n(currentLocale);

  return (
    <div className="relative inline-block shrink-0" ref={secDropdownRef}>
      <button
        type="button"
        onClick={() => setSecOpen((v) => !v)}
        className={`droplet-pill relative inline-flex items-center justify-center border border-slate-200 bg-white/95 ${
          compact ? "min-h-9 px-1.5 sm:px-2" : "min-h-11 px-2 sm:px-2.5"
        } shadow-sm transition hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 w-9 sm:w-auto max-w-[38px] sm:max-w-[155px] min-w-0 shrink-0 cursor-pointer ${
          secondaryCount > 0 ? "border-blue-300 bg-blue-50/50" : ""
        }`}
        aria-label="Multilingual display mode selection"
        aria-expanded={secOpen}
        title={isKo ? "다중 병기 언어 선택 (복수 선택 가능)" : "Select multilingual languages (multi-select)"}
      >
        <span className="text-xs sm:text-sm select-none shrink-0" aria-hidden="true">
          {secondaryCount > 0 ? "🈁" : "📄"}
        </span>

        {secondaryCount > 0 && (
          <span className="sm:hidden absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white shadow-2xs">
            {secondaryCount}
          </span>
        )}

        <span className="hidden sm:inline-block font-bold text-[11px] sm:text-xs text-slate-800 ml-1 truncate">
          {secondaryCount === 0
            ? catalogI18n.single
            : (secondaryCount === 1
                ? `+ ${formatLanguageName(languages.find((l) => l.code === activeSecLocales[0]) || languages[0], currentLocale, false).split("\n")[0]}`
                : `+ ${secondaryCount} ${isKo ? "개 언어" : "langs"}`)
          }
        </span>
        <span className="hidden sm:inline-block text-slate-400 text-[9px] ml-1 shrink-0">▾</span>
      </button>

      {secOpen && (
        <div
          dir="ltr"
          className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-1 z-50 w-auto sm:w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div>
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span>🈁</span>
                <span>{catalogI18n.multilingualTitle || "Multilingual Languages"}</span>
                {secondaryCount > 0 && (
                  <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {secondaryCount}
                  </span>
                )}
              </h4>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                {catalogI18n.multilingualDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSecOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              applyLocales([]);
              setSecOpen(false);
            }}
            className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition mb-2 cursor-pointer ${
              secondaryCount === 0
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>{catalogI18n.singleClear}</span>
            {secondaryCount === 0 && <span>✓</span>}
          </button>

          <div className="relative mb-2">
            <input
              type="text"
              placeholder={catalogI18n.searchMultilingual}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 overscroll-contain">
            {filteredLanguages.map((lang) => {
              const isSelected = activeSecLocales.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleLocale(lang.code)}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 text-blue-900 font-bold border border-blue-200"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{formatLanguageName(lang, currentLocale, false)}</span>
                  </div>
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 border text-[10px] ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white font-black"
                        : "border-slate-300 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer with Done button */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              {isKo ? `${secondaryCount}개 병기 언어 선택됨` : `${secondaryCount} selected`}
            </span>
            <button
              type="button"
              onClick={() => {
                applyLocales(activeSecLocales);
                setSecOpen(false);
              }}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-black text-white shadow-2xs transition cursor-pointer"
            >
              {isKo ? "선택 완료" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
