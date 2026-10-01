import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { describe, expect, it } from "vitest";

/**
 * Proves the exact migration order for a brand-new Supabase project, with ONLY Supabase's own
 * `auth` schema and roles stubbed (everything else must come from this repo's migrations).
 */
const root = path.join(__dirname, "../..");
const mig = (f: string) => readFileSync(path.join(root, "supabase/migrations", f), "utf8");
const allMigrations = readdirSync(path.join(root, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
const seed = readFileSync(path.join(root, "supabase/seed/learn_demo.staging-run.sql"), "utf8");
const marker = readFileSync(path.join(root, "supabase/verify/staging_marker.sql"), "utf8");
const verify = readFileSync(path.join(root, "supabase/verify/learn_staging_verify.sql"), "utf8");

const SUPABASE_STUB = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
`;

async function fresh() {
  // pgcrypto is available on every Supabase project; PGlite needs it loaded explicitly.
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_STUB);
  return db;
}
async function verdict(db: PGlite) {
  const r = await db.query<{ ord: number; check_name: string; ok: boolean; detail: string }>(verify.replace(/;\s*$/, ""));
  return r.rows;
}

describe("migration order for a new staging project", { timeout: 60_000 }, () => {
  it("the migrations in the repo are exactly these four, in this order", () => {
    expect(allMigrations).toEqual([
      "202609120001_initial_marketplace_schema.sql",
      "202609120002_payment_settlement_upgrade.sql",
      "202609300001_learning_platform.sql",
      "202609300002_learning_content_rpc.sql",
    ]);
  });

  it("the learning migrations alone do NOT apply (they depend on the marketplace schema)", async () => {
    const db = await fresh();
    await expect(db.exec(mig("202609300001_learning_platform.sql"))).rejects.toThrow(/security|has_role|app_role/);
    await db.close();
  });

  it("all four apply cleanly in order on an empty project", async () => {
    const db = await fresh();
    for (const f of allMigrations) await db.exec(mig(f));
    const n = await db.query<{ n: string }>("select count(*)::text n from pg_tables where schemaname='public' and tablename like 'learn\\_%'");
    expect(Number(n.rows[0].n)).toBe(24);
    await db.close();
  });
});

describe("demo seed guard (marker + opt-in)", { timeout: 60_000 }, () => {
  it("is refused without the staging marker even when opted in, and without opt-in even with the marker", async () => {
    const db = await fresh();
    for (const f of allMigrations) await db.exec(mig(f));
    await expect(db.exec(seed)).rejects.toThrow(/no staging marker/);
    await db.exec("rollback").catch(() => {});
    await db.exec(marker);
    const noOptIn = seed.replace("set app.allow_demo_seed = 'on';", "");
    await expect(db.exec(noOptIn)).rejects.toThrow(/set app.allow_demo_seed/);
    await db.exec("rollback").catch(() => {});
    await db.exec(seed);
    const q = await db.query<{ n: string }>("select count(*)::text n from public.learn_questions");
    expect(Number(q.rows[0].n)).toBeGreaterThanOrEqual(40);
    await db.close();
  });

  it("the marker table is invisible to students and never created by migrations", async () => {
    const db = await fresh();
    for (const f of allMigrations) expect(mig(f)).not.toContain("learn_seed_allowed");
    for (const f of allMigrations) await db.exec(mig(f));
    await db.exec(marker);
    await db.exec("set role authenticated");
    await expect(db.query("select * from public.learn_seed_allowed")).rejects.toThrow();
    await db.close();
  });
});

describe("read-only staging verification script", { timeout: 60_000 }, () => {
  it("is green on a correctly migrated + seeded + marked database", async () => {
    const db = await fresh();
    for (const f of allMigrations) await db.exec(mig(f));
    await db.exec(marker);
    await db.exec(seed);
    const rows = await verdict(db);
    expect(rows.filter((r) => !r.ok).map((r) => `${r.check_name} :: ${r.detail}`)).toEqual([]);
    expect(rows[rows.length - 1]).toMatchObject({ check_name: "OVERALL", ok: true, detail: "ALL GREEN" });
    expect(rows.length).toBe(21);
    await db.close();
  });

  it("does not modify anything (row/table counts identical before and after)", async () => {
    const db = await fresh();
    for (const f of allMigrations) await db.exec(mig(f));
    await db.exec(marker);
    await db.exec(seed);
    const snap = async () => (await db.query("select (select count(*) from public.learn_questions) q, (select count(*) from public.learn_xp_ledger) x, (select count(*) from pg_class) c")).rows[0];
    const before = await snap();
    await verdict(db);
    expect(await snap()).toEqual(before);
    await db.close();
  });

  it("goes red when something is wrong: unseeded DB, disabled RLS, missing marker", async () => {
    const db = await fresh();
    for (const f of allMigrations) await db.exec(mig(f));
    let rows = await verdict(db);
    const failed = rows.filter((r) => !r.ok).map((r) => r.check_name);
    expect(failed).toEqual(expect.arrayContaining(["math curriculum published (4 lessons)", "staging marker present (this is the staging database)"]));
    expect(rows[rows.length - 1].ok).toBe(false);
    await db.exec(marker);
    await db.exec(seed);
    await db.exec("alter table public.learn_xp_ledger disable row level security");
    rows = await verdict(db);
    expect(rows.find((r) => r.check_name.startsWith("RLS enabled"))?.ok).toBe(false);
    await db.exec("alter table public.learn_xp_ledger enable row level security");
    await db.exec("grant insert on public.learn_xp_ledger to authenticated");
    rows = await verdict(db);
    expect(rows.find((r) => r.check_name.startsWith("authenticated cannot write"))?.ok).toBe(false);
    await db.close();
  });
});
