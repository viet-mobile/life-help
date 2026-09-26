import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Protected request media (customer photos / videos).
 *
 * Files live only in a PRIVATE bucket and are never given a public or signed download URL. The
 * Worker streams a file only after authorize_request_media_view() (owner, or the currently assigned
 * Helper) and every view is logged. Deletion is scheduled by the database when the customer confirms
 * "service complete" (or cancels) and executed by runMediaDeletion() (cleanup cron).
 *
 * Honest limit: a web page cannot technically block screenshots / screen recording, and a second
 * camera can always film a screen. We do not claim otherwise: the UI tells customers and Helpers so,
 * the media view carries a per-viewer watermark, saving is prohibited by policy, and views are traceable.
 */

export const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "video/mp4", "video/quicktime", "video/webm"] as const;
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024; // storage bucket limit (database allows up to 100 MB)

async function bucketName(): Promise<string | null> {
  try {
    const env = (await getCloudflareContext({ async: true })).env as Record<string, string | undefined>;
    const bucket = env.LIFE_HELP_MEDIA_BUCKET?.trim();
    return bucket && /^[a-z0-9-]{3,63}$/.test(bucket) ? bucket : null;
  } catch {
    return null;
  }
}

/** Private-bucket upload; the object key is server-generated (never from the client). */
export async function uploadPrivateMedia(client: SupabaseClient, checkoutId: string, contentType: string, bytes: ArrayBuffer): Promise<{ ok: true; objectKey: string } | { ok: false; code: string }> {
  const bucket = await bucketName();
  if (!bucket) return { ok: false, code: "MEDIA_STORAGE_NOT_CONFIGURED" };
  const extension = contentType.split("/")[1].replace("quicktime", "mov");
  const objectKey = `requests/${checkoutId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(bucket).upload(objectKey, bytes, { contentType, upsert: false, cacheControl: "no-store" });
  return error ? { ok: false, code: "MEDIA_UPLOAD_FAILED" } : { ok: true, objectKey };
}

export async function readPrivateMedia(client: SupabaseClient, objectKey: string): Promise<Blob | null> {
  const bucket = await bucketName();
  if (!bucket) return null;
  const { data } = await client.storage.from(bucket).download(objectKey);
  return data ?? null;
}

/** Permanently delete scheduled media (storage object first, then the ledger row -> DELETED). */
export async function runMediaDeletion(client: SupabaseClient, limit = 50): Promise<{ deleted: number; failed: number; notConfigured: boolean }> {
  const bucket = await bucketName();
  const { data } = await client.rpc("list_media_pending_deletion", { p_limit: limit });
  const pending = (Array.isArray(data) ? data : []) as Array<{ media_id: string; object_key: string }>;
  if (!bucket) return { deleted: 0, failed: pending.length, notConfigured: true };
  let deleted = 0, failed = 0;
  for (const item of pending) {
    const { error } = await client.storage.from(bucket).remove([item.object_key]);
    // Verify the object is really gone before recording DELETED (a failed delete stays queued).
    const still = error ? null : await client.storage.from(bucket).download(item.object_key);
    if (error || still?.data) { failed += 1; continue; }
    const { data: marked } = await client.rpc("mark_request_media_deleted", { p_media_id: item.media_id });
    if (marked?.success) deleted += 1; else failed += 1;
  }
  return { deleted, failed, notConfigured: false };
}

/** Response headers for an in-app media view: inline only, never cached, never embeddable elsewhere. */
export function protectedMediaHeaders(contentType: string): Record<string, string> {
  return {
    "Content-Type": contentType,
    "Content-Disposition": "inline",
    "Cache-Control": "no-store, private, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
  };
}
