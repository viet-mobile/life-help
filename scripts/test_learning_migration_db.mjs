// Deterministic test of migrations 202609300024 / 202609300025 (learning platform) on the REAL migration chain in
// PGlite. Runs the SAME behavioural gate (scripts/lib/learningGate.mjs) that scripts/test_learning_migration_staging.mjs
// runs against the live staging project, with the API roles exercised through SET ROLE + a JWT subject (as PostgREST does).
// Usage: node scripts/test_learning_migration_db.mjs
import crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { MIGRATIONS, sqlOf, checker } from "./lib/prepayFixtures.mjs";
import { LEARN_TABLES, learningGate } from "./lib/learningGate.mjs";

const { check, done } = checker();
const db = new PGlite();
// Supabase defaults reproduced: roles, auth.uid() from the JWT subject, default privileges to the API roles, service_role bypasses RLS.
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role; grant execute on function auth.uid() to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`);
for (const f of MIGRATIONS) await db.exec(sqlOf(f));

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
  createUser: async (label) => { const id = crypto.randomUUID(); await db.query("insert into auth.users (id) values ($1)", [id]); created.push(id); return { id, token: id, label }; },
  makeStaff: async (user) => {
    await db.query("insert into public.profiles (id, display_name) values ($1, 'gate staff')", [user.id]);
    await db.query("insert into public.user_roles (user_id, role) values ($1, 'STAFF')", [user.id]);
  },
  catalog: async (sql) => (await db.query(sql)).rows,
  purge: async () => { await db.query("delete from auth.users where id = any($1::uuid[])", [created]); },
};

await learningGate(backend, {
  expect: (name, condition, detail) => check(name, !!condition, detail),
  notTestable: (name, reason) => console.log(`NOT_TESTABLE ${name} (${reason})`),
});

// Purge proof: every fixture is gone, nothing immutable was needed.
const left = [];
for (const t of LEARN_TABLES) { const n = (await db.query(`select count(*)::int n from public.${t}`)).rows[0].n; if (n) left.push(`${t}=${n}`); }
check("PURGE. every learn_* fixture row (student progress by Auth-user cascade, content by the staff fixture) is removed", left.length === 0, left);
check("PURGE. no admin_audit_logs / immutable rows were created by the gate", (await db.query("select count(*)::int n from public.admin_audit_logs")).rows[0].n === 0);
done();
