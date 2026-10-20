import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
function request(path: string) { return new NextRequest(`https://jiu.life.help${path}`, { headers: { host: "jiu.life.help", "x-life-country": "spoofed" } }); }
describe("JIU host routing", () => {
  it("routes its home to the learner blog and normalizes internal headers", async () => {
    const r = await proxy(request("/"));
    expect(r.headers.get("x-middleware-rewrite")).toBe("https://jiu.life.help/jiu");
    expect(r.headers.get("x-middleware-request-x-life-portal")).toBe("jiu");
    expect(r.headers.get("x-middleware-request-x-life-language")).toBe("ko");
    expect(r.headers.get("x-middleware-request-x-life-country")).toBeNull();
  });
  it("preserves the learning platform's host boundary", async () => {
    for (const path of ["/study", "/study/math", "/api/learn", "/api/learn/state"]) expect((await proxy(request(path))).status).toBe(404);
  });
});
