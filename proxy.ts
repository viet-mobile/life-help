import { NextResponse, type NextRequest } from "next/server";
import { hasRole } from "@/lib/auth/roles";
import { updateSession } from "@/utils/supabase/middleware";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/learn/i18n";
import { parseLearnHost } from "@/lib/learn/hosts";
import { SITES, type Site } from "@/lib/learn/types";
import { allowsLearnPathAccess } from "@/lib/env";
import { splitLocalePrefix } from "@/lib/learn/i18n/path";
import { updateLearnSession } from "@/lib/learn/server/supabase/proxySession";
import { locales } from "@/messages/registry";

/**
 * LIFE.HELP country domains
 *
 * Domain = country
 * Path   = language
 *
 * Example:
 *   korea.life.help/vi
 *   vietnam.life.help/ko
 *   japan.life.help/en
 */
const COUNTRIES = new Set([
  "korea",
  "japan",
  "china",
  "taiwan",
  "vietnam",
  "philippines",
  "indonesia",
  "russia",
  "uzbek",
  "nepal",
  "india",
  "cambodia",
  "thailand",
  "myanmar",
  "srilanka",
  "kazakh",
  "france",
  "deutsch",
  "turkiye",
  "ukraina",
  "timorleste",
  "uae",
  "italia",
  "egypt",
  "espania",
  "iran",
  "netherland",
  "poland",
  "ethiopia",
  "sweden",
  "israel",
  "denmark",
  "norway",
  "mongol",
  "mexico",
  "brazil",
  "greece",
  "portugal",
  "southafrica",
  "swiss",
  "pakistan",
  "saudiarabia",
  "yemen",
  "iraq",
  "bangladesh",
  "us",
  "uk",
  "canada",
  "australia",
  "newzealand",
  "singapore",
  "malaysia",
  "nigeria",
  "elsalvador",
  "centralafrica",
  "venezuela",
  "kenya",
  "argentina",
  "romania",
  "finland",
  "czechia",
  "hungary",
  "zambia",
  "uganda",
  "congo",
  "ghana",
  "mozambique",
  "guatemala",
  "guinea",
  "niger",
  "rwanda",
  "madagascar",
  "malawi",
  "mali",
  "burkinafaso",
  "senegal",
  "angola",
  "ecuador",
  "georgia",
  "zimbabwe",
  "chad",
  "chile",
  "cameroon",
  "cotedivoire",
  "colombia",
  "drcongo",
  "peru",
  "tanzania",
  "algeria",
  "morocco",
  "benin",
  "tunisia",
  "bolivia",
  "belgium",
  "jordan",
  "dominica",
  "honduras",
  "azerbaijan",
  "tajikistan",
  "papuanewguinea",
]);

const COUNTRY_HOST_ALIASES: Readonly<Record<string, string>> = {
  czech: "czechia",
  centralafrican: "centralafrica",
  dominican: "dominica",
  dominicanrepublic: "dominica",
  papua: "papuanewguinea",
  png: "papuanewguinea",
};

/**
 * Supported user-facing language path codes.
 *
 * zt = zh-Hant
 * zs = zh-Hans
 */
const LANGUAGES = new Set([
  ...locales.map((l) => l.toLowerCase()),
  ...locales,
  "zt",
  "zs",
  "zh",
]);

export const COUNTRY_TO_DEFAULT_LANGUAGE: Record<string, string> = {
  korea: "ko",
  vietnam: "vi",
  japan: "ja",
  china: "zs",
  taiwan: "zt",
  philippines: "en",
  indonesia: "id",
  russia: "ru",
  uzbek: "uz",
  nepal: "ne",
  india: "hi",
  cambodia: "km",
  thailand: "th",
  myanmar: "my",
  srilanka: "si",
  kazakh: "kk",
  france: "fr",
  deutsch: "de",
  turkiye: "tr",
  ukraina: "uk",
  timorleste: "tet",
  uae: "ar",
  italia: "it",
  egypt: "arz",
  espania: "es",
  iran: "fa",
  netherland: "nl",
  poland: "pl",
  ethiopia: "am",
  sweden: "sv",
  israel: "he",
  denmark: "da",
  norway: "no",
  mongol: "mn",
  mexico: "es",
  brazil: "pt",
  greece: "el",
  portugal: "pt",
  southafrica: "en",
  swiss: "de",
  pakistan: "ur",
  saudiarabia: "ar",
  yemen: "ar",
  iraq: "ar",
  bangladesh: "bn",
  us: "en",
  uk: "en",
  canada: "en",
  australia: "en",
  newzealand: "en",
  singapore: "en",
  malaysia: "en",
  nigeria: "en",
  elsalvador: "es",
  centralafrica: "fr",
  venezuela: "es",
  kenya: "sw",
  argentina: "es",
  romania: "en",
  finland: "en",
  czechia: "en",
  hungary: "en",
  zambia: "en",
  uganda: "en",
  congo: "fr",
  ghana: "en",
  mozambique: "pt",
  guatemala: "es",
  guinea: "fr",
  niger: "fr",
  rwanda: "en",
  madagascar: "fr",
  malawi: "en",
  mali: "fr",
  burkinafaso: "fr",
  senegal: "fr",
  angola: "pt",
  ecuador: "es",
  georgia: "ka",
  zimbabwe: "en",
  chad: "fr",
  chile: "es",
  cameroon: "fr",
  cotedivoire: "fr",
  colombia: "es",
  drcongo: "fr",
  peru: "es",
  tanzania: "sw",
  algeria: "ar",
  morocco: "ar",
  benin: "fr",
  tunisia: "ar",
  bolivia: "es",
  belgium: "nl",
  jordan: "ar",
  dominica: "es",
  honduras: "es",
  azerbaijan: "en",
  tajikistan: "en",
  papuanewguinea: "en",
};

function getHost(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  )
    .split(":")[0]
    .toLowerCase();
}

/**
 * Detect country from:
 *
 * korea.life.help
 * tech.korea.life.help
 * chat.korea.life.help
 * sys.korea.life.help
 */
function getCountryFromHost(host: string): string | null {
  const parts = host.split(".");

  // country.life.help
  if (parts.length === 3 && parts[2] === "help") {
    const country = COUNTRY_HOST_ALIASES[parts[0]] ?? parts[0];

    if (COUNTRIES.has(country)) {
      return country;
    }
  }

  // tech.country.life.help
  // chat.country.life.help
  // sys.country.life.help
  if (parts.length === 4 && parts[3] === "help") {
    const country = COUNTRY_HOST_ALIASES[parts[1]] ?? parts[1];

    if (COUNTRIES.has(country)) {
      return country;
    }
  }

  return null;
}

export const ISO2_TO_COUNTRY: Readonly<Record<string, string>> = {
  GR: "greece", GH: "ghana", NG: "nigeria", ZA: "southafrica", NL: "netherland",
  NP: "nepal", NO: "norway", NZ: "newzealand", TW: "taiwan", DK: "denmark",
  DE: "deutsch", TL: "timorleste", RU: "russia", RO: "romania", MY: "malaysia",
  MX: "mexico", MZ: "mozambique", MN: "mongol", US: "us", MM: "myanmar",
  BD: "bangladesh", VE: "venezuela", VN: "vietnam", BR: "brazil", SA: "saudiarabia",
  LK: "srilanka", SE: "sweden", CH: "swiss", ES: "espania", SG: "singapore",
  AE: "uae", ET: "ethiopia", SV: "elsalvador", GB: "uk", YE: "yemen",
  UG: "uganda", UZ: "uzbek", UA: "ukraina", IQ: "iraq", IR: "iran",
  IL: "israel", EG: "egypt", IT: "italia", IN: "india", ID: "indonesia",
  JP: "japan", ZM: "zambia", CN: "china", CF: "centralafrica", CZ: "czech",
  KZ: "kazakh", KH: "cambodia", CA: "canada", KE: "kenya", CG: "congo",
  TH: "thailand", TR: "turkiye", PK: "pakistan", PT: "portugal", PL: "poland",
  FR: "france", FI: "finland", PH: "philippines", KR: "korea", HU: "hungary",
  AU: "australia", AR: "argentina", CO: "colombia", CL: "chile", PE: "peru",
  EC: "ecuador", GT: "guatemala", GE: "georgia", AO: "angola", CM: "cameroon",
  CI: "cotedivoire", CD: "drcongo", ZW: "zimbabwe", RW: "rwanda", SN: "senegal",
  MW: "malawi", ML: "mali", BF: "burkinafaso", NE: "niger", GN: "guinea",
  MG: "madagascar", TD: "chad", TZ: "tanzania", DZ: "algeria", MA: "morocco",
  BJ: "benin", TN: "tunisia", BO: "bolivia", BE: "belgium", JO: "jordan",
  DO: "dominica", HN: "honduras", AZ: "azerbaijan", TJ: "tajikistan",
  PG: "papuanewguinea",
};

export function parseAcceptLanguage(header: string | null): string | null {
  if (!header) return null;
  const tags = header.split(",").map((part) => part.split(";")[0].trim().toLowerCase());
  for (const tag of tags) {
    if (tag === "zh-tw" || tag === "zh-hk") return "zt";
    if (tag === "zh-cn" || tag === "zh-sg" || tag === "zh") return "zs";
    const primary = tag.split("-")[0];
    if (LANGUAGES.has(primary)) return primary;
    if (LANGUAGES.has(tag)) return tag;
  }
  return null;
}

const COUNTRY_HOST_REDIRECTS: Record<string, string> = {
  "turkey.life.help": "turkiye.life.help",
  "spain.life.help": "espania.life.help",
  "germany.life.help": "deutsch.life.help",
  "italy.life.help": "italia.life.help",
};


/**
 * Learning sites (math.life.help, english.life.help, korean.life.help / study.korean.life.help).
 *
 * The subdomain selects a learning site; the app lives at /study/[site]/...
 * internally, so math.life.help/dashboard is served by /study/math/dashboard.
 * Locally (no subdomain) the same pages are reachable at /study/math.
 */
const LEARN_SITES = new Set<string>(SITES);

function getLearnSiteFromHost(host: string): Site | null {
  return parseLearnHost(host)?.site ?? null;
}

function isLearnPassthrough(pathname: string) {
  return (
    pathname.startsWith("/api/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icon-")
  );
}

function getPortalFromHost(host: string): "customer" | "tech" | "chat" | "sys" | "main" {
  if (host === "sys.life.help") return "sys";
  if (host === "chat.life.help") return "chat";
  if (host === "tech.life.help") return "tech";

  if (host.startsWith("sys.")) return "sys";
  if (host.startsWith("chat.")) return "chat";
  if (host.startsWith("tech.")) return "tech";

  return "customer";
}

function getLanguagesFromPath(pathname: string): {
  language: string | null;
  secondaryLanguage: string | null;
  secondaryLanguages: string[];
  subpath: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { language: null, secondaryLanguage: null, secondaryLanguages: [], subpath: pathname || "/" };
  }

  const parseLang = (seg: string | undefined): string | null => {
    if (!seg) return null;
    const lower = seg.toLowerCase();
    if (lower === "zt" || lower === "zh-hant") return "zt";
    if (lower === "zs" || lower === "zh" || lower === "zh-hans") return "zs";
    return LANGUAGES.has(lower) ? lower : null;
  };

  const first = parseLang(segments[0]);
  if (!first) {
    return { language: null, secondaryLanguage: null, secondaryLanguages: [], subpath: pathname || "/" };
  }

  // Check if second segment contains valid secondary language(s) (e.g. /vi/ko or /vi/ko+en or /vi/ko,en)
  if (segments.length >= 2) {
    const rawSecond = segments[1];
    const candidateParts = rawSecond.split(/[,+]/).filter(Boolean);
    const validSeconds: string[] = [];
    for (const part of candidateParts) {
      const parsed = parseLang(part);
      if (parsed && parsed !== first && !validSeconds.includes(parsed)) {
        validSeconds.push(parsed);
      }
    }
    if (validSeconds.length > 0 && validSeconds.length === candidateParts.length) {
      const rest = segments.slice(2);
      return {
        language: first,
        secondaryLanguage: validSeconds.join("+"),
        secondaryLanguages: validSeconds,
        subpath: rest.length > 0 ? "/" + rest.join("/") : "/",
      };
    }
  }

  const rest = segments.slice(1);
  return {
    language: first,
    secondaryLanguage: null,
    secondaryLanguages: [],
    subpath: rest.length > 0 ? "/" + rest.join("/") : "/",
  };
}

function getLanguage(pathname: string): string | null {
  return getLanguagesFromPath(pathname).language;
}

function buildInternalPath(
  request: NextRequest,
  host: string,
): {
  pathname: string;
  country: string | null;
  language: string | null;
  secondaryLanguage: string | null;
  secondaryLanguages: string[];
} {
  const rawPathname = request.nextUrl.pathname;
  const portal = getPortalFromHost(host);
  const country = getCountryFromHost(host);

  // 1. Detect language(s) and subpath
  // e.g. "/vi" -> { language: "vi", secondaryLanguage: null, subpath: "/" }
  //      "/vi/ko" -> { language: "vi", secondaryLanguage: "ko", subpath: "/" }
  //      "/vi/ko+en" -> { language: "vi", secondaryLanguage: "ko+en", secondaryLanguages: ["ko", "en"], subpath: "/" }
  //      "/vi/counselor" -> { language: "vi", secondaryLanguage: null, subpath: "/counselor" }
  //      "/vi/ko/counselor" -> { language: "vi", secondaryLanguage: "ko", subpath: "/counselor" }
  const { language, secondaryLanguage, secondaryLanguages, subpath } = getLanguagesFromPath(rawPathname);

  // Bypass internal portal rewriting for global API endpoints, manifest, service worker, and icons
  if (
    subpath.startsWith("/api/") ||
    subpath === "/manifest.webmanifest" ||
    subpath === "/manifest.json" ||
    subpath === "/sw.js" ||
    subpath === "/robots.txt" ||
    subpath === "/sitemap.xml" ||
    subpath.startsWith("/icon-")
  ) {
    return {
      pathname: subpath,
      country,
      language,
      secondaryLanguage,
      secondaryLanguages,
    };
  }


  /**
   * 1. System Admin portal
   *
   * sys.life.help, sys.korea.life.help, etc.
   * -> /admin
   */
  if (portal === "sys") {
    let internalPath = "/admin";
    if (subpath === "/" || subpath === "") {
      internalPath = "/admin";
    } else if (subpath === "/login") {
      internalPath = "/admin/login";
    } else if (subpath.startsWith("/admin")) {
      internalPath = subpath;
    } else {
      internalPath = `/admin${subpath}`;
    }

    return {
      pathname: internalPath,
      country,
      language,
      secondaryLanguage,
      secondaryLanguages,
    };
  }

  /**
   * 2. Technician portal
   *
   * tech.life.help, tech.korea.life.help, etc.
   * -> /tech
   */
  if (portal === "tech") {
    let internalPath = "/tech";
    if (subpath === "/" || subpath === "") {
      internalPath = "/tech";
    } else if (subpath.startsWith("/tech")) {
      internalPath = subpath;
    } else {
      internalPath = `/tech${subpath}`;
    }

    return {
      pathname: internalPath,
      country,
      language,
      secondaryLanguage,
      secondaryLanguages,
    };
  }

  /**
   * 3. Chat portal
   *
   * chat.life.help, chat.korea.life.help, etc.
   * -> /chat
   */
  if (portal === "chat") {
    let internalPath = "/chat";
    if (subpath === "/" || subpath === "") {
      internalPath = "/chat";
    } else if (subpath.startsWith("/chat")) {
      internalPath = subpath;
    } else {
      internalPath = `/chat${subpath}`;
    }

    return {
      pathname: internalPath,
      country,
      language,
      secondaryLanguage,
      secondaryLanguages,
    };
  }

  /**
   * 4. Customer portal & universal language routing
   *
   * life.help/vi, korea.life.help/vi, localhost:3000/vi
   */
  let internalPath = subpath;
  if (internalPath === "/sys") {
    internalPath = "/admin";
  } else if (internalPath.startsWith("/sys/")) {
    internalPath = internalPath.replace(/^\/sys/, "/admin");
  }

  return {
    pathname: internalPath,
    country,
    language,
    secondaryLanguage,
    secondaryLanguages,
  };
}

export async function proxy(request: NextRequest) {

  // Learning presentation overlays (hints, explanations) are server-side content read through the ASSETS binding only; they are never
  // served to a browser (wrangler.jsonc makes /learn-content/* worker-first, and this refuses it on every host, also under next start).
  // Note: /learn-content/daily-tips/* is public multilingual daily tips assets and is permitted to pass through to static ASSETS.
  if (
    (request.nextUrl.pathname === "/learn-content" || request.nextUrl.pathname.startsWith("/learn-content/")) &&
    !request.nextUrl.pathname.startsWith("/learn-content/daily-tips/")
  ) {
    return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const rawHost =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const host = rawHost.split(":")[0].toLowerCase();
  const port = rawHost.includes(":")
    ? `:${rawHost.split(":")[1]}`
    : "";

  const learningAliases: Record<string, string> = {
    "hoc.tieng.han.viet.mobile": "korean.life.help",
    "hoc.tieng.anh.viet.mobile": "english.life.help",
  };
  if (learningAliases[host]) {
    const target = new URL(`https://${learningAliases[host]}`);
    target.searchParams.set("lang", "vi");
    return NextResponse.redirect(target, 308);
  }
  if (parseLearnHost(host) && request.nextUrl.searchParams.get("lang") === "vi") {
    const target = request.nextUrl.clone();
    target.searchParams.delete("lang");
    const response = NextResponse.redirect(target, 307);
    response.cookies.set(LOCALE_COOKIE, "vi", { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
    return response;
  }

  /**
   * Country domain official alias redirects
   * turkey.life.help -> https://turkiye.life.help/
   * spain.life.help -> https://espania.life.help/
   * germany.life.help -> https://deutsch.life.help/
   * italy.life.help -> https://italia.life.help/
   */
  if (COUNTRY_HOST_REDIRECTS[host]) {
    const targetHost = COUNTRY_HOST_REDIRECTS[host];
    const proto = host.includes("life.help") ? "https:" : request.nextUrl.protocol;
    const targetUrl = new URL(
      `${proto}//${targetHost}${port}${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(targetUrl, 308);
  }

  /**
   * Country-specific favicon.ico routing
   */
  if (request.nextUrl.pathname === "/favicon.ico") {
    if (host === "jiu.life.help" || host === "jiu.localhost") {
      return NextResponse.rewrite(new URL("/jiu/favicon.ico", request.url));
    }
    // math.life.help / english.life.help: the site's own logo (LIFE.HELP with MATH / ENGLISH above it), served by a route handler.
    // The Worker runs first for /favicon.ico only (wrangler.jsonc assets.run_worker_first); public/ files are NOT reachable by a rewrite there.
    const learnFaviconSite = getLearnSiteFromHost(host);
    if (learnFaviconSite) {
      return NextResponse.rewrite(new URL(`/study/${learnFaviconSite}/favicon.ico`, request.url));
    }
    // Every existing host keeps the generic LIFE.HELP favicon (app/favicon.ico, byte-identical to public/favicon.ico) - what production has always served.
    return NextResponse.next();
  }

  if (host === "jiu.life.help" || host === "jiu.localhost") {
    const path = request.nextUrl.pathname;
    if (path === "/study" || path.startsWith("/study/") || path === "/api/learn" || path.startsWith("/api/learn/")) {
      return new NextResponse("Not Found", { status: 404 });
    }
    const jiuHeaders = new Headers(request.headers);
    jiuHeaders.set("x-life-portal", "jiu");
    jiuHeaders.set("x-life-language", "ko");
    jiuHeaders.delete("x-life-country");
    const target = path === "/" ? "/jiu" : path;
    const out = target !== path
      ? NextResponse.rewrite(new URL(target + request.nextUrl.search, request.url), { request: { headers: jiuHeaders } })
      : NextResponse.next({ request: { headers: jiuHeaders } });
    out.headers.set("X-Robots-Tag", "noindex, nofollow");
    return out;
  }

  /**
   * Learning sites: math.life.help / english.life.help (and /study/* locally).
   * This block uses ONLY the learning session helper (publishable credentials, no service key); the generic marketplace
   * session handling below is never called for learning hosts (tests/learn/supabase-isolation.test.ts).
   */
  // LEARN_BLOCK_START
  {
    const learnHostSite = getLearnSiteFromHost(host);
    const path = request.nextUrl.pathname;
    const isStudyPath = path === "/study" || path.startsWith("/study/");

    // Path-based access (/study/...) is an explicit opt-in for local/staging (default deny). In production the
    // learning sites are reachable solely through their own hostnames, so existing
    // LIFE.HELP hosts (korea.life.help/study/math ...) must not expose them.
    // The learning API is hidden the same way (a GET would otherwise answer 405 on every LIFE.HELP host and reveal the route).
    const isLearnApi = path === "/api/learn" || path.startsWith("/api/learn/");
    if ((isStudyPath || isLearnApi) && !learnHostSite && !allowsLearnPathAccess()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const pathSite = path.startsWith("/study/") ? path.split("/")[2] : null;
    if (learnHostSite && pathSite && LEARN_SITES.has(pathSite) && pathSite !== learnHostSite) {
      const targetSub = pathSite === "chemistry" ? "chem" : pathSite;
      const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
      const isStaging = host.includes("-staging");
      let targetOrigin = `https://${targetSub}.life.help`;
      if (isLocal) {
        const port = host.split(":")[1] ? `:${host.split(":")[1]}` : "";
        targetOrigin = `http://${targetSub}.localhost${port}`;
      } else if (isStaging) {
        targetOrigin = `https://${pathSite === "korean" ? "study-korean" : targetSub}-staging.life.help`;
      }
      const restAfterSite = "/" + path.split("/").slice(3).join("/");
      return NextResponse.redirect(new URL((restAfterSite === "/" ? "" : restAfterSite) + request.nextUrl.search, targetOrigin), 307);
    }
    const learnSite = learnHostSite ?? (pathSite && LEARN_SITES.has(pathSite) ? pathSite : null);

    if (learnSite) {
      const passthrough = isLearnPassthrough(path);
      // Language in the URL (https://math.life.help/en , /vi/dashboard): the first segment after the site root names a registry locale.
      // It is stripped before routing and travels as x-learn-locale, so the server renders - and link previews / crawlers see - the
      // metadata of THAT language without any cookie. Links inside the page keep the prefix (x-learn-base).
      const sitePath = path.startsWith("/study/") ? "/" + path.split("/").slice(3).join("/") : path;
      const { locale: urlLocale, secondaryLocale: urlSecondaryLocale, secondaryLocales: urlSecondaryLocales, rest } = passthrough
        ? { locale: null, secondaryLocale: null, secondaryLocales: [], rest: sitePath }
        : splitLocalePrefix(sitePath);
      const innerPath = urlLocale ? rest : sitePath;
      const siteRoot = learnHostSite ? "" : `/study/${learnSite}`;
      const isInsights = innerPath === "/insights" || innerPath.startsWith("/insights/");
      const internal = passthrough ? path : (isInsights ? innerPath : `/study/${learnSite}${innerPath === "/" ? "" : innerPath}`);

      // Resolve effective locale from URL or persistent cookies
      const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value || request.cookies.get("life_help_locale")?.value;
      const validCookieLocale = cookieLocale && LANGUAGES.has(cookieLocale.toLowerCase()) ? cookieLocale : null;
      const effectiveLocale = urlLocale || validCookieLocale || "ko";

      // Resolve effective secondary locales from URL or persistent cookies
      const cookieSecLocales = request.cookies.get("life_help_secondary_locales")?.value;
      const cookieSecLocale = request.cookies.get("life_help_secondary_locale")?.value;
      const validCookieSecLocales = cookieSecLocales
        ? cookieSecLocales.split(/[,+]/).filter((l) => LANGUAGES.has(l.toLowerCase()))
        : (cookieSecLocale && LANGUAGES.has(cookieSecLocale.toLowerCase()) ? [cookieSecLocale] : []);

      const effectiveSecLocales = (urlSecondaryLocales && urlSecondaryLocales.length > 0)
        ? urlSecondaryLocales
        : (urlSecondaryLocale ? [urlSecondaryLocale] : validCookieSecLocales).filter((l) => l !== effectiveLocale).slice(0, 4);

      const learnHeaders = new Headers(request.headers);
      learnHeaders.set("x-life-portal", "learn");
      learnHeaders.set("x-life-site", learnSite);
      // The public base path for links: includes both primary and secondary language prefixes to preserve state
      const secJoined = effectiveSecLocales.length > 0 ? effectiveSecLocales.join("+") : null;
      const urlPrefix = effectiveLocale ? (secJoined ? `/${effectiveLocale}/${secJoined}` : `/${effectiveLocale}`) : "";
      learnHeaders.set("x-learn-base", `${siteRoot}${urlPrefix}`);
      learnHeaders.set("x-learn-path", innerPath);
      learnHeaders.set("x-learn-locale", effectiveLocale);
      learnHeaders.set("x-life-language", effectiveLocale);

      if (effectiveSecLocales.length > 0) {
        const secListStr = effectiveSecLocales.join(",");
        learnHeaders.set("x-learn-secondary-locale", effectiveSecLocales[0]);
        learnHeaders.set("x-learn-secondary-locales", secListStr);
        learnHeaders.set("x-life-secondary-language", secJoined || effectiveSecLocales[0]);
        learnHeaders.set("x-life-secondary-languages", secListStr);
      } else {
        learnHeaders.delete("x-learn-secondary-locale");
        learnHeaders.delete("x-learn-secondary-locales");
        learnHeaders.delete("x-life-secondary-language");
        learnHeaders.delete("x-life-secondary-languages");
      }
      learnHeaders.delete("x-life-country");

      // Keep the learning Supabase session fresh and persist refreshed cookies (no-op without LEARN_SUPABASE_* public config).
      const { response: sessionResponse } = await updateLearnSession(request);
      const out =
        internal !== path
          ? NextResponse.rewrite(new URL(internal + request.nextUrl.search, request.url), {
              request: { headers: learnHeaders },
            })
          : NextResponse.next({ request: { headers: learnHeaders } });
      sessionResponse.cookies.getAll().forEach((c) => out.cookies.set(c));

      // Persist browser language and multi-secondary preferences
      if (effectiveLocale) {
        out.cookies.set(LOCALE_COOKIE, effectiveLocale, { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
        out.cookies.set("life_help_locale", effectiveLocale, { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
        if (effectiveSecLocales.length > 0) {
          const secListStr = effectiveSecLocales.join(",");
          out.cookies.set("life_help_secondary_locale", effectiveSecLocales[0], { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
          out.cookies.set("life_help_secondary_locales", secListStr, { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
          out.cookies.set("life_help_display_mode", "bilingual", { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
        } else if (urlLocale && !urlSecondaryLocale) {
          out.cookies.delete("life_help_secondary_locale");
          out.cookies.delete("life_help_secondary_locales");
          out.cookies.set("life_help_display_mode", "monolingual", { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
        }
      }
      out.headers.set("X-Robots-Tag", "noindex, nofollow"); // first release: learning sites are not indexed
      return out;
    }
  }
  // LEARN_BLOCK_END

  /**
   * Allow a portal to return to its customer domain.
   *
   * Example:
   * tech.korea.life.help?portal=main
   * → korea.life.help
   */
  if (
    (host.startsWith("tech.") ||
      host.startsWith("chat.") ||
      host.startsWith("sys.")) &&
    (request.nextUrl.searchParams.get("portal") === "main" ||
      request.nextUrl.pathname === "/main")
  ) {
    const mainHost = host.replace(/^(tech|chat|sys)\./, "");

    return NextResponse.redirect(
      new URL(
        `${request.nextUrl.protocol}//${mainHost}${port}/`,
      ),
    );
  }

  /**
   * Smart Geo & Language Routing for bare life.help:
   * When visitors arrive at https://life.help (the global brand/advertising URL),
   * dynamically dispatch to the appropriate country domain + language environment.
   *
   * Priority:
   * 1. User manual override cookies (life_help_country, life_help_locale)
   * 2. Geo-IP location (Cloudflare cf-ipcountry)
   * 3. Device/browser language (Accept-Language header)
   */
  if (host === "life.help") {
    const cfCountry = request.headers.get("cf-ipcountry")?.toUpperCase();
    const cookieCountry = request.cookies.get("life_help_country")?.value?.toLowerCase();
    const rawTargetCountry = (cookieCountry && COUNTRIES.has(cookieCountry))
      ? cookieCountry
      : (cfCountry && ISO2_TO_COUNTRY[cfCountry] ? ISO2_TO_COUNTRY[cfCountry] : null);

    if (rawTargetCountry) {
      const targetCountry = COUNTRY_HOST_ALIASES[rawTargetCountry] ?? rawTargetCountry;
      const { language: urlLang, secondaryLanguage: urlSecLang, subpath: cleanSubpath } = getLanguagesFromPath(request.nextUrl.pathname);
      const cookieLang = request.cookies.get("life_help_locale")?.value || request.cookies.get("learn_lang")?.value;
      const deviceLang = parseAcceptLanguage(request.headers.get("accept-language"));
      const targetLang = urlLang || (cookieLang && LANGUAGES.has(cookieLang) ? cookieLang : null) || (deviceLang && LANGUAGES.has(deviceLang) ? deviceLang : null) || COUNTRY_TO_DEFAULT_LANGUAGE[targetCountry] || "ko";
      const targetSecPart = urlSecLang ? `/${urlSecLang}` : "";

      if (
        !cleanSubpath.startsWith("/api/") &&
        cleanSubpath !== "/manifest.webmanifest" &&
        cleanSubpath !== "/manifest.json" &&
        cleanSubpath !== "/sw.js" &&
        cleanSubpath !== "/robots.txt" &&
        cleanSubpath !== "/sitemap.xml" &&
        !cleanSubpath.startsWith("/icon-")
      ) {
        const proto = request.nextUrl.protocol === "http:" ? "http:" : "https:";
        const redirectUrl = new URL(
          `${proto}//${targetCountry}.life.help${port}/${targetLang}${targetSecPart}${cleanSubpath === "/" ? "" : cleanSubpath}${request.nextUrl.search}`
        );
        return NextResponse.redirect(redirectUrl, 307);
      }
    }
  }

  const {
    pathname,
    country,
    language,
    secondaryLanguage,
    secondaryLanguages,
  } = buildInternalPath(request, host);

  /**
   * Pass routing information internally.
   *
   * The pages can later read:
   *
   * x-life-country
   * x-life-language
   * x-life-secondary-language
   */
  const requestHeaders = new Headers(request.headers);

  if (country) {
    requestHeaders.set("x-life-country", country);
  } else {
    requestHeaders.delete("x-life-country");
  }

  const defaultCountryLang = country ? COUNTRY_TO_DEFAULT_LANGUAGE[country] : null;
  const cookieLang = request.cookies.get("life_help_locale")?.value || request.cookies.get("learn_lang")?.value;
  const validCookieLang = cookieLang && LANGUAGES.has(cookieLang.toLowerCase()) ? cookieLang : null;
  const effectiveLanguage = language || validCookieLang || defaultCountryLang;

  if (effectiveLanguage) {
    requestHeaders.set("x-life-language", effectiveLanguage);
  } else {
    requestHeaders.delete("x-life-language");
  }

  if (secondaryLanguage) {
    requestHeaders.set("x-life-secondary-language", secondaryLanguage);
    const allSecsStr = secondaryLanguages.length > 0 ? secondaryLanguages.join(",") : secondaryLanguage.replace(/\+/g, ",");
    requestHeaders.set("x-life-secondary-languages", allSecsStr);
  } else {
    requestHeaders.delete("x-life-secondary-language");
    requestHeaders.delete("x-life-secondary-languages");
  }

  requestHeaders.set(
    "x-life-portal",
    getPortalFromHost(host),
  );

  // Helper to persist language and bilingual mode cookies
  const applyLocaleCookies = (res: NextResponse) => {
    if (language) {
      res.cookies.set("life_help_locale", language, { path: "/", maxAge: 31536000, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
      if (secondaryLanguage) {
        const firstSec = secondaryLanguages[0] || secondaryLanguage.split(/[,+]/)[0];
        const allSecsStr = secondaryLanguages.length > 0 ? secondaryLanguages.join(",") : secondaryLanguage.replace(/\+/g, ",");
        res.cookies.set("life_help_secondary_locale", firstSec, { path: "/", maxAge: 31536000, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
        res.cookies.set("life_help_secondary_locales", allSecsStr, { path: "/", maxAge: 31536000, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
        res.cookies.set("life_help_display_mode", "bilingual", { path: "/", maxAge: 31536000, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
      } else {
        res.cookies.delete("life_help_secondary_locale");
        res.cookies.delete("life_help_secondary_locales");
        res.cookies.set("life_help_display_mode", "monolingual", { path: "/", maxAge: 31536000, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
      }
    }
  };

  // Public path (without the language prefix) and the URL's language prefix: used server-side for canonical / hreflang.
  // Always overwritten so a client-supplied value is never trusted.
  if (getPortalFromHost(host) === "customer") {
    requestHeaders.set("x-life-path", pathname);
    if (language) requestHeaders.set("x-life-url-lang", request.nextUrl.pathname.split("/").filter(Boolean)[0].toLowerCase());
    else requestHeaders.delete("x-life-url-lang");
  } else {
    requestHeaders.delete("x-life-path");
    requestHeaders.delete("x-life-url-lang");
  }

  const requestWithHeaders = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  applyLocaleCookies(requestWithHeaders);

  /**
   * Authentication
   *
   * Keep the existing Supabase session handling.
   */
  const { response, user } = await updateSession(request);

  const authRequired =
    process.env.AUTH_ENFORCEMENT === "true" &&
    (pathname.startsWith("/tech") ||
      pathname.startsWith("/admin"));

  if (authRequired) {
    const allowed = pathname.startsWith("/admin")
      ? (["ADMIN", "STAFF"] as const)
      : (["TECHNICIAN", "ADMIN", "STAFF"] as const);

    if (!hasRole(user, allowed)) {
      return NextResponse.redirect(
        new URL(
          pathname.startsWith("/admin")
            ? "/admin/login"
            : "/tech/login",
          request.url,
        ),
      );
    }
  }

  /**
   * Rewrite only when the internal path differs.
   */
  console.log("PROXY HIT:", {
    rawUrl: request.url,
    pathname: request.nextUrl.pathname,
    rewrittenPath: pathname,
    portal: getPortalFromHost(host),
    country,
    language,
    secondaryLanguage,
    effectiveLanguage,
  });

  if (pathname !== request.nextUrl.pathname) {
    const rewriteUrl = new URL(pathname, request.url);

    const rewriteResponse = NextResponse.rewrite(
      rewriteUrl,
      {
        request: {
          headers: requestHeaders,
        },
      },
    );

    if (effectiveLanguage) {
      rewriteResponse.headers.set("x-life-language", effectiveLanguage);
    }
    if (secondaryLanguage) {
      rewriteResponse.headers.set("x-life-secondary-language", secondaryLanguage);
    }
    if (country) {
      rewriteResponse.headers.set("x-life-country", country);
    }
    rewriteResponse.headers.set("x-life-portal", getPortalFromHost(host));
    applyLocaleCookies(rewriteResponse);

    return rewriteResponse;
  }

  /**
   * If there is no rewrite, still pass the routing headers.
   */
  if (
    country ||
    effectiveLanguage ||
    host === "sys.life.help" ||
    host.startsWith("tech.") ||
    host.startsWith("chat.") ||
    host.startsWith("sys.")
  ) {
    return requestWithHeaders;
  }

  // Bare life.help (no country, no language prefix): forward the routing headers too, keeping the refreshed session cookies.
  const bareHeaders = new Headers(request.headers);
  for (const h of ["x-life-path", "x-life-url-lang"]) {
    const v = requestHeaders.get(h);
    if (v) bareHeaders.set(h, v); else bareHeaders.delete(h);
  }
  const bare = NextResponse.next({ request: { headers: bareHeaders } });
  response.cookies.getAll().forEach((c) => bare.cookies.set(c));
  applyLocaleCookies(bare);
  return bare;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|logos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
