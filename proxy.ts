import { NextResponse, type NextRequest } from "next/server";
import { hasRole } from "@/lib/auth/roles";
import { updateSession } from "@/lib/supabase/middleware";

function hostPath(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  if (request.nextUrl.pathname !== "/") return request.nextUrl.pathname;
  if (host === "tech.viet.mobile") return "/tech";
  if (host === "admin.viet.mobile") return "/admin";
  return "/";
}
export async function proxy(request: NextRequest) {
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
