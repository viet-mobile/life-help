/* eslint-disable @typescript-eslint/no-explicit-any -- untyped SQL rows */
import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LEARNING_CHAIN, apply, newBase } from "../learn/chainDb";
import { LearnService } from "@/lib/learn/server/service";
import { SupabaseLearnStore } from "@/lib/learn/server/supabaseStore";
import { activeScopes, opensSite, type EntRow } from "../staging/entitlementFixture";

/**
 * Cross-site entitlement test contamination. The three per-site staging tests each END with an active regrant on the SAME fixture user, so
 * when the scope test started, English was legitimately Premium. This file reconstructs that on the real RPC / store / service and pins
 * the fix: clean baseline, math-only grant, "all", and that revoked / expired rows are history.
 */
const day = 86_400_000;
const iso = (d: number) => new Date(Date.now() + d * day).toISOString();
const row = (scope: string, over: Partial<EntRow> = {}): EntRow => ({ scope, starts_at: iso(-1), expires_at: null, revoked_at: null, ...over });

describe("fixture bookkeeping (same rule as resolveAccess)", () => {
  it("what the three per-site tests leave behind: an ACTIVE regrant for math, english and korean", () => {
    // per test: grant(site) -> revoked; grant(site, -2d..-1d) -> expired; grant(site, null, +1d) -> ACTIVE (the last step of every test)
    const perTest = (s: string): EntRow[] => [row(s, { revoked_at: iso(-0.5) }), row(s, { starts_at: iso(-2), expires_at: iso(-1) }), row(s, { expires_at: iso(1) })];
    const beforeScopeTest = [...perTest("math"), ...perTest("english"), ...perTest("korean")];
    expect(activeScopes(beforeScopeTest)).toEqual(["english", "korean", "math"]);
    // the old scope test then granted math and expected english LOCKED: it was open because of the leftover english grant
    const oldTest = [...beforeScopeTest, row("math")];
    expect(opensSite(oldTest, "english")).toBe(true); // => "Expected locked, received open", a false scope-leak signal
    expect(opensSite(oldTest, "korean")).toBe(true);
  });
  it("with every entitlement of a test revoked afterwards, the baseline is clean and the signal is real", () => {
    const revokedAfter = (rows: EntRow[]) => rows.map((r) => ({ ...r, revoked_at: r.revoked_at ?? iso(-0.1) }));
    const leftovers = revokedAfter([row("math", { expires_at: iso(1) }), row("english", { expires_at: iso(1) }), row("korean", { expires_at: iso(1) })]);
    expect(activeScopes(leftovers)).toEqual([]);
    const withMathOnly = [...leftovers, row("math")];
    expect(opensSite(withMathOnly, "math")).toBe(true);
    expect(opensSite(withMathOnly, "english")).toBe(false);
    expect(opensSite(withMathOnly, "korean")).toBe(false);
  });
  it("an isolated fixture user (its own rows) is not contaminated by another user's grants", () => {
    const userA = [row("english", { expires_at: iso(1) })];
    const userB = [row("math")];
    expect(opensSite(userA, "english")).toBe(true);
    expect(opensSite(userB, "english")).toBe(false); // B reads only B's rows
  });
  it("revoked / expired / not-yet-started rows are not contamination", () => {
    const history = [row("english", { revoked_at: iso(-1) }), row("english", { starts_at: iso(-3), expires_at: iso(-2) }), row("english", { starts_at: iso(1) })];
    expect(activeScopes(history)).toEqual([]);
    expect(opensSite(history, "english")).toBe(false);
    expect(activeScopes([...history, row("math")])).toEqual(["math"]);
  });
  it("'all' unlocks every site; a scoped grant only its own", () => {
    for (const site of ["math", "english", "korean"]) expect(opensSite([row("all")], site)).toBe(true);
    expect(["math", "english", "korean"].map((s) => opensSite([row("english")], s))).toEqual([false, true, false]);
  });
});

describe("the real RPC, store and service agree (no product scope leak)", () => {
  let pg: PGlite;
  const client = () => ({ from: (t: string) => ({ select: (cols: string) => ({ eq: async (c: string, v: string) => ({ data: (await pg.query(`select ${cols} from public.${t} where ${c} = $1`, [v])).rows, error: null }) }) }) }) as unknown as SupabaseClient;
  const svc = () => new LearnService({ store: new SupabaseLearnStore(client()) });
  const tier = async (u: string, site: "math" | "english" | "korean") => (await svc().getAccess({ userId: u }, site)).tier;
  const user = async (n: number) => { const id = `20000000-0000-4000-8000-00000000000${n}`; await pg.query("insert into auth.users(id) values ($1)", [id]); return id; };
  const grant = async (u: string, scope: string, s: string | null, e: string | null) => (await pg.query<any>("select public.learn_grant_entitlement($1, $2, 'grant', $3, $4, 'STG-test') id", [u, scope, s, e])).rows[0].id as string;
  const revoke = (id: string) => pg.query("select public.learn_revoke_entitlement($1)", [id]);

  beforeAll(async () => { pg = await newBase(); await apply(pg, LEARNING_CHAIN); }, 120_000);
  afterAll(async () => { await pg.close(); });

  it("a math grant does not unlock english or korean; english stays locked even though math is active", async () => {
    const u = await user(1);
    await grant(u, "math", null, null);
    expect(await Promise.all([tier(u, "math"), tier(u, "english"), tier(u, "korean")])).toEqual(["PREMIUM", "FREE", "FREE"]);
  });
  it("the contamination reproduced on the real service: leftover english grant => english open after a math grant (what the old test saw)", async () => {
    const u = await user(2);
    await grant(u, "english", null, iso(1)); // left active by the english full-flow test
    await grant(u, "math", null, null);      // the scope test's own grant
    expect(await tier(u, "english")).toBe("PREMIUM");
  });
  it("after the leftover is revoked (the fix: revoke everything a test created), english is locked again", async () => {
    const u = await user(3);
    const left = await grant(u, "english", null, iso(1));
    await grant(u, "math", null, null);
    await revoke(left);
    expect(await Promise.all([tier(u, "math"), tier(u, "english"), tier(u, "korean")])).toEqual(["PREMIUM", "FREE", "FREE"]);
  });
  it("an isolated user is unaffected by another user's active grants", async () => {
    const a = await user(4), b = await user(5);
    await grant(a, "all", null, null);
    expect(await Promise.all([tier(a, "math"), tier(b, "math"), tier(b, "english")])).toEqual(["PREMIUM", "FREE", "FREE"]);
  });
  it("revoked and expired english rows keep english locked; an 'all' grant opens every site", async () => {
    const u = await user(6);
    await grant(u, "english", iso(-2), iso(-1));
    await revoke(await grant(u, "english", null, null));
    expect(await Promise.all([tier(u, "math"), tier(u, "english"), tier(u, "korean")])).toEqual(["FREE", "FREE", "FREE"]);
    await grant(u, "all", null, null);
    expect(await Promise.all([tier(u, "math"), tier(u, "english"), tier(u, "korean")])).toEqual(["PREMIUM", "PREMIUM", "PREMIUM"]);
  });
});

describe("the staging spec after the fix", () => {
  const spec = readFileSync("tests/staging/entitlement.staging.spec.ts", "utf8");
  it("every test ends by revoking all active entitlements of the fixture user, pass or fail (afterEach)", () => {
    expect(spec).toContain("test.afterEach(async () => { await revokeAllActive(); });");
    expect(spec).toContain("no active entitlement left behind");
    expect(spec).toContain("await expectCleanBaseline(`${site}: free learner checks`);"); // the per-site tests also start clean
  });
  it("the scope test starts from a proven clean baseline, grants math only, and checks math / english (korean is entirely free) plus revoked-expired and 'all'", () => {
    const t = spec.slice(spec.indexOf('test("an entitlement for one site does not open another'));
    expect(t).toContain('await expectCleanBaseline("the cross-site scope checks")');
    expect(t).toContain('await grant("math", null, null)');
    expect(t).toContain('toEqual(["math"])');
    for (const needle of ["math opens with a math entitlement", "a math entitlement must not unlock english", "revoked / expired english entitlements keep english locked", 'opens with an "all" entitlement']) expect(t, needle).toContain(needle);
    expect(t.indexOf("expectCleanBaseline")).toBeLessThan(t.indexOf('grant("math"'));
    expect(t.indexOf('grant("math"')).toBeLessThan(t.indexOf("must not unlock english"));
  });
  it("the product scope rule was not touched (resolveAccess still keys on scope all|site)", () => {
    expect(readFileSync("lib/learn/domain/access.ts", "utf8")).toContain('(r.scope === "all" || r.scope === site)');
  });
});
