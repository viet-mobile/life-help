import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SCRIPT = "scripts/staging/service-core-staging.mjs";

describe("service-core staging harness (prepared, not run)", () => {
  it("lists every required gate in --plan mode without any network access", () => {
    const out = execFileSync("node", [SCRIPT, "--plan"], { encoding: "utf8", env: { PATH: process.env.PATH } as unknown as NodeJS.ProcessEnv });
    for (const g of ["request access", "revoke-all", "migration 040", "grant", "helper approval", "TRUE CONCURRENCY", "admin assign", "idempotency", "cross-device chat", "outbox", "negative authorization", "residue"]) expect(out.toLowerCase()).toContain(g.toLowerCase());
  });
  it("refuses to run without a matching project ref confirmation", () => {
    const r = spawnSync("node", [SCRIPT], { encoding: "utf8", env: { PATH: process.env.PATH, SERVICE_CORE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co", SERVICE_CORE_SUPABASE_SECRET_KEY: "x", EXPECTED_SERVICE_CORE_SUPABASE_REF: "abcdefghijklmnopqrst", SERVICE_CORE_STAGING_CONFIRM: "something-else" } as unknown as NodeJS.ProcessEnv });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("REFUSED");
  });
  it("uses a unique RUN_ID in fixtures and only deletes rows it created", () => {
    const src = readFileSync(SCRIPT, "utf8");
    expect(src).toContain("const RUN_ID");
    expect(src).not.toMatch(/\.delete\(\)\s*\.neq|\.delete\(\)\s*;/); // never an unfiltered delete
  });
});
