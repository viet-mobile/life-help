/* eslint-disable @typescript-eslint/no-explicit-any -- untyped SQL rows */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LEARNING_CHAIN, apply, newBase } from "../learn/chainDb";
import { resolveAccess } from "@/lib/learn/domain/access";
import { LearnService } from "@/lib/learn/server/service";
import { SupabaseLearnStore } from "@/lib/learn/server/supabaseStore";
import { classify, type Evidence } from "../staging/entitlementDiagnostics";

/**
 * Why can a granted entitlement still leave the premium lesson locked on staging? This file traces the whole path locally and pins the
 * facts: the fixture write (null/null), the Worker's read (the REAL SupabaseLearnStore + LearnService on the REAL migration), the identity the
 * server uses, caching, scope matching and environment sources - and classifies the failure modes A..G the browser spec can report.
 */
const U = "10000000-0000-4000-8000-0000000000f1";
const OTHER = "10000000-0000-4000-8000-0000000000f2";
const src = (f: string) => readFileSync(f, "utf8");
const day = 86_400_000;

describe("fixture write path and the Worker read path (real RPC, real store, real service)", () => {
  let pg: PGlite;
  /** a Supabase-js look-alike that answers .from(t).select(cols).eq(col, v) with the real table in PGlite (what the service key sees) */
  const client = () =>
    ({
      from: (t: string) => ({ select: (cols: string) => ({ eq: async (c: string, v: string) => ({ data: (await pg.query(`select ${cols} from public.${t} where ${c} = $1`, [v])).rows, error: null }) }) }),
    }) as unknown as SupabaseClient;
  const service = () => new LearnService({ store: new SupabaseLearnStore(client()) });
  const grant = async (user: string, scope: string, start: string | null, end: string | null) =>
    (await pg.query<{ id: string }>("select public.learn_grant_entitlement($1, $2, 'grant', $3, $4, 'STG-test') id", [user, scope, start, end])).rows[0].id;

  beforeAll(async () => {
    pg = await newBase();
    await apply(pg, LEARNING_CHAIN);
    await pg.query("insert into auth.users(id) values ($1), ($2)", [U, OTHER]);
  }, 120_000);
  afterAll(async () => { await pg.close(); });

  it("null/null means: starts now (stamped by the DATABASE clock), never expires, not revoked, scoped to the site passed", async () => {
    const id = await grant(U, "math", null, null);
    const row = (await pg.query<any>("select user_id, scope, source, starts_at, expires_at, revoked_at from public.learn_entitlements where id = $1", [id])).rows[0];
    expect([row.user_id, row.scope, row.source, row.expires_at, row.revoked_at]).toEqual([U, "math", "grant", null, null]);
    expect(Math.abs(new Date(row.starts_at).getTime() - Date.now())).toBeLessThan(10_000);
    const store = new SupabaseLearnStore(client());
    const records = await store.getEntitlements(U);
    expect(records).toEqual([{ scope: "math", source: "grant", startsAt: new Date(row.starts_at).toISOString() === records[0].startsAt ? records[0].startsAt : row.starts_at, expiresAt: null, revokedAt: null }]);
    // the Worker's decision, on the real service path
    const svc = service();
    expect((await svc.getAccess({ userId: U }, "math")).tier).toBe("PREMIUM");
    expect((await svc.getAccess({ userId: U }, "english")).tier).toBe("FREE"); // scope is authoritative: math does not open english
    expect((await svc.getAccess({ userId: U }, "korean")).tier).toBe("FREE");
  });

  it("the entitlement belongs to ONE identity: another signed-in user and a guest (even with forged premium flags) stay FREE", async () => {
    const svc = service();
    expect((await svc.getAccess({ userId: OTHER }, "math")).tier).toBe("FREE");
    expect((await svc.getAccess({ userId: null, guestState: { premium: true, tier: "PREMIUM", access: { tier: "PREMIUM", status: "active" } } }, "math")).tier).toBe("FREE");
  });

  it("wildcard 'all' covers every site; revoke and expiry lock again; a future start does not unlock yet", async () => {
    const svc = service();
    const all = await grant(OTHER, "all", null, null);
    for (const site of ["math", "english", "korean"] as const) expect((await svc.getAccess({ userId: OTHER }, site)).tier, site).toBe("PREMIUM");
    await pg.query("select public.learn_revoke_entitlement($1)", [all]);
    expect((await svc.getAccess({ userId: OTHER }, "math")).tier).toBe("FREE");
    const user3 = "10000000-0000-4000-8000-0000000000f3";
    await pg.query("insert into auth.users(id) values ($1)", [user3]);
    await grant(user3, "english", new Date(Date.now() - 2 * day).toISOString(), new Date(Date.now() - day).toISOString());
    expect(await svc.getAccess({ userId: user3 }, "english")).toMatchObject({ tier: "FREE", status: "expired" });
    await grant(user3, "math", new Date(Date.now() + day).toISOString(), null);
    expect((await svc.getAccess({ userId: user3 }, "math")).tier).toBe("FREE");
  });

  it("clock note: starts_at comes from the database; only a Worker clock BEHIND the database by more than the test delay could keep a fresh grant locked", () => {
    const startsAt = new Date("2026-10-11T12:00:00.000Z").toISOString();
    const rec = [{ scope: "math" as const, source: "grant" as const, startsAt, expiresAt: null, revokedAt: null }];
    expect(resolveAccess(rec, "math", new Date("2026-10-11T12:00:00.500Z")).tier).toBe("PREMIUM");
    expect(resolveAccess(rec, "math", new Date("2026-10-11T11:59:59.000Z")).tier).toBe("FREE");
  });

  it("every call re-reads the stored entitlement (no per-service cache): a grant after a first FREE answer is seen immediately", async () => {
    const svc = service();
    const u = "10000000-0000-4000-8000-0000000000f4";
    await pg.query("insert into auth.users(id) values ($1)", [u]);
    expect((await svc.getAccess({ userId: u }, "math")).tier).toBe("FREE");
    await grant(u, "math", null, null);
    expect((await svc.getAccess({ userId: u }, "math")).tier).toBe("PREMIUM");
  });
});

describe("browser identity, server authority, caching, environment (source facts)", () => {
  it("the premium decision uses the SERVER session identity (Supabase auth cookie -> auth.getUser), never client state", () => {
    const page = src("app/study/[site]/(play)/lesson/[lessonId]/page.tsx");
    expect(page).toContain("svc.getAccess({ userId: await getUserId() }, site)");
    expect(page).not.toMatch(/searchParams|localStorage|learn_lang/);
    const runtime = src("lib/learn/server/runtime.ts");
    expect(runtime).toMatch(/createLearnSessionClient\(\)[\s\S]*auth\.getUser\(\)/);
    expect(runtime).toContain("user?.id ?? null");
    const svc = src("lib/learn/server/service.ts");
    expect(svc).toMatch(/if \(!actor\.userId \|\| !this\.deps\.store\) return FREE_ACCESS;/);
  });
  it("the Worker reads entitlements with the SERVICE (secret) client of the LEARNING project, filtered by the session user id", () => {
    const store = src("lib/learn/server/supabaseStore.ts");
    expect(store).toMatch(/from\("learn_entitlements"\)\.select\("scope, source, starts_at, expires_at, revoked_at"\)\.eq\("user_id", userId\)/);
    expect(src("lib/learn/server/runtime.ts")).toContain("createLearnServiceClient()");
  });
  it("environment: learning server code reads ONLY LEARN_* / EXPECTED_LEARN_* (+ APP_ENV, NODE_ENV, content source); no generic Supabase fallback", () => {
    const walk = (d: string, out: string[] = []): string[] => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(n)) out.push(p); } return out; };
    const names = new Set<string>();
    for (const f of [...walk("lib/learn/server"), "lib/env.ts"]) for (const m of src(f).matchAll(/(?:process\.env|env)\.([A-Z][A-Z0-9_]+)/g)) names.add(m[1]);
    const allowed = new Set(["LEARN_SUPABASE_URL", "LEARN_SUPABASE_PUBLISHABLE_KEY", "LEARN_SUPABASE_SECRET_KEY", "EXPECTED_LEARN_SUPABASE_REF", "LEARN_CONTENT_SOURCE", "APP_ENV", "NODE_ENV", "VITEST"]);
    for (const n of names) expect(allowed.has(n), `${n} is read by the learning server`).toBe(true);
    for (const forbidden of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]) expect(names.has(forbidden), forbidden).toBe(false);
    expect(src("lib/learn/server/supabase/config.ts")).toContain("return null; // cross-wired project");
    expect(src("proxy.ts")).toContain("updateLearnSession"); // the learning session helper (LEARN_* only) refreshes the session cookie for learning hosts / paths
  });
  it("caching: the lesson page is dynamic (reads the session cookie), with no static/revalidate configuration anywhere under /study", () => {
    const walk = (d: string, out: string[] = []): string[] => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(n)) out.push(p); } return out; };
    for (const f of walk("app/study")) expect(src(f), f).not.toMatch(/export const (revalidate|dynamic)\s*=\s*['"0-9]*(force-static|[1-9])/);
    expect(src("lib/learn/server/supabase/session.ts")).toMatch(/cookies\(\)/);
  });
  it("site scope key: the entitlement scope, the route segment and the query use the same canonical site names", () => {
    expect(src("lib/learn/domain/access.ts")).toContain('scope: "all" | "math" | "english" | "korean"');
    expect(src("supabase/migrations/202610080029_learning_entitlements.sql")).toContain("scope in ('all', 'math', 'english', 'korean')");
    expect(src("lib/learn/types.ts")).toMatch(/SITES = \["math", "english", "korean"\]/);
  });
});

describe("the staging spec itself", () => {
  const spec = src("tests/staging/entitlement.staging.spec.ts");
  it("the sign-in wait cannot be satisfied by the login page itself (the cause that fits the observed failure)", () => {
    // the old wait: any URL under /study/<site>, which the login page's own URL already is
    expect(new RegExp("/study/math").test("https://life-help-staging.simpl2eye.workers.dev/study/math/login")).toBe(true);
    expect(spec).not.toMatch(/waitForURL\(new RegExp\(`\/study\/\$\{site\}`\)\)/);
    expect(spec).toMatch(/toHaveURL\(learnUrl\(site, "\/dashboard"\)/);
    expect(spec).toContain("signed in: Supabase session cookie present");
    expect(spec).toContain("the browser is signed in as the fixture user"); // onboarding wrote a profile row for THIS user
  });
  it("grant() reads the stored row back and checks user, scope and not-revoked; failures print safe evidence only", () => {
    expect(spec).toContain("the entitlement row exists");
    expect(spec).toContain("stored for the fixture user, with the requested scope, not revoked");
    expect(spec).toContain("describeEvidence(e)");
    expect(spec).not.toMatch(/console\.log|JSON\.stringify\(cookies|c\.value\)(?!\.)/);
  });
  it("classifier: A grant missing, B not signed in, C wrong scope, F identity changed, E stale page, D worker read empty", () => {
    const ok: Evidence = { expectedScope: "math", grantRows: 1, grantScope: "math", grantActive: true, sessionCookie: true, profileRow: true, gateVisible: true, cacheControl: "private, no-cache, no-store, max-age=0, must-revalidate", identityStable: true };
    expect(classify({ ...ok, gateVisible: false })).toBe("OK");
    expect(classify({ ...ok, grantRows: 0, grantScope: null, grantActive: false })).toBe("A_GRANT_NOT_CREATED");
    expect(classify({ ...ok, sessionCookie: false })).toBe("B_BROWSER_NOT_SIGNED_IN_AS_FIXTURE");
    expect(classify({ ...ok, profileRow: false })).toBe("B_BROWSER_NOT_SIGNED_IN_AS_FIXTURE");
    expect(classify({ ...ok, grantScope: "english" })).toBe("C_GRANT_FOR_WRONG_SCOPE");
    expect(classify({ ...ok, grantScope: "all" })).toBe("D_WORKER_READ_RETURNS_NO_ENTITLEMENT");
    expect(classify({ ...ok, identityStable: false })).toBe("F_IDENTITY_CHANGED");
    expect(classify({ ...ok, cacheControl: "public, s-maxage=60" })).toBe("E_STALE_CACHED_PAGE");
    expect(classify(ok)).toBe("D_WORKER_READ_RETURNS_NO_ENTITLEMENT");
  });
});
