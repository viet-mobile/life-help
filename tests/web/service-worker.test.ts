import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

type Handler = (event: unknown) => void;

function load() {
  const handlers: Record<string, Handler> = {};
  const store = new Map<string, Response>();
  const puts: string[] = [];
  const caches = {
    open: async () => ({ addAll: async () => {}, put: async (r: Request) => { puts.push(new URL(r.url).pathname); }, keys: async () => [], delete: async () => true }),
    match: async (r: Request | string) => store.get(typeof r === "string" ? r : new URL(r.url).pathname)?.clone(),
    keys: async () => [],
    delete: async () => true,
  };
  const sandbox = {
    self: { location: { origin: "https://life.help" }, addEventListener: (n: string, h: Handler) => { handlers[n] = h; }, skipWaiting: () => {}, clients: { claim: async () => {} } },
    caches, URL, Response, fetch: async () => { throw new Error("offline"); },
  };
  vm.runInNewContext(readFileSync("public/sw.js", "utf8"), sandbox);
  return { handlers, store, puts };
}

function run(handlers: Record<string, Handler>, path: string, mode = "cors") {
  let responded: Promise<Response> | undefined;
  handlers.fetch({ request: { method: "GET", url: `https://life.help${path}`, mode }, respondWith: (p: Promise<Response>) => { responded = p; } });
  return responded;
}

describe("service worker", () => {
  it("does not touch API, authenticated or personal pages", () => {
    const { handlers } = load();
    for (const p of ["/api/chat", "/admin", "/tech/workspace", "/chat/counselor", "/login", "/payment", "/jiu", "/request"]) {
      expect(run(handlers, p, "navigate"), p).toBeUndefined();
    }
  });
  it("shows the minimal offline page, never the Korean home, for failed navigations", async () => {
    const { handlers, store } = load();
    store.set("/offline.html", new Response("offline-page"));
    store.set("/", new Response("korean-home"));
    for (const p of ["/visa", "/en/services/boiler", "/"]) {
      const res = await run(handlers, p, "navigate");
      expect(await res!.text(), p).toBe("offline-page");
    }
  });
  it("does not intercept ordinary non-static requests", () => {
    const { handlers } = load();
    expect(run(handlers, "/visa", "cors")).toBeUndefined();
  });
  it("offline page exists and is noindex", () => {
    const html = readFileSync("public/offline.html", "utf8");
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain("<title>");
  });
});
