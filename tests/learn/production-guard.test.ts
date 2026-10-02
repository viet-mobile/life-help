import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { allowsLearnPathAccess, getAppEnv } from "@/lib/env";

/**
 * Regression for the failed production canary (2026-10-02): on Cloudflare Workers without `nodejs_compat_populate_process_env`
 * the runtime `process.env` does not reliably carry NODE_ENV / APP_ENV, and the old "is this production?" check read them at
 * runtime. Some isolates therefore decided "local", skipped the 404 guard and served /study/math on existing LIFE.HELP hosts.
 * The fix: the production decision comes from the BUILD-time constant (Next inlines `process.env.NODE_ENV`), path access is
 * default-deny, and these tests simulate a production-built bundle running with an EMPTY runtime environment.
 */
// `NODE_ENV` is typed read-only by Next; the tests must delete / restore it to simulate the Worker runtime.
const env = process.env as Record<string, string | undefined>;
const savedNodeEnv = env.NODE_ENV;
const savedAppEnv = env.APP_ENV;
afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  if (savedNodeEnv === undefined) delete env.NODE_ENV; else env.NODE_ENV = savedNodeEnv;
  if (savedAppEnv === undefined) delete env.APP_ENV; else env.APP_ENV = savedAppEnv;
});

describe("environment decision does not depend on the runtime environment", () => {
  it("a production BUILD is production (or its explicit APP_ENV) even when the runtime env is empty", () => {
    expect(getAppEnv({}, true)).toBe("production");
    expect(getAppEnv({ NODE_ENV: "development" }, true)).toBe("production");
    expect(getAppEnv({ APP_ENV: "bogus" }, true)).toBe("production");
    expect(getAppEnv({ APP_ENV: "staging" }, true)).toBe("staging");
    expect(getAppEnv({ APP_ENV: "STAGING" }, true)).toBe("staging");
  });
  it("a non-production build keeps the development behaviour", () => {
    expect(getAppEnv({}, false)).toBe("local");
    expect(getAppEnv({ NODE_ENV: "production" }, false)).toBe("production");
    expect(getAppEnv({ NODE_ENV: "development" }, false)).toBe("local");
  });
  it("path-based learning access is DEFAULT DENY: only explicit staging / local, or a non-production build", () => {
    for (const source of [{}, { NODE_ENV: "production" }, { APP_ENV: "production" }, { APP_ENV: "bogus" }, { APP_ENV: "" }]) {
      expect(allowsLearnPathAccess(source, true), JSON.stringify(source)).toBe(false);
    }
    expect(allowsLearnPathAccess({ APP_ENV: "staging" }, true)).toBe(true);
    expect(allowsLearnPathAccess({ APP_ENV: "local" }, true)).toBe(true);
    expect(allowsLearnPathAccess({}, false)).toBe(true); // `next dev`
    expect(allowsLearnPathAccess({ NODE_ENV: "production" }, false)).toBe(false);
    expect(allowsLearnPathAccess({ APP_ENV: "production" }, false)).toBe(false);
  });
});

/** The proxy exactly as the production Worker runs it: built for production, runtime process.env empty. */
async function proxyOnProductionWorker() {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production"); // the constant Next inlines at build time is evaluated when the module loads
  const { proxy } = await import("@/proxy");
  delete env.NODE_ENV; // ... then the Worker's runtime env holds neither NODE_ENV nor APP_ENV
  delete env.APP_ENV;
  return proxy;
}
const get = (proxy: (r: NextRequest) => Promise<Response>, host: string, path: string, method = "GET") =>
  proxy(new NextRequest(`https://${host}${path}`, { method, headers: { host } }));

describe("proxy on a production-built Worker with an EMPTY runtime environment", () => {
  it("existing LIFE.HELP hosts never expose the learning sites or API (every time, not just on some isolates)", async () => {
    const proxy = await proxyOnProductionWorker();
    const hosts = ["korea.life.help", "life.help", "tech.life.help", "chat.life.help", "sys.life.help", "vietnam.life.help", "unknown.life.help", "life-help.example.workers.dev"];
    const paths = ["/study", "/study/math", "/study/english", "/study/math/login", "/study/english/dashboard", "/api/learn/state", "/api/learn/attempt"];
    for (const host of hosts) for (const path of paths) {
      for (let i = 0; i < 3; i++) expect((await get(proxy, host, path)).status, `${host}${path}`).toBe(404);
    }
    expect((await get(proxy, "korea.life.help", "/api/learn/state", "POST")).status).toBe(404);
  });

  it("the learning hosts still work: math.life.help / english.life.help are rewritten to their site, noindex", async () => {
    const proxy = await proxyOnProductionWorker();
    for (const [host, site] of [["math.life.help", "math"], ["english.life.help", "english"]] as const) {
      const res = await get(proxy, host, "/dashboard");
      expect(res.status).toBe(200);
      expect(res.headers.get("x-middleware-rewrite") ?? "").toContain(`/study/${site}/dashboard`);
      expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
  });

  it("an explicit APP_ENV=staging still opts in to path-based access (the staging Worker)", async () => {
    const proxy = await proxyOnProductionWorker();
    env.APP_ENV = "staging";
    const res = await get(proxy, "life-help-staging.example.workers.dev", "/study/math");
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite") ?? "").toBe("");
  });
});

describe("production build: runtime NODE_ENV / APP_ENV can be anything, learning paths are ALWAYS denied on existing hosts", () => {
  const RUNTIME_NODE_ENV = [undefined, "", " ", "development", "test", "staging", "weird-value", "PRODUCTION"];
  const RUNTIME_APP_ENV = [undefined, "", "production", "PRODUCTION", "bogus", "prod", "0"];
  const HOSTS = ["life.help", "korea.life.help", "tech.life.help", "sys.life.help", "chat.life.help"];
  const PATHS = ["/study", "/study/math", "/study/english", "/study/math/login", "/study/english/login", "/api/learn/state", "/api/learn/start", "/api/learn/submit"];

  it("every runtime combination x host x path x method answers 404", async () => {
    const proxy = await proxyOnProductionWorker();
    let checked = 0;
    for (const nodeEnv of RUNTIME_NODE_ENV) for (const appEnv of RUNTIME_APP_ENV) {
      if (nodeEnv === undefined) delete env.NODE_ENV; else env.NODE_ENV = nodeEnv;
      if (appEnv === undefined) delete env.APP_ENV; else env.APP_ENV = appEnv;
      for (const host of HOSTS) for (const path of PATHS) {
        for (const method of path.startsWith("/api/learn") ? ["GET", "POST"] : ["GET"]) {
          const res = await get(proxy, host, path, method);
          expect(res.status, `NODE_ENV=${JSON.stringify(nodeEnv)} APP_ENV=${JSON.stringify(appEnv)} ${method} ${host}${path}`).toBe(404);
          expect(res.headers.get("x-middleware-rewrite") ?? "", "no rewrite to a learning page").toBe("");
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(2000);
  });

  it("only an explicit APP_ENV=staging or APP_ENV=local opts in to path-based access (case-insensitive); nothing else does", async () => {
    const proxy = await proxyOnProductionWorker();
    for (const appEnv of ["staging", "STAGING", "local", "Local"]) {
      env.APP_ENV = appEnv;
      const res = await get(proxy, "korea.life.help", "/study/math");
      expect(res.status, appEnv).toBe(200);
    }
    for (const appEnv of ["", "production", "bogus", "stagin", "staging ", "dev"]) {
      env.APP_ENV = appEnv;
      expect((await get(proxy, "korea.life.help", "/study/math")).status, JSON.stringify(appEnv)).toBe(404);
    }
  });

  it("learning hostnames keep working under every runtime environment (they do not depend on the guard)", async () => {
    const proxy = await proxyOnProductionWorker();
    for (const nodeEnv of RUNTIME_NODE_ENV) {
      if (nodeEnv === undefined) delete env.NODE_ENV; else env.NODE_ENV = nodeEnv;
      for (const host of ["math.life.help", "english.life.help"]) {
        const res = await get(proxy, host, "/");
        expect(res.status).toBe(200);
        expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      }
    }
  });
});

describe("production build: malformed / look-alike hostnames fail closed", () => {
  // Only the exact allowlisted names resolve to a learning site (lib/learn/hosts.ts); anything else is an ordinary host, so /study and /api/learn stay hidden.
  const LOOKALIKES = ["math.life.help.evil.com", "evilmath.life.help", "xmath.life.help", "math.life.help.", "math..life.help", "life.help.math.life.help", "math.evil.com", "english.life.help.attacker.example", "mathlife.help", "math.life.help.localhost", ""];
  it("a look-alike host never reaches the learning pages or API, for any method and any runtime environment", async () => {
    const proxy = await proxyOnProductionWorker();
    let checked = 0;
    for (const appEnv of [undefined, "", "production", "bogus"]) {
      if (appEnv === undefined) delete env.APP_ENV; else env.APP_ENV = appEnv;
      for (const host of LOOKALIKES) for (const path of ["/study/math", "/study/english/dashboard", "/api/learn/state", "/api/learn/attempt"]) {
        for (const method of path.startsWith("/api/learn") ? ["GET", "POST"] : ["GET"]) {
          const res = await get(proxy, host || "unknown.example", path, method);
          expect(res.status, `APP_ENV=${JSON.stringify(appEnv)} ${method} ${JSON.stringify(host)}${path}`).toBe(404);
          expect(res.headers.get("x-middleware-rewrite") ?? "", "no rewrite to a learning page").toBe("");
          checked++;
        }
      }
    }
    expect(checked).toBe(264); // 4 runtime APP_ENV values x 11 hosts x (2 page paths + 2 API paths x GET,POST)
  });
});
