"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
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
  const isDualScript = isDualScriptLocale(currentLocale);
  const scriptMeta = isDualScript ? DUAL_SCRIPT_LANGUAGES[currentLocale] : null;

  const [secOpen, setSecOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const secDropdownRef = useRef<HTMLDivElement>(null);

  // Close secondary popover on outside click
  useEffect(() => {
    if (!secOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (secDropdownRef.current && !secDropdownRef.current.contains(e.target as Node)) {
        setSecOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [secOpen]);

  const sortedLanguages = useMemo(() => {
    return getSortedLanguages(currentLocale);
  }, [currentLocale]);

  const filteredBilingualLanguages = useMemo(() => {
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

  const secondaryCount = context.secondaryLocales.length;
  const isKo = currentLocale === "ko";

  return (
    <div dir="ltr" className={`inline-flex items-center gap-1 sm:gap-1.5 shrink-0 max-w-full ${className}`}>
      {/* ① Primary Language Selection (Mobile: Icon only | Desktop: Full Select) */}
      <div
        dir="ltr"
        className="droplet-pill relative inline-flex items-center justify-center border border-slate-200 bg-white/95 min-h-11 px-2 sm:px-2.5 shadow-sm transition hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 w-9 sm:w-auto max-w-[38px] sm:max-w-[140px] md:max-w-[165px] min-w-0 shrink-0 cursor-pointer"
        aria-label="Language selection"
        title={isKo ? "주 언어 선택" : "Select primary language"}
      >
        <span className="text-xs sm:text-sm select-none shrink-0" aria-hidden="true">
          🌐
        </span>
        <select
          value={currentLocale}
          onChange={handleChange}
          dir="ltr"
          className="absolute inset-0 opacity-0 sm:opacity-100 sm:static cursor-pointer bg-transparent pr-0 text-[11px] font-bold text-slate-800 sm:text-xs md:text-sm w-full min-w-0 min-h-11 truncate focus-visible:outline-none text-left pl-0 sm:pl-1"
          aria-label="Select system language"
        >
          {sortedLanguages.map((lang) => (
            <option
              key={lang.code}
              value={lang.code}
              dir="ltr"
              className="text-slate-900 bg-white text-left whitespace-pre py-1"
            >
              {formatLanguageName(lang, currentLocale, false)}
            </option>
          ))}
        </select>
      </div>

      {/* Dual Script Selector if applicable */}
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

      {/* ② Multi-select Bilingual Secondary Language Dropdown Popover */}
      <div className="relative inline-block shrink-0" ref={secDropdownRef}>
        <button
          type="button"
          onClick={() => setSecOpen((v) => !v)}
          className={`droplet-pill relative inline-flex items-center justify-center border border-slate-200 bg-white/95 min-h-11 px-2 sm:px-2.5 shadow-sm transition hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 w-9 sm:w-auto max-w-[38px] sm:max-w-[155px] min-w-0 shrink-0 cursor-pointer ${
            secondaryCount > 0 ? "border-blue-300 bg-blue-50/50" : ""
          }`}
          aria-label="Bilingual display mode selection"
          aria-expanded={secOpen}
          title={isKo ? "병기 언어 선택 (복수 선택 가능)" : "Select bilingual languages (multi-select)"}
        >
          <span className="text-xs sm:text-sm select-none shrink-0" aria-hidden="true">
            {secondaryCount > 0 ? "🈁" : "📄"}
          </span>

          {/* Mobile Badge indicator when 1 or more secondary languages are active */}
          {secondaryCount > 0 && (
            <span className="sm:hidden absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white shadow-2xs">
              {secondaryCount}
            </span>
          )}

          {/* Desktop Text Label */}
          <span className="hidden sm:inline-block font-bold text-[11px] sm:text-xs text-slate-800 ml-1 truncate">
            {secondaryCount === 0
              ? (isKo ? "단일 언어" : "Single")
              : (secondaryCount === 1
                  ? `+ ${formatLanguageName(languages.find((l) => l.code === context.secondaryLocales[0]) || languages[0], currentLocale, false).split("\n")[0]}`
                  : `+ ${secondaryCount} ${isKo ? "개 언어" : "langs"}`)
            }
          </span>
          <span className="hidden sm:inline-block text-slate-400 text-[9px] ml-1 shrink-0">▾</span>
        </button>

        {/* Multi-select Popover */}
        {secOpen && (
          <div
            dir="ltr"
            className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-1 z-50 w-auto sm:w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div>
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span>🈁</span>
                  <span>{isKo ? "병기 언어 선택" : "Bilingual Languages"}</span>
                  {secondaryCount > 0 && (
                    <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                      {secondaryCount}
                    </span>
                  )}
                </h4>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                  {isKo ? "선택된 언어를 다시 누르면 해제됩니다" : "Click selected language to remove"}
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

            {/* Top Action: Single Language Mode (Clear All) */}
            <button
              type="button"
              onClick={() => {
                context.setSecondaryLocales([]);
                setSecOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition mb-2 cursor-pointer ${
                secondaryCount === 0
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>{isKo ? "단일 언어 표기 (모두 해제)" : "Single Language (Clear all)"}</span>
              {secondaryCount === 0 && <span>✓</span>}
            </button>

            {/* Quick Search */}
            <div className="mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isKo ? "언어 검색 (예: 한국어, English, Tiếng Việt)..." : "Search languages..."}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Language Toggle List */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 overscroll-contain">
              {filteredBilingualLanguages.map((lang) => {
                const isSelected = context.secondaryLocales.includes(lang.code);
                const displayName = formatLanguageName(lang, currentLocale, false);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => context.toggleSecondaryLocale(lang.code)}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-900 font-extrabold border border-blue-200 shadow-2xs"
                        : "text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <span className="truncate pr-2 whitespace-pre leading-tight">
                      {displayName}
                    </span>
                    <span
                      className={`shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${
                        isSelected ? "bg-blue-600 text-white" : "text-slate-400"
                      }`}
                    >
                      {isSelected ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
              {filteredBilingualLanguages.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400 font-medium">
                  {isKo ? "검색 결과가 없습니다." : "No matching languages found."}
                </p>
              )}
            </div>

            {/* Footer with Done button */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">
                {isKo ? `${secondaryCount}개 병기 언어 선택됨` : `${secondaryCount} selected`}
              </span>
              <button
                type="button"
                onClick={() => setSecOpen(false)}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs font-black text-white shadow-2xs transition cursor-pointer"
              >
                {isKo ? "선택 완료" : "Done"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
