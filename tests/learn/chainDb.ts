import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Builds a PGlite database from the REAL LIFE.HELP migration chain (every file in supabase/migrations, in order),
 * with only Supabase's own roles and `auth` schema stubbed. Learning tests therefore run on top of the latest
 * marketplace / payment / audit schema and its grants, exactly as the migrations will on the staging project.
 * Local only: no network, no remote database.
 */
export const root = path.join(__dirname, "../..");
export const MIGRATIONS = readdirSync(path.join(root, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
export const LEARN_MIGRATIONS = MIGRATIONS.filter((f) => /^\d+_learning_/.test(f));
export const sqlOf = (f: string) =>
  readFileSync(path.join(root, "supabase/migrations", f), "utf8").replace(/create extension if not exists pgcrypto[^;]*;/gi, "");

export const SUPABASE_STUB = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
`;

export async function createChainDb({ until }: { until?: string } = {}) {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  for (const f of MIGRATIONS.filter((m) => !until || m < until)) await db.exec(sqlOf(f));
  return db;
}

export const demoSeed = () => readFileSync(path.join(root, "supabase/seed/learn_demo.sql"), "utf8");
