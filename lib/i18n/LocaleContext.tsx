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
import { COUNTRY_TO_LANGUAGE_MAP } from "@/lib/i18n/siteMetadata";
import {
  convertScript,
  isDualScriptLocale,
  DUAL_SCRIPT_LANGUAGES,
  type ScriptType,
  type DualScriptMeta,
} from "@/lib/i18n/scriptConverter";

export type { ScriptType, DualScriptMeta };
export { isDualScriptLocale, DUAL_SCRIPT_LANGUAGES, convertScript };

export type DisplayMode = "bilingual" | "monolingual";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  script: ScriptType;
  setScript: (script: ScriptType) => void;
  isDualScript: boolean;
  scriptMeta: DualScriptMeta | null;
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
 * Determines whether a bilingual phrase is considered long and should be rendered
 * on two separate lines (newline "\n" without the dot " · ").
 * Short phrases/labels (e.g. "Cancel · 취소", "Detail · 상세") remain on a single line.
 */
export function getBilingualSeparator(
  targetText: string,
  koText: string,
  customSeparator?: string,
): string {
  if (customSeparator !== undefined) {
    return customSeparator;
  }
  const cleanTarget = targetText.trim();
  const cleanKo = koText.trim();

  // If combined length is 18+ characters, or either text is 10+ characters,
  // or contains commas/slashes (e.g. lists of items like "변기, 싱크대, 하수구 등..."),
  // treat as long phrase and format across two lines with newline "\n" without the dot " · ".
  // Short UI buttons/labels (e.g. Cancel · 취소, Detail · 상세, Apply · 신청) remain on a single line.
  const isLong =
    cleanTarget.length + cleanKo.length >= 18 ||
    cleanTarget.length >= 10 ||
    cleanKo.length >= 10 ||
    cleanTarget.includes(",") ||
    cleanKo.includes(",") ||
    cleanTarget.includes("/") ||
    cleanKo.includes("/");

  return isLong ? "\n" : " · ";
}

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
 * Also supports every locale of the registry in messages/index.ts.
 */
export function resolveLocaleFromPath(pathname?: string | null): Locale | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const firstSegment = segments[0];
  const lower = firstSegment.toLowerCase();

  // Explicit mappings required by LIFE.HELP routing
  if (lower === "sg") return "fr";
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

export function getDomainLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  const parts = host.split(".");
  if (parts.length >= 3 && parts[parts.length - 1] === "help") {
    const candidateCountry =
      parts[0] === "tech" || parts[0] === "chat" || parts[0] === "sys"
        ? parts[1]
        : parts[0];
    if (candidateCountry && COUNTRY_TO_LANGUAGE_MAP[candidateCountry]) {
      const mapped = COUNTRY_TO_LANGUAGE_MAP[candidateCountry];
      if (isValidLocale(mapped)) return mapped;
    }
  }
  return null;
}

function getClientLocaleSnapshot(): Locale {
  if (typeof window === "undefined") return defaultLocale;

  const currentPath = window.location.pathname;
  const urlLocale = resolveLocaleFromPath(currentPath);

  // 1. If URL has a language segment, URL language takes highest priority
  if (urlLocale) {
    cachedLocale = urlLocale;
    lastKnownPathname = currentPath;
    return urlLocale;
  }

  // 2. Explicit user selection in localStorage (kept across navigation)
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved === "sg") {
      localStorage.setItem(STORAGE_KEY, "fr");
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      cachedLocale = "fr";
      return "fr";
    }
    if (saved && isValidLocale(saved)) {
      cachedLocale = saved;
      return saved;
    }
  } catch {
    // storage unavailable: fall through
  }

  // 3. Cached locale from explicit setLocale call in memory
  if (cachedLocale) {
    return cachedLocale;
  }

  // 4. Host domain (e.g. vietnam.life.help -> vi)
  const domainLocale = getDomainLocale();
  if (domainLocale) {
    cachedLocale = domainLocale;
    return domainLocale;
  }

  // 5. Server-rendered initial locale
  if (ssrInitialLocale && isValidLocale(ssrInitialLocale)) {
    return ssrInitialLocale;
  }

  // 6. Device locale fallback
  try {
    const detected = detectDeviceLocale();
    cachedLocale = detected;
    return detected;
  } catch {
    return defaultLocale;
  }
}

let ssrInitialLocale: Locale = defaultLocale;

function getServerLocaleSnapshot(): Locale {
  return ssrInitialLocale || defaultLocale;
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

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  if (initialLocale && isValidLocale(initialLocale)) {
    ssrInitialLocale = initialLocale;
  }

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

  const [script, setScriptState] = React.useState<ScriptType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`life_help_script_${locale}`);
      if (saved === "latn" || saved === "cyrl") return saved;
    }
    return DUAL_SCRIPT_LANGUAGES[locale]?.defaultScript || "latn";
  });

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(`life_help_script_${locale}`) : null;
    if (saved === "latn" || saved === "cyrl") {
      setScriptState(saved);
    } else {
      setScriptState(DUAL_SCRIPT_LANGUAGES[locale]?.defaultScript || "latn");
    }
  }, [locale]);

  const setScript = useCallback(
    (newScript: ScriptType) => {
      setScriptState(newScript);
      try {
        localStorage.setItem(`life_help_script_${locale}`, newScript);
      } catch {
        // ignore
      }
    },
    [locale],
  );

  const isDualScript = isDualScriptLocale(locale);
  const scriptMeta = isDualScript ? DUAL_SCRIPT_LANGUAGES[locale] : null;

  // Sync client-side route changes with the locale external store
  useEffect(() => {
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }, [pathname]);

  // Post-hydration storage sync: if URL has no language prefix and localStorage has a saved user preference,
  // transition safely after hydration completes without SSR mismatch errors.
  useEffect(() => {
    try {
      const urlLoc = resolveLocaleFromPath(window.location.pathname);
      if (!urlLoc) {
        const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (saved && isValidLocale(saved) && saved !== locale) {
          setLocale(saved);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Learning sites set lang/dir on the server from their own locale source; do not overwrite it with the marketplace locale.
    if (typeof document !== "undefined" && !document.documentElement.hasAttribute("data-learn")) {
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

  const t = useCallback(
    (key: string) => {
      const raw = translate(locale, key);
      return convertScript(raw, locale, script);
    },
    [locale, script],
  );
  const tKo = useCallback((key: string) => translate("ko", key), []);

  const tBilingual = useCallback(
    (key: string, separator?: string) => {
      const rawCurrent = translate(locale, key);
      const current = convertScript(rawCurrent, locale, script);
      if (locale === "ko" || displayMode === "monolingual") return current;
      const ko = translate("ko", key);
      if (!ko || current === ko) return current;
      const actualSeparator = getBilingualSeparator(current, ko, separator);
      return `${current}${actualSeparator}${ko}`;
    },
    [locale, displayMode, script],
  );

  const formatBilingual = useCallback(
    (targetText: string, koText: string, separator?: string) => {
      const convertedTarget = convertScript(targetText, locale, script);
      if (locale === "ko") return koText || convertedTarget;
      if (displayMode === "monolingual") return convertedTarget;
      if (!koText || convertedTarget === koText) return convertedTarget;
      const actualSeparator = getBilingualSeparator(convertedTarget, koText, separator);
      return `${convertedTarget}${actualSeparator}${koText}`;
    },
    [locale, displayMode, script],
  );

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        script,
        setScript,
        isDualScript,
        scriptMeta,
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
      script: "latn",
      setScript: () => {},
      isDualScript: false,
      scriptMeta: null,
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
