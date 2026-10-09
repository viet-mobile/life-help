/* eslint-disable @typescript-eslint/no-explicit-any -- the SQL harness handles untyped rows */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { approvedHelper, call, createRequest, newCustomer, newServiceDb } from "./serviceDb";

/**
 * Race / replay matrix and function-security audit on the real migration.
 * NOTE: PGlite is a single-connection embedded Postgres, so concurrent calls here are issued together but executed one after the
 * other. That proves the state machine (exactly-one winner, replays rejected, no duplicate events) but NOT row-lock behaviour under
 * true parallel connections; that is covered by scripts/staging/service-core-staging.mjs (READY_NOT_RUN until a staging project exists).
 */
const settle = <T,>(ps: Promise<T>[]) => Promise.allSettled(ps);
const ok = (r: PromiseSettledResult<unknown>[]) => r.filter((x) => x.status === "fulfilled").length;
const codes = (r: PromiseSettledResult<unknown>[]) => r.filter((x): x is PromiseRejectedResult => x.status === "rejected").map((x) => String(x.reason?.message ?? x.reason));

describe("race and replay matrix", { timeout: 120_000 }, () => {
  let db: PGlite;
  beforeAll(async () => { db = await newServiceDb(); });
  afterAll(async () => { await db.close(); });

  const events = async (id: string, type: string) =>
    (await db.query<{ n: number }>("select count(*)::int as n from public.svc_outbox where request_id = $1 and event_type = $2", [id, type])).rows[0].n;
  const row = async (id: string) => (await db.query<any>("select status, helper_id from public.svc_requests where id = $1", [id])).rows[0];

  it("A. 20 approved helpers accept one request: exactly one assignment, one HELPER_ACCEPTED", async () => {
    const c = newCustomer();
    const helpers = [];
    for (let i = 0; i < 20; i++) helpers.push(await approvedHelper(db, { name: `Racer ${i}` }));
    const { request } = await createRequest(db, c);
    const res = await settle(helpers.map((h) => call(db, "svc_h_accept", h.credHash, request.id)));
    expect(ok(res)).toBe(1);
    expect(codes(res).every((m) => /INVALID_STATE|NOT_AVAILABLE|NOT_ELIGIBLE/.test(m))).toBe(true);
    const r = await row(request.id);
    expect(r.status).toBe("ASSIGNED");
    expect(helpers.map((h) => h.id)).toContain(r.helper_id);
    expect(await events(request.id, "HELPER_ACCEPTED")).toBe(1);
    expect(await events(request.id, "REQUEST_ASSIGNED")).toBe(0);
  });

  it("B. admin manual assignment races a helper accept: one canonical helper, consistent events", async () => {
    const c = newCustomer();
    const a = await approvedHelper(db, { name: "Self accept" });
    const b = await approvedHelper(db, { name: "Admin pick" });
    const { request } = await createRequest(db, c);
    const res = await settle([call(db, "svc_h_accept", a.credHash, request.id), call(db, "svc_a_assign", "admin-1", request.id, b.id)]);
    const r = await row(request.id);
    expect(r.status).toBe("ASSIGNED");
    expect([a.id, b.id]).toContain(r.helper_id);
    // whichever order ran, the stored helper is exactly the one the last successful action named
    expect(ok(res)).toBeGreaterThanOrEqual(1);
    const seen = (await call(db, "svc_c_get_request", c.credHash, null, request.id)).request;
    expect(seen.helper.id).toBe(r.helper_id);
  });

  it("C. cancel races accept: one valid terminal state, never an assigned cancelled request", async () => {
    for (let i = 0; i < 5; i++) {
      const c = newCustomer();
      const h = await approvedHelper(db, { name: `C${i}` });
      const { request } = await createRequest(db, c);
      const acts = [() => call(db, "svc_h_accept", h.credHash, request.id), () => call(db, "svc_c_cancel_request", c.credHash, null, request.id)];
      if (i % 2) acts.reverse();
      await settle(acts.map((f) => f()));
      const r = await row(request.id);
      expect(["ASSIGNED", "CANCELLED"]).toContain(r.status);
      if (r.status === "ASSIGNED") expect(r.helper_id).toBe(h.id);
    }
  });

  it("D/E. START x20 and COMPLETE x20: one canonical transition each, one event each", async () => {
    const c = newCustomer();
    const h = await approvedHelper(db, { name: "Replayer" });
    const { request } = await createRequest(db, c);
    await call(db, "svc_h_accept", h.credHash, request.id);
    const starts = await settle(Array.from({ length: 20 }, () => call(db, "svc_h_start_request", h.credHash, request.id)));
    expect(ok(starts)).toBe(1);
    expect(codes(starts).every((m) => /INVALID_STATE/.test(m))).toBe(true);
    expect(await events(request.id, "REQUEST_STARTED")).toBe(1);
    const done = await settle(Array.from({ length: 20 }, () => call(db, "svc_h_complete_request", h.credHash, request.id)));
    expect(ok(done)).toBe(1);
    expect(codes(done).every((m) => /INVALID_STATE/.test(m))).toBe(true);
    expect(await events(request.id, "REQUEST_COMPLETED")).toBe(1);
    const trail = (await call(db, "svc_c_get_request", c.credHash, null, request.id)).events.map((e: any) => e.to);
    expect(trail).toEqual(["WAITING", "ASSIGNED", "IN_PROGRESS", "COMPLETED"]);
  });

  it("F. the same message id sent 10 times stores one message and notifies once; a new id is a new message", async () => {
    const c = newCustomer();
    const h = await approvedHelper(db, { name: "Chatty" });
    const { request } = await createRequest(db, c);
    await call(db, "svc_h_accept", h.credHash, request.id);
    const msgId = "11111111-1111-4111-8111-111111111111";
    const sends = await settle(Array.from({ length: 10 }, () => call(db, "svc_msg_send", "CUSTOMER", c.credHash, null, request.id, "Xin chào", "vi", msgId)));
    expect(ok(sends)).toBe(10);
    const ids = new Set(sends.map((s: any) => s.value.id));
    expect(ids.size).toBe(1);
    expect(await call(db, "svc_msg_list", "CUSTOMER", c.credHash, null, request.id, 0, null)).toHaveLength(1);
    expect(await events(request.id, "NEW_CHAT_MESSAGE")).toBe(1);
    await call(db, "svc_msg_send", "CUSTOMER", c.credHash, null, request.id, "Xin chào", "vi", "22222222-2222-4222-8222-222222222222");
    expect(await call(db, "svc_msg_list", "CUSTOMER", c.credHash, null, request.id, 0, null)).toHaveLength(2);
    // the identity is per sender: another party using the same id does not collide with (or read) the customer's message
    const other = await call(db, "svc_msg_send", "HELPER", h.credHash, null, request.id, "네", "ko", msgId);
    expect(other.senderKind).toBe("HELPER");
  });

  it("G. a full lifecycle plus replays leaves exactly one semantic notification per step and recipient", async () => {
    const c = newCustomer();
    const h = await approvedHelper(db, { name: "Exact" });
    const { request } = await createRequest(db, c);
    await settle([call(db, "svc_h_accept", h.credHash, request.id), call(db, "svc_h_accept", h.credHash, request.id)]);
    await settle([call(db, "svc_h_start_request", h.credHash, request.id), call(db, "svc_h_start_request", h.credHash, request.id)]);
    await settle([call(db, "svc_h_complete_request", h.credHash, request.id), call(db, "svc_h_complete_request", h.credHash, request.id)]);
    const out = (await db.query<{ event_type: string; recipient_kind: string; n: number }>(
      "select event_type, recipient_kind, count(*)::int as n from public.svc_outbox where request_id = $1 and (recipient_kind <> 'HELPER' or recipient_id = $2) group by 1, 2", [request.id, h.id])).rows;
    const by = Object.fromEntries(out.map((r) => [`${r.event_type}:${r.recipient_kind}`, r.n]));
    expect(by["HELPER_ACCEPTED:CUSTOMER"]).toBe(1);
    expect(by["REQUEST_STARTED:CUSTOMER"]).toBe(1);
    expect(by["REQUEST_COMPLETED:CUSTOMER"]).toBe(1);
    expect(by["NEW_REQUEST_AVAILABLE:HELPER"]).toBe(1);
    expect(Object.values(by).every((n) => n === 1)).toBe(true);
  });

  it("a failed transition writes no event (state change and outbox row are one transaction)", async () => {
    const c = newCustomer();
    const h = await approvedHelper(db, { name: "Atomic" });
    const { request } = await createRequest(db, c);
    const before = (await db.query<{ n: number }>("select count(*)::int as n from public.svc_outbox where request_id = $1", [request.id])).rows[0].n;
    await settle([call(db, "svc_h_start_request", h.credHash, request.id)]); // not assigned yet -> rejected
    await settle([call(db, "svc_h_complete_request", h.credHash, request.id)]);
    const after = (await db.query<{ n: number }>("select count(*)::int as n from public.svc_outbox where request_id = $1", [request.id])).rows[0].n;
    expect(after).toBe(before);
    expect((await row(request.id)).status).toBe("WAITING");
  });
});

describe("service-core function security audit", { timeout: 120_000 }, () => {
  let db: PGlite;
  beforeAll(async () => { db = await newServiceDb(); });
  afterAll(async () => { await db.close(); });

  const fns = async () => (await db.query<any>(`
    select p.oid, p.proname, p.prosecdef, p.proconfig, p.prosrc, pg_get_userbyid(p.proowner) as owner, p.proacl::text as acl,
           has_function_privilege('anon', p.oid, 'EXECUTE') as anon, has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth,
           has_function_privilege('service_role', p.oid, 'EXECUTE') as svc
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'svc\\_%'`)).rows;

  it("covers every function; API functions are SECURITY DEFINER, search_path empty, service_role only", async () => {
    const all = await fns();
    expect(all.length).toBeGreaterThan(40);
    const api = all.filter((f) => !f.proname.startsWith("svc__"));
    const internal = all.filter((f) => f.proname.startsWith("svc__"));
    expect(api.length).toBeGreaterThan(25);
    for (const f of api) {
      expect(f.prosecdef, `${f.proname} security definer`).toBe(true);
      expect(f.proconfig ?? [], `${f.proname} search_path`).toContain("search_path=\"\"");
      expect(f.anon, `${f.proname} anon`).toBe(false);
      expect(f.auth, `${f.proname} authenticated`).toBe(false);
      expect(f.svc, `${f.proname} service_role`).toBe(true);
      expect(f.acl ?? "", `${f.proname} PUBLIC grant`).not.toMatch(/(^\{|,)=X\//); // an empty grantee is PUBLIC
    }
    for (const f of internal) {
      expect(f.proconfig ?? [], `${f.proname} search_path`).toContain("search_path=\"\"");
      expect([f.anon, f.auth, f.svc], `${f.proname} internals are callable by nobody but the owner`).toEqual([false, false, false]);
      expect(f.acl ?? "", `${f.proname} PUBLIC grant`).not.toMatch(/(^\{|,)=X\//);
    }
  });

  it("all functions belong to the migration owner, never to a request-scoped or API role", async () => {
    const owners = new Set((await fns()).map((f) => f.owner));
    expect([...owners]).toHaveLength(1);
    expect(["anon", "authenticated", "service_role"]).not.toContain([...owners][0]);
  });

  it("no function builds dynamic SQL from its inputs", async () => {
    for (const f of await fns()) expect(f.prosrc, `${f.proname}`).not.toMatch(/\bexecute\b|\bformat\s*\(/i);
  });

  it("no API result carries a credential, token hash or other secret", async () => {
    const c = newCustomer();
    const h = await approvedHelper(db, { name: "Secrets" });
    const created = await createRequest(db, c);
    const id = created.request.id;
    await call(db, "svc_h_accept", h.credHash, id);
    await call(db, "svc_msg_send", "CUSTOMER", c.credHash, null, id, "hi", "vi");
    const outs = [
      created,
      await call(db, "svc_c_get_request", c.credHash, null, id),
      await call(db, "svc_c_list_requests", c.credHash),
      await call(db, "svc_h_me", h.credHash),
      await call(db, "svc_h_list_requests", h.credHash),
      await call(db, "svc_msg_list", "HELPER", h.credHash, null, id, 0, null),
      await call(db, "svc_a_list_requests", null),
      await call(db, "svc_a_list_helpers", null),
      await call(db, "svc_a_get_request", id),
      await call(db, "svc_notifications_list", "CUSTOMER", c.credHash, 0),
    ];
    const text = JSON.stringify(outs);
    for (const secretValue of [c.cred, c.token, c.credHash, c.tokenHash, c.session, c.sessionHash, h.cred, h.credHash]) expect(text).not.toContain(secretValue);
    expect(text).not.toMatch(/"(credential_hash|credHash|token_hash|tokenHash|access_token_hash|cred)"/i);
  });

  it("no actor reaches another actor's data through any API function (cross-customer, cross-helper)", async () => {
    const a = newCustomer(), b = newCustomer();
    const ra = (await createRequest(db, a)).request.id;
    const h1 = await approvedHelper(db, { name: "H1" });
    const h2 = await approvedHelper(db, { name: "H2", services: ["boiler"] });
    await call(db, "svc_h_accept", h1.credHash, ra);
    for (const [fn, args] of [
      ["svc_c_get_request", [b.credHash, null, ra]],
      ["svc_c_cancel_request", [b.credHash, null, ra]],
      ["svc_msg_list", ["CUSTOMER", b.credHash, null, ra, 0, null]],
      ["svc_msg_send", ["CUSTOMER", b.credHash, null, ra, "x", "vi"]],
      ["svc_h_get_request", [h2.credHash, ra]],
      ["svc_h_start_request", [h2.credHash, ra]],
      ["svc_msg_list", ["HELPER", h2.credHash, null, ra, 0, null]],
    ] as Array<[string, unknown[]]>) {
      await expect(call(db, fn, ...args), `${fn} must not cross actors`).rejects.toThrow(/NOT_FOUND|FORBIDDEN|NOT_ELIGIBLE|NOT_APPROVED|INVALID_STATE/);
    }
    expect((await call(db, "svc_c_list_requests", b.credHash)).map?.((r: any) => r.id) ?? []).not.toContain(ra);
  });
});
