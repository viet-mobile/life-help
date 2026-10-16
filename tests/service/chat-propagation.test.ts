/* eslint-disable @typescript-eslint/no-explicit-any -- the SQL harness handles untyped rows */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { locales } from "@/messages";
import { createLocalDb } from "@/lib/service/dbLocal";
import { ServiceCore } from "@/lib/service/core";
import { createServiceHandler, resetLimits } from "@/lib/service/http";
import { FakeTranslator } from "@/lib/service/translate";

/** Chat propagation on the real SQL and HTTP layer: the server side of every segment the staging journey probes. */
const ORIGIN = "http://localhost:3100";
const IKSAN = { country: "KR", sido: "전북특별자치도", gungu: "익산시" };
const ADMIN_COOKIE = "test_admin=ok";
let local: Awaited<ReturnType<typeof createLocalDb>>;
let handle: ReturnType<typeof createServiceHandler>;
const clock = 1_800_000_000_000;

class Agent {
  jar = new Map<string, string>();
  constructor(private admin = false) {}
  async call(method: string, path: string, body?: unknown) {
    const headers: Record<string, string> = { host: "localhost:3100" };
    const cookie = [...this.jar].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).concat(this.admin ? [ADMIN_COOKIE] : []).join("; ");
    if (cookie) headers.cookie = cookie;
    if (method !== "GET") { headers.origin = ORIGIN; headers["content-type"] = "application/json"; }
    const res = await handle(new Request(`${ORIGIN}/api/svc${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), path.split("?")[0].split("/").filter(Boolean));
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";"); const i = pair.indexOf("=");
      if (/Max-Age=0/i.test(c)) this.jar.delete(pair.slice(0, i)); else this.jar.set(pair.slice(0, i), decodeURIComponent(pair.slice(i + 1)));
    }
    return { status: res.status, body: (await res.json()) as any };
  }
  get = (p: string) => this.call("GET", p);
  post = (p: string, b: unknown = {}) => this.call("POST", p, b);
}
const req = { serviceSlug: "toilet-clog", ...IKSAN, address: "전북특별자치도 익산시 신동 대학로 123", description: "Bồn cầu bị tắc", locale: "vi", selectedOptions: [] };
async function setup() {
  const customer = new Agent(), helper = new Agent(), admin = new Agent(true);
  const reg = await helper.post("/h/register", { name: "Chat Helper", primaryLocale: "ko", spokenLocales: ["ko", "vi"], services: ["toilet-clog"], regions: [IKSAN] });
  await admin.post(`/a/helpers/${reg.body.helper.id}/status`, { status: "APPROVED" });
  await helper.post("/h/available", { available: true });
  const created = await customer.post("/c/requests", req);
  return { customer, helper, admin, helperId: reg.body.helper.id as string, id: created.body.request.id as string };
}
const rowCount = async (id: string, like = "%") => ((await local.sql("select count(*)::int c from public.svc_messages where request_id = $1 and body like $2", [id, like]))[0] as any).c as number;

beforeAll(async () => {
  local = await createLocalDb();
  const core = new ServiceCore(local, new FakeTranslator(), () => clock, 60_000);
  handle = createServiceHandler({ core: async () => core, locales, verifyAdmin: async (r) => (r.headers.get("cookie")?.includes(ADMIN_COOKIE) ? "admin-1" : null), now: () => clock });
}, 120_000);
afterAll(async () => { await local.close(); });
beforeEach(() => resetLimits());

describe("server side of every chat segment", () => {
  it("1. send succeeds -> the row is persisted -> the assigned helper's poll (cursor 0) returns it, with the original text", async () => {
    const { customer, helper, id } = await setup();
    await helper.post(`/h/requests/${id}/accept`);
    const sent = await customer.post(`/c/requests/${id}/messages`, { body: "RUN-1 xin chao", locale: "vi" });
    expect(sent.status).toBe(201);
    expect(await rowCount(id, "RUN-1%")).toBe(1);
    const poll = await helper.get(`/h/requests/${id}/messages?after=0&locale=ko`);
    expect(poll.status).toBe(200);
    expect(poll.body.messages.map((m: any) => m.body)).toEqual(["RUN-1 xin chao"]);
    expect(poll.body.messages[0].translation.text).toBe("[ko] RUN-1 xin chao");
  });
  it("2. a send that is refused (stranger, bad body, closed request) fails with a code and stores nothing", async () => {
    const { customer, helper, id } = await setup();
    await helper.post(`/h/requests/${id}/accept`);
    const stranger = new Agent();
    expect((await stranger.post(`/c/requests/${id}/messages`, { body: "intruder", locale: "vi" })).status).toBe(404);
    expect((await customer.post(`/c/requests/${id}/messages`, { body: "   ", locale: "vi" })).status).toBe(400);
    await helper.post(`/h/requests/${id}/start`); await helper.post(`/h/requests/${id}/complete`);
    const closed = await customer.post(`/c/requests/${id}/messages`, { body: "late", locale: "vi" });
    expect([closed.status, closed.body.error]).toEqual([409, "INVALID_STATE"]);
    expect(await rowCount(id)).toBe(0);
  });
  it("3. a 201 always means the row is committed (there is no 'success without a row')", async () => {
    const { customer, helper, id } = await setup();
    await helper.post(`/h/requests/${id}/accept`);
    for (let i = 0; i < 5; i++) {
      const r = await customer.post(`/c/requests/${id}/messages`, { body: `RUN-3 m${i}`, locale: "vi" });
      expect(r.status).toBe(201);
      expect(await rowCount(id, `RUN-3 m${i}`)).toBe(1);
    }
  });
  it("4./6. a row exists but the helper only sees it when it asks from an earlier cursor: a cursor at or past the row's seq returns nothing (documented contract)", async () => {
    const { customer, helper, id } = await setup();
    await helper.post(`/h/requests/${id}/accept`);
    const m = (await customer.post(`/c/requests/${id}/messages`, { body: "RUN-6", locale: "vi" })).body.message;
    expect((await helper.get(`/h/requests/${id}/messages?after=${m.seq - 1}&locale=ko`)).body.messages).toHaveLength(1);
    expect((await helper.get(`/h/requests/${id}/messages?after=${m.seq}&locale=ko`)).body.messages).toHaveLength(0); // the cursor, not the DB, is what hides it
    expect(await rowCount(id, "RUN-6")).toBe(1);
  });
  it("5. polls whose authorization fails: unassigned, other helper, suspended, then reinstated - each answer is explicit and nothing leaks", async () => {
    const { customer, helper, admin, helperId, id } = await setup();
    await customer.post(`/c/requests/${id}/messages`, { body: "RUN-5 before", locale: "vi" });
    expect((await helper.get(`/h/requests/${id}/messages?after=0&locale=ko`)).status).toBe(404); // not assigned yet
    await helper.post(`/h/requests/${id}/accept`);
    expect((await helper.get(`/h/requests/${id}/messages?after=0&locale=ko`)).body.messages.map((m: any) => m.body)).toEqual(["RUN-5 before"]);
    const other = new Agent();
    const reg = await other.post("/h/register", { name: "Other", primaryLocale: "ko", spokenLocales: ["ko"], services: ["toilet-clog"], regions: [IKSAN] });
    await admin.post(`/a/helpers/${reg.body.helper.id}/status`, { status: "APPROVED" });
    expect((await other.get(`/h/requests/${id}/messages?after=0&locale=ko`)).status).toBe(404);
    await admin.post(`/a/helpers/${helperId}/status`, { status: "SUSPENDED" });
    expect((await helper.get(`/h/requests/${id}/messages?after=0&locale=ko`)).status).toBe(403); // NOT_APPROVED
    await admin.post(`/a/helpers/${helperId}/status`, { status: "APPROVED" });
    // the job went back to WAITING when the helper was suspended: the helper is no longer a party until it accepts again
    expect((await helper.get(`/h/requests/${id}/messages?after=0&locale=ko`)).status).toBe(404);
  });
  it("8. the same poll URL keeps working across the assignment transition: refused before, delivering after, earlier messages included", async () => {
    const { customer, helper, id } = await setup();
    const url = `/h/requests/${id}/messages?after=0&locale=ko`;
    const outcomes: number[] = [(await helper.get(url)).status];
    await customer.post(`/c/requests/${id}/messages`, { body: "RUN-8 a", locale: "vi" });
    outcomes.push((await helper.get(url)).status);
    await helper.post(`/h/requests/${id}/accept`);
    const after = await helper.get(url);
    outcomes.push(after.status);
    await customer.post(`/c/requests/${id}/messages`, { body: "RUN-8 b", locale: "vi" });
    expect(outcomes).toEqual([404, 404, 200]);
    expect((await helper.get(url)).body.messages.map((m: any) => m.body)).toEqual(["RUN-8 a", "RUN-8 b"]);
  });
  it("9. a duplicate client message id is idempotent end to end: one row, one message for the receiver", async () => {
    const { customer, helper, id } = await setup();
    await helper.post(`/h/requests/${id}/accept`);
    const clientId = "11111111-1111-4111-8111-111111111111";
    const a = await customer.post(`/c/requests/${id}/messages`, { body: "RUN-9", locale: "vi", clientId });
    const b = await customer.post(`/c/requests/${id}/messages`, { body: "RUN-9", locale: "vi", clientId });
    expect([a.status, b.status, a.body.message.id === b.body.message.id]).toEqual([201, 201, true]);
    expect(await rowCount(id, "RUN-9")).toBe(1);
    expect((await helper.get(`/h/requests/${id}/messages?after=0&locale=ko`)).body.messages).toHaveLength(1);
  });
  it("chat state on the customer side (clearing browser storage) cannot affect the helper: the helper's view depends only on its own credential and the assignment", async () => {
    const { customer, helper, id } = await setup();
    await helper.post(`/h/requests/${id}/accept`);
    const before = (await helper.get(`/h/requests/${id}/messages?after=0&locale=ko`)).status;
    customer.jar.delete("lh_c"); // the customer's own cookie vanishes (storage cleared / new device) - its session cookie is separate
    const after = (await helper.get(`/h/requests/${id}/messages?after=0&locale=ko`)).status;
    expect([before, after]).toEqual([200, 200]);
  });
});

/**
 * 8 (client). The REAL usePoll code, run with a stand-in for React's hooks and fake timers: an error (e.g. the pre-assignment 404) never
 * ends the loop, the cadence is the configured interval, runs never overlap, a hidden tab is skipped and resumed immediately, and the loop
 * calls the LATEST tick (so a changed request id / assignment is not captured stale).
 */
describe("usePoll (client polling loop)", () => {
  async function loadPoll() {
    vi.resetModules();
    const effects: Array<() => void | (() => void)> = [];
    vi.doMock("react", () => ({ useRef: (v: unknown) => ({ current: v }), useEffect: (fn: () => void | (() => void)) => { effects.push(fn); } }));
    const { usePoll } = await import("@/lib/service/usePoll");
    return { usePoll, effects };
  }
  const doc = { visibilityState: "visible", listeners: new Map<string, () => void>(), addEventListener(n: string, f: () => void) { this.listeners.set(n, f); }, removeEventListener(n: string) { this.listeners.delete(n); } };
  beforeEach(() => { vi.useFakeTimers(); doc.visibilityState = "visible"; doc.listeners.clear(); (globalThis as any).document = doc; });

  // eslint-disable-next-line react-hooks/rules-of-hooks -- usePoll is called outside React on purpose, with its hooks replaced
  const start = async (tick: () => Promise<void>, onError?: (e: unknown) => void, ms = 2000) => {
    const { usePoll: runPoll, effects } = await loadPoll();
    runPoll(tick, ms, true, onError); // the hook under test, driven by hand (React is stood in for)
    const cleanups = effects.map((e) => e());
    return () => cleanups.forEach((c) => typeof c === "function" && c());
  };

  it("keeps polling at the configured interval after errors (404 before assignment) and delivers once the tick succeeds", async () => {
    let assigned = false; const calls: number[] = []; const errors: unknown[] = []; const got: string[] = [];
    const stop = await start(async () => { calls.push(Date.now()); if (!assigned) throw Object.assign(new Error("x"), { status: 404 }); got.push("message"); }, (e) => errors.push(e));
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(6000);
    expect(calls).toHaveLength(4);       // t=0, 2000, 4000, 6000 despite three consecutive errors
    expect(errors).toHaveLength(4);
    assigned = true;
    await vi.advanceTimersByTimeAsync(2000);
    expect(got).toEqual(["message"]);
    expect(calls.slice(1).map((t, i) => t - calls[i])).toEqual(Array(calls.length - 1).fill(2000));
    stop();
  });
  it("never overlaps runs: a slow tick delays the next one instead of stacking requests", async () => {
    let inFlight = 0, maxInFlight = 0, runs = 0;
    const stop = await start(async () => { runs++; inFlight++; maxInFlight = Math.max(maxInFlight, inFlight); await new Promise((r) => setTimeout(r, 5000)); inFlight--; });
    await vi.advanceTimersByTimeAsync(20_000);
    expect(maxInFlight).toBe(1);
    expect(runs).toBeGreaterThanOrEqual(2);
    stop();
  });
  it("skips ticks while the tab is hidden and runs immediately when it becomes visible again", async () => {
    let runs = 0;
    const stop = await start(async () => { runs++; });
    await vi.advanceTimersByTimeAsync(0);
    expect(runs).toBe(1);
    doc.visibilityState = "hidden";
    await vi.advanceTimersByTimeAsync(10_000);
    expect(runs).toBe(1); // no requests while hidden (the loop itself keeps its timer)
    doc.visibilityState = "visible";
    doc.listeners.get("visibilitychange")!();
    await vi.advanceTimersByTimeAsync(0);
    expect(runs).toBe(2);
    stop();
  });
  it("stops cleanly on cleanup (no timers, no listener) and does not run again", async () => {
    let runs = 0;
    const stop = await start(async () => { runs++; });
    await vi.advanceTimersByTimeAsync(2000);
    const before = runs;
    stop();
    expect(doc.listeners.size).toBe(0);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(runs).toBe(before);
  });
  it("source audit: the loop's effect depends only on [ms, enabled] and reads tick/onError through a ref, so a changed request id or assignment can never be captured stale", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("lib/service/usePoll.ts", "utf8");
    expect(src).toContain("}, [ms, enabled]);");
    expect(src).toContain("latest.current.tick()");
    expect(src).toMatch(/const settle = [\s\S]*running = false;[\s\S]*schedule\(\);/); // an error never ends the loop: every outcome schedules the next run
    expect(src).toContain("POLL_TICK_TIMEOUT_MS"); // ... and neither does a tick that never settles
    expect(src).not.toMatch(/AbortController/); // no abort controller to be reused or cancelled across navigation
  });

  // Regression for the final staging approval (STG-mvb00osw-d579cb): the receiver's chat was mounted and visible but never showed the other
  // side's message until a reload. A request that neither completes nor fails left `running` true for good, so no timer, no later tick and no
  // return to the tab could start a new poll.
  it("a tick that never settles is abandoned after the watchdog and polling carries on (it used to stop for good)", async () => {
    const { POLL_TICK_TIMEOUT_MS } = await import("@/lib/service/usePoll");
    let runs = 0; const errors: Array<{ code?: string }> = []; const delivered: string[] = [];
    const stop = await start(async () => {
      runs++;
      if (runs === 1) return new Promise<void>(() => { /* a stalled request: never resolves, never rejects */ });
      delivered.push(`poll-${runs}`);
    }, (e) => errors.push(e as { code?: string }));
    await vi.advanceTimersByTimeAsync(POLL_TICK_TIMEOUT_MS - 1);
    expect(runs).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(errors.map((e) => e.code)).toEqual(["poll_timeout"]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(runs).toBe(2);
    expect(delivered).toEqual(["poll-2"]);
    await vi.advanceTimersByTimeAsync(4000);
    expect(runs).toBeGreaterThanOrEqual(4); // and keeps going at the configured cadence
    stop();
  });
  it("coming back to the tab abandons a tick that has been waiting for a long time and polls right away", async () => {
    const { POLL_STALE_ON_VISIBLE_MS } = await import("@/lib/service/usePoll");
    let runs = 0;
    const stop = await start(async () => { runs++; if (runs === 1) return new Promise<void>(() => undefined); });
    await vi.advanceTimersByTimeAsync(POLL_STALE_ON_VISIBLE_MS + 1);
    expect(runs).toBe(1);
    doc.listeners.get("visibilitychange")!();
    await vi.advanceTimersByTimeAsync(0);
    expect(runs).toBe(2);
    stop();
  });
  it("a healthy tick that is merely slow is not abandoned, never overlaps, and a stale tick's late result changes nothing", async () => {
    let inFlight = 0, maxInFlight = 0; const errors: unknown[] = [];
    let release: (() => void) | undefined;
    const stop = await start(async () => { inFlight++; maxInFlight = Math.max(maxInFlight, inFlight); try { await new Promise<void>((r) => { release = r; }); } finally { inFlight--; } }, (e) => errors.push(e));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(errors).toHaveLength(0);
    expect(maxInFlight).toBe(1);
    release?.(); // answers late but within the watchdog
    await vi.advanceTimersByTimeAsync(0);
    expect(errors).toHaveLength(0);
    stop();
  });
  it("a tick that throws synchronously also schedules the next one", async () => {
    let runs = 0;
    const stop = await start((() => { runs++; throw new Error("sync"); }) as unknown as () => Promise<void>, () => undefined);
    await vi.advanceTimersByTimeAsync(4000);
    expect(runs).toBeGreaterThanOrEqual(2);
    stop();
  });
});

describe("client reads are time-limited (a request that never answers fails instead of hanging)", () => {
  it("a GET that gets no answer rejects with TIMEOUT after READ_TIMEOUT_MS; a POST is not timed out client-side", async () => {
    vi.resetModules(); vi.useFakeTimers();
    const seen: Array<{ method: string; hasSignal: boolean }> = [];
    (globalThis as any).fetch = (_u: string, init: RequestInit) => new Promise((_res, rej) => {
      seen.push({ method: String(init.method), hasSignal: !!init.signal });
      init.signal?.addEventListener("abort", () => rej(Object.assign(new Error("t"), { name: "TimeoutError" })));
    });
    const { chatApi, READ_TIMEOUT_MS } = await import("@/lib/service/client");
    const p = chatApi.list("CUSTOMER", "r", 0, "ko").then(() => "ok", (e) => `${e.code}:${e.status}`);
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS + 1);
    expect(await p).toBe("TIMEOUT:0");
    void chatApi.send("CUSTOMER", "r", "x", "ko", "id").catch(() => undefined);
    expect(seen).toEqual([{ method: "GET", hasSignal: true }, { method: "POST", hasSignal: false }]);
    vi.useRealTimers();
  });
});

describe("chat list with several untranslated messages answers in one provider timeout, not one per message", () => {
  it("translations run concurrently and keep the message order; a failed one is marked FAILED while the others are shown", async () => {
    const { ServiceCore } = await import("@/lib/service/core");
    const order: number[] = [];
    const translator = { translate: async (text: string) => { order.push(Date.now()); await new Promise((r) => setTimeout(r, 50)); return text.includes("bad") ? { ok: false as const, reason: "x" } : { ok: true as const, text: `T:${text}`, provider: "t" }; } };
    const rows = ["a", "bad", "c"].map((b, i) => ({ id: `m${i}`, seq: i + 1, requestId: "r", senderKind: "HELPER", body: b, sourceLocale: "en", createdAt: "x", translation: null }));
    const db = { rpc: async (name: string) => (name === "svc_msg_list" ? rows : null) } as any;
    const core = new (ServiceCore as any)(db, translator, () => Date.now()) as any;
    const t0 = Date.now();
    const views = await core.withTranslations(rows, "CUSTOMER", "ko");
    expect(Date.now() - t0).toBeLessThan(140); // 3 x 50 ms would be sequential
    expect(views.map((v: any) => [v.seq, v.translationStatus])).toEqual([[1, "OK"], [2, "FAILED"], [3, "OK"]]);
    expect(views[0].translation.text).toBe("T:a");
  });
});
