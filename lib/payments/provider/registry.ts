import type { PaymentProviderAdapter, ProviderEnvironment } from "@/lib/payments/provider/contract";
import { providerSecretNames } from "@/lib/payments/provider/contract";
import { MOCK_PROVIDER_CODE, MockPaymentProvider } from "@/lib/payments/provider/mockProvider";

/**
 * Which provider adapters this deployment may use. Deny by default:
 *   - no real provider is registered yet (none chosen);
 *   - the deployment environment is SANDBOX only on the STAGING project with LIFE_HELP_PROVIDER_ENVIRONMENT=SANDBOX;
 *     anything else (production, unknown) has NO provider environment, so every provider call is refused;
 *   - the MOCK provider additionally needs LIFE_HELP_MOCK_PROVIDER=ENABLED and is never available for LIVE.
 * The staging Solana devnet direct signer is a separate rail (lib/payments/transfers.ts) and is never
 * returned here: it can not act as a production provider adapter.
 */
const STAGING_REF = "wreebowcbiymodswajwe";

export function deploymentProviderEnvironment(env: Record<string, string | undefined>): ProviderEnvironment | null {
  const ref = (env.SUPABASE_URL || "").match(/([a-z0-9]+)\.supabase\.(?:co|in)/i)?.[1];
  if (ref === STAGING_REF && env.LIFE_HELP_PROVIDER_ENVIRONMENT === "SANDBOX") return "SANDBOX";
  return null;
}

export function resolveProviderAdapter(code: string, env: Record<string, string | undefined>): PaymentProviderAdapter | null {
  const environment = deploymentProviderEnvironment(env);
  if (!environment) return null;
  if (code === MOCK_PROVIDER_CODE) {
    if (environment !== "SANDBOX" || env.LIFE_HELP_MOCK_PROVIDER !== "ENABLED") return null;
    return new MockPaymentProvider("SANDBOX");
  }
  return null;
}

/** Server-side secrets only (runtime env); never logged, never returned. */
export function providerWebhookSecret(code: string, env: Record<string, string | undefined>): string | null {
  const value = env[providerSecretNames(code).webhookSecret];
  return value && value.length >= 16 ? value : null;
}
