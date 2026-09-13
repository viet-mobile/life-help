"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import {
  type Locale,
  defaultLocale,
  detectDeviceLocale,
  isValidLocale,
  languages,
  locales,
  type LanguageMeta,
  translate,
} from "@/messages";

export type DisplayMode = "bilingual" | "monolingual";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleDisplayMode: () => void;
  isBilingual: boolean;
  t: (key: string) => string;
  tKo: (key: string) => string;
  tBilingual: (key: string, separator?: string) => string;
  formatBilingual: (targetText: string, koText: string, separator?: string) => string;
  currentMeta: LanguageMeta;
  languages: readonly LanguageMeta[];
  isReady: boolean;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

const STORAGE_KEY = "life_help_locale";
const LEGACY_STORAGE_KEY = "viet_mobile_locale";
const LOCALE_CHANGE_EVENT = "life_help_locale_change";

const DISPLAY_MODE_STORAGE_KEY = "life_help_display_mode";
const DISPLAY_MODE_CHANGE_EVENT = "life_help_display_mode_change";

/**
 * Resolves a URL path's first segment into a valid supported Locale.
 * Priority mappings:
 *   /vi -> vi
 *   /ko -> ko
 *   /en -> en
 *   /ja -> ja
 *   /zt -> zh-Hant
 *   /zs -> zh-Hans
 *   /zh -> zh-Hans
 * Also supports all 38 locales from messages.
 */
export function resolveLocaleFromPath(pathname?: string | null): Locale | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const firstSegment = segments[0];
  const lower = firstSegment.toLowerCase();

  // Explicit mappings required by LIFE.HELP routing
  if (lower === "zt") return "zh-Hant";
  if (lower === "zs" || lower === "zh") return "zh-Hans";

  // Check direct valid locale match
  if (isValidLocale(firstSegment)) {
    return firstSegment;
  }

  // Case-insensitive match against all supported locales in messages (e.g. zh-hans -> zh-Hans)
  const matched = (locales as readonly string[]).find(
    (l) => l.toLowerCase() === lower
  );
  if (matched && isValidLocale(matched)) {
    return matched;
  }

  return null;
}

let cachedLocale: Locale | null = null;
let lastKnownPathname: string | null = null;
let cachedDisplayMode: DisplayMode | null = null;

function getClientLocaleSnapshot(): Locale {
  if (typeof window === "undefined") return defaultLocale;

  const currentPath = window.location.pathname;
  const urlLocale = resolveLocaleFromPath(currentPath);

  // If the pathname changed (navigation or initial load)
  if (currentPath !== lastKnownPathname) {
    lastKnownPathname = currentPath;

    // 1. If URL contains a valid language segment, URL language ALWAYS takes highest priority
    if (urlLocale) {
      cachedLocale = urlLocale;
      return urlLocale;
    } else {
      // Path has no language prefix; reset URL-forced cache so localStorage/device locale is used
      cachedLocale = null;
    }
  }

  // If locale was explicitly selected via setLocale during this view, return cachedLocale
  if (cachedLocale) {
    return cachedLocale;
  }

  // 1 (Fallback for initial evaluation): If URL has language, use it
  if (urlLocale) {
    cachedLocale = urlLocale;
    return urlLocale;
  }

  // 2. Otherwise check localStorage (existing behavior)
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved && isValidLocale(saved)) {
      cachedLocale = saved;
      return saved;
    }

    // 3. Otherwise detect device locale (existing behavior)
    const detected = detectDeviceLocale();
    cachedLocale = detected;
    return detected;
  } catch {
    return defaultLocale;
  }
}

function getServerLocaleSnapshot(): Locale {
  return defaultLocale;
}

function getClientDisplayModeSnapshot(): DisplayMode {
  if (cachedDisplayMode) return cachedDisplayMode;
  try {
    const saved = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
    if (saved === "monolingual" || saved === "bilingual") {
      cachedDisplayMode = saved;
      return saved;
    }
  } catch {
    // ignore
  }
  return "monolingual";
}

function getServerDisplayModeSnapshot(): DisplayMode {
  return "monolingual";
}

function subscribeLocale(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      const currentUrlLocale = typeof window !== "undefined" ? resolveLocaleFromPath(window.location.pathname) : null;
      if (!currentUrlLocale) {
        cachedLocale = null;
        callback();
      }
    }
  };

  const handleCustom = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LOCALE_CHANGE_EVENT, handleCustom);
  window.addEventListener("popstate", handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LOCALE_CHANGE_EVENT, handleCustom);
    window.removeEventListener("popstate", handleCustom);
  };
}

function subscribeDisplayMode(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === DISPLAY_MODE_STORAGE_KEY) {
      cachedDisplayMode = null;
      callback();
    }
  };

  const handleCustom = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(DISPLAY_MODE_CHANGE_EVENT, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(DISPLAY_MODE_CHANGE_EVENT, handleCustom);
  };
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const locale = useSyncExternalStore(
    subscribeLocale,
    getClientLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  const displayMode = useSyncExternalStore(
    subscribeDisplayMode,
    getClientDisplayModeSnapshot,
    getServerDisplayModeSnapshot,
  );

  // Sync client-side route changes with the locale external store
  useEffect(() => {
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }, [pathname]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      const meta = languages.find((item) => item.code === locale);
      document.documentElement.dir = meta?.dir || "ltr";
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    cachedLocale = newLocale;
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `${STORAGE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }, []);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    cachedDisplayMode = mode;
    try {
      localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, mode);
      document.cookie = `${DISPLAY_MODE_STORAGE_KEY}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new Event(DISPLAY_MODE_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }, []);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(displayMode === "bilingual" ? "monolingual" : "bilingual");
  }, [displayMode, setDisplayMode]);

  const isBilingual = displayMode === "bilingual" && locale !== "ko";

  const currentMeta =
    languages.find((item) => item.code === locale) ||
    languages.find((item) => item.code === defaultLocale)!;

  const t = useCallback((key: string) => translate(locale, key), [locale]);
  const tKo = useCallback((key: string) => translate("ko", key), []);

  const tBilingual = useCallback(
    (key: string, separator: string = " · ") => {
      const current = translate(locale, key);
      if (locale === "ko" || displayMode === "monolingual") return current;
      const ko = translate("ko", key);
      if (!ko || current === ko) return current;
      return `${current}${separator}${ko}`;
    },
    [locale, displayMode],
  );

  const formatBilingual = useCallback(
    (targetText: string, koText: string, separator: string = " · ") => {
      if (locale === "ko") return koText || targetText;
      if (displayMode === "monolingual") return targetText;
      if (!koText || targetText === koText) return targetText;
      return `${targetText}${separator}${koText}`;
    },
    [locale, displayMode],
  );

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        displayMode,
        setDisplayMode,
        toggleDisplayMode,
        isBilingual,
        t,
        tKo,
        tBilingual,
        formatBilingual,
        currentMeta,
        languages,
        isReady: true,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: defaultLocale,
      setLocale: () => {},
      displayMode: "bilingual",
      setDisplayMode: () => {},
      toggleDisplayMode: () => {},
      isBilingual: true,
      t: (key: string) => translate(defaultLocale, key),
      tKo: (key: string) => translate("ko", key),
      tBilingual: (key: string) => translate(defaultLocale, key),
      formatBilingual: (targetText: string) => targetText,
      currentMeta: languages[0],
      languages,
      isReady: true,
    };
  }
  return ctx;
}
