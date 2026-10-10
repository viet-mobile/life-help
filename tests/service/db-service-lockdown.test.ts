/* eslint-disable @typescript-eslint/no-explicit-any -- the SQL harness handles untyped rows */
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { apply, newBase } from "../learn/chainDb";
import { SERVICE_ACCESS, SERVICE_CORE, SERVICE_LOCKDOWN, approvedHelper, call, createRequest, newCustomer, newServiceDb, rejects, secret, sha } from "./serviceDb";

/**
 * Migration 042: the svc__* internals are not API for ANY role (PUBLIC, anon, authenticated, service_role) while every svc_* wrapper keeps
 * working. Proven on the real SQL: ACLs, a staging-like drift that 042 repairs, wrappers executed AS service_role, and the flows.
 */
const internalsOf = async (db: PGlite) =>
  (await db.query<any>(`select p.oid, p.oid::regprocedure::text as sig, p.proname, p.prosecdef,
      has_function_privilege('anon', p.oid, 'EXECUTE') anon, has_function_privilege('authenticated', p.oid, 'EXECUTE') auth,
      has_function_privilege('service_role', p.oid, 'EXECUTE') svc, has_function_privilege(current_user, p.oid, 'EXECUTE') owner,
      exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE') public_exec
    from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname like 'svc\\_\\_%' order by p.proname`)).rows;
const asRole = async <T,>(db: PGlite, role: string, fn: () => Promise<T>) => {
  await db.exec(`set role ${role}`);
  try { return await fn(); } finally { await db.exec("reset role"); }
};

describe("042: internal RPCs are hidden from every API role", { timeout: 120_000 }, () => {
  let db: PGlite;
  beforeAll(async () => { db = await newServiceDb(); });
  afterAll(async () => { await db.close(); });

  it("PUBLIC, anon, authenticated and service_role have NO EXECUTE on any svc__* function (the owner keeps it)", async () => {
    const rows = await internalsOf(db);
    expect(rows.length).toBeGreaterThanOrEqual(17); // 15 building blocks (040/041) + the two lockdown helpers
    for (const r of rows) {
      expect(r.public_exec, `${r.proname} PUBLIC`).toBe(false);
      expect(r.anon, `${r.proname} anon`).toBe(false);
      expect(r.auth, `${r.proname} authenticated`).toBe(false);
      expect(r.svc, `${r.proname} service_role`).toBe(false);
      expect(r.owner, `${r.proname} owner`).toBe(true);
    }
    for (const n of ["svc__fail", "svc__eligible", "svc__emit", "svc__helper_json", "svc__request_json", "svc__helper_by_cred", "svc__approved_helper", "svc__customer_request", "svc__set_status", "svc__announce_request", "svc__announce_to_helper", "svc__chat_party", "svc__msg_json", "svc__post_message", "svc__owner_request"]) expect(rows.map((r: any) => r.proname), n).toContain(n);
  });

  it("calling an internal directly is a permission error for every API role", async () => {
    for (const role of ["anon", "authenticated", "service_role"]) {
      await asRole(db, role, async () => {
        await expect(db.query("select public.svc__fail('X')"), role).rejects.toThrow(/permission denied for function svc__fail/);
        await expect(db.query("select public.svc__lockdown_internals()"), role).rejects.toThrow(/permission denied/);
      });
    }
  });

  it("AUDIT: every non-internal function that reaches an internal is SECURITY DEFINER, so it keeps working through the owner", async () => {
    const rows = (await db.query<any>(`select proname, prosecdef, prosrc from pg_proc where pronamespace = 'public'::regnamespace and proname like 'svc\\_%'`)).rows;
    const wrappers = rows.filter((r: any) => !r.proname.startsWith("svc__") && /svc__/.test(r.prosrc));
    expect(wrappers.length).toBeGreaterThan(20);
    for (const w of wrappers) expect(w.prosecdef, `${w.proname} calls an internal, so it must be SECURITY DEFINER`).toBe(true);
    // internals only ever run inside a definer wrapper (or another internal): no non-definer API function reaches them
    expect(rows.filter((r: any) => !r.proname.startsWith("svc__") && !r.prosecdef)).toEqual([]);
  });

  it("wrapper RPCs work AS service_role after the revoke: request, helper, accept, chat, start, complete, link claim/rotate/revoke-all", async () => {
    await asRole(db, "service_role", async () => {
      const c = newCustomer();
      const h = await approvedHelper(db);
      const created = await createRequest(db, c);
      const id = created.request.id;
      expect((await call(db, "svc_core_schema_version"))).toBe(42);
      expect((await call(db, "svc_h_accept", h.credHash, id)).status).toBe("ASSIGNED");
      await call(db, "svc_msg_send", "CUSTOMER", c.credHash, null, id, "hello", "vi", "11111111-1111-4111-8111-111111111111");
      await call(db, "svc_msg_send", "HELPER", h.credHash, null, id, "네", "ko");
      expect(await call(db, "svc_msg_list", "CUSTOMER", c.credHash, null, id, 0, "ko")).toHaveLength(2);
      expect((await call(db, "svc_h_start_request", h.credHash, id)).status).toBe("IN_PROGRESS");
      expect((await call(db, "svc_h_complete_request", h.credHash, id)).status).toBe("COMPLETED");
      // request access (041): claim -> own session -> read; rotate; revoke-all
      const link = secret(), session = secret();
      const own = newCustomer();
      const r2 = (await createRequest(db, own)).request.id;
      await call(db, "svc_c_rotate_link", own.credHash, r2, sha(link));
      await call(db, "svc_c_claim", r2, sha(link), sha(session));
      expect((await call(db, "svc_c_get_request", null, sha(session), r2)).request.id).toBe(r2);
      expect((await call(db, "svc_c_revoke_all_access", own.credHash, r2)).ok).toBe(true);
      await rejects(db, "svc_c_get_request", [null, sha(session), r2], "NOT_FOUND");
      // admin assignment
      const c3 = newCustomer();
      const h3 = await approvedHelper(db, { name: "Assigned" });
      const r3 = (await createRequest(db, c3)).request.id;
      expect((await call(db, "svc_a_assign", "admin-1", r3, h3.id)).status).toBe("ASSIGNED");
    });
  });

  it("a staging-like drift (API roles can execute internals) is repaired by 042, and the flows still pass afterwards", async () => {
    const drift = await newBase();
    await apply(drift, [SERVICE_CORE, SERVICE_ACCESS]);
    await drift.exec(`do $$ declare f record; begin for f in select p.oid::regprocedure sig from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname like 'svc\\_\\_%' loop
      execute format('grant execute on function %s to public, anon, authenticated, service_role', f.sig); end loop; end $$`);
    const before = await internalsOf(drift);
    expect(before.length).toBe(15);
    expect(before.every((r: any) => r.svc && r.anon && r.auth && r.public_exec)).toBe(true); // exposed
    await apply(drift, [SERVICE_LOCKDOWN]);
    const after = await internalsOf(drift);
    expect(after.length).toBe(17);
    for (const r of after) expect([r.public_exec, r.anon, r.auth, r.svc, r.owner], r.proname).toEqual([false, false, false, false, true]);
    // the repaired database still runs a whole request (concurrency/idempotency rules live in the wrappers)
    const c = newCustomer();
    const hs = [await approvedHelper(drift, { name: "R1" }), await approvedHelper(drift, { name: "R2" }), await approvedHelper(drift, { name: "R3" })];
    const id = (await createRequest(drift, c)).request.id;
    const res = await Promise.allSettled(hs.map((h) => call(drift, "svc_h_accept", h.credHash, id)));
    expect(res.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    await drift.close();
  });

  it("recurrence: a new svc__ function is revoked at creation (event trigger) or by the documented call; other functions are untouched", async () => {
    const hasTrigger = (await db.query<any>("select 1 from pg_event_trigger where evtname = 'svc_lockdown_on_create'")).rows.length === 1;
    await db.exec("create function public.svc__future_internal() returns integer language sql as $$ select 1 $$; create function public.svc_future_api() returns integer language sql as $$ select 1 $$;");
    const internal = (await internalsOf(db)).find((r: any) => r.proname === "svc__future_internal");
    if (hasTrigger) expect([internal.svc, internal.anon, internal.auth, internal.public_exec]).toEqual([false, false, false, false]);
    else await db.exec("select public.svc__lockdown_internals()");
    const fixed = (await internalsOf(db)).find((r: any) => r.proname === "svc__future_internal");
    expect([fixed.svc, fixed.anon, fixed.auth, fixed.public_exec]).toEqual([false, false, false, false]);
    // the narrow rule never touches a non-internal function: its default grants are unchanged
    const api = (await db.query<any>("select has_function_privilege('service_role', 'public.svc_future_api()', 'EXECUTE') svc")).rows[0];
    expect(api.svc).toBe(true);
    await db.exec("drop function public.svc__future_internal(); drop function public.svc_future_api()");
  });

  it("every migration that creates a svc__ function also locks it down (so nobody can forget it)", () => {
    const dir = "supabase/migrations";
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".sql"))) {
      const sql = readFileSync(`${dir}/${f}`, "utf8");
      if (!/create (or replace )?function public\.svc__/i.test(sql)) continue;
      expect(/like 'svc\\_\\_%'/.test(sql) || /svc__lockdown_internals\(\)/.test(sql), `${f} creates svc__ functions without revoking them`).toBe(true);
    }
  });

  it("the Worker's database clients can never call an internal", async () => {
    const { createLocalDb } = await import("@/lib/service/dbLocal");
    const local = await createLocalDb();
    await expect(local.rpc("svc__fail", { p_code: "X" })).rejects.toBeTruthy();
    await local.close();
  });
});
