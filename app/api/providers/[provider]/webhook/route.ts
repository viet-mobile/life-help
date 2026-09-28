import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";
import { ingestProviderWebhook } from "@/lib/payments/provider/ingest";
import { deploymentProviderEnvironment, providerWebhookSecret, resolveProviderAdapter } from "@/lib/payments/provider/registry";

const MAX_WEBHOOK_BYTES = 256 * 1024;

function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/providers/{provider}/webhook - provider-neutral signed webhook ingestion.
 * The RAW body is read once and handed, unparsed, to the provider adapter for signature verification;
 * nothing is parsed or recorded before the signature verifies. Unknown / unconfigured provider, missing
 * secret, wrong environment and invalid signatures are refused without touching the ledger.
 * Responses carry codes only (no secrets, no payload echo).
 */
export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(provider)) return respond(404, { success: false, code: "UNKNOWN_PROVIDER" });
  let env: Record<string, string | undefined> = {};
  try { env = (await getCloudflareContext({ async: true })).env as Record<string, string | undefined>; } catch { env = {}; }
  const adapter = resolveProviderAdapter(provider, env);
  if (!adapter) return respond(404, { success: false, code: "UNKNOWN_PROVIDER" });
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > MAX_WEBHOOK_BYTES) return respond(413, { success: false, code: "PAYLOAD_TOO_LARGE" });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return respond(503, { success: false, code: "SERVICE_UNAVAILABLE" });
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });
  const outcome = await ingestProviderWebhook(client, adapter, { rawBody, headers }, {
    deploymentEnvironment: deploymentProviderEnvironment(env), webhookSecret: providerWebhookSecret(provider, env),
  });
  return respond(outcome.httpStatus, {
    success: outcome.httpStatus === 200, code: outcome.code,
    results: outcome.results.map((r) => ({ result: r.result ?? null, code: r.code ?? null, replayed: r.replayed === true })),
  });
}
