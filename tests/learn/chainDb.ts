import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Builds PGlite databases from the REAL migration files, with only Supabase's own roles, default privileges and `auth` schema
 * stubbed. Learning tests therefore run on top of the actual marketplace / payment / audit schema (staging-like chains) or on
 * an empty Supabase-compatible base (production-like chains). Local only: no network, no remote database.
 */
export const root = path.join(__dirname, "../..");
export const MIGRATIONS = readdirSync(path.join(root, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
export const LEARN_MIGRATIONS = MIGRATIONS.filter((f) => /^\d+_learning_/.test(f));
export const SHIM = "202609300023_learning_prereq_shim.sql";
export const M024 = "202609300024_learning_platform.sql";
export const M025 = "202609300025_learning_content_rpc.sql";
export const M026 = "202609300026_learning_selfcontained_auth.sql";
export const M027 = "202609300027_learning_elementary_grades.sql";
export const LEARNING_CHAIN = [SHIM, M024, M025, M026, M027];
export const MARKETPLACE_FILES = MIGRATIONS.filter((f) => !LEARN_MIGRATIONS.includes(f));
export const sqlOf = (f: string) =>
  readFileSync(path.join(root, "supabase/migrations", f), "utf8").replace(/create extension if not exists pgcrypto[^;]*;/gi, "");

/** sha256 of a migration file, line endings normalised to LF (a CRLF checkout must not change the pin). */
export const sha256Of = (f: string) =>
  createHash("sha256").update(readFileSync(path.join(root, "supabase/migrations", f), "utf8").replace(/\r\n/g, "\n")).digest("hex");

/**
 * Supabase as the migrations see it: API roles (service_role bypasses RLS), auth.uid() from the JWT subject, and the default
 * privileges Supabase grants the API roles on every new public object (the very thing the authority migrations revoke).
 * auth.users is a minimal stand-in with the columns a "data untouched" check needs.
 */
export const SUPABASE_STUB = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_app_meta_data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role; grant execute on function auth.uid() to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;
/** The one pre-existing production Auth user (fixed values so before/after hashes are comparable). */
export const EXISTING_USER = "00000000-0000-4000-8000-0000000000aa";

/** Empty production-compatible base: Supabase stub plus the single existing auth user. */
export async function newBase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  await db.query("insert into auth.users (id, email, created_at, updated_at) values ($1, 'existing@example.test', '2026-09-12T00:00:00Z', '2026-09-12T00:00:00Z')", [EXISTING_USER]);
  return db;
}
export async function apply(db: PGlite, files: string[]) {
  for (const f of files) await db.exec(sqlOf(f));
}
/** Hash of every auth.users row (id + all columns): proves the migrations changed no existing user row. */
export async function usersHash(db: PGlite): Promise<string> {
  return (await db.query<{ h: string }>("select md5(coalesce(string_agg(t::text, '|' order by id), '')) h from auth.users t")).rows[0].h;
}

/** Staging-like chain: every migration file in order (marketplace 0001-0023, then the learning migrations). */
export async function createChainDb({ until }: { until?: string } = {}) {
  const db = await newBase();
  await apply(db, MIGRATIONS.filter((m) => !until || m < until));
  return db;
}

/** Catalog snapshot of everything that is NOT part of the learning platform (to prove it is unchanged). */
export async function nonLearningCatalog(db: PGlite): Promise<string[]> {
  const q = async (sql: string) => (await db.query<{ x: string }>(sql)).rows.map((r) => r.x);
  return [
    ...(await q(`select 'class ' || n.nspname || '.' || c.relname || ' rls=' || c.relrowsecurity || ' acl=' || coalesce(c.relacl::text, '') as x
      from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('public', 'security') and c.relkind in ('r', 'p', 'v') and c.relname not like 'learn\\_%' order by 1`)),
    ...(await q(`select 'func ' || n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') ' || md5(p.prosrc) || ' secdef=' || p.prosecdef || ' acl=' || coalesce(p.proacl::text, '') || ' cmt=' || coalesce(obj_description(p.oid, 'pg_proc'), '') as x
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'security') and p.proname not like 'learn\\_%' order by 1`)),
    ...(await q(`select 'policy ' || tablename || '.' || policyname || ' ' || cmd || ' ' || coalesce(qual, '') || ' ' || coalesce(with_check, '') as x from pg_policies where schemaname = 'public' and tablename not like 'learn\\_%' order by 1`)),
    ...(await q(`select 'type ' || n.nspname || '.' || t.typname || ' ' || coalesce((select string_agg(e.enumlabel, ',' order by e.enumsortorder) from pg_enum e where e.enumtypid = t.oid), '') || ' cmt=' || coalesce(obj_description(t.oid, 'pg_type'), '') as x
      from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname in ('public', 'security') and t.typtype = 'e' and t.typname <> 'learn_publish_status' order by 1`)),
    ...(await q(`select 'schema ' || nspname || ' cmt=' || coalesce(obj_description(oid, 'pg_namespace'), '') as x from pg_namespace where nspname in ('security') order by 1`)),
  ];
}

export const demoSeed = () => readFileSync(path.join(root, "supabase/seed/learn_demo.sql"), "utf8");
