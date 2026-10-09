import { readFileSync } from "node:fs";
import path from "node:path";
import type { ServiceDb } from "./db";
import { fromDbMessage } from "./errors";

/** The roles / default privileges Supabase provides, so the migration's grants and revokes mean the same thing locally. */
const SUPABASE_ROLES = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;
export const SERVICE_CORE_MIGRATION = "supabase/migrations/202610090040_service_core.sql";

interface LocalDb extends ServiceDb {
  close(): Promise<void>;
  /** Test / ops helper: run SQL directly (never reachable from a request). */
  sql(text: string, params?: unknown[]): Promise<unknown[]>;
}

/**
 * LOCAL ONLY (APP_ENV local / test): the real migration on an embedded Postgres (PGlite) in this process. Never selected in
 * production (see runtime.ts). The package is loaded through a computed specifier so no bundler (and above all not the Cloudflare
 * Worker build) ever pulls it - or its WASM - into a deployable.
 */
export async function createLocalDb(root = process.cwd()): Promise<LocalDb> {
  // The specifier is only known at run time (a function argument), so no bundler can follow it; `new Function` additionally hides the
  // import from the Turbopack / esbuild constant folding. Under vitest the plain import keeps module resolution working.
  const load = (process.env.VITEST
    ? (specifier: string) => import(/* @vite-ignore */ specifier)
    : new Function("specifier", "return import(specifier)")) as (specifier: string) => Promise<typeof import("@electric-sql/pglite")>;
  const { PGlite } = await load(["@electric-sql", "pglite"].join("/"));
  const db = new PGlite();
  await db.exec(SUPABASE_ROLES);
  await db.exec(readFileSync(path.join(root, SERVICE_CORE_MIGRATION), "utf8"));
  return {
    async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
      const keys = Object.keys(args);
      if (!/^svc_[a-z_]+$/.test(fn) || keys.some((k) => !/^p_[a-z_]+$/.test(k))) throw fromDbMessage("INTERNAL");
      const call = `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as v`;
      try {
        const res = await db.query<{ v: T }>(call, keys.map((k) => args[k] ?? null));
        return res.rows[0].v;
      } catch (e) {
        throw fromDbMessage(e instanceof Error ? e.message : String(e));
      }
    },
    async sql(text, params = []) {
      return (await db.query(text, params)).rows as unknown[];
    },
    close: () => db.close(),
  };
}
