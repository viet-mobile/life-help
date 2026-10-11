import { NextResponse } from "next/server";
import { CONTENT_VERSION } from "@/lib/learn/content/assets";

/**
 * Uptime probe for external monitors (UptimeRobot, Cloudflare Health Checks, ...).
 * Cheap on purpose: no database call, no secrets, no user data. It proves that the Worker runs and serves the committed content version.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { ok: true, service: "life-help", contentVersion: CONTENT_VERSION, time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export function HEAD() {
  return new Response(null, { status: 200, headers: { "Cache-Control": "no-store" } });
}
