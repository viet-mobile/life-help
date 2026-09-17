// lib/shortcut/desktopShortcut.ts
import {
  SITE_METADATA,
  COUNTRY_TO_LANGUAGE_MAP,
} from "@/lib/i18n/siteMetadata";

export interface DomainShortcutDetails {
  host: string;
  portal: "tech" | "chat" | "sys" | "customer";
  country: string | null;
  countryDisplayName: string;
  lang: string;
  canonicalDomain: string;
  canonicalUrl: string;
  title: string;
  shortName: string;
  description: string;
  iconPngUrl: string;
  iconIcoUrl: string;
  urlFileContent: string;
  suggestedFileName: string;
}

export const COUNTRY_KOREAN_NAMES: Record<string, string> = {
  korea: "한국",
  japan: "일본",
  china: "중국",
  taiwan: "대만",
  vietnam: "베트남",
  philippines: "필리핀",
  indonesia: "인도네시아",
  russia: "러시아",
  uzbek: "우즈베키스탄",
  nepal: "네팔",
  india: "인도",
  cambodia: "캄보디아",
  thailand: "태국",
  myanmar: "미얀마",
  srilanka: "스리랑카",
  kazakh: "카자흐스탄",
  france: "프랑스",
  deutsch: "독일",
  turkiye: "튀르키예",
  ukraina: "우크라이나",
  timorleste: "동티모르",
  uae: "아랍에미리트",
  italia: "이탈리아",
  egypt: "이집트",
  espania: "스페인",
  iran: "이란",
  netherland: "네덜란드",
  poland: "폴란드",
  ethiopia: "에티오피아",
  sweden: "스웨덴",
  israel: "이스라엘",
  denmark: "덴마크",
  norway: "노르웨이",
  mongol: "몽골",
  mexico: "멕시코",
  brazil: "브라질",
  greece: "그리스",
  portugal: "포르투갈",
  southafrica: "남아프리카공화국",
  swiss: "스위스",
  pakistan: "파키스탄",
  saudiarabia: "사우디아라비아",
  yemen: "예멘",
  iraq: "이라크",
  bangladesh: "방글라데시",
  us: "미국",
  uk: "영국",
  canada: "캐나다",
  australia: "호주",
  newzealand: "뉴질랜드",
  singapore: "싱가포르",
  malaysia: "말레이시아",
  nigeria: "나이지리아",
};

/**
 * Resolves full domain, country, portal, and localized site URL description
 * for desktop shortcut generation and Web App Manifest.
 */
export function getDomainShortcutDetails(options?: {
  host?: string | null;
  pathname?: string | null;
  localeOverride?: string | null;
  searchParams?: URLSearchParams | null;
}): DomainShortcutDetails {
  const host = (options?.host || "").split(":")[0].toLowerCase().trim();
  const pathname = options?.pathname || "/";
  const searchParams = options?.searchParams;

  // 1. Detect Portal
  let portal: "tech" | "chat" | "sys" | "customer" = "customer";
  if (host === "tech.life.help" || host.startsWith("tech.")) {
    portal = "tech";
  } else if (host === "chat.life.help" || host.startsWith("chat.")) {
    portal = "chat";
  } else if (host === "sys.life.help" || host.startsWith("sys.")) {
    portal = "sys";
  } else if (searchParams?.get("portal")) {
    const p = searchParams.get("portal")?.toLowerCase();
    if (p === "tech" || p === "chat" || p === "sys") {
      portal = p;
    }
  }

  // 2. Detect Country
  let country: string | null = null;
  const parts = host.split(".");

  if (parts.length >= 3 && parts[parts.length - 1] === "help") {
    if (parts[0] === "tech" || parts[0] === "chat" || parts[0] === "sys") {
      const candidate = parts[1];
      if (candidate && COUNTRY_TO_LANGUAGE_MAP[candidate]) {
        country = candidate;
      }
    } else {
      const candidate = parts[0];
      if (candidate && COUNTRY_TO_LANGUAGE_MAP[candidate]) {
        country = candidate;
      }
    }
  } else if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    if (parts[0] === "tech" || parts[0] === "chat" || parts[0] === "sys") {
      const candidate = parts[1];
      if (candidate && COUNTRY_TO_LANGUAGE_MAP[candidate]) {
        country = candidate;
      }
    } else {
      const candidate = parts[0];
      if (candidate && COUNTRY_TO_LANGUAGE_MAP[candidate]) {
        country = candidate;
      }
    }
  }

  if (!country && searchParams?.get("country")) {
    const c = searchParams.get("country")?.toLowerCase() || "";
    if (COUNTRY_TO_LANGUAGE_MAP[c]) {
      country = c;
    }
  }

  // 3. Detect Language
  let lang = options?.localeOverride || "";
  if (!lang) {
    const firstSegment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
    if (firstSegment && COUNTRY_TO_LANGUAGE_MAP[firstSegment]) {
      lang = firstSegment;
    }
  }
  if (!lang && country && COUNTRY_TO_LANGUAGE_MAP[country]) {
    lang = COUNTRY_TO_LANGUAGE_MAP[country];
  }
  if (!lang) {
    lang = "ko";
  }

  // 4. Resolve Localized Metadata Translation
  const meta = SITE_METADATA[lang] || SITE_METADATA["ko"];
  const isKorean = lang === "ko";

  // 5. Canonical Domain & URL
  let canonicalDomain = host;
  if (!canonicalDomain || canonicalDomain.includes("localhost") || canonicalDomain === "127.0.0.1") {
    if (portal !== "customer" && country) {
      canonicalDomain = `${portal}.${country}.life.help`;
    } else if (portal !== "customer") {
      canonicalDomain = `${portal}.life.help`;
    } else if (country) {
      canonicalDomain = `${country}.life.help`;
    } else {
      canonicalDomain = "korea.life.help";
    }
  }

  const cleanPath = !pathname || pathname === "/" ? "/" : pathname;
  const canonicalUrl = `https://${canonicalDomain}${cleanPath}`;

  // 6. Title, Short Name, and Description
  // STRICT USER RULE: ABSOLUTELY ZERO PARENTHESES () IN KOREAN TEXT (USE · OR NEWLINE ONLY)
  let title = "";
  let shortName = "";
  let description = "";

  const countryDisplayName = country ? (COUNTRY_KOREAN_NAMES[country] || country.toUpperCase()) : "글로벌";

  if (portal === "tech") {
    title = isKorean
      ? "LIFE.HELP TECH · 헬퍼 포털"
      : `LIFE.HELP TECH · ${meta.tech.title}`;
    shortName = isKorean ? "LIFE.HELP · 헬퍼" : "LIFE.HELP · Helper";
    description = meta.tech.description;
  } else if (portal === "chat") {
    title = isKorean
      ? "LIFE.HELP CHAT · 모국어 실시간 상담 센터"
      : `LIFE.HELP CHAT · ${meta.chat.title}`;
    shortName = isKorean ? "LIFE.HELP · 상담" : "LIFE.HELP · Chat";
    description = meta.chat.description;
  } else if (portal === "sys") {
    title = isKorean
      ? "LIFE.HELP SYS · 본사 통합 관리 시스템"
      : `LIFE.HELP SYS · ${meta.sys.title}`;
    shortName = isKorean ? "LIFE.HELP · 본사" : "LIFE.HELP · SYS";
    description = meta.sys.description;
  } else if (country) {
    const cUpper = country.toUpperCase();
    title = isKorean
      ? `LIFE.HELP ${cUpper} · ${countryDisplayName} 다국어 생활서비스`
      : `LIFE.HELP ${cUpper} · ${meta.tagline}`;
    shortName = isKorean ? `LIFE.HELP · ${countryDisplayName}` : `LIFE.HELP · ${cUpper}`;
    if (country === "vietnam" && (lang === "vi" || !options?.localeOverride)) {
      description = "Nền tảng dịch vụ sinh hoạt đa ngôn ngữ";
    } else {
      description = meta.description;
    }
  } else {
    title = isKorean
      ? "LIFE.HELP · 다국어 생활서비스 플랫폼"
      : `LIFE.HELP · ${meta.tagline}`;
    shortName = "LIFE.HELP";
    description = meta.description;
  }

  // 7. Icon URLs
  const iconSlug = portal !== "customer" ? portal : (country || "default");
  const iconPngUrl = `/logos/favicon-${iconSlug}.png`;
  const iconIcoUrl = `/logos/favicon-${iconSlug}.ico`;

  // 8. Generate Windows Internet Shortcut (.url) content with UTF-8 BOM and Comment
  const urlFileContent =
    "\uFEFF[InternetShortcut]\r\n" +
    `URL=${canonicalUrl}\r\n` +
    `IconIndex=0\r\n` +
    `IconFile=https://${canonicalDomain}${iconIcoUrl}\r\n` +
    `Comment=${description}\r\n` +
    "[{000214A0-0000-0000-C000-000000000046}]\r\n" +
    "Prop3=19,11\r\n";

  const suggestedFileName = `${canonicalDomain}.url`;

  return {
    host,
    portal,
    country,
    countryDisplayName,
    lang,
    canonicalDomain,
    canonicalUrl,
    title,
    shortName,
    description,
    iconPngUrl,
    iconIcoUrl,
    urlFileContent,
    suggestedFileName,
  };
}

/**
 * Triggers instant download of Windows .url desktop shortcut file on client browsers.
 */
export function downloadDesktopShortcut(details: DomainShortcutDetails): void {
  if (typeof window === "undefined") return;

  try {
    const blob = new Blob([details.urlFileContent], {
      type: "application/x-mswinurl;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = details.suggestedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
  } catch {
    // Fallback: direct API download route
    window.location.href = `/api/shortcut/download?host=${encodeURIComponent(
      details.canonicalDomain
    )}&lang=${encodeURIComponent(details.lang)}`;
  }
}
