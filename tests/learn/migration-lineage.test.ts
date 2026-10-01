/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { EXISTING_USER, LEARNING_CHAIN, M024, M025, M026, MARKETPLACE_FILES, SHIM, apply, createChainDb, newBase, nonLearningCatalog, root, sha256Of, sqlOf, usersHash } from "./chainDb";

/**
 * Migration lineage for the learning-only production release.
 *   024 / 025 are IMMUTABLE (already applied on staging): pinned by sha256.
 *   023 = marker-tagged shim (creates app_role + has_role only on a database without the marketplace schema),
 *   026 = self-contained learning authorization + removal of exactly the shim objects.
 * Chains: A production-now, B staging / marketplace present, C adversarial, D future marketplace rollout after learning.
 * Local PGlite only.
 */
const PINNED: Record<string, string> = {
  [M024]: "e5a14ce275623f8aa46cda9dbbc44218402638447912ab83d160f95246366920",
  [M025]: "c0339c69d661ba1371da4dd36d37d61b78a1d2d7f44c35037f982fa736cbcf83",
};
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const STAFF = "33333333-3333-3333-3333-333333333333";
const MARKET_STAFF = "44444444-4444-4444-4444-444444444444";

type R = { status: "ok" | "denied" | "error"; rows: any[]; message?: string };
async function as(db: PGlite, actor: "anon" | "service" | { id: string }, sql: string, params: unknown[] = []): Promise<R> {
  const role = actor === "anon" ? "anon" : actor === "service" ? "service_role" : "authenticated";
  const sub = typeof actor === "object" ? actor.id : "";
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${sub}', false);`);
  try { return { status: "ok", rows: (await db.query(sql, params)).rows }; }
  catch (e: any) { return { status: e.code === "42501" ? "denied" : "error", rows: [], message: String(e.message) }; }
  finally { await db.exec("reset role"); }
}
const one = async (db: PGlite, sql: string, params: unknown[] = []) => (await db.query<any>(sql, params)).rows[0];
const count = async (db: PGlite, sql: string) => Number((await one(db, sql)).n);
const tryApply = async (db: PGlite, files: string[]) => { try { await apply(db, files); return null; } catch (e: any) { return String(e.message); } };
const learnTables = (db: PGlite) => count(db, "select count(*) n from pg_tables where schemaname = 'public' and tablename like 'learn\\_%'");
const policyDefs = async (db: PGlite) => (await db.query<any>("select tablename, qual, with_check from pg_policies where schemaname = 'public' and policyname = 'learn content staff all' order by tablename")).rows;
const addUsers = (db: PGlite, ids: string[]) => Promise.all(ids.map((id) => db.query("insert into auth.users (id) values ($1) on conflict do nothing", [id])));
const MARKER = "learn-prereq-shim:v1";

describe("immutability: 024 / 025 are pinned", () => {
  it("sha256 of 202609300024 and 202609300025 equals the version already applied on staging", () => {
    expect(sha256Of(M024)).toBe(PINNED[M024]);
    expect(sha256Of(M025)).toBe(PINNED[M025]);
  });
  it("the new migrations are exactly 023 (shim) and 026 (self-contained auth); no other learning file changed", () => {
    expect(LEARNING_CHAIN).toEqual([SHIM, M024, M025, M026]);
  });
  it("neither new migration uses CASCADE (comments aside) or creates a marketplace table", () => {
    for (const f of [SHIM, M026]) {
      const code = sqlOf(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
      expect(code).not.toMatch(/\bdrop\b[^;]*\bcascade\b/i); // ON DELETE CASCADE on the staff FK is a reference action, not DROP ... CASCADE
      expect(code).not.toMatch(/create\s+table\s+(?!public\.learn_)/i);
    }
  });
});

describe("CHAIN A: production-now (empty Supabase base -> 023 -> 024 -> 025 -> 026)", { timeout: 120_000 }, () => {
  it("applies; learning schema is complete; shim objects are gone; auth.users is untouched; nothing of the marketplace exists", async () => {
    const db = await newBase();
    const before = await usersHash(db);
    await apply(db, LEARNING_CHAIN);
    expect(await learnTables(db)).toBe(25); // 24 content/progress tables + learn_staff_users
    expect(await usersHash(db)).toBe(before);
    expect(await count(db, "select count(*) n from auth.users")).toBe(1);
    expect((await one(db, "select to_regtype('public.app_role') t, to_regnamespace('security') s, to_regprocedure('security.has_role(public.app_role[])') f")))
      .toMatchObject({ t: null, s: null, f: null });
    expect(await count(db, "select count(*) n from pg_tables where schemaname = 'public' and tablename not like 'learn\\_%'")).toBe(0);
    expect(await count(db, "select count(*) n from pg_description d where d.description like '" + MARKER + "%'")).toBe(0);
    const pol = await policyDefs(db);
    expect(pol).toHaveLength(14);
    for (const p of pol) { expect(p.qual).toContain("learn_security.is_staff"); expect(p.with_check).toContain("learn_security.is_staff"); expect(`${p.qual}${p.with_check}`).not.toMatch(/has_role|app_role/); }
    await db.close();
  });

  it("learn_staff_users: FK to auth.users, role ADMIN|EDITOR only, RLS on, no API-role write, service_role SELECT only", async () => {
    const db = await newBase();
    await apply(db, LEARNING_CHAIN);
    expect((await one(db, "select pg_get_constraintdef(oid) d from pg_constraint where conrelid = 'public.learn_staff_users'::regclass and contype = 'f'")).d).toMatch(/REFERENCES auth\.users\(id\) ON DELETE CASCADE/);
    expect((await one(db, "select relrowsecurity r from pg_class where oid = 'public.learn_staff_users'::regclass")).r).toBe(true);
    expect(await count(db, "select count(*) n from pg_policies where tablename = 'learn_staff_users'")).toBe(0);
    await addUsers(db, [STAFF]);
    expect((await db.query("insert into public.learn_staff_users (user_id, role) values ($1, 'EDITOR')", [STAFF])).affectedRows).toBe(1);
    await expect(db.query("insert into public.learn_staff_users (user_id, role) values ($1, 'OWNER')", [A])).rejects.toThrow(); // role check
    await expect(db.query("insert into public.learn_staff_users (user_id, role) values ('99999999-9999-9999-9999-999999999999', 'ADMIN')")).rejects.toThrow(); // FK
    const g = await one(db, `select
      has_table_privilege('anon','public.learn_staff_users','SELECT') a_s, has_table_privilege('authenticated','public.learn_staff_users','SELECT') u_s,
      has_table_privilege('service_role','public.learn_staff_users','SELECT') s_s, has_table_privilege('service_role','public.learn_staff_users','INSERT') s_i,
      has_table_privilege('service_role','public.learn_staff_users','UPDATE') s_u, has_table_privilege('service_role','public.learn_staff_users','DELETE') s_d,
      has_table_privilege('authenticated','public.learn_staff_users','INSERT') u_i, has_table_privilege('anon','public.learn_staff_users','INSERT') a_i`);
    expect(g).toEqual({ a_s: false, u_s: false, s_s: true, s_i: false, s_u: false, s_d: false, u_i: false, a_i: false });
    for (const [who, actor] of [["anon", "anon"], ["student", { id: A }], ["service", "service"]] as const) {
      const ins = await as(db, actor as any, "insert into public.learn_staff_users (user_id, role) values ($1, 'ADMIN')", [A]);
      const upd = await as(db, actor as any, "update public.learn_staff_users set role = 'ADMIN' where user_id = $1", [STAFF]);
      const del = await as(db, actor as any, "delete from public.learn_staff_users where user_id = $1", [STAFF]);
      expect([who, ins.status, upd.status, del.status]).toEqual([who, "denied", "denied", "denied"]);
    }
    expect((await as(db, "service", "select user_id from public.learn_staff_users")).rows).toHaveLength(1);
    expect((await as(db, { id: A }, "select * from public.learn_staff_users")).status).toBe("denied");
    expect((await as(db, "anon", "select * from public.learn_staff_users")).status).toBe("denied");
    await db.close();
  });

  it("learn_security.is_staff: SECURITY DEFINER, search_path '', authenticated-only EXECUTE; schema USAGE for authenticated only; evaluates auth.uid()", async () => {
    const db = await newBase();
    await apply(db, LEARNING_CHAIN);
    await addUsers(db, [A, STAFF]);
    await db.query("insert into public.learn_staff_users (user_id, role) values ($1, 'EDITOR')", [STAFF]);
    const f = await one(db, `select prosecdef, provolatile, coalesce(proconfig::text, '') cfg,
      has_function_privilege('anon', p.oid, 'EXECUTE') a, has_function_privilege('authenticated', p.oid, 'EXECUTE') u, has_function_privilege('service_role', p.oid, 'EXECUTE') s,
      has_schema_privilege('anon', 'learn_security', 'USAGE') sa, has_schema_privilege('authenticated', 'learn_security', 'USAGE') su, has_schema_privilege('service_role', 'learn_security', 'USAGE') ss,
      (select count(*) from pg_proc q join pg_namespace n on n.oid = q.pronamespace where n.nspname = 'learn_security') nfn,
      (select count(*) from pg_proc q join pg_namespace n on n.oid = q.pronamespace where n.nspname = 'public' and q.proname = 'is_staff') public_copy
      from pg_proc p where p.oid = 'learn_security.is_staff(text[])'::regprocedure`);
    expect(f).toMatchObject({ prosecdef: true, provolatile: "s", a: false, u: true, s: false, sa: false, su: true, ss: false });
    expect(f.cfg.replace(/[\\"{}]/g, "")).toBe("search_path=");
    expect(Number(f.nfn)).toBe(1);
    expect(Number(f.public_copy)).toBe(0); // no public wrapper: the predicate is not reachable as an API RPC
    expect((await as(db, "anon", "select learn_security.is_staff()")).status).toBe("denied");
    expect((await as(db, "service", "select learn_security.is_staff()")).status).toBe("denied");
    expect((await as(db, { id: A }, "select learn_security.is_staff() s")).rows[0].s).toBe(false);
    expect((await as(db, { id: STAFF }, "select learn_security.is_staff() s")).rows[0].s).toBe(true);
    expect((await as(db, { id: STAFF }, "select learn_security.is_staff(array['ADMIN']) s")).rows[0].s).toBe(false); // EDITOR is not ADMIN
    await db.close();
  });

  it("a student cannot make themselves staff: forged ADMIN metadata, a forged role claim, or the server key all fail", async () => {
    const db = await newBase();
    await apply(db, LEARNING_CHAIN);
    await db.query("insert into auth.users (id, raw_app_meta_data) values ($1, '{\"role\":\"ADMIN\",\"learn_role\":\"ADMIN\"}')", [A]);
    await db.exec("set role authenticated; select set_config('request.jwt.claim.sub', '" + A + "', false); select set_config('request.jwt.claims', '{\"role\":\"authenticated\",\"app_metadata\":{\"role\":\"ADMIN\"}}', false);");
    const staff = (await db.query<any>("select learn_security.is_staff() s")).rows[0].s;
    const write = await db.query("insert into public.learn_subjects (code, name) values ('x', 'x')").then(() => "ok", (e: any) => e.code);
    await db.exec("reset role");
    expect(staff).toBe(false);
    expect(write).toBe("42501");
    // the API roles cannot grant staff either (no INSERT on the staff table for any of them)
    for (const actor of ["service", { id: A }, "anon"] as const) expect((await as(db, actor as any, "insert into public.learn_staff_users (user_id, role) values ($1, 'ADMIN')", [A])).status).toBe("denied");
    expect(await count(db, "select count(*) n from public.learn_staff_users")).toBe(0);
    await db.close();
  });

  it("policy behaviour after replacement: students cannot write or read answers; staff author; publish workflow and trusted RPCs unchanged", async () => {
    const db = await newBase();
    await apply(db, LEARNING_CHAIN);
    await addUsers(db, [A, STAFF]);
    await db.query("insert into public.learn_staff_users (user_id, role) values ($1, 'EDITOR')", [STAFF]);
    await db.query("insert into public.learn_subjects (code, name) values ('math', 'm') returning id");
    const subj = (await one(db, "select id from public.learn_subjects where code = 'math'")).id;
    await db.query("insert into public.learn_skills (code, subject_id, title) values ('s.one', $1, 't')", [subj]);
    const skill = (await one(db, "select id from public.learn_skills where code = 's.one'")).id;
    const q = (code: string, status = "DRAFT") => ({ sql: "insert into public.learn_questions (code, subject_id, skill_id, type, difficulty, prompt, status) values ($1, $2, $3, 'numeric', 1, 'p', $4) returning id", params: [code, subj, skill, status] });
    expect((await as(db, { id: A }, q("stu-q").sql, q("stu-q").params)).status).toBe("denied"); // student cannot author
    const staffQ = await as(db, { id: STAFF }, q("staff-q").sql, q("staff-q").params);
    expect(staffQ.status).toBe("ok"); // staff can
    const qid = staffQ.rows[0].id;
    expect((await as(db, { id: STAFF }, "insert into public.learn_question_answers (question_id, answer) values ($1, '{\"v\":1}')", [qid])).status).toBe("ok");
    for (const t of ["learn_questions", "learn_question_answers", "learn_question_hints", "learn_question_explanations", "learn_question_options"]) {
      const r = await as(db, { id: A }, `select * from public.${t}`);
      expect(r.status === "denied" || r.rows.length === 0, t).toBe(true); // answer key / hints / explanation unreadable by students
    }
    expect((await as(db, { id: STAFF }, "select * from public.learn_question_answers")).rows).toHaveLength(1);
    // publish workflow: human reviewer required, one step at a time
    expect((await as(db, { id: STAFF }, "update public.learn_questions set status = 'PUBLISHED' where id = $1", [qid])).status).toBe("error");
    expect((await as(db, { id: STAFF }, "update public.learn_questions set status = 'REVIEWED' where id = $1", [qid])).status).toBe("error"); // no reviewer
    for (const s of ["REVIEWED", "APPROVED", "PUBLISHED"]) expect((await as(db, { id: STAFF }, "update public.learn_questions set status = $2, reviewed_by = $3 where id = $1", [qid, s, STAFF])).status).toBe("ok");
    // trusted RPCs stay service-role only (not staff, not students)
    for (const actor of [{ id: STAFF }, { id: A }, "anon"] as const) {
      expect((await as(db, actor as any, "select public.learn_load_content('math')")).status).toBe("denied");
      expect((await as(db, actor as any, "select public.learn_load_state($1, 'math', '2026-03-01')", [A])).status).toBe("denied");
    }
    expect((await as(db, "service", "select public.learn_load_content('math') c")).status).toBe("ok");
    await db.close();
  });
});

describe("CHAIN B: staging / marketplace present (0001-0023 -> 023 NO-OP -> 024 -> 025 -> 026)", { timeout: 180_000 }, () => {
  it("shim is a no-op; marketplace app_role / user_roles / has_role stay byte-for-byte; only learning policies change", async () => {
    const without = await createChainDb({ until: SHIM }); // marketplace only
    const baseline = await nonLearningCatalog(without);
    const baseUsers = await usersHash(without);
    const full = await createChainDb(); // + 023 .. 026
    expect(await nonLearningCatalog(full)).toEqual(baseline);
    expect(await usersHash(full)).toBe(baseUsers);
    expect((await one(full, "select obj_description('public.app_role'::regtype, 'pg_type') t, obj_description('security.has_role(public.app_role[])'::regprocedure, 'pg_proc') f")))
      .toEqual({ t: null, f: null }); // not marked: not ours
    expect(await count(full, "select count(*) n from pg_tables where schemaname = 'public' and tablename = 'user_roles'")).toBe(1);
    expect((await one(full, "select pg_get_functiondef('security.has_role(public.app_role[])'::regprocedure) d")).d).toContain("user_roles");
    for (const p of await policyDefs(full)) expect(`${p.qual}${p.with_check}`).toContain("learn_security.is_staff");
    expect(await learnTables(full)).toBe(25);
    await without.close(); await full.close();
  });

  it("marketplace STAFF (user_roles) are NOT learning staff; learning staff work without any marketplace role", async () => {
    const db = await createChainDb();
    await addUsers(db, [MARKET_STAFF, STAFF]);
    await db.query("insert into public.profiles (id, display_name) values ($1, 'm'), ($2, 's')", [MARKET_STAFF, STAFF]);
    await db.query("insert into public.user_roles (user_id, role) values ($1, 'STAFF')", [MARKET_STAFF]);
    expect((await as(db, { id: MARKET_STAFF }, "select learn_security.is_staff() s")).rows[0].s).toBe(false);
    expect((await as(db, { id: MARKET_STAFF }, "insert into public.learn_subjects (code, name) values ('mk', 'x')")).status).toBe("denied");
    await db.query("insert into public.learn_staff_users (user_id, role) values ($1, 'ADMIN')", [STAFF]);
    expect((await as(db, { id: STAFF }, "select learn_security.is_staff() s")).rows[0].s).toBe(true);
    expect((await as(db, { id: STAFF }, "insert into public.learn_subjects (code, name) values ('lt', 'x')")).status).toBe("denied"); // catalog structure is written by the server key, not by staff (unchanged from 024)
    expect((await as(db, { id: STAFF }, "select * from public.learn_questions")).status).toBe("ok");
    await db.close();
  });
});

describe("CHAIN C: adversarial states fail closed and never delete what is not ours", { timeout: 180_000 }, () => {
  const snapshot = async (db: PGlite) => ({ catalog: await nonLearningCatalog(db), users: await usersHash(db) });
  const FOREIGN = `create schema security; create type public.app_role as enum ('CUSTOMER','TECHNICIAN','ADMIN','STAFF');
    create function security.has_role(required_roles public.app_role[]) returns boolean language sql stable security definer set search_path = '' as $$ select true $$;`;

  it("C1 partial state (app_role exists, has_role missing): 023 refuses, nothing is changed", async () => {
    const db = await newBase();
    await db.exec("create type public.app_role as enum ('ADMIN', 'STAFF')");
    const before = await snapshot(db);
    expect(await tryApply(db, [SHIM])).toMatch(/partial prerequisite state/);
    expect(await snapshot(db)).toEqual(before);
    expect(await one(db, "select to_regnamespace('security') s")).toEqual({ s: null });
    await db.close();
  });

  it("C2 foreign (unmarked) app_role + has_role: the whole learning chain applies, the foreign objects are never modified or dropped", async () => {
    const db = await newBase();
    await db.exec(FOREIGN);
    const before = await snapshot(db);
    await apply(db, LEARNING_CHAIN);
    expect(await snapshot(db)).toEqual(before);
    expect((await one(db, "select pg_get_functiondef('security.has_role(public.app_role[])'::regprocedure) d")).d).toContain("select true");
    expect(await learnTables(db)).toBe(25);
    await db.close();
  });

  it("C3 foreign `security` schema (no has_role): the shim adds only its own marked objects; 026 keeps the unmarked schema", async () => {
    const db = await newBase();
    await db.exec("create schema security; create table security.keepme (id int)");
    await apply(db, LEARNING_CHAIN);
    expect(await one(db, "select to_regnamespace('security') is not null s, to_regclass('security.keepme') is not null k, to_regtype('public.app_role') is null t")).toEqual({ s: true, k: true, t: true });
    expect(await count(db, "select count(*) n from pg_proc where pronamespace = 'security'::regnamespace")).toBe(0);
    await db.close();
  });

  it("C4 something still depends on the shim (a column of type app_role): 026 fails as a whole, no CASCADE, shim and policies intact", async () => {
    const db = await newBase();
    await apply(db, [SHIM, M024, M025]);
    await db.exec("create table public.depends_on_shim (r public.app_role)");
    const err = await tryApply(db, [M026]);
    expect(err).toMatch(/depend/i);
    expect(await one(db, "select to_regclass('public.learn_staff_users') s, to_regnamespace('learn_security') n")).toEqual({ s: null, n: null }); // atomic: nothing from 026 stayed
    expect(await one(db, "select to_regtype('public.app_role') is not null t, to_regprocedure('security.has_role(public.app_role[])') is not null f")).toEqual({ t: true, f: true });
    for (const p of await policyDefs(db)) expect(`${p.qual}`).toContain("has_role");
    expect(await count(db, "select count(*) n from pg_tables where tablename = 'depends_on_shim'")).toBe(1);
    await db.close();
  });

  it("C5 something else policy-depends on has_role: 026 fails, no CASCADE", async () => {
    const db = await newBase();
    await apply(db, [SHIM, M024, M025]);
    await db.exec("create table public.other (id int); alter table public.other enable row level security; create policy p on public.other for select to authenticated using ((select security.has_role(array['ADMIN']::public.app_role[])))");
    expect(await tryApply(db, [M026])).toMatch(/depend/i);
    expect(await one(db, "select to_regprocedure('security.has_role(public.app_role[])') is not null f")).toEqual({ f: true });
    await db.close();
  });

  it("C6 inconsistent markers (only the type is marked / only the function is marked): 026 refuses and drops nothing", async () => {
    for (const strip of ["function", "type"] as const) {
      const db = await newBase();
      await apply(db, [SHIM, M024, M025]);
      if (strip === "function") await db.exec("comment on function security.has_role(public.app_role[]) is null");
      else await db.exec("comment on type public.app_role is null");
      const err = await tryApply(db, [M026]);
      expect(err, strip).toMatch(/inconsistent shim markers/);
      expect(await one(db, "select to_regtype('public.app_role') is not null t, to_regprocedure('security.has_role(public.app_role[])') is not null f, to_regclass('public.learn_staff_users') is null s")).toEqual({ t: true, f: true, s: true });
      await db.close();
    }
  });

  it("C7 marked schema that is not empty: 026 refuses (and rolls back the has_role / app_role drops)", async () => {
    const db = await newBase();
    await apply(db, [SHIM, M024, M025]);
    await db.exec("create table security.extra (id int)");
    expect(await tryApply(db, [M026])).toMatch(/not empty/);
    expect(await one(db, "select to_regtype('public.app_role') is not null t, to_regprocedure('security.has_role(public.app_role[])') is not null f")).toEqual({ t: true, f: true });
    await db.close();
  });

  it("C8 the shim itself is idempotent-safe: applying it twice is a no-op the second time (marketplace-present state)", async () => {
    const db = await newBase();
    await apply(db, [SHIM]);
    const marked = await one(db, "select obj_description('public.app_role'::regtype, 'pg_type') t");
    expect(marked.t).toMatch(/^learn-prereq-shim:v1/);
    await apply(db, [SHIM]); // both exist now -> no-op
    expect((await one(db, "select obj_description('public.app_role'::regtype, 'pg_type') t")).t).toBe(marked.t);
    expect((await as(db, { id: A }, "select security.has_role(array['ADMIN']::public.app_role[]) r")).rows[0].r).toBe(false); // shim has_role is always false
    expect(await count(db, "select count(*) n from pg_tables where tablename = 'user_roles'")).toBe(0); // the shim never creates user_roles
    expect((await db.query<any>("select enumlabel from pg_enum e where e.enumtypid = 'public.app_role'::regtype order by enumsortorder")).rows.map((r) => r.enumlabel)).toEqual(["CUSTOMER", "TECHNICIAN", "ADMIN", "STAFF"]);
    await db.close();
  });
});

describe("CHAIN D: future marketplace rollout AFTER learning (023 -> 024 -> 025 -> 026 -> marketplace 0001 .. 0023)", { timeout: 240_000 }, () => {
  it("succeeds; marketplace app_role / user_roles / has_role are created fresh; learning keeps its own staff model; catalog equals chain B", async () => {
    const db = await newBase();
    const usersBefore = await usersHash(db);
    await apply(db, LEARNING_CHAIN);
    await apply(db, MARKETPLACE_FILES); // real 0001 .. 0023, in order, must not collide with anything learning left behind
    expect(await usersHash(db)).toBe(usersBefore);
    expect(await learnTables(db)).toBe(25);
    expect((await one(db, "select obj_description('public.app_role'::regtype, 'pg_type') t")).t).toBeNull(); // the marketplace's own, unmarked
    expect((await one(db, "select pg_get_functiondef('security.has_role(public.app_role[])'::regprocedure) d")).d).toContain("user_roles");
    for (const p of await policyDefs(db)) { expect(`${p.qual}${p.with_check}`).toContain("learn_security.is_staff"); expect(`${p.qual}${p.with_check}`).not.toMatch(/has_role/); } // never reverted to the marketplace function
    const full = await createChainDb(); // chain B
    expect(await nonLearningCatalog(db)).toEqual(await nonLearningCatalog(full)); // same marketplace end state either order
    // the learning staff model is still independent of the (now existing) marketplace roles
    await addUsers(db, [MARKET_STAFF, STAFF]);
    await db.query("insert into public.profiles (id, display_name) values ($1, 'm'), ($2, 's')", [MARKET_STAFF, STAFF]);
    await db.query("insert into public.user_roles (user_id, role) values ($1, 'ADMIN')", [MARKET_STAFF]);
    await db.query("insert into public.learn_staff_users (user_id, role) values ($1, 'EDITOR')", [STAFF]);
    expect((await as(db, { id: MARKET_STAFF }, "select learn_security.is_staff() s")).rows[0].s).toBe(false);
    expect((await as(db, { id: STAFF }, "select learn_security.is_staff() s")).rows[0].s).toBe(true);
    await db.close(); await full.close();
  });
});

describe("ROLLBACK (manual script, no CASCADE)", { timeout: 240_000 }, () => {
  const rollback = readFileSync(path.join(root, "supabase/rollbacks/202609300026_learning_platform_full.down.sql"), "utf8");
  const learningLeft = async (db: PGlite) =>
    Number((await one(db, `select (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname like 'learn\\_%')
      + (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where p.proname like 'learn\\_%' or n.nspname = 'learn_security')
      + (select count(*) from pg_type t where t.typname like 'learn\\_%' and t.typtype = 'e')
      + (select count(*) from pg_namespace where nspname = 'learn_security') n`)).n);

  it("the script never uses CASCADE", () => expect(rollback.replace(/--.*$/gm, "")).not.toMatch(/\bcascade\b/i));

  it("production-now: removes every learning object, leaves no shim residue, auth.users untouched, no marketplace objects appear", async () => {
    const db = await newBase();
    const users = await usersHash(db);
    await apply(db, LEARNING_CHAIN);
    expect(await learningLeft(db)).toBeGreaterThan(0);
    await db.exec(rollback);
    expect(await learningLeft(db)).toBe(0);
    expect(await usersHash(db)).toBe(users);
    expect(await count(db, "select count(*) n from pg_tables where schemaname = 'public'")).toBe(0);
    expect((await one(db, "select to_regtype('public.app_role') t, to_regnamespace('security') s")).s).toBeNull();
    expect(await count(db, "select count(*) n from pg_description where description like '" + MARKER + "%'")).toBe(0);
    await db.close();
  });

  it("interrupted state (023-025 applied, 026 never ran): removes the learning objects AND the marker-tagged shim", async () => {
    const db = await newBase();
    await apply(db, [SHIM, M024, M025]);
    await db.exec(rollback);
    expect(await learningLeft(db)).toBe(0);
    expect(await one(db, "select to_regtype('public.app_role') t, to_regnamespace('security') s")).toEqual({ t: null, s: null });
    await db.close();
  });

  it("marketplace present: removes only learning objects; every marketplace object and auth user is unchanged", async () => {
    const db = await createChainDb();
    const marketplace = await nonLearningCatalog(db);
    const users = await usersHash(db);
    await db.exec(rollback);
    expect(await learningLeft(db)).toBe(0);
    expect(await nonLearningCatalog(db)).toEqual(marketplace);
    expect(await usersHash(db)).toBe(users);
    await db.close();
  });
});
