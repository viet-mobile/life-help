"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import {
  type Locale,
  defaultLocale,
  detectDeviceLocale,
  isValidLocale,
  languages,
  type LanguageMeta,
  translate,
} from "@/messages";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  tKo: (key: string) => string;
  tBilingual: (key: string, separator?: string) => string;
  formatBilingual: (targetText: string, koText: string, separator?: string) => string;
  currentMeta: LanguageMeta;
  languages: readonly LanguageMeta[];
  isReady: boolean;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

const STORAGE_KEY = "viet_mobile_locale";
const LOCALE_CHANGE_EVENT = "viet_mobile_locale_change";

let cachedLocale: Locale | null = null;

function getClientLocaleSnapshot(): Locale {
  if (cachedLocale) return cachedLocale;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isValidLocale(saved)) {
      cachedLocale = saved;
      return saved;
    }
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

function subscribe(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedLocale = null;
      callback();
    }
  };

  const handleCustom = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LOCALE_CHANGE_EVENT, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LOCALE_CHANGE_EVENT, handleCustom);
  };
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getClientLocaleSnapshot,
    getServerLocaleSnapshot,
  );

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

  const currentMeta =
    languages.find((item) => item.code === locale) ||
    languages.find((item) => item.code === defaultLocale)!;

  const t = useCallback((key: string) => translate(locale, key), [locale]);
  const tKo = useCallback((key: string) => translate("ko", key), []);

  const tBilingual = useCallback(
    (key: string, separator: string = " · ") => {
      const current = translate(locale, key);
      if (locale === "ko") return current;
      const ko = translate("ko", key);
      if (!ko || current === ko) return current;
      return `${current}${separator}${ko}`;
    },
    [locale],
  );

  const formatBilingual = useCallback(
    (targetText: string, koText: string, separator: string = " · ") => {
      if (locale === "ko") return koText || targetText;
      if (!koText || targetText === koText) return targetText;
      return `${targetText}${separator}${koText}`;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
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
