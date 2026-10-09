import { CUSTOMER_COOKIE, HELPER_COOKIE, REQUEST_TOKEN_COOKIE, clearCookieHeader, isSecret, readCookie, setCookieHeader } from "./credentials";
import type { CreateRequestInput, ServiceCore } from "./core";
import { ServiceError } from "./errors";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface HttpDeps {
  /** The service core, or null when no backend is configured (every route then answers 503 - there is no silent local fallback). */
  core: () => Promise<ServiceCore | null>;
  /** The verified admin identity of this request (signed session), or null. */
  verifyAdmin: (request: Request) => Promise<string | null>;
  /** Locale codes the product supports, from the canonical locale source. */
  locales: readonly string[];
  now?: () => number;
}

const MAX_BODY_BYTES = 32 * 1024;
const JSON_HEADERS = { "Cache-Control": "no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Best-effort per-isolate limiter (edge / WAF limits must back it in production). */
const buckets = new Map<string, { count: number; resetAt: number }>();
export function limit(key: string, max: number, windowMs: number, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return;
  }
  if (++b.count > max) throw new ServiceError("RATE_LIMITED");
}
export const resetLimits = () => buckets.clear();

function json(data: unknown, status = 200, cookies: string[] = []): Response {
  const headers = new Headers(JSON_HEADERS);
  for (const c of cookies) headers.append("Set-Cookie", c);
  return Response.json(data, { status, headers });
}

/** CSRF defence for cookie-authenticated writes: the browser always sends Origin (or Sec-Fetch-Site) on fetch() POSTs. */
function assertSameOrigin(request: Request) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host).toLowerCase();
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host.toLowerCase() === host) return;
    } catch { /* fall through */ }
    throw new ServiceError("BAD_ORIGIN");
  }
  if (request.headers.get("sec-fetch-site") === "same-origin") return;
  throw new ServiceError("BAD_ORIGIN");
}

async function readBody(request: Request): Promise<Record<string, any>> {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) throw new ServiceError("UNSUPPORTED_MEDIA_TYPE");
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) throw new ServiceError("PAYLOAD_TOO_LARGE");
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === "object" && !Array.isArray(v)) return v;
  } catch { /* below */ }
  throw new ServiceError("INVALID_INPUT");
}

const isHttps = (request: Request) => (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "")) === "https";
const clientKey = (request: Request) => request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

export function createServiceHandler(deps: HttpDeps) {
  const now = deps.now ?? Date.now;
  const locale = (v: unknown, fallback: string) => (typeof v === "string" && deps.locales.includes(v) ? v : fallback);
  const intParam = (v: string | null) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0; };
  const id = (v: string) => { if (!UUID.test(v)) throw new ServiceError("NOT_FOUND"); return v; };

  return async function handle(request: Request, path: string[]): Promise<Response> {
    try {
      const core = await deps.core();
      if (!core) throw new ServiceError("SERVICE_UNAVAILABLE");
      const method = request.method.toUpperCase();
      const url = new URL(request.url);
      const writes = method !== "GET" && method !== "HEAD";
      if (writes) assertSameOrigin(request);
      const secure = isHttps(request);
      const route = `/${path.join("/")}`;
      const m = (re: RegExp) => route.match(re);
      const ip = clientKey(request);
      const t = now();
      let hit: RegExpMatchArray | null;

      /* ------------------------------------------------------------ customer */
      if (route.startsWith("/c/")) {
        const cred = readCookie(request, CUSTOMER_COOKIE);
        // A request's access token reaches the server in an HttpOnly cookie set by the claim exchange below (browsers never keep it in
        // JS-readable storage); the header form is for non-browser clients.
        const tokenCookie = (reqId: string) => readCookie(request, `${REQUEST_TOKEN_COOKIE}${reqId.replace(/-/g, "")}`);
        const headerToken = request.headers.get("x-svc-token");
        const tokenFor = (reqId: string) => headerToken ?? tokenCookie(reqId);
        const tokenCookieHeader = (reqId: string, value: string) =>
          setCookieHeader(`${REQUEST_TOKEN_COOKIE}${reqId.replace(/-/g, "")}`, value, { maxAgeSec: 90 * 86_400, secure });
        if (route === "/c/requests" && method === "POST") {
          limit(`create:${ip}`, 20, 3_600_000, t);
          const body = await readBody(request);
          const out = await core.createRequest(cred, { ...(body as CreateRequestInput), locale: locale(body.locale, "") });
          const { credential, ...rest } = out;
          const cookies = [tokenCookieHeader(rest.request.id, rest.token)];
          if (credential) cookies.push(setCookieHeader(CUSTOMER_COOKIE, credential, { maxAgeSec: 400 * 86_400, secure }));
          return json(rest, 201, cookies);
        }
        if ((hit = m(/^\/c\/requests\/([^/]+)\/claim$/)) && method === "POST") {
          // One-time exchange: the link's token is verified, then kept only as an HttpOnly cookie for this browser
          limit(`claim:${ip}`, 30, 600_000, t);
          const body = await readBody(request);
          if (!isSecret(body.token)) throw new ServiceError("FORBIDDEN");
          const reqId = id(hit[1]);
          const out = await core.getCustomerRequest(cred, body.token, reqId); // FORBIDDEN / NOT_FOUND unless the token is valid for this request
          return json({ request: out.request }, 200, [tokenCookieHeader(reqId, body.token)]);
        }
        if (route === "/c/requests" && method === "GET") return json({ requests: await core.listCustomerRequests(cred) });
        if ((hit = m(/^\/c\/requests\/([^/]+)$/)) && method === "GET") return json(await core.getCustomerRequest(cred, tokenFor(id(hit[1])), id(hit[1])));
        if ((hit = m(/^\/c\/requests\/([^/]+)\/cancel$/)) && method === "POST") return json({ request: await core.cancelCustomerRequest(cred, tokenFor(id(hit[1])), id(hit[1])) });
        if ((hit = m(/^\/c\/requests\/([^/]+)\/messages$/))) {
          if (method === "GET") return json({ messages: await core.listMessages("CUSTOMER", cred, tokenFor(id(hit[1])), id(hit[1]), intParam(url.searchParams.get("after")), locale(url.searchParams.get("locale"), "en")) });
          if (method === "POST") {
            limit(`msg:${cred ?? ip}`, 60, 60_000, t);
            const body = await readBody(request);
            return json({ message: await core.sendMessage("CUSTOMER", cred, tokenFor(id(hit[1])), id(hit[1]), body.body, locale(body.locale, ""), body.clientId) }, 201);
          }
        }
        if (route === "/c/notifications" && method === "GET") return json({ notifications: await core.notifications("CUSTOMER", cred, intParam(url.searchParams.get("after"))) });
        if (route === "/c/notifications/read" && method === "POST") {
          const body = await readBody(request);
          return json({ marked: await core.markNotificationsRead("CUSTOMER", cred, Number(body.upTo) || 0) });
        }
      }

      /* -------------------------------------------------------------- helper */
      if (route.startsWith("/h/")) {
        const cred = readCookie(request, HELPER_COOKIE);
        if (route === "/h/register" && method === "POST") {
          limit(`hreg:${ip}`, 10, 3_600_000, t);
          const body = await readBody(request);
          const { helper, credential } = await core.registerHelper({ ...(body as Parameters<ServiceCore["registerHelper"]>[0]), primaryLocale: locale(body.primaryLocale, ""), spokenLocales: Array.isArray(body.spokenLocales) ? body.spokenLocales.filter((l: unknown) => typeof l === "string" && deps.locales.includes(l)) : [] });
          // the credential is returned ONCE (to be kept by the applicant) and also signs this browser in
          return json({ helper, credential }, 201, [setCookieHeader(HELPER_COOKIE, credential, { maxAgeSec: 90 * 86_400, secure })]);
        }
        if (route === "/h/login" && method === "POST") {
          limit(`hlogin:${ip}`, 20, 600_000, t);
          const body = await readBody(request);
          const credential = typeof body.credential === "string" ? body.credential.trim().toLowerCase() : "";
          if (!isSecret(credential)) throw new ServiceError("FORBIDDEN");
          const helper = await core.helperMe(credential); // FORBIDDEN unless known, unexpired and not DISABLED
          return json({ helper }, 200, [setCookieHeader(HELPER_COOKIE, credential, { maxAgeSec: 90 * 86_400, secure })]);
        }
        if (route === "/h/logout" && method === "POST") return json({ ok: true }, 200, [clearCookieHeader(HELPER_COOKIE, secure)]);
        if (route === "/h/me" && method === "GET") return json({ helper: await core.helperMe(cred) });
        if (route === "/h/me" && method === "PATCH") return json({ helper: await core.updateHelperProfile(cred, await readBody(request)) });
        if (route === "/h/available" && method === "POST") return json({ helper: await core.setAvailable(cred, (await readBody(request)).available === true) });
        if (route === "/h/requests" && method === "GET") return json(await core.listHelperRequests(cred));
        if ((hit = m(/^\/h\/requests\/([^/]+)$/)) && method === "GET") return json({ request: await core.getHelperRequest(cred, id(hit[1])) });
        if ((hit = m(/^\/h\/requests\/([^/]+)\/(accept|start|complete)$/)) && method === "POST") {
          return json({ request: await core.helperAction(hit[2] as "accept" | "start" | "complete", cred, id(hit[1])) });
        }
        if ((hit = m(/^\/h\/requests\/([^/]+)\/messages$/))) {
          if (method === "GET") return json({ messages: await core.listMessages("HELPER", cred, null, id(hit[1]), intParam(url.searchParams.get("after")), locale(url.searchParams.get("locale"), "ko")) });
          if (method === "POST") {
            limit(`hmsg:${cred ?? ip}`, 60, 60_000, t);
            const body = await readBody(request);
            return json({ message: await core.sendMessage("HELPER", cred, null, id(hit[1]), body.body, locale(body.locale, ""), body.clientId) }, 201);
          }
        }
        if (route === "/h/notifications" && method === "GET") return json({ notifications: await core.notifications("HELPER", cred, intParam(url.searchParams.get("after"))) });
        if (route === "/h/notifications/read" && method === "POST") return json({ marked: await core.markNotificationsRead("HELPER", cred, Number((await readBody(request)).upTo) || 0) });
      }

      /* --------------------------------------------------------------- admin */
      if (route.startsWith("/a/")) {
        const admin = await deps.verifyAdmin(request);
        if (!admin) throw new ServiceError("UNAUTHENTICATED");
        const readerLocale = locale(url.searchParams.get("locale"), "ko");
        if (route === "/a/requests" && method === "GET") return json({ requests: await core.adminListRequests(url.searchParams.get("status")) });
        if ((hit = m(/^\/a\/requests\/([^/]+)$/)) && method === "GET") return json(await core.adminGetRequest(id(hit[1])));
        if ((hit = m(/^\/a\/requests\/([^/]+)\/assign$/)) && method === "POST") {
          const body = await readBody(request);
          return json({ request: await core.adminAssign(admin, id(hit[1]), id(String(body.helperId ?? ""))) });
        }
        if ((hit = m(/^\/a\/requests\/([^/]+)\/cancel$/)) && method === "POST") return json({ request: await core.adminCancel(admin, id(hit[1])) });
        if ((hit = m(/^\/a\/requests\/([^/]+)\/messages$/))) {
          if (method === "GET") return json({ messages: await core.adminListMessages(id(hit[1]), intParam(url.searchParams.get("after")), readerLocale) });
          if (method === "POST") {
            const body = await readBody(request);
            return json({ message: await core.adminSendMessage(admin, id(hit[1]), body.body, locale(body.locale, "ko"), body.clientId) }, 201);
          }
        }
        if (route === "/a/helpers" && method === "GET") return json({ helpers: await core.adminListHelpers(url.searchParams.get("status")) });
        if ((hit = m(/^\/a\/helpers\/([^/]+)\/status$/)) && method === "POST") return json({ helper: await core.adminSetHelperStatus(admin, id(hit[1]), String((await readBody(request)).status ?? "")) });
        if ((hit = m(/^\/a\/helpers\/([^/]+)$/)) && method === "PATCH") return json({ helper: await core.adminUpdateHelper(admin, id(hit[1]), await readBody(request)) });
        if (route === "/a/notifications" && method === "GET") return json({ notifications: await core.adminNotifications(intParam(url.searchParams.get("after"))) });
      }

      throw new ServiceError("NOT_FOUND");
    } catch (err) {
      if (err instanceof ServiceError) return json({ error: err.code }, err.status);
      console.error("service core error", err instanceof Error ? err.message : err);
      return json({ error: "INTERNAL" }, 500);
    }
  };
}
