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
  registerDictionary,
  dictionaries,
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
  secondaryLocale: Locale | null;
  setSecondaryLocale: (locale: Locale | null) => void;
  secondaryLocales: Locale[];
  setSecondaryLocales: (locales: Locale[]) => void;
  toggleSecondaryLocale: (locale: Locale) => void;
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
  tSecondary: (key: string) => string;
  tSecondaryList: (key: string) => string[];
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

const SECONDARY_LOCALE_STORAGE_KEY = "life_help_secondary_locale";
const SECONDARY_LOCALES_STORAGE_KEY = "life_help_secondary_locales";
const SECONDARY_LOCALE_CHANGE_EVENT = "life_help_secondary_locale_change";
const EMPTY_SECONDARY_LOCALES_STR = "";

function getCookieDomainAttr(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith("life.help")) {
    return "; domain=.life.help";
  }
  return "";
}


let cachedSecondaryLocalesStr: string | null = null;
let lastKnownSecPathname: string | null = null;

function getClientSecondaryLocalesStringSnapshot(): string {
  if (typeof window === "undefined") return EMPTY_SECONDARY_LOCALES_STR;

  const currentPath = window.location.pathname;

  // 1. Explicit secondary locales in the URL take top priority
  const urlSecLocales = resolveSecondaryLocalesFromPath(currentPath);
  if (urlSecLocales.length > 0) {
    const joined = urlSecLocales.join(",");
    cachedSecondaryLocalesStr = joined;
    lastKnownSecPathname = currentPath;
    return joined;
  }

  // 2. Return cached in-memory snapshot if pathname has not changed
  if (cachedSecondaryLocalesStr !== null && lastKnownSecPathname === currentPath) {
    return cachedSecondaryLocalesStr;
  }
  lastKnownSecPathname = currentPath;

  // 3. Persistent preference across page navigation: check localStorage and cookies
  try {
    const mode = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY) || document.cookie.match(/life_help_display_mode=([^;]+)/)?.[1];
    if (mode === "monolingual" || mode === "single") {
      cachedSecondaryLocalesStr = EMPTY_SECONDARY_LOCALES_STR;
      return EMPTY_SECONDARY_LOCALES_STR;
    }

    const savedList = localStorage.getItem(SECONDARY_LOCALES_STORAGE_KEY);
    if (savedList) {
      const parsed = savedList.split(/[,+]/).filter((s): s is Locale => isValidLocale(s));
      if (parsed.length > 0) {
        cachedSecondaryLocalesStr = parsed.join(",");
        return cachedSecondaryLocalesStr;
      }
    }
    const savedSingle = localStorage.getItem(SECONDARY_LOCALE_STORAGE_KEY);
    if (savedSingle && isValidLocale(savedSingle)) {
      cachedSecondaryLocalesStr = savedSingle;
      return savedSingle;
    }

    // Check cookies (shared across subdomains e.g. physics.life.help -> chemistry.life.help)
    const cookieMulti = document.cookie.match(/life_help_secondary_locales=([^;]+)/)?.[1];
    if (cookieMulti) {
      const parsed = cookieMulti.split(/[,+]/).filter((s): s is Locale => isValidLocale(s));
      if (parsed.length > 0) {
        cachedSecondaryLocalesStr = parsed.join(",");
        return cachedSecondaryLocalesStr;
      }
    }
    const cookieSingle = document.cookie.match(/life_help_secondary_locale=([^;]+)/)?.[1];
    if (cookieSingle && isValidLocale(cookieSingle)) {
      cachedSecondaryLocalesStr = cookieSingle;
      return cookieSingle;
    }

    if (mode === "bilingual" || mode === "multilingual") {
      const mainLocale = getClientLocaleSnapshot();
      const def = mainLocale === "ko" ? "en" : "ko";
      cachedSecondaryLocalesStr = def;
      return def;
    }
  } catch {
    // ignore
  }

  cachedSecondaryLocalesStr = EMPTY_SECONDARY_LOCALES_STR;
  return EMPTY_SECONDARY_LOCALES_STR;
}

function getClientSecondaryLocaleSnapshot(): Locale | null {
  const str = getClientSecondaryLocalesStringSnapshot();
  if (!str) return null;
  const first = str.split(",")[0];
  return isValidLocale(first) ? (first as Locale) : null;
}

function getServerSecondaryLocalesStringSnapshot(): string {
  return EMPTY_SECONDARY_LOCALES_STR;
}

function getServerSecondaryLocaleSnapshot(): Locale | null {
  return null;
}

function subscribeSecondaryLocale(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (
      e.key === SECONDARY_LOCALE_STORAGE_KEY ||
      e.key === SECONDARY_LOCALES_STORAGE_KEY ||
      e.key === DISPLAY_MODE_STORAGE_KEY
    ) {
      cachedSecondaryLocalesStr = null;
      callback();
    }
  };
  const handleCustom = () => {
    callback();
  };
  const handlePopState = () => {
    cachedSecondaryLocalesStr = null;
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SECONDARY_LOCALE_CHANGE_EVENT, handleCustom);
  window.addEventListener("popstate", handlePopState);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SECONDARY_LOCALE_CHANGE_EVENT, handleCustom);
    window.removeEventListener("popstate", handlePopState);
  };
}

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

/**
 * Resolves a URL path's second segment into valid supported Locales if present (e.g. /vi/ko -> [ko], /vi/ko,en -> [ko, en]).
 */
export function resolveSecondaryLocalesFromPath(pathname?: string | null): Locale[] {
  if (!pathname) return [];
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return [];

  const first = resolveLocaleFromPath("/" + segments[0]);
  if (!first) return [];

  const rawSecond = segments[1];
  const candidates = rawSecond.split(/[,+]/).filter(Boolean);
  const result: Locale[] = [];
  for (const cand of candidates) {
    const loc = resolveLocaleFromPath("/" + cand);
    if (loc && loc !== first && !result.includes(loc)) {
      result.push(loc);
    }
  }
  return result;
}

export function resolveSecondaryLocaleFromPath(pathname?: string | null): Locale | null {
  const list = resolveSecondaryLocalesFromPath(pathname);
  return list.length > 0 ? list[0] : null;
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
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    const urlSecLocale = resolveSecondaryLocaleFromPath(currentPath);
    if (urlSecLocale) {
      cachedDisplayMode = "bilingual";
      return "bilingual";
    }
  }
  if (cachedDisplayMode) return cachedDisplayMode;
  try {
    const saved = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY) || document.cookie.match(/life_help_display_mode=([^;]+)/)?.[1];
    if (saved === "bilingual" || saved === "multilingual") {
      cachedDisplayMode = "bilingual";
      return "bilingual";
    }
    if (saved === "monolingual" || saved === "single") {
      cachedDisplayMode = "monolingual";
      return "monolingual";
    }
    const secList = localStorage.getItem(SECONDARY_LOCALES_STORAGE_KEY) || document.cookie.match(/life_help_secondary_locales=([^;]+)/)?.[1];
    if (secList && secList.trim().length > 0) {
      cachedDisplayMode = "bilingual";
      return "bilingual";
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

  const secondaryLocalesStr = useSyncExternalStore(
    subscribeSecondaryLocale,
    getClientSecondaryLocalesStringSnapshot,
    getServerSecondaryLocalesStringSnapshot,
  );

  const secondaryLocales: Locale[] = React.useMemo(() => {
    if (!secondaryLocalesStr) return [];
    return secondaryLocalesStr.split(",").filter((s): s is Locale => isValidLocale(s));
  }, [secondaryLocalesStr]);

  const secondaryLocale = secondaryLocales.length > 0 ? secondaryLocales[0] : null;

  const [dictVersion, setDictVersion] = React.useState(0);

  // Dynamically load translation dictionary from static assets for non-anchor languages
  useEffect(() => {
    if (typeof window === "undefined") return;

    const needed: Locale[] = [];
    if (locale && !dictionaries[locale] && !needed.includes(locale)) {
      needed.push(locale);
    }
    for (const sec of secondaryLocales) {
      if (sec && !dictionaries[sec] && !needed.includes(sec)) {
        needed.push(sec);
      }
    }

    if (needed.length === 0) return;

    let active = true;
    const pending: Locale[] = [];

    // Check sessionStorage first for instantaneous zero-latency dictionary hydration
    for (const loc of needed) {
      try {
        const cached = sessionStorage.getItem(`life_help_dict_${loc}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          registerDictionary(loc, parsed);
        } else {
          pending.push(loc);
        }
      } catch {
        pending.push(loc);
      }
    }

    if (pending.length === 0) {
      setDictVersion((v) => v + 1);
      return;
    }

    Promise.all(
      pending.map(async (loc) => {
        try {
          const res = await fetch(`/messages/${loc}.json`);
          if (res.ok) {
            const data = await res.json();
            registerDictionary(loc, data);
            try {
              sessionStorage.setItem(`life_help_dict_${loc}`, JSON.stringify(data));
            } catch {}
            return true;
          }
        } catch (e) {
          console.warn(`[LocaleContext] Failed to load /messages/${loc}.json`, e);
        }
        return false;
      })
    ).then((results) => {
      if (active && results.some(Boolean)) {
        setDictVersion((v) => v + 1);
      }
    });

    return () => {
      active = false;
    };
  }, [locale, secondaryLocales]);

  const [script, setScriptState] = React.useState<ScriptType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`life_help_script_${locale}`) as ScriptType;
      if (saved === "latn" || saved === "cyrl" || saved === "hant" || saved === "hans") return saved;
    }
    return DUAL_SCRIPT_LANGUAGES[locale]?.defaultScript || "latn";
  });

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem(`life_help_script_${locale}`) as ScriptType) : null;
    if (saved === "latn" || saved === "cyrl" || saved === "hant" || saved === "hans") {
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
    cachedSecondaryLocalesStr = null;
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
    window.dispatchEvent(new Event(SECONDARY_LOCALE_CHANGE_EVENT));
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
      const domainAttr = getCookieDomainAttr();
      const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${STORAGE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax${domainAttr}${secure}`;
      document.cookie = `learn_lang=${newLocale}; path=/; max-age=31536000; SameSite=Lax${domainAttr}${secure}`;
      window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }, []);

  const setSecondaryLocales = useCallback((locs: Locale[]) => {
    const valid = Array.from(new Set(locs.filter(isValidLocale)));
    const str = valid.join(",");
    cachedSecondaryLocalesStr = str;
    try {
      if (valid.length > 0) {
        localStorage.setItem(SECONDARY_LOCALES_STORAGE_KEY, str);
        localStorage.setItem(SECONDARY_LOCALE_STORAGE_KEY, valid[0]);
        localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, "bilingual");
        const domainAttr = getCookieDomainAttr();
        const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${SECONDARY_LOCALES_STORAGE_KEY}=${str}; path=/; max-age=31536000; SameSite=Lax${domainAttr}${secure}`;
        document.cookie = `${SECONDARY_LOCALE_STORAGE_KEY}=${valid[0]}; path=/; max-age=31536000; SameSite=Lax${domainAttr}${secure}`;
        document.cookie = `${DISPLAY_MODE_STORAGE_KEY}=bilingual; path=/; max-age=31536000; SameSite=Lax${domainAttr}${secure}`;
      } else {
        localStorage.removeItem(SECONDARY_LOCALES_STORAGE_KEY);
        localStorage.removeItem(SECONDARY_LOCALE_STORAGE_KEY);
        localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, "monolingual");
        const domainAttr = getCookieDomainAttr();
        const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${SECONDARY_LOCALES_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax${domainAttr}${secure}`;
        document.cookie = `${SECONDARY_LOCALE_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax${domainAttr}${secure}`;
        document.cookie = `${DISPLAY_MODE_STORAGE_KEY}=monolingual; path=/; max-age=31536000; SameSite=Lax${domainAttr}${secure}`;
      }

      // Update URL if the URL currently starts with a primary locale
      if (typeof window !== "undefined") {
        const currentPathname = window.location.pathname;
        const primary = resolveLocaleFromPath(currentPathname);
        if (primary) {
          const currentSecs = resolveSecondaryLocalesFromPath(currentPathname);
          const segments = currentPathname.split("/").filter(Boolean);
          const restSegments = currentSecs.length > 0 ? segments.slice(2) : segments.slice(1);
          const restPath = restSegments.length > 0 ? "/" + restSegments.join("/") : "";
          const secPart = valid.length > 0 ? `/${valid.join("+")}` : "";
          const newPath = `/${primary}${secPart}${restPath}` || "/";
          lastKnownSecPathname = newPath;
          if (newPath !== currentPathname) {
            window.history.replaceState(null, "", `${newPath}${window.location.search}${window.location.hash}`);
          }
        }
      }

      window.dispatchEvent(new Event(SECONDARY_LOCALE_CHANGE_EVENT));
      window.dispatchEvent(new Event(DISPLAY_MODE_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }, []);

  const toggleSecondaryLocale = useCallback((target: Locale) => {
    let next: Locale[];
    if (secondaryLocales.includes(target)) {
      next = secondaryLocales.filter((l) => l !== target);
    } else {
      if (secondaryLocales.length >= 4) return;
      next = [...secondaryLocales, target];
    }
    setSecondaryLocales(next);
  }, [secondaryLocales, setSecondaryLocales]);

  const setSecondaryLocale = useCallback((sec: Locale | null) => {
    setSecondaryLocales(sec ? [sec] : []);
  }, [setSecondaryLocales]);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    cachedDisplayMode = mode;
    try {
      localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, mode);
      document.cookie = `${DISPLAY_MODE_STORAGE_KEY}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
      if (mode === "monolingual") {
        setSecondaryLocales([]);
      } else {
        const currentSecsStr = getClientSecondaryLocalesStringSnapshot();
        if (!currentSecsStr) {
          setSecondaryLocales([locale === "ko" ? "en" : "ko"]);
        }
      }
      window.dispatchEvent(new Event(DISPLAY_MODE_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }, [locale, setSecondaryLocales]);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(secondaryLocales.length > 0 ? "monolingual" : "bilingual");
  }, [secondaryLocales, setDisplayMode]);

  const isBilingual = secondaryLocales.length > 0 && secondaryLocales.some((l) => l !== locale);

  const currentMeta =
    languages.find((item) => item.code === locale) ||
    languages.find((item) => item.code === defaultLocale)!;

  const t = useCallback(
    (key: string) => {
      const raw = translate(locale, key);
      return convertScript(raw, locale, script);
    },
    [locale, script, dictVersion],
  );
  const tKo = useCallback((key: string) => translate("ko", key), [dictVersion]);
  const tSecondary = useCallback((key: string) => {
    if (!secondaryLocale) return "";
    return translate(secondaryLocale, key);
  }, [secondaryLocale, dictVersion]);

  const tSecondaryList = useCallback((key: string) => {
    return secondaryLocales.map((loc) => translate(loc, key));
  }, [secondaryLocales, dictVersion]);

  const tBilingual = useCallback(
    (key: string, separator?: string) => {
      const rawCurrent = translate(locale, key);
      const current = convertScript(rawCurrent, locale, script);
      if (!secondaryLocale || secondaryLocale === locale || displayMode === "monolingual") return current;
      const sec = translate(secondaryLocale, key);
      if (!sec || current === sec) return current;
      const actualSeparator = getBilingualSeparator(current, sec, separator);
      return `${current}${actualSeparator}${sec}`;
    },
    [locale, secondaryLocale, displayMode, script, dictVersion],
  );

  const formatBilingual = useCallback(
    (targetText: string, secondaryText: string, separator?: string) => {
      const convertedTarget = convertScript(targetText, locale, script);
      if (!secondaryLocale || secondaryLocale === locale || displayMode === "monolingual") return convertedTarget;
      if (!secondaryText || convertedTarget === secondaryText) return convertedTarget;
      const actualSeparator = getBilingualSeparator(convertedTarget, secondaryText, separator);
      return `${convertedTarget}${actualSeparator}${secondaryText}`;
    },
    [locale, secondaryLocale, displayMode, script, dictVersion],
  );

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        secondaryLocale,
        setSecondaryLocale,
        secondaryLocales,
        setSecondaryLocales,
        toggleSecondaryLocale,
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
        tSecondary,
        tSecondaryList,
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
      secondaryLocale: null,
      setSecondaryLocale: () => {},
      secondaryLocales: [],
      setSecondaryLocales: () => {},
      toggleSecondaryLocale: () => {},
      script: "latn",
      setScript: () => {},
      isDualScript: false,
      scriptMeta: null,
      displayMode: "monolingual",
      setDisplayMode: () => {},
      toggleDisplayMode: () => {},
      isBilingual: false,
      t: (key: string) => translate(defaultLocale, key),
      tKo: (key: string) => translate("ko", key),
      tSecondary: () => "",
      tSecondaryList: () => [],
      tBilingual: (key: string) => translate(defaultLocale, key),
      formatBilingual: (targetText: string) => targetText,
      currentMeta: languages[0],
      languages,
      isReady: true,
    };
  }
  return ctx;
}
