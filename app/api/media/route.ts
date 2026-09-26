import { NextResponse } from "next/server";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

/**
 * GET /api/media?requestId= : ids + types of a request's ACTIVE photos / videos (no URLs, no keys).
 * Owner (device-owner cookie) or the Helper currently holding an active assignment on the request.
 * Each file is then viewed through /api/media/{id}, which re-authorizes and logs every view.
 */
export async function GET(request: Request) {
  const requestId = new URL(request.url).searchParams.get("requestId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return NextResponse.json({ success: false, code: "REQUEST_NOT_FOUND" }, { status: 404 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const helper = await resolveAuthenticatedHelper(request);
  let allowed = false;
  let viewer: "CUSTOMER" | "HELPER" = "CUSTOMER";
  let viewerRef = "";
  if (helper.ok) {
    const { data: active } = await client.from("request_assignments").select("id").eq("request_id", requestId).eq("helper_id", helper.value.helper.id).in("status", ["PENDING", "NOTIFIED", "ACCEPTED"]).limit(1).maybeSingle();
    allowed = !!active; viewer = "HELPER"; viewerRef = helper.value.helper.id;
  } else {
    const owner = await resolveCustomerOwner(client);
    if (owner.ok) {
      const { data: row } = await client.from("service_requests").select("id").eq("id", requestId).eq("customer_id", owner.owner.customerId).maybeSingle();
      allowed = !!row; viewerRef = owner.owner.identityId;
    }
  }
  if (!allowed) return NextResponse.json({ success: false, code: "MEDIA_NOT_AVAILABLE" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const { data } = await client.from("request_media").select("id, media_kind, content_type").eq("request_id", requestId).eq("status", "ACTIVE").order("created_at");
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`life.help/media-watermark/v1:${viewerRef}`)));
  const watermark = `${viewer === "HELPER" ? "H" : "C"}-${Array.from(digest.slice(0, 3), (b) => b.toString(16).padStart(2, "0")).join("")}`;
  return NextResponse.json({ success: true, viewer, watermark, media: (data ?? []).map((m) => ({ id: m.id, kind: m.media_kind, contentType: m.content_type })) }, { headers: { "Cache-Control": "no-store" } });
}
