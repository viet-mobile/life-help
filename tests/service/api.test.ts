/* eslint-disable @typescript-eslint/no-explicit-any -- the SQL harness handles untyped rows */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { locales } from "@/messages";
import { createLocalDb } from "@/lib/service/dbLocal";
import { ServiceCore } from "@/lib/service/core";
import { createServiceHandler, resetLimits } from "@/lib/service/http";
import { FakeTranslator, MyMemoryTranslator } from "@/lib/service/translate";
import { readSupabaseConfig } from "@/lib/service/dbSupabase";
import { resolveBackend, resolveTranslator } from "@/lib/service/runtime";
import { normalizeServiceSlug } from "@/lib/service/catalog";

/**
 * The HTTP layer on the real SQL (embedded Postgres, same migration as production). Each actor is a separate agent with its own
 * cookie jar - the customer, the helper and the admin share nothing but the server.
 */
const ORIGIN = "http://localhost:3100";
const IKSAN = { country: "KR", sido: "전북특별자치도", gungu: "익산시" };
const ADMIN_COOKIE = "test_admin=ok";

let local: Awaited<ReturnType<typeof createLocalDb>>;
let translator: FakeTranslator;
let core: ServiceCore | null;
let handle: ReturnType<typeof createServiceHandler>;
let clock = 1_800_000_000_000;

class Agent {
  jar = new Map<string, string>();
  constructor(readonly name: string, private admin = false) {}
  async call(method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { host: "localhost:3100", ...extra };
    const cookie = [...this.jar].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).concat(this.admin ? [ADMIN_COOKIE] : []).join("; ");
    if (cookie) headers.cookie = cookie;
    if (method !== "GET") { headers.origin = headers.origin ?? ORIGIN; headers["content-type"] = headers["content-type"] ?? "application/json"; }
    const res = await handle(new Request(`${ORIGIN}/api/svc${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), path.split("?")[0].split("/").filter(Boolean));
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";"); const i = pair.indexOf("=");
      const name = pair.slice(0, i), value = decodeURIComponent(pair.slice(i + 1));
      if (/Max-Age=0/i.test(c)) this.jar.delete(name); else this.jar.set(name, value);
    }
    return { status: res.status, body: (await res.json()) as any, headers: res.headers };
  }
  get = (p: string, h?: Record<string, string>) => this.call("GET", p, undefined, h);
  post = (p: string, b: unknown = {}, h?: Record<string, string>) => this.call("POST", p, b, h);
}

const newRequest = { serviceSlug: "clog-clearing", ...IKSAN, address: "전북특별자치도 익산시 신동 대학로 123", description: "Bồn cầu bị tắc nghẽn", locale: "vi", selectedOptions: ["urgent"] };

async function approvedHelper(agent: Agent, over: Record<string, unknown> = {}) {
  const reg = await agent.post("/h/register", { name: "Helper A", primaryLocale: "ko", spokenLocales: ["ko", "vi"], services: ["clog-clearing"], regions: [IKSAN], ...over });
  expect(reg.status).toBe(201);
  const admin = new Agent("admin", true);
  expect((await admin.post(`/a/helpers/${reg.body.helper.id}/status`, { status: "APPROVED" })).status).toBe(200);
  expect((await agent.post("/h/available", { available: true })).status).toBe(200);
  return { id: reg.body.helper.id as string, credential: reg.body.credential as string };
}

beforeAll(async () => {
  local = await createLocalDb();
  translator = new FakeTranslator();
  core = new ServiceCore(local, translator, () => clock, 60_000);
  handle = createServiceHandler({ core: async () => core, locales, verifyAdmin: async (req) => (req.headers.get("cookie")?.includes(ADMIN_COOKIE) ? "admin-1" : null), now: () => clock });
}, 120_000);
afterAll(async () => { await local.close(); });
beforeEach(() => { resetLimits(); translator.calls.length = 0; });

describe("service API: three separate clients, one server", { timeout: 60_000 }, () => {
  it("customer -> helper (another device) -> chat -> start -> complete, admin sees the same request", async () => {
    const customer = new Agent("customer"), helper = new Agent("helper"), admin = new Agent("admin", true);
    const h = await approvedHelper(helper);

    const created = await customer.post("/c/requests", newRequest);
    expect(created.status).toBe(201);
    const { request, token } = created.body;
    expect(request.status).toBe("WAITING");
    expect(customer.jar.get("lh_c")).toMatch(/^[0-9a-f]{64}$/); // anonymous credential in a cookie, no phone, no account
    expect(created.body.eligibleHelpers).toBe(1);

    // the helper (a different client) is told and sees it, without the street address; the description comes with a ko translation
    const feed = await helper.get("/h/notifications");
    expect(feed.body.notifications.map((n: any) => [n.event, n.requestId])).toEqual([["NEW_REQUEST_AVAILABLE", request.id]]);
    const list = await helper.get("/h/requests");
    const seen = list.body.available.find((r: any) => r.id === request.id);
    expect(seen.address).toBeNull();
    expect(seen.sourceLocale).toBe("vi");
    expect(seen.description).toBe("Bồn cầu bị tắc nghẽn"); // original preserved
    expect(seen.descriptionTranslation).toEqual({ locale: "ko", text: "[ko] Bồn cầu bị tắc nghẽn", status: "OK" });
    expect(translator.calls[0]).toMatchObject({ from: "vi", to: "ko" }); // NOT assumed to be English

    // the admin (third client) sees the very same request
    const adminList = await admin.get("/a/requests");
    expect(adminList.body.requests.map((r: any) => r.id)).toContain(request.id);

    const accepted = await helper.post(`/h/requests/${request.id}/accept`);
    expect(accepted.body.request.status).toBe("ASSIGNED");
    expect(accepted.body.request.address).toContain("대학로");
    const mine = await customer.get(`/c/requests/${request.id}`);
    expect(mine.body.request.status).toBe("ASSIGNED");
    expect(mine.body.request.helper.displayName).toBe("Helper A");
    expect(JSON.stringify(mine.body)).not.toMatch(/credential|token_hash|contactEmail|email/i);
    expect((await customer.get("/c/notifications")).body.notifications.map((n: any) => n.event)).toEqual(["HELPER_ACCEPTED"]);

    // chat, both directions, each reader gets the other side's text in their own language next to the original
    await customer.post(`/c/requests/${request.id}/messages`, { body: "Xin chào, tôi cần giúp", locale: "vi" });
    await helper.post(`/h/requests/${request.id}/messages`, { body: "네, 곧 가겠습니다", locale: "ko" });
    const forHelper = (await helper.get(`/h/requests/${request.id}/messages?locale=ko`)).body.messages;
    expect(forHelper.map((m: any) => [m.senderKind, m.body, m.own, m.translationStatus])).toEqual([["CUSTOMER", "Xin chào, tôi cần giúp", false, "OK"], ["HELPER", "네, 곧 가겠습니다", true, "NONE"]]);
    expect(forHelper[0].translation).toEqual({ locale: "ko", text: "[ko] Xin chào, tôi cần giúp" });
    const forCustomer = (await customer.get(`/c/requests/${request.id}/messages?locale=vi`, { "x-svc-token": token })).body.messages;
    expect(forCustomer.map((m: any) => [m.senderKind, m.translationStatus])).toEqual([["CUSTOMER", "NONE"], ["HELPER", "OK"]]);
    expect(forCustomer[1].translation.text).toBe("[vi] 네, 곧 가겠습니다");
    // polling with a cursor returns only what is new
    const cursor = forHelper.at(-1).seq;
    await customer.post(`/c/requests/${request.id}/messages`, { body: "Cảm ơn", locale: "vi" });
    const delta = (await helper.get(`/h/requests/${request.id}/messages?locale=ko&after=${cursor}`)).body.messages;
    expect(delta.map((m: any) => m.body)).toEqual(["Cảm ơn"]);

    expect((await helper.post(`/h/requests/${request.id}/start`)).body.request.status).toBe("IN_PROGRESS");
    expect((await customer.get(`/c/requests/${request.id}`)).body.request.status).toBe("IN_PROGRESS");
    expect((await helper.post(`/h/requests/${request.id}/complete`)).body.request.status).toBe("COMPLETED");
    expect((await customer.get(`/c/requests/${request.id}`)).body.request.status).toBe("COMPLETED");
    expect((await customer.get("/c/notifications")).body.notifications.map((n: any) => n.event)).toEqual(["HELPER_ACCEPTED", "NEW_CHAT_MESSAGE", "REQUEST_STARTED", "REQUEST_COMPLETED"]);
    expect((await admin.get(`/a/requests/${request.id}`)).body.request.status).toBe("COMPLETED");
    expect(h.id).toBeTruthy();
  });

  it("a request opened on another device with the request link; losing the cookie does not lose the request", async () => {
    const phone = new Agent("phone"), laptop = new Agent("laptop");
    const created = await phone.post("/c/requests", { ...newRequest, serviceSlug: "bank-help" });
    const id = created.body.request.id;
    expect((await laptop.get(`/c/requests/${id}`)).status).toBe(404); // a UUID alone is nothing
    expect((await laptop.post(`/c/requests/${id}/claim`, { token: created.body.token })).status).toBe(200); // link -> own session
    expect((await laptop.get(`/c/requests/${id}`)).body.request.id).toBe(id);
    phone.jar.clear(); // "cleared browser data" on the phone: it opens the link again
    expect((await phone.get(`/c/requests/${id}`)).status).toBe(404);
    expect((await phone.post(`/c/requests/${id}/claim`, { token: created.body.token })).status).toBe(200);
    expect((await phone.get(`/c/requests/${id}`)).status).toBe(200);
    expect((await phone.get("/c/requests")).body.requests).toEqual([]); // the list belongs to the customer credential, not the link
  });

  it("customers are isolated: B can neither read, cancel nor message A's request", async () => {
    const a = new Agent("a"), b = new Agent("b");
    const { body } = await a.post("/c/requests", { ...newRequest, serviceSlug: "mobile-help" });
    await b.post("/c/requests", { ...newRequest, serviceSlug: "mobile-help" }); // B has a credential too
    expect((await b.get(`/c/requests/${body.request.id}`)).status).toBe(404);
    expect((await b.post(`/c/requests/${body.request.id}/cancel`)).status).toBe(404);
    expect((await b.post(`/c/requests/${body.request.id}/messages`, { body: "hi", locale: "vi" })).status).toBe(404);
    expect((await b.get(`/c/requests/${body.request.id}/messages?locale=vi`)).status).toBe(404);
    expect((await a.get("/c/requests")).body.requests).toHaveLength(1);
    expect((await a.post(`/c/requests/${body.request.id}/cancel`)).body.request.status).toBe("CANCELLED");
  });

  it("helpers: unapproved / unrelated / forged credentials get nothing", async () => {
    const pendingAgent = new Agent("pending"), good = new Agent("good"), other = new Agent("other"), customer = new Agent("c");
    const reg = await pendingAgent.post("/h/register", { name: "Pending", primaryLocale: "ko", services: ["housing"], regions: [IKSAN] });
    expect(reg.body.helper.status).toBe("PENDING");
    const { body } = await customer.post("/c/requests", { ...newRequest, serviceSlug: "housing" });
    const id = body.request.id;
    expect((await pendingAgent.get("/h/requests")).status).toBe(403); // NOT_APPROVED
    expect((await pendingAgent.post(`/h/requests/${id}/accept`)).body.error).toBe("NOT_APPROVED");
    await approvedHelper(good, { services: ["housing"] });
    await approvedHelper(other, { services: ["cleaning"] });
    expect((await other.post(`/h/requests/${id}/accept`)).body.error).toBe("NOT_ELIGIBLE");
    expect((await other.get(`/h/requests/${id}`)).status).toBe(404);
    // a forged cookie, a customer credential used as a helper credential, no cookie at all
    const forged = new Agent("forged"); forged.jar.set("lh_h", "a".repeat(64));
    expect((await forged.get("/h/requests")).status).toBe(403);
    const mixed = new Agent("mixed"); mixed.jar.set("lh_h", customer.jar.get("lh_c")!);
    expect((await mixed.get("/h/requests")).status).toBe(403);
    expect((await new Agent("none").get("/h/me")).status).toBe(403);
    // login with a credential that was never issued
    expect((await new Agent("x").post("/h/login", { credential: "b".repeat(64) })).status).toBe(403);
    expect((await new Agent("x").post("/h/login", { credential: "short" })).status).toBe(403);
    // the real credential signs a fresh browser in; a disabled one no longer does
    const fresh = new Agent("fresh");
    expect((await fresh.post("/h/login", { credential: reg.body.credential })).body.helper.id).toBe(reg.body.helper.id);
    const admin = new Agent("admin", true);
    await admin.post(`/a/helpers/${reg.body.helper.id}/status`, { status: "DISABLED" });
    expect((await new Agent("again").post("/h/login", { credential: reg.body.credential })).status).toBe(403);
    expect((await fresh.get("/h/me")).status).toBe(403);
    // logging out clears the cookie
    await good.post("/h/logout");
    expect((await good.get("/h/me")).status).toBe(403);
  });

  it("admin: unauthenticated denied everywhere; manual assignment is visible to customer and helper", async () => {
    const anon = new Agent("anon"), admin = new Agent("admin", true), customer = new Agent("c"), helper = new Agent("h");
    for (const [m, p] of [["GET", "/a/requests"], ["GET", "/a/helpers"], ["GET", "/a/notifications"], ["POST", "/a/requests/00000000-0000-4000-8000-000000000000/assign"]] as const) {
      expect((await anon.call(m, p, m === "POST" ? {} : undefined)).status, `${m} ${p}`).toBe(401);
    }
    const custAsAdmin = new Agent("ca"); custAsAdmin.jar.set("lh_c", "c".repeat(64)); custAsAdmin.jar.set("life_help_sys_session", "x|1|y");
    expect((await custAsAdmin.get("/a/requests")).status).toBe(401);
    const h = await approvedHelper(helper, { services: ["cleaning"] });
    const { body } = await customer.post("/c/requests", { ...newRequest, serviceSlug: "cleaning", sido: "서울특별시", gungu: "강남구" }); // helper's region does NOT cover it
    expect(body.request.unmatched).toBe(true);
    expect((await helper.get("/h/requests")).body.available).toEqual([]);
    const assigned = await admin.post(`/a/requests/${body.request.id}/assign`, { helperId: h.id });
    expect(assigned.body.request.status).toBe("ASSIGNED");
    expect((await customer.get(`/c/requests/${body.request.id}`)).body.request.helper.id).toBe(h.id);
    expect((await helper.get("/h/requests")).body.mine.map((r: any) => r.id)).toContain(body.request.id);
    expect((await customer.get("/c/notifications")).body.notifications.map((n: any) => n.event)).toEqual(["REQUEST_ASSIGNED"]);
    expect((await helper.get("/h/notifications")).body.notifications.map((n: any) => n.event)).toContain("REQUEST_ASSIGNED");
    expect((await admin.post(`/a/requests/${body.request.id}/assign`, { helperId: "not-a-uuid" })).status).toBe(404);
    expect((await admin.get("/a/helpers?status=PENDING")).body.helpers.every((x: any) => x.status === "PENDING")).toBe(true);
  });

  it("writes need a same-origin JSON request (CSRF) and bodies are bounded", async () => {
    const c = new Agent("c");
    expect((await c.call("POST", "/c/requests", newRequest, { origin: "https://evil.example" })).body.error).toBe("BAD_ORIGIN");
    expect((await c.call("POST", "/c/requests", newRequest, { origin: "", "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await c.call("POST", "/c/requests", newRequest, { "content-type": "text/plain" })).status).toBe(415);
    expect((await c.call("POST", "/c/requests", { ...newRequest, description: "x".repeat(40_000) })).status).toBe(413);
    expect((await c.call("POST", "/c/requests", { ...newRequest, serviceSlug: "not-a-service" })).status).toBe(400);
    expect((await c.call("POST", "/c/requests", { ...newRequest, locale: "xx-nope" })).status).toBe(400);
    expect((await c.call("POST", "/c/requests", { ...newRequest, description: "   " })).status).toBe(400);
    expect((await c.get("/c/nothing")).status).toBe(404);
    expect((await c.get("/c/requests/not-a-uuid")).status).toBe(404);
  });

  it("source language is the customer's, never assumed English; translation failure shows the original and is never faked", async () => {
    const customer = new Agent("c"), helper = new Agent("h");
    await approvedHelper(helper, { services: ["insurance-help"] });
    const { body } = await customer.post("/c/requests", { ...newRequest, serviceSlug: "insurance-help", locale: "mn", description: "Даатгалын тусламж хэрэгтэй" });
    expect(body.request.sourceLocale).toBe("mn");
    expect(translator.calls.some((c) => c.from === "en")).toBe(false);
    const id = body.request.id;
    await helper.post(`/h/requests/${id}/accept`);
    await customer.post(`/c/requests/${id}/messages`, { body: "Сайн байна уу [[fail]]", locale: "mn" });
    const first = (await helper.get(`/h/requests/${id}/messages?locale=ko`)).body.messages[0];
    expect([first.body, first.translation, first.translationStatus]).toEqual(["Сайн байна уу [[fail]]", null, "FAILED"]);
    const callsAfterFirst = translator.calls.length;
    await helper.get(`/h/requests/${id}/messages?locale=ko`); // inside the cooldown: no hammering the provider
    expect(translator.calls.length).toBe(callsAfterFirst);
    clock += 61_000; // after the cooldown a retry is allowed (still failing here)
    expect((await helper.get(`/h/requests/${id}/messages?locale=ko`)).body.messages[0].translationStatus).toBe("FAILED");
    expect(translator.calls.length).toBe(callsAfterFirst + 1);
    // the original survives in the database, and nothing was cached as a "translation" for it
    const cached = await local.sql("select count(*)::int c from public.svc_translations t join public.svc_messages m on m.id = t.entity_id where t.entity = 'MESSAGE' and m.request_id = $1", [id]);
    expect(cached).toEqual([{ c: 0 }]);
    const stored = await local.sql("select body, source_locale from public.svc_messages where request_id = $1", [id]);
    expect(stored).toEqual([{ body: "Сайн байна уу [[fail]]", source_locale: "mn" }]);
  });

  it("same-language readers get the original and no translation call", async () => {
    const customer = new Agent("c"), helper = new Agent("h");
    await approvedHelper(helper, { services: ["job-help"], primaryLocale: "vi" });
    const { body } = await customer.post("/c/requests", { ...newRequest, serviceSlug: "job-help" });
    await helper.post(`/h/requests/${body.request.id}/accept`);
    await customer.post(`/c/requests/${body.request.id}/messages`, { body: "Xin chào", locale: "vi" });
    translator.calls.length = 0;
    const m = (await helper.get(`/h/requests/${body.request.id}/messages?locale=vi`)).body.messages[0];
    expect([m.translationStatus, m.translation]).toEqual(["SAME_LANGUAGE", null]);
    expect(translator.calls).toEqual([]);
  });

  it("when the service core is not configured every route answers 503 (no localStorage / seed fallback)", async () => {
    const off = createServiceHandler({ core: async () => null, locales, verifyAdmin: async () => null });
    for (const [m, p] of [["GET", "/c/requests"], ["POST", "/c/requests"], ["GET", "/h/requests"], ["GET", "/a/requests"]]) {
      const res = await off(new Request(`${ORIGIN}/api/svc${p}`, { method: m, headers: { origin: ORIGIN, host: "localhost:3100", "content-type": "application/json" }, body: m === "POST" ? "{}" : undefined }), p.split("/").filter(Boolean));
      expect([m, p, res.status]).toEqual([m, p, 503]);
    }
  });
});

describe("environment guards", () => {
  it("the embedded database and the fake translator can never be selected in production", () => {
    expect(resolveBackend({ SERVICE_CORE_BACKEND: "local", APP_ENV: "production" }, "production")).toBe("off");
    expect(resolveBackend({ SERVICE_CORE_BACKEND: "local" }, "local")).toBe("local");
    expect(resolveBackend({}, "local")).toBe("off");
    expect(resolveTranslator({ SERVICE_CORE_TRANSLATOR: "fake" }, "production")).toBeInstanceOf(MyMemoryTranslator);
    expect(resolveTranslator({ SERVICE_CORE_TRANSLATOR: "fake" }, "local")).toBeInstanceOf(FakeTranslator);
  });

  it("the Supabase backend needs its dedicated variables and a matching project ref; generic / learning variables are ignored", () => {
    const ok = { SERVICE_CORE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co", SERVICE_CORE_SUPABASE_SECRET_KEY: "k", EXPECTED_SERVICE_CORE_SUPABASE_REF: "abcdefghijklmnopqrst" };
    expect(readSupabaseConfig(ok)).toEqual({ url: "https://abcdefghijklmnopqrst.supabase.co", key: "k" });
    expect(resolveBackend(ok, "production")).toBe("supabase");
    expect(readSupabaseConfig({ ...ok, EXPECTED_SERVICE_CORE_SUPABASE_REF: "otherrefotherrefother" })).toBeNull();
    expect(readSupabaseConfig({ ...ok, SERVICE_CORE_SUPABASE_URL: "http://abcdefghijklmnopqrst.supabase.co" })).toBeNull();
    expect(readSupabaseConfig({ ...ok, SERVICE_CORE_SUPABASE_SECRET_KEY: "" })).toBeNull();
    expect(readSupabaseConfig({ SUPABASE_URL: ok.SERVICE_CORE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: "k", EXPECTED_SUPABASE_REF: "abcdefghijklmnopqrst", LEARN_SUPABASE_URL: ok.SERVICE_CORE_SUPABASE_URL })).toBeNull();
  });

  it("service slugs fold legacy sub-services into the canonical ones and reject anything else", () => {
    expect(normalizeServiceSlug("toilet-clog")).toBe("clog-clearing");
    expect(normalizeServiceSlug("plumbing")).toBe("leak-plumbing");
    expect(normalizeServiceSlug("boiler")).toBe("boiler");
    for (const bad of ["", "x", "Boiler", null, 5, "drop table"]) expect(normalizeServiceSlug(bad)).toBeNull();
  });
});

describe("request access credentials: link and session are separate, with server-side expiry and revocation", { timeout: 60_000 }, () => {
  async function fresh(service = "mobile-help") {
    const owner = new Agent("owner");
    const created = await owner.post("/c/requests", { ...newRequest, serviceSlug: service });
    return { owner, id: created.body.request.id as string, link: created.body.token as string, created };
  }
  const claim = (agent: Agent, id: string, token: unknown) => agent.post(`/c/requests/${id}/claim`, { token });
  const sessionCookie = (agent: Agent, id: string) => agent.jar.get(`lh_rt_${id.replace(/-/g, "")}`);
  const admin = () => new Agent("admin", true);

  it("creating sets only a SESSION cookie (HttpOnly); the link is returned once and is not the cookie", async () => {
    const { owner, id, link, created } = await fresh();
    const set = created.headers.getSetCookie().join("\n");
    expect(set).toMatch(new RegExp(`lh_rt_${id.replace(/-/g, "")}=[^;]+;[^\\n]*HttpOnly`, "i"));
    expect(set).toMatch(/lh_c=[^;]+;[^\n]*HttpOnly/i);
    expect(sessionCookie(owner, id)).toMatch(/^[0-9a-f]{64}$/);
    expect(sessionCookie(owner, id)).not.toBe(link); // two identities
    expect(created.body.session).toBeUndefined(); // the session secret never appears in a body
    expect(JSON.stringify(created.body)).not.toContain(sessionCookie(owner, id)!);
  });

  it("denied: request id only, malformed, wrong and header-presented link tokens; all look identical to an unknown request", async () => {
    const { id, link } = await fresh();
    const d = new Agent("d");
    const unknown = "00000000-0000-4000-8000-000000000000";
    const outcomes = [
      await d.get(`/c/requests/${id}`),
      await d.get(`/c/requests/${id}/messages?locale=vi`),
      await claim(d, id, undefined),
      await claim(d, id, "short"),
      await claim(d, id, "g".repeat(64)),
      await claim(d, id, "f".repeat(64)),
      await claim(d, unknown, link), // right token, no such request
      await d.get(`/c/requests/${id}`, { "x-svc-token": link }), // the link is NOT an authority, only claimable
    ];
    for (const o of outcomes) { expect(o.status).toBe(404); expect(o.body).toEqual({ error: "NOT_FOUND" }); }
    expect([...d.jar.keys()].filter((k) => k.startsWith("lh_rt_"))).toEqual([]);
  });

  it("valid link -> own HttpOnly session; request-A's session does nothing on request B", async () => {
    const a = await fresh(), b = await fresh("job-help");
    const d = new Agent("d");
    const res = await claim(d, a.id, a.link);
    expect(res.status).toBe(200);
    expect(res.headers.getSetCookie().join("\n")).toMatch(/HttpOnly/i);
    expect(sessionCookie(d, a.id)).not.toBe(a.link);
    expect((await d.get(`/c/requests/${a.id}`)).status).toBe(200);
    expect((await d.get(`/c/requests/${b.id}`)).status).toBe(404);
    const copy = new Agent("copy");
    copy.jar.set(`lh_rt_${b.id.replace(/-/g, "")}`, sessionCookie(d, a.id)!); // A's session value placed under B's cookie name
    expect((await copy.get(`/c/requests/${b.id}`)).status).toBe(404);
    expect((await claim(new Agent("x"), b.id, a.link)).status).toBe(404); // A's link on B
  });

  it("an expired LINK is refused by the server (not just by cookie age); sessions already issued keep their own lifetime", async () => {
    const { id, link } = await fresh();
    const early = new Agent("early");
    expect((await claim(early, id, link)).status).toBe(200);
    await local.sql("update public.svc_requests set token_expires_at = now() - interval '1 second' where id = $1", [id]);
    expect((await claim(new Agent("late"), id, link)).status).toBe(404);
    expect((await early.get(`/c/requests/${id}`)).status).toBe(200);
  });

  it("an expired SESSION is refused by the server; other sessions and the owner are unaffected", async () => {
    const { owner, id, link } = await fresh();
    const [a, b] = [new Agent("a"), new Agent("b")];
    await claim(a, id, link); await claim(b, id, link);
    const sessions = await local.sql("select session_hash from public.svc_request_sessions where request_id = $1 order by created_at", [id]);
    expect(sessions).toHaveLength(3); // creator + two claims
    await local.sql("update public.svc_request_sessions set expires_at = now() - interval '1 second' where request_id = $1 and via = 'CLAIM' and id = (select id from public.svc_request_sessions where request_id = $1 and via = 'CLAIM' order by created_at limit 1)", [id]);
    expect((await a.get(`/c/requests/${id}`)).status).toBe(404);
    expect((await a.get(`/c/requests/${id}/messages?locale=vi`)).status).toBe(404);
    expect((await b.get(`/c/requests/${id}`)).status).toBe(200);
    expect((await owner.get(`/c/requests/${id}`)).status).toBe(200);
  });

  it("a REVOKED link is refused; revoking needs the owner credential (a session or a stranger cannot)", async () => {
    const { owner, id, link } = await fresh();
    const viaLink = new Agent("via-link"), stranger = new Agent("stranger");
    await claim(viaLink, id, link);
    expect((await viaLink.post(`/c/requests/${id}/link/revoke`)).status).toBe(404);
    expect((await stranger.post(`/c/requests/${id}/link/revoke`)).status).toBe(404);
    expect((await new Agent("anon").post(`/c/requests/${id}/link/rotate`)).status).toBe(404); // no unauthenticated rotate
    expect((await owner.post(`/c/requests/${id}/link/revoke`)).status).toBe(200);
    expect((await claim(new Agent("late"), id, link)).status).toBe(404);
    expect((await viaLink.get(`/c/requests/${id}`)).status).toBe(200); // link revocation alone leaves sessions alone
    const row = (await local.sql("select token_revoked_at is not null as revoked from public.svc_requests where id = $1", [id]))[0] as any;
    expect(row.revoked).toBe(true);
  });

  it("ROTATION: old link refused, new link accepted, existing sessions and all request/chat data unchanged", async () => {
    const { owner, id, link } = await fresh();
    const sessionDevice = new Agent("session-device");
    await claim(sessionDevice, id, link);
    await owner.post(`/c/requests/${id}/messages`, { body: "before rotation", locale: "vi" });
    const before = (await owner.get(`/c/requests/${id}`)).body;
    const rot = await owner.post(`/c/requests/${id}/link/rotate`);
    expect(rot.status).toBe(200);
    expect(rot.body.token).toMatch(/^[0-9a-f]{64}$/);
    expect(rot.body.token).not.toBe(link);
    expect((await claim(new Agent("old"), id, link)).status).toBe(404);
    const fresh2 = new Agent("new");
    expect((await claim(fresh2, id, rot.body.token)).status).toBe(200);
    expect((await sessionDevice.get(`/c/requests/${id}`)).status).toBe(200); // documented: rotation does not end sessions
    const after = (await fresh2.get(`/c/requests/${id}`)).body;
    expect(after.request).toEqual(before.request);
    expect((await fresh2.get(`/c/requests/${id}/messages?locale=vi`)).body.messages.map((m: any) => m.body)).toEqual(["before rotation"]);
    // rotation after a revoke issues a working link again
    await owner.post(`/c/requests/${id}/link/revoke`);
    expect((await claim(new Agent("r"), id, rot.body.token)).status).toBe(404);
    const rot2 = await owner.post(`/c/requests/${id}/link/rotate`);
    expect((await claim(new Agent("r2"), id, rot2.body.token)).status).toBe(200);
  });

  it("CROSS-DEVICE: A and B each hold their own session; both read the same request and chat; revoke-all ends both (and the link)", async () => {
    const { owner, id, link } = await fresh("housing");
    const [devA, devB] = [new Agent("deviceA"), new Agent("deviceB")];
    expect((await claim(devA, id, link)).status).toBe(200);
    expect((await claim(devB, id, link)).status).toBe(200);
    expect(sessionCookie(devA, id)).not.toBe(sessionCookie(devB, id)); // own sessions
    await devA.post(`/c/requests/${id}/messages`, { body: "from A", locale: "vi" });
    expect((await devB.get(`/c/requests/${id}/messages?locale=vi`)).body.messages.map((m: any) => m.body)).toEqual(["from A"]);
    expect((await devA.get(`/c/requests/${id}`)).body.request.id).toBe((await devB.get(`/c/requests/${id}`)).body.request.id);

    const out = await owner.post(`/c/requests/${id}/access/revoke-all`);
    expect(out.status).toBe(200);
    expect(out.body.sessionsRevoked).toBe(3); // creator browser session + A + B
    for (const dev of [devA, devB]) {
      expect((await dev.get(`/c/requests/${id}`)).status).toBe(404);
      expect((await dev.get(`/c/requests/${id}/messages?locale=vi`)).status).toBe(404);
      expect((await dev.post(`/c/requests/${id}/messages`, { body: "x", locale: "vi" })).status).toBe(404);
    }
    expect((await claim(new Agent("late"), id, link)).status).toBe(404);
    expect((await owner.get(`/c/requests/${id}`)).status).toBe(200); // the owner's own customer credential is a separate identity
    const rot = await owner.post(`/c/requests/${id}/link/rotate`); // recovery path after revoke-all
    expect((await claim(devA, id, rot.body.token)).status).toBe(200);
    expect((await devA.get(`/c/requests/${id}`)).status).toBe(200);
  });

  it("admin can rotate, revoke and revoke-all; non-admins get 401", async () => {
    const { id, link } = await fresh("clog-clearing");
    const dev = new Agent("dev"), anon = new Agent("anon");
    await claim(dev, id, link);
    for (const p of ["link/rotate", "link/revoke", "access/revoke-all"]) expect((await anon.post(`/a/requests/${id}/${p}`)).status).toBe(401);
    const rot = await admin().post(`/a/requests/${id}/link/rotate`);
    expect(rot.status).toBe(200);
    expect((await claim(new Agent("o"), id, link)).status).toBe(404);
    expect((await claim(new Agent("n"), id, rot.body.token)).status).toBe(200);
    expect((await admin().post(`/a/requests/${id}/link/revoke`)).status).toBe(200);
    expect((await claim(new Agent("n2"), id, rot.body.token)).status).toBe(404);
    expect((await admin().post(`/a/requests/${id}/access/revoke-all`)).body.sessionsRevoked).toBeGreaterThanOrEqual(2);
    expect((await dev.get(`/c/requests/${id}`)).status).toBe(404);
    expect((await admin().post(`/a/requests/00000000-0000-4000-8000-000000000000/link/rotate`)).status).toBe(404);
  });

  it("every claim attempt - forged, expired, revoked, valid - counts toward 30 per 10 minutes", async () => {
    const { owner, id, link } = await fresh("insurance-help");
    await owner.post(`/c/requests/${id}/link/revoke`);
    const ip = new Agent("brute");
    let last = 0;
    for (let i = 0; i < 30; i++) { last = (await claim(ip, id, i % 2 ? link : "f".repeat(64))).status; expect(last).toBe(404); } // revoked + forged: same answer
    expect((await claim(ip, id, link)).status).toBe(429);
    resetLimits();
    expect((await claim(ip, id, link)).status).toBe(404);
  });

  it("at most 20 live sessions per request", async () => {
    const { id, link } = await fresh("hospital-help");
    let last = 0;
    for (let i = 0; i < 21; i++) { resetLimits(); last = (await claim(new Agent(`s${i}`), id, link)).status; }
    expect(last).toBe(429);
  });
});
