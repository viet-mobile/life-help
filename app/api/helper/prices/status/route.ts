import { NextResponse } from "next/server";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";

/** Publish (ACTIVE), pause (PAUSED) or unpublish (DRAFT) one of the authenticated helper's own offers. */
export async function POST(request: Request) {
  const resolved = await resolveAuthenticatedHelper(request);
  if (!resolved.ok) return NextResponse.json({ success: false, code: resolved.code }, { status: resolved.status });
  const body = await request.json().catch(() => null) as { price_id?: unknown; status?: unknown } | null;
  if (typeof body?.price_id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.price_id) || !["ACTIVE", "PAUSED", "DRAFT"].includes(String(body?.status))) {
    return NextResponse.json({ success: false, code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const { data, error } = await resolved.value.client.rpc("set_helper_service_price_status", {
    p_helper_id: resolved.value.helper.id,
    p_price_id: body.price_id,
    p_status: body.status,
  });
  if (error || !data) return NextResponse.json({ success: false, code: "SAVE_FAILED" }, { status: 502 });
  if (!data.success) return NextResponse.json({ success: false, code: data.code, reason: data.reason ?? null }, { status: data.code === "PRICE_NOT_FOUND" ? 404 : 422 });
  return NextResponse.json({ success: true, status: data.status, revision: data.revision }, { headers: { "Cache-Control": "no-store" } });
}
