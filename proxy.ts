import { NextResponse, type NextRequest } from "next/server";
import { hasRole } from "@/lib/auth/roles";
import { updateSession } from "@/utils/supabase/middleware";

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
]);

/**
 * Supported user-facing language path codes.
 *
 * zt = zh-Hant
 * zs = zh-Hans
 */
const LANGUAGES = new Set([
  "ko",
  "vi",
  "en",
  "zt",
  "zs",
  "ja",
  "zh",
  "th",
  "id",
  "km",
  "my",
  "ne",
  "hi",
  "si",
  "ta",
  "lo",
  "tl",
  "tet",
  "ru",
  "uz",
  "kk",
  "fr",
  "de",
  "tr",
  "uk",
  "ar",
  "it",
  "es",
  "fa",
  "nl",
  "pl",
  "am",
  "sv",
  "he",
  "da",
  "no",
  "mn",
  "pt",
  "el",
  "ur",
  "zh-hans",
  "zh-hant",
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
    const country = parts[0];

    if (COUNTRIES.has(country)) {
      return country;
    }
  }

  // tech.country.life.help
  // chat.country.life.help
  // sys.country.life.help
  if (parts.length === 4 && parts[3] === "help") {
    const country = parts[1];

    if (COUNTRIES.has(country)) {
      return country;
    }
  }

  return null;
}

const COUNTRY_HOST_REDIRECTS: Record<string, string> = {
  "turkey.life.help": "turkiye.life.help",
  "spain.life.help": "espania.life.help",
  "germany.life.help": "deutsch.life.help",
  "italy.life.help": "italia.life.help",
};

function getPortalFromHost(host: string): "customer" | "tech" | "chat" | "sys" | "main" | "register-device" {
  if (host === "register-device.life.help" || host.startsWith("register-device.")) return "register-device";
  if (host === "sys.life.help") return "sys";
  if (host === "chat.life.help") return "chat";
  if (host === "tech.life.help") return "tech";

  if (host.startsWith("sys.")) return "sys";
  if (host.startsWith("chat.")) return "chat";
  if (host.startsWith("tech.")) return "tech";

  return "customer";
}

function getLanguage(pathname: string): string | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (!firstSegment) {
    return null;
  }

  const lower = firstSegment.toLowerCase();
  if (lower === "zt" || lower === "zh-hant") return "zt";
  if (lower === "zs" || lower === "zh" || lower === "zh-hans") return "zs";

  return LANGUAGES.has(lower) ? lower : null;
}

function buildInternalPath(
  request: NextRequest,
  host: string,
): {
  pathname: string;
  country: string | null;
  language: string | null;
} {
  const pathname = request.nextUrl.pathname;
  const portal = getPortalFromHost(host);
  const country = getCountryFromHost(host);

  // 1. Detect if pathname starts with a supported language code (e.g. /vi, /ko, /en, /zt, /zs)
  const language = getLanguage(pathname);

  // 2. Strip language prefix if present to obtain the relative subpath
  // e.g. "/vi" -> "/"
  //      "/vi/counselor" -> "/counselor"
  //      "/vi/workspace" -> "/workspace"
  let subpath = pathname;
  if (language) {
    const firstSeg = pathname.split("/").filter(Boolean)[0];
    subpath =
      pathname === `/${firstSeg}`
        ? "/"
        : pathname.replace(new RegExp(`^/${firstSeg}(?=/|$)`, "i"), "") || "/";
  }

  // Bypass internal portal rewriting for global API endpoints, manifest, service worker, and icons
  if (
    subpath.startsWith("/api/") ||
    subpath === "/manifest.webmanifest" ||
    subpath === "/manifest.json" ||
    subpath === "/sw.js" ||
    subpath.startsWith("/icon-")
  ) {
    return {
      pathname: subpath,
      country,
      language,
    };
  }

  /**
   * 0. Device Registration portal
   *
   * register-device.life.help
   * -> /register-device
   */
  if (portal === "register-device") {
    return {
      pathname: "/register-device",
      country,
      language,
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
  };
}

export async function proxy(request: NextRequest) {
  const rawHost =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const host = rawHost.split(":")[0].toLowerCase();
  const port = rawHost.includes(":")
    ? `:${rawHost.split(":")[1]}`
    : "";

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
    const country = getCountryFromHost(host);
    if (country) {
      return NextResponse.rewrite(
        new URL(`/logos/favicon-${country}.ico`, request.url),
      );
    }
    return NextResponse.rewrite(
      new URL(`/logos/favicon-default.ico`, request.url),
    );
  }

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

  const {
    pathname,
    country,
    language,
  } = buildInternalPath(request, host);

  /**
   * Pass routing information internally.
   *
   * The pages can later read:
   *
   * x-life-country
   * x-life-language
   */
  const requestHeaders = new Headers(request.headers);

  if (country) {
    requestHeaders.set("x-life-country", country);
  } else {
    requestHeaders.delete("x-life-country");
  }

  const defaultCountryLang = country ? COUNTRY_TO_DEFAULT_LANGUAGE[country] : null;
  const effectiveLanguage = language || defaultCountryLang;

  if (effectiveLanguage) {
    requestHeaders.set("x-life-language", effectiveLanguage);
  } else {
    requestHeaders.delete("x-life-language");
  }

  requestHeaders.set(
    "x-life-portal",
    getPortalFromHost(host),
  );

  const requestWithHeaders = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

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
    if (country) {
      rewriteResponse.headers.set("x-life-country", country);
    }
    rewriteResponse.headers.set("x-life-portal", getPortalFromHost(host));

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

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|logos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};