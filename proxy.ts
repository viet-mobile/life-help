import { NextResponse, type NextRequest } from "next/server";
import { hasRole } from "@/lib/auth/roles";
import { updateSession } from "@/lib/supabase/middleware";

function hostPath(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0];

  // Route alias /sys and /sys/*
  if (request.nextUrl.pathname === "/sys") return "/admin";
  if (request.nextUrl.pathname.startsWith("/sys/")) {
    return request.nextUrl.pathname.replace(/^\/sys/, "/admin");
  }

  // Handle subdomain on root path or specific paths
  if (
    host === "sys.life.help" ||
    host === "sys.viet.mobile" ||
    host.startsWith("sys.")
  ) {
    if (request.nextUrl.pathname === "/") return "/admin";
    if (request.nextUrl.pathname === "/login") return "/admin/login";
  }

  if (request.nextUrl.pathname !== "/") return request.nextUrl.pathname;
  if (host === "tech.life.help" || host === "tech.viet.mobile") return "/tech";
  if (host === "admin.life.help" || host === "admin.viet.mobile") return "/admin";
  if (host === "chat.life.help" || host === "chat.viet.mobile") return "/chat";
  return "/";
}

export async function proxy(request: NextRequest) {
  const rawHost = request.headers.get("host") ?? "";
  const host = rawHost.split(":")[0];
  const port = rawHost.includes(":") ? `:${rawHost.split(":")[1]}` : "";

  // If user on a subdomain requests ?portal=main or /main to escape to main portal
  if (
    (host.startsWith("tech.") ||
      host.startsWith("chat.") ||
      host.startsWith("admin.") ||
      host.startsWith("sys.")) &&
    (request.nextUrl.searchParams.get("portal") === "main" ||
      request.nextUrl.pathname === "/main")
  ) {
    const mainHost = host.replace(/^(tech|chat|admin|sys)\./, "");
    return NextResponse.redirect(new URL(`${request.nextUrl.protocol}//${mainHost}${port}/`));
  }

  const pathname = hostPath(request);
  const authRequired =
    process.env.AUTH_ENFORCEMENT === "true" &&
    (pathname.startsWith("/tech") || pathname.startsWith("/admin"));
  const { response, user } = await updateSession(request);
  if (authRequired) {
    const allowed = pathname.startsWith("/admin")
      ? (["ADMIN", "STAFF"] as const)
      : (["TECHNICIAN", "ADMIN", "STAFF"] as const);
    if (!hasRole(user, allowed))
      return NextResponse.redirect(
        new URL(pathname.startsWith("/admin") ? "/admin/login" : "/tech/login", request.url),
      );
  }
  if (pathname !== request.nextUrl.pathname)
    return NextResponse.rewrite(new URL(pathname, request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"] };
