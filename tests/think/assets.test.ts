import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadThinkAsset } from "../../lib/think/assets";
import { FILE_META, TASK_LOADERS } from "../../lib/think/data/assets-index";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
afterEach(() => vi.unstubAllGlobals());
describe("thinking assets", () => {
  it("retains every authored task and overlay in hash-pinned static files", () => {
    const rows = JSON.parse(readFileSync("public/think-assets/inventory.json", "utf8")) as {source:string;hash:string}[];
    expect(rows.length).toBeGreaterThan(1000);
    for (const r of rows) {
      const text = readFileSync(`public/think-assets/${r.hash}.json`, "utf8");
      expect(hash(text)).toBe(r.hash);
      expect(JSON.parse(text)).toEqual(JSON.parse(readFileSync(r.source, "utf8")));
    }
    expect(FILE_META.reduce((n, m) => n + m.count, 0)).toBe(1553); // 1,576 minus 23 duplicate tasks removed after the independent blind review
    expect(readFileSync("lib/think/data/assets-index.ts", "utf8")).not.toMatch(/import\([^)]*\.json/);
  });
  it("fetches a pilot through the actual asset loader and retains review status", async () => {
    const fn=vi.fn(async (url: string) => new Response(readFileSync(path.join(process.cwd(), "public", url))));
    vi.stubGlobal("fetch", fn);
    const rows = await TASK_LOADERS["pilot-math"]();
    expect(rows).toHaveLength(12);
    expect(rows[0].id).toBe("m-01");
    expect(rows.every(t => t.status === "reviewed-ai")).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("rejects altered content and retries instead of caching a failure", async () => {
    const original='{"example":"integrity"}',h=hash(original);
    const fn=vi.fn().mockResolvedValueOnce(new Response('{"example":"tampered"}')).mockResolvedValueOnce(new Response(original));
    vi.stubGlobal("fetch",fn);
    await expect(loadThinkAsset(h)).rejects.toThrow("integrity");
    await expect(loadThinkAsset(h)).resolves.toEqual({example:"integrity"});
    expect(fn).toHaveBeenCalledTimes(2);
  });
  it("rejects missing assets and invalid paths", async () => {
    vi.stubGlobal("fetch",vi.fn(async()=>new Response("missing",{status:404})));
    await expect(loadThinkAsset(hash('missing asset test'))).rejects.toThrow("404");
    await expect(loadThinkAsset("../private")).rejects.toThrow("Invalid");
  });
});
