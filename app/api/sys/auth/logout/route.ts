import { NextResponse } from "next/server";
import { SYS_SESSION_COOKIE } from "@/lib/auth/sysSession";
import { isSameOrigin } from "@/lib/security/guards";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "BAD_ORIGIN" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: SYS_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
