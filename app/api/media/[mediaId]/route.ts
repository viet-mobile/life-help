import { NextResponse } from "next/server";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { resolveAuthenticatedHelper } from "@/lib/helper/serverIdentity";
import { protectedMediaHeaders, readPrivateMedia } from "@/lib/media/mediaStorage";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

/**
 * GET /api/media/{mediaId}: in-app view of one request photo / video.
 * Allowed: the owning customer (device-owner cookie) or the Helper currently assigned (Supabase Auth,
 * never after completing the work). Each view is logged. Streamed inline with no-store headers; no
 * public, signed or download URL exists. (Screenshots cannot be blocked by any web page: disclosed.)
 */
export async function GET(request: Request, context: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(mediaId)) return NextResponse.json({ success: false, code: "MEDIA_NOT_AVAILABLE" }, { status: 404 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const helper = await resolveAuthenticatedHelper(request);
  const owner = helper.ok ? null : await resolveCustomerOwner(client);
  const { data } = await client.rpc("authorize_request_media_view", {
    p_media_id: mediaId,
    p_customer_id: owner?.ok ? owner.owner.customerId : null,
    p_helper_id: helper.ok ? helper.value.helper.id : null,
  });
  if (!data?.success) return NextResponse.json({ success: false, code: "MEDIA_NOT_AVAILABLE" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const blob = await readPrivateMedia(client, String(data.object_key));
  if (!blob) return NextResponse.json({ success: false, code: "MEDIA_STORAGE_NOT_CONFIGURED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return new NextResponse(blob.stream(), { status: 200, headers: protectedMediaHeaders(String(data.content_type)) });
}
