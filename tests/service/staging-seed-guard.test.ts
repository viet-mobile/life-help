import { describe, expect, it } from "vitest";
import { createChainDb } from "../learn/chainDb";
import { guardStagingOnly, markerSql, stagingSeedSql } from "../../scripts/staging/seed-learn-demo.mjs";
import { readFileSync } from "node:fs";

const STAGING = "wreebowcbiymodswajwe";
const PRODUCTION = "wstdbymmkrqgtsibhcjz";
const goodEnv = (over: Record<string, string> = {}) => ({
  SERVICE_CORE_SUPABASE_URL: `https://${STAGING}.supabase.co`, SERVICE_CORE_SUPABASE_SECRET_KEY: "x", EXPECTED_SERVICE_CORE_SUPABASE_REF: STAGING,
  SERVICE_CORE_STAGING_CONFIRM: STAGING, SERVICE_CORE_STAGING_ANON_KEY: "x", TEST_SUPABASE_URL: `https://${STAGING}.supabase.co`,
  TEST_SUPABASE_SERVICE_ROLE_KEY: "x", TEST_SUPABASE_ANON_KEY: "x", TEST_LIFE_HELP_SYS_ADMIN_ID: "x", TEST_LIFE_HELP_SYS_ADMIN_PASSWORD: "x", ...over,
});
const ARGS = ["--confirm-staging-seed", STAGING];

describe("guardStagingOnly", () => {
  it("accepts a complete staging environment with the confirmation on the command line", () => {
    expect(guardStagingOnly(goodEnv(), ARGS).ok).toBe(true);
  });
  it("refuses without the command-line confirmation or with a different ref", () => {
    expect(guardStagingOnly(goodEnv(), []).ok).toBe(false);
    expect(guardStagingOnly(goodEnv(), ["--confirm-staging-seed", PRODUCTION]).ok).toBe(false);
  });
  it("refuses any value that derives or contains the production ref, and an incomplete environment", () => {
    expect(guardStagingOnly(goodEnv({ TEST_SUPABASE_URL: `https://${PRODUCTION}.supabase.co` }), ARGS).ok).toBe(false);
    expect(guardStagingOnly(goodEnv({ SERVICE_CORE_SUPABASE_URL: `https://${PRODUCTION}.supabase.co` }), ARGS).ok).toBe(false);
    expect(guardStagingOnly(goodEnv({ SERVICE_CORE_STAGING_CONFIRM: PRODUCTION }), ARGS).ok).toBe(false);
    expect(guardStagingOnly(goodEnv({ TEST_SUPABASE_ANON_KEY: `x${PRODUCTION}` }), ARGS).ok).toBe(false);
    expect(guardStagingOnly({}, ARGS).ok).toBe(false);
  });
  it("refuses a production ref smuggled onto the command line", () => {
    expect(guardStagingOnly(goodEnv(), [...ARGS, PRODUCTION]).ok).toBe(false);
  });
});

describe("the emitted staging seed refuses a database without the staging marker (local PGlite)", () => {
  const seed = readFileSync("supabase/seed/learn_demo.sql", "utf8");
  it("aborts without the marker, even with the demo opt-in, and loads nothing", async () => {
    const db = await createChainDb();
    await expect(db.exec(`set app.allow_demo_seed = 'on'; ${stagingSeedSql(seed)}`)).rejects.toThrow(/no staging marker/);
    await db.exec("rollback"); // the seed opens its own transaction; a refusal leaves it aborted
    const n = await db.query<{ n: string }>("select count(*)::text n from public.learn_questions");
    expect(Number(n.rows[0].n)).toBe(0);
    await db.close();
  });
  it("loads once the marker exists, and the marker cannot be anything but staging", async () => {
    const db = await createChainDb();
    await db.exec(markerSql());
    await db.exec(markerSql()); // idempotent
    await expect(db.exec("insert into public.learn_environment_marker(ref, kind) values ('other', 'production')")).rejects.toThrow();
    await db.exec(`set app.allow_demo_seed = 'on'; ${stagingSeedSql(seed)}`);
    const n = await db.query<{ n: string }>("select count(*)::text n from public.learn_questions");
    expect(Number(n.rows[0].n)).toBeGreaterThan(1000);
    await db.close();
  });
  it("the marker table is not readable or writable by the API roles", async () => {
    const db = await createChainDb();
    await db.exec(markerSql());
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(db.query("select * from public.learn_environment_marker")).rejects.toThrow();
      await db.exec("reset role");
    }
    await db.close();
  });
  it("the plain seed still refuses without the opt-in (unchanged local guard)", async () => {
    const db = await createChainDb();
    await db.exec(markerSql());
    await expect(db.exec(stagingSeedSql(seed))).rejects.toThrow(/demo seed refused/);
    await db.close();
  });
});
