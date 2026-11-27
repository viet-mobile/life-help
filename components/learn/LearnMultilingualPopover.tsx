"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeSecLocales, setActiveSecLocales] = useState<Locale[]>(() => {
    return getInitialActiveLocales(currentLocale, secondaryLocales as Locale[], secondaryLocale as Locale);
  });
  const activeSecLocalesRef = useRef(activeSecLocales);
  activeSecLocalesRef.current = activeSecLocales;

  const applyLocales = (nextList: Locale[]) => {
    setActiveSecLocales(nextList);
    const domainAttr = typeof window !== "undefined" && window.location.hostname.toLowerCase().endsWith("life.help") ? "; domain=.life.help" : "";
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
    const maxAge = 31536000;
    try {
      if (nextList.length === 0) {
        localStorage.removeItem("life_help_secondary_locales");
        localStorage.removeItem("life_help_secondary_locale");
        localStorage.setItem("life_help_display_mode", "single");
        document.cookie = `life_help_display_mode=single; Path=/; Max-Age=${maxAge}; SameSite=Lax${domainAttr}${secure}`;
        document.cookie = `life_help_secondary_locale=; Path=/; Max-Age=0; SameSite=Lax${domainAttr}${secure}`;
        document.cookie = `life_help_secondary_locales=; Path=/; Max-Age=0; SameSite=Lax${domainAttr}${secure}`;
      } else {
        localStorage.setItem("life_help_secondary_locales", nextList.join(","));
        localStorage.setItem("life_help_secondary_locale", nextList[0]);
        localStorage.setItem("life_help_display_mode", "bilingual");
        document.cookie = `life_help_display_mode=bilingual; Path=/; Max-Age=${maxAge}; SameSite=Lax${domainAttr}${secure}`;
        document.cookie = `life_help_secondary_locale=${nextList[0]}; Path=/; Max-Age=${maxAge}; SameSite=Lax${domainAttr}${secure}`;
        document.cookie = `life_help_secondary_locales=${nextList.join("+")}; Path=/; Max-Age=${maxAge}; SameSite=Lax${domainAttr}${secure}`;
      }
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("life_help_secondary_locale_change"));
      window.dispatchEvent(new Event("life_help_display_mode_change"));
      window.dispatchEvent(new Event("storage"));
      const pathname = window.location.pathname;
      const { locale: currentUrlLocale, rest } = splitLocalePrefix(pathname);
      const effectivePrimary = currentUrlLocale || currentLocale;
      const secPart = nextList.length > 0 ? `/${nextList.join("+")}` : "";
      const targetPath = `/${effectivePrimary}${secPart}${rest === "/" ? "" : rest}`;
      if (targetPath !== pathname) {
        window.location.assign(`${targetPath}${window.location.search}${window.location.hash}`);
        return;
      }
    }
  };

  const updateCoords = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const screenW = window.innerWidth;
    const popoverW = Math.min(320, screenW - 24);
    let left = rect.left;
    if (left + popoverW > screenW - 12) {
      left = screenW - popoverW - 12;
    }
    if (left < 12) {
      left = 12;
    }
    setCoords({
      top: rect.bottom + 6,
      left,
      width: popoverW,
    });
  };

  const handleToggle = () => {
    if (!secOpen) {
      updateCoords();
      setSecOpen(true);
    } else {
      applyLocales(activeSecLocalesRef.current);
      setSecOpen(false);
    }
  };

  // Close secondary popover on outside click/touch
  useEffect(() => {
    if (!secOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        applyLocales(activeSecLocalesRef.current);
        setSecOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    window.addEventListener("resize", updateCoords);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      window.removeEventListener("resize", updateCoords);
    };
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
        if (prev.length >= 4) return prev; // Limit to max 4 secondary languages
        return [...prev, code];
      }
    });
  };

  const secondaryCount = activeSecLocales.length;
  const isKo = currentLocale === "ko";
  const catalogI18n = getCatalogI18n(currentLocale);

  const labelText = useMemo(() => {
    if (secondaryCount === 0) return catalogI18n.single;
    if (secondaryCount === 1) {
      const found = languages.find((l) => l.code === activeSecLocales[0]);
      const name = found ? formatLanguageName(found, currentLocale, false).split("\n")[0] : "";
      return `+ ${name}`;
    }
    return `+ ${secondaryCount} ${isKo ? "개 언어" : "langs"}`;
  }, [secondaryCount, activeSecLocales, currentLocale, isKo, catalogI18n]);

  return (
    <div className="relative inline-block shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="droplet-pill inline-flex items-center justify-between gap-1 h-[34px] min-h-[34px] px-2 sm:px-2.5 transition shrink-0 cursor-pointer border border-slate-200 bg-white shadow-2xs hover:border-blue-400 min-w-[72px] max-w-[115px] sm:max-w-[145px]"
        style={{ height: "34px", boxSizing: "border-box" }}
        aria-label="Multilingual display mode selection"
        aria-expanded={secOpen}
        title={isKo ? "다중 병기 언어 선택 (복수 선택 가능)" : "Select multilingual languages (multi-select)"}
      >
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <span className="text-xs shrink-0 select-none" aria-hidden="true">
            {secondaryCount > 0 ? "🈁" : "📄"}
          </span>
          <span className="font-bold text-[0.8rem] text-slate-800 truncate select-none leading-none">
            {labelText}
          </span>
        </div>

        {/* 메인 언어 선택 및 과목 선택과 완벽히 동일한 상하 방향 화살표(↕) 표시 */}
        <svg
          className="w-3 h-3 text-slate-500 shrink-0 ml-0.5 select-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </button>

      {/* Portal 렌더링: 조상 엘리먼트의 overflow / backdrop-filter 클리핑을 원천 차단하여 100% 확실하게 열림 */}
      {secOpen && mounted && coords && createPortal(
        <div
          ref={popoverRef}
          dir="ltr"
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 99999,
          }}
          className="droplet-card border border-slate-200/90 bg-white/98 p-3.5 shadow-2xl ring-1 ring-black/10 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
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
              onClick={() => {
                applyLocales(activeSecLocalesRef.current);
                setSecOpen(false);
              }}
              className="droplet-pill p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer flex items-center justify-center text-xs font-bold"
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
            className={`w-full flex items-center justify-between droplet-btn px-3 py-2 text-xs font-bold transition mb-2 cursor-pointer ${
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
              className="droplet-input w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
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
                  className={`w-full flex items-center justify-between droplet-btn px-3 py-2 text-left text-xs transition cursor-pointer ${
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
              className="droplet-btn bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-black text-white shadow-2xs transition cursor-pointer"
            >
              {isKo ? "선택 완료" : "Done"}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
