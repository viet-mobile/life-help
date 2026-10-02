import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy as current } from "@/proxy";
import { proxy as baseline } from "./../fixtures/proxy.baseline";

/**
 * Regression guard for the existing LIFE.HELP hosts. `tests/fixtures/proxy.baseline.ts`
 * is a verbatim copy of proxy.ts from `main` before the learning platform; for every
 * non-learning request the current proxy must behave identically.
 */
const SNAPSHOT_HEADERS = ["x-middleware-rewrite", "location", "x-life-country", "x-life-language", "x-life-portal",
  "x-middleware-request-x-life-country", "x-middleware-request-x-life-language", "x-middleware-request-x-life-portal", "x-middleware-next"];

async function snap(fn: typeof current, host: string, path: string) {
  const res = await fn(new NextRequest(`https://${host}${path}`, { headers: { host } }));
  return { status: res.status, headers: Object.fromEntries(SNAPSHOT_HEADERS.map((h) => [h, res.headers.get(h)])) };
}

const HOSTS = ["life.help", "korea.life.help", "vietnam.life.help", "japan.life.help", "taiwan.life.help", "us.life.help",
  "tech.life.help", "tech.korea.life.help", "chat.life.help", "chat.vietnam.life.help", "sys.life.help", "sys.korea.life.help",
  "register-device.life.help", "turkey.life.help", "spain.life.help", "unknown.life.help", "life-help.example.workers.dev", "localhost:3000"];
// /favicon.ico is covered in brand.test.ts: it is the one deliberate difference (existing hosts are pinned to the generic favicon that production serves).
const PATHS = ["/", "/vi", "/ko/services/ac", "/login", "/admin", "/tech/workspace", "/chat/counselor", "/api/review", "/manifest.webmanifest", "/sys", "/payment"];

describe("existing hostnames are unaffected by the learning platform", () => {
  afterEach(() => vi.unstubAllEnvs());
  for (const host of HOSTS) {
    it(`${host}`, async () => {
      for (const path of PATHS) {
        expect(await snap(current, host, path), `${host}${path}`).toEqual(await snap(baseline, host, path));
      }
    });
  }
});

describe("learning hosts and production guard", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rewrites learn hostnames to /study/<site>", async () => {
    const r = await snap(current, "math.life.help", "/dashboard");
    expect(r.headers["x-middleware-rewrite"]).toContain("/study/math/dashboard");
    expect(r.headers["x-middleware-request-x-life-portal"]).toBe("learn");
    const s = await snap(current, "english-staging.life.help", "/");
    expect(s.headers["x-middleware-rewrite"]).toContain("/study/english");
  });

  it("serves /study/* paths on any host outside production (workers.dev staging)", async () => {
    vi.stubEnv("APP_ENV", "staging");
    const r = await snap(current, "life-help-staging.acct.workers.dev", "/study/math/dashboard");
    expect(r.status).toBe(200);
    expect(r.headers["x-middleware-request-x-life-portal"]).toBe("learn");
  });

  it("returns 404 for /study/* on existing production hosts (no exposure of learning pages)", async () => {
    vi.stubEnv("APP_ENV", "production");
    for (const host of ["korea.life.help", "life.help", "sys.life.help", "x.workers.dev"]) {
      expect((await snap(current, host, "/study/math")).status, host).toBe(404);
      expect((await snap(current, host, "/study")).status, host).toBe(404);
    }
    // ...while the learning hostnames themselves keep working.
    expect((await snap(current, "math.life.help", "/")).status).toBe(200);
  });
});
