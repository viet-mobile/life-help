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
]);

function getHost(request: NextRequest) {
  return (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
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

function getPortalFromHost(host: string): "customer" | "tech" | "chat" | "sys" | "main" {
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

  return LANGUAGES.has(firstSegment) ? firstSegment : null;
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

  /**
   * Global system
   *
   * sys.life.help
   * → /admin
   */
  if (portal === "sys" && host === "sys.life.help") {
    if (pathname === "/") {
      return {
        pathname: "/admin",
        country: null,
        language: null,
      };
    }

    if (pathname === "/login") {
      return {
        pathname: "/admin/login",
        country: null,
        language: null,
      };
    }
  }

  /**
   * Country system
   *
   * sys.korea.life.help
   * → /admin
   */
  if (portal === "sys" && country) {
    if (pathname === "/") {
      return {
        pathname: "/admin",
        country,
        language: null,
      };
    }

    if (pathname === "/login") {
      return {
        pathname: "/admin/login",
        country,
        language: null,
      };
    }

    if (pathname.startsWith("/admin")) {
      return {
        pathname,
        country,
        language: null,
      };
    }

    return {
      pathname: `/admin${pathname}`,
      country,
      language: null,
    };
  }

  /**
   * Technician portal
   *
   * tech.korea.life.help
   * → /tech
   */
  if (portal === "tech") {
    if (pathname === "/") {
      return {
        pathname: "/tech",
        country,
        language: null,
      };
    }

    if (pathname.startsWith("/tech")) {
      return {
        pathname,
        country,
        language: null,
      };
    }

    return {
      pathname: `/tech${pathname}`,
      country,
      language: null,
    };
  }

  /**
   * Chat portal
   *
   * chat.korea.life.help
   * → /chat
   */
  if (portal === "chat") {
    if (pathname === "/") {
      return {
        pathname: "/chat",
        country,
        language: null,
      };
    }

    if (pathname.startsWith("/chat")) {
      return {
        pathname,
        country,
        language: null,
      };
    }

    return {
      pathname: `/chat${pathname}`,
      country,
      language: null,
    };
  }

  /**
   * Customer portal
   *
   * korea.life.help/vi
   * vietnam.life.help/ko
   *
   * Domain = country
   * First path segment = language
   */
  if (country) {
    const language = getLanguage(pathname);

    if (language) {
      const strippedPath =
        pathname === `/${language}`
          ? "/"
          : pathname.replace(new RegExp(`^/${language}(?=/|$)`), "");

      return {
        pathname: strippedPath || "/",
        country,
        language,
      };
    }

    return {
      pathname,
      country,
      language: null,
    };
  }

  /**
   * Existing legacy/global routes
   *
   * Keep compatibility with the current project.
   */
  if (pathname === "/sys") {
    return {
      pathname: "/admin",
      country: null,
      language: null,
    };
  }

  if (pathname.startsWith("/sys/")) {
    return {
      pathname: pathname.replace(/^\/sys/, "/admin"),
      country: null,
      language: null,
    };
  }

  return {
    pathname,
    country: null,
    language: null,
  };
}

export async function proxy(request: NextRequest) {
  const rawHost = request.headers.get("host") ?? "";
  const host = rawHost.split(":")[0].toLowerCase();
  const port = rawHost.includes(":")
    ? `:${rawHost.split(":")[1]}`
    : "";

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

  if (language) {
    requestHeaders.set("x-life-language", language);
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

    return NextResponse.rewrite(
      rewriteUrl,
      {
        request: {
          headers: requestHeaders,
        },
      },
    );
  }

  /**
   * If there is no rewrite, still pass the routing headers.
   */
  if (
    country ||
    language ||
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};