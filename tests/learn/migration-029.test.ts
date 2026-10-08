import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LEARNING_CHAIN, M029, apply, newBase, nonLearningCatalog, root, sqlOf, usersHash } from "./chainDb";

/** 202610080029 (learning entitlements) on the REAL migration files, PGlite only. No payment is involved anywhere. */
const BEFORE = LEARNING_CHAIN.slice(0, LEARNING_CHAIN.indexOf(M029));
const ROLLBACK = readFileSync(path.join(root, "supabase/rollbacks/202610080029_learning_entitlements.down.sql"), "utf8");
const U = "10000000-0000-4000-8000-0000000000e1";
const rejects = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return String((e as Error).message); } };

describe("202610080029: learning entitlements", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await newBase();
    await apply(db, BEFORE);
    await db.query("insert into auth.users(id) values ($1)", [U]);
  }, 120_000);
  afterAll(async () => { await db.close(); });

  it("applies cleanly and touches no non-learning object or auth user", async () => {
    const catalog = await nonLearningCatalog(db);
    const users = await usersHash(db);
    await db.exec(sqlOf(M029));
    expect(await nonLearningCatalog(db)).toEqual(catalog);
    expect(await usersHash(db)).toBe(users);
  });

  it("only service_role can read; nobody writes the table directly; grant / revoke are service_role RPCs", async () => {
    const priv = async (role: string, p: string) => (await db.query<{ ok: boolean }>(`select has_table_privilege('${role}', 'public.learn_entitlements', '${p}') ok`)).rows[0].ok;
    expect(await priv("service_role", "SELECT")).toBe(true);
    for (const p of ["INSERT", "UPDATE", "DELETE"]) expect(await priv("service_role", p), p).toBe(false);
    for (const role of ["anon", "authenticated"]) for (const p of ["SELECT", "INSERT"]) expect(await priv(role, p), `${role} ${p}`).toBe(false);
    const fn = async (role: string, sig: string) => (await db.query<{ ok: boolean }>(`select has_function_privilege('${role}', '${sig}', 'EXECUTE') ok`)).rows[0].ok;
    for (const sig of ["public.learn_grant_entitlement(uuid, text, text, timestamptz, timestamptz, text)", "public.learn_revoke_entitlement(uuid)"]) {
      expect(await fn("service_role", sig)).toBe(true);
      expect(await fn("anon", sig)).toBe(false);
      expect(await fn("authenticated", sig)).toBe(false);
    }
  });

  it("grant -> revoke keeps the history; bad scope / source / dates are refused", async () => {
    const id = (await db.query<{ id: string }>("select public.learn_grant_entitlement($1, 'all', 'grant', null, '2027-01-01', 'scholarship') id", [U])).rows[0].id;
    await db.query("select public.learn_revoke_entitlement($1)", [id]);
    const row = (await db.query<{ revoked_at: string | null; source: string }>("select revoked_at, source from public.learn_entitlements where id = $1", [id])).rows[0];
    expect(row.revoked_at).not.toBeNull();
    expect(row.source).toBe("grant");
    expect(await rejects(db.query("select public.learn_grant_entitlement($1, 'physics', 'grant', null, null, null)", [U]))).toMatch(/check|violat/i);
    expect(await rejects(db.query("select public.learn_grant_entitlement($1, 'all', 'paypal', null, null, null)", [U]))).toMatch(/check|violat/i);
    expect(await rejects(db.query("select public.learn_grant_entitlement($1, 'all', 'promotion', '2027-01-01', '2026-01-01', null)", [U]))).toMatch(/check|violat/i);
  });

  it("deleting entitlements never touches progress: the table has no reference from any progress table", async () => {
    const refs = (await db.query<{ n: number }>("select count(*)::int n from pg_constraint where contype = 'f' and confrelid = 'public.learn_entitlements'::regclass")).rows[0].n;
    expect(refs).toBe(0);
  });

  it("the manual rollback refuses while entitlement rows exist", async () => {
    expect(await rejects(db.exec(ROLLBACK))).toMatch(/not empty/);
  });
});
