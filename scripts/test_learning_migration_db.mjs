// Deterministic test of the learning migrations (202609300023 shim, 024, 025, 026) in PGlite. Runs the SAME behavioural gate
// (scripts/lib/learningGate.mjs) that scripts/test_learning_migration_staging.mjs runs against the live staging project, with
// the API roles exercised through SET ROLE + a JWT subject (as PostgREST does), on three databases:
//   A  production-now : empty Supabase base (+1 existing auth user) -> 023 -> 024 -> 025 -> 026   (no marketplace schema at all)
//   B  staging-like   : the full real chain (marketplace 0001-0023, then 023 .. 026)
//   D  future rollout : A, THEN the real marketplace 0001-0023
// Usage: node scripts/test_learning_migration_db.mjs
import crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { MIGRATIONS, sqlOf, checker } from "./lib/learningTestKit.mjs";
import { LEARN_TABLES, learningGate } from "./lib/learningGate.mjs";

const { check, done } = checker();
const LEARNING = MIGRATIONS.filter((f) => /^\d+_learning_/.test(f));
const MARKETPLACE = MIGRATIONS.filter((f) => !LEARNING.includes(f));
const EXISTING_USER = "00000000-0000-4000-8000-0000000000aa";

// Supabase defaults reproduced: roles, auth.uid() from the JWT subject, default privileges to the API roles, service_role bypasses RLS.
const STUB = `create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
  create table auth.users (id uuid primary key, email text, raw_app_meta_data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role; grant execute on function auth.uid() to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  insert into auth.users (id, email, created_at, updated_at) values ('${EXISTING_USER}', 'existing@example.test', '2026-09-12T00:00:00Z', '2026-09-12T00:00:00Z');`;

async function build(files) {
  const db = new PGlite();
  await db.exec(STUB);
  for (const f of files) await db.exec(sqlOf(f));
  return db;
}
const CHAINS = [
  ["A production-now (023 -> 024 -> 025 -> 026 on an empty base)", () => build(LEARNING), { marketplace: false }],
  ["B staging-like (marketplace 0001-0023 -> 023 -> 024 -> 025 -> 026)", () => build(MIGRATIONS), { marketplace: true }],
  ["D future rollout (023 -> 026, THEN marketplace 0001-0023)", () => build([...LEARNING, ...MARKETPLACE]), { marketplace: true }],
];

for (const [label, make, { marketplace }] of CHAINS) {
  console.log(`\n=== CHAIN ${label}`);
  const db = await make();
  const usersBefore = (await db.query("select md5(string_agg(t::text, '|' order by id)) h from auth.users t")).rows[0].h;
  const roleOf = (actor) => (actor === "anon" ? "anon" : actor === "service" ? "service_role" : "authenticated");
  const param = (v) => (v !== null && typeof v === "object" ? JSON.stringify(v) : v);
  const cast = (v, i) => (v !== null && typeof v === "object" ? `$${i}::jsonb` : `$${i}`);
  async function run(actor, sql, params = []) {
    await db.exec(`set role ${roleOf(actor)}; select set_config('request.jwt.claim.sub', '${actor && actor.id ? actor.id : ""}', false);`);
    try { return { status: "ok", result: await db.query(sql, params) }; }
    catch (error) { return { status: error.code === "42501" ? "denied" : "error", message: String(error.message).slice(0, 200) }; }
    finally { await db.exec("reset role"); }
  }
  const where = (filter, start = 1) => { const keys = Object.keys(filter); return { sql: keys.length ? ` where ${keys.map((k, i) => `${k} = $${start + i}`).join(" and ")}` : "", params: keys.map((k) => filter[k]) }; };
  const rowsOf = (r) => (r.status === "ok" ? { status: "ok", rows: r.result.rows } : r);
  const created = [];
  const backend = {
    select: async (actor, table, filter = {}, { limit } = {}) => { const w = where(filter); return rowsOf(await run(actor, `select * from public.${table}${w.sql}${limit ? ` limit ${limit}` : ""}`, w.params)); },
    insert: async (actor, table, row) => {
      const keys = Object.keys(row);
      const sql = keys.length ? `insert into public.${table} (${keys.join(", ")}) values (${keys.map((k, i) => cast(row[k], i + 1)).join(", ")}) returning *` : `insert into public.${table} default values returning *`;
      return rowsOf(await run(actor, sql, keys.map((k) => param(row[k]))));
    },
    update: async (actor, table, set, filter) => {
      const keys = Object.keys(set), w = where(filter, keys.length + 1);
      return rowsOf(await run(actor, `update public.${table} set ${keys.map((k, i) => `${k} = ${cast(set[k], i + 1)}`).join(", ")}${w.sql} returning *`, [...keys.map((k) => param(set[k])), ...w.params]));
    },
    del: async (actor, table, filter) => { const w = where(filter); return rowsOf(await run(actor, `delete from public.${table}${w.sql} returning *`, w.params)); },
    rpc: async (actor, fn, args) => {
      const keys = Object.keys(args);
      const r = await run(actor, `select public.${fn}(${keys.map((k, i) => `${k} => ${cast(args[k], i + 1)}`).join(", ")}) as r`, keys.map((k) => param(args[k])));
      return r.status === "ok" ? { status: "ok", data: r.result.rows[0].r } : r;
    },
    createUser: async (userLabel) => { const id = crypto.randomUUID(); await db.query("insert into auth.users (id) values ($1)", [id]); created.push(id); return { id, token: id, label: userLabel }; },
    // Learning staff = a row in learn_staff_users, granted by the database owner (the API roles cannot write it).
    makeStaff: async (user) => { await db.query("insert into public.learn_staff_users (user_id, role, note) values ($1, 'EDITOR', 'gate fixture')", [user.id]); },
    catalog: async (sql) => (await db.query(sql)).rows,
    purge: async () => { await db.query("delete from auth.users where id = any($1::uuid[])", [created]); },
  };

  await learningGate(backend, {
    expect: (name, condition, detail) => check(`[${label[0]}] ${name}`, !!condition, detail),
    notTestable: (name, reason) => console.log(`NOT_TESTABLE [${label[0]}] ${name} (${reason})`),
  });

  // Purge proof + untouched-data proof.
  const left = [];
  for (const t of [...LEARN_TABLES, "learn_staff_users"]) { const n = (await db.query(`select count(*)::int n from public.${t}`)).rows[0].n; if (n) left.push(`${t}=${n}`); }
  check(`[${label[0]}] PURGE. every learn_* fixture row (student progress and staff grants by Auth-user cascade, content by the staff fixture) is removed`, left.length === 0, left);
  const usersAfter = (await db.query("select md5(string_agg(t::text, '|' order by id)) h from auth.users t")).rows[0].h;
  check(`[${label[0]}] the pre-existing auth user row is byte-identical after the whole gate`, usersAfter === usersBefore);
  if (marketplace) check(`[${label[0]}] no admin_audit_logs / immutable rows were created by the gate`, (await db.query("select count(*)::int n from public.admin_audit_logs")).rows[0].n === 0);
  else {
    check(`[${label[0]}] the empty base got NO marketplace objects (no public table outside learn_*, no app_role, no security schema)`,
      (await db.query("select count(*)::int n from pg_tables where schemaname = 'public' and tablename not like 'learn\\_%'")).rows[0].n === 0
      && (await db.query("select to_regtype('public.app_role') t, to_regnamespace('security') s")).rows[0].t === null
      && (await db.query("select to_regnamespace('security') s")).rows[0].s === null);
  }
  await db.close();
}
done();
