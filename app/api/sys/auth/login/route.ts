import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { constantTimeEqual, SYS_SESSION_COOKIE } from "@/lib/auth/sysSession";

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });

    const adminId = (env as any).LIFE_HELP_SYS_ADMIN_ID as string | undefined;
    const adminPassword = (env as any).LIFE_HELP_SYS_ADMIN_PASSWORD as string | undefined;
    const sessionSecret = (env as any).LIFE_HELP_SYS_SESSION_SECRET as string | undefined;

    if (!adminId || !adminPassword || !sessionSecret) {
      console.error("SYS admin secrets are not configured.");
      return NextResponse.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const id = String(body.id ?? "").trim();
    const password = String(body.password ?? "");

    const isIdValid = constantTimeEqual(id, adminId);
    const isPasswordValid = constantTimeEqual(password, adminPassword);

    if (!isIdValid || !isPasswordValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    const payload = `${adminId}|${expiresAt}`;
    const signature = await hmac(sessionSecret, payload);
    const token = `${payload}|${signature}`;

    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: SYS_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("SYS login error:", error);
    return NextResponse.json(
      { ok: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
