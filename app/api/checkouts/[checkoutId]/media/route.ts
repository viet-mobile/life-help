import { NextResponse } from "next/server";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { ALLOWED_MEDIA_TYPES, MAX_MEDIA_BYTES, uploadPrivateMedia } from "@/lib/media/mediaStorage";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

/**
 * POST /api/checkouts/{checkoutId}/media (raw body, Content-Type = the file type): the owner attaches
 * a photo / video to an OPEN checkout. Stored only in the private bucket under a server-generated key;
 * registered in request_media (max 10 per request, 50 MB each, images / videos only).
 */
export async function POST(request: Request, context: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(checkoutId)) return NextResponse.json({ success: false, code: "CHECKOUT_NOT_FOUND" }, { status: 404 });
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!(ALLOWED_MEDIA_TYPES as readonly string[]).includes(contentType)) return NextResponse.json({ success: false, code: "MEDIA_TYPE_NOT_ALLOWED" }, { status: 415 });
  const declared = Number(request.headers.get("content-length") || "0");
  if (declared > MAX_MEDIA_BYTES) return NextResponse.json({ success: false, code: "MEDIA_TOO_LARGE" }, { status: 413 });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const owner = await resolveCustomerOwner(client);
  if (!owner.ok) return NextResponse.json({ success: false, code: owner.code }, { status: owner.status });
  const { data: checkout } = await client.from("service_checkouts").select("id, status").eq("id", checkoutId).eq("customer_id", owner.owner.customerId).maybeSingle();
  if (!checkout) return NextResponse.json({ success: false, code: "CHECKOUT_NOT_FOUND" }, { status: 404 });
  if (checkout.status !== "OPEN") return NextResponse.json({ success: false, code: "CHECKOUT_NOT_OPEN" }, { status: 409 });
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_MEDIA_BYTES) return NextResponse.json({ success: false, code: "MEDIA_TOO_LARGE" }, { status: 413 });
  const stored = await uploadPrivateMedia(client, checkoutId, contentType, bytes);
  if (!stored.ok) return NextResponse.json({ success: false, code: stored.code }, { status: 503 });
  const storageProvider = "SUPABASE_STORAGE_PRIVATE";
  const { data } = await client.rpc("register_request_media", {
    p_checkout_id: checkoutId, p_customer_id: owner.owner.customerId, p_storage_provider: storageProvider, p_object_key: stored.objectKey,
    p_content_type: contentType, p_byte_size: bytes.byteLength,
  });
  if (!data?.success) return NextResponse.json({ success: false, code: data?.code ?? "MEDIA_REJECTED" }, { status: 409 });
  return NextResponse.json({ success: true, mediaId: data.media_id }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
