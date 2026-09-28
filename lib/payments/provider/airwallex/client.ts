import type { ProviderEnvironment } from "@/lib/payments/provider/contract";

/**
 * Airwallex HTTP client (server-side only). Authentication: POST /api/v1/authentication/login with the
 * x-client-id + x-api-key headers returns a Bearer token (documented validity 30 minutes), reused until shortly
 * before expiry and refreshed once on a 401. Credentials are constructor inputs from server-side secrets
 * (never the browser, never logged, never echoed in errors). The fetch implementation is injected: tests use
 * deterministic offline fixtures; nothing in this sprint calls the real API.
 */
export const AIRWALLEX_BASE_URL: Record<ProviderEnvironment, string> = { SANDBOX: "https://api-demo.airwallex.com", LIVE: "https://api.airwallex.com" };

export type AirwallexCredentials = { clientId: string; apiKey: string };
export type AirwallexFetch = (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => Promise<{ status: number; json(): Promise<unknown> }>;

export class AirwallexApiError extends Error {
  readonly status: number;
  readonly providerCode: string | null;
  constructor(status: number, providerCode: string | null) {
    super(`AIRWALLEX_HTTP_${status}${providerCode ? `_${providerCode}` : ""}`);
    this.status = status;
    this.providerCode = providerCode;
  }
}

export class AirwallexHttpClient {
  private token: { value: string; expiresAtMs: number } | null = null;
  readonly baseUrl: string;
  private readonly options: { environment: ProviderEnvironment; credentials: AirwallexCredentials; fetch: AirwallexFetch; nowMs?: () => number; loginAs?: string | null };
  constructor(options: { environment: ProviderEnvironment; credentials: AirwallexCredentials; fetch: AirwallexFetch; nowMs?: () => number; loginAs?: string | null }) {
    if (!options.credentials?.clientId || !options.credentials?.apiKey) throw new Error("AIRWALLEX_CREDENTIALS_MISSING");
    this.options = options;
    this.baseUrl = AIRWALLEX_BASE_URL[options.environment];
  }
  private now() { return this.options.nowMs ? this.options.nowMs() : Date.now(); }

  private async accessToken(force = false): Promise<string> {
    if (!force && this.token && this.token.expiresAtMs - 60_000 > this.now()) return this.token.value;
    const headers: Record<string, string> = { "x-client-id": this.options.credentials.clientId, "x-api-key": this.options.credentials.apiKey, "Content-Type": "application/json" };
    if (this.options.loginAs) headers["x-login-as"] = this.options.loginAs;
    const r = await this.options.fetch(`${this.baseUrl}/api/v1/authentication/login`, { method: "POST", headers });
    const body = (await r.json().catch(() => null)) as { token?: string; expires_at?: string } | null;
    if (r.status !== 201 && r.status !== 200) throw new AirwallexApiError(r.status, "AUTHENTICATION_FAILED");
    if (!body?.token) throw new AirwallexApiError(r.status, "AUTHENTICATION_NO_TOKEN");
    const expires = body.expires_at ? Date.parse(body.expires_at) : NaN;
    this.token = { value: body.token, expiresAtMs: Number.isFinite(expires) ? expires : this.now() + 30 * 60_000 };
    return this.token.value;
  }

  async request<T = Record<string, unknown>>(method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const token = await this.accessToken(attempt > 0);
      const r = await this.options.fetch(`${this.baseUrl}${path}`, {
        method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body),
      });
      const json = (await r.json().catch(() => null)) as (T & { code?: string }) | null;
      if (r.status === 401 && attempt === 0) continue;
      if (r.status < 200 || r.status >= 300) throw new AirwallexApiError(r.status, typeof json?.code === "string" ? json.code : null);
      return json as T;
    }
    throw new AirwallexApiError(401, "UNAUTHORIZED");
  }
}
