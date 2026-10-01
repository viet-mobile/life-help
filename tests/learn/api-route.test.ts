import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnService } from "@/lib/learn/server/service";

/**
 * Exercises the real HTTP route with the authenticated user mocked at the session
 * boundary (`getUserId`). Proves the server trusts only the verified session, never
 * identifiers or state supplied in the request body.
 */
let currentUser: string | null = null;
const store = new MemoryLearnStore();
let n = 0;
const service = new LearnService({ store, newId: () => `sess-${String(++n).padStart(6, "0")}` });

vi.mock("@/lib/learn/server/runtime", () => ({
  getLearnService: () => service,
  getUserId: async () => currentUser,
  accountsEnabled: () => true,
  resolveActor: async (guestState?: unknown) => ({ userId: currentUser, guestState: currentUser ? undefined : guestState }),
}));

import { POST } from "@/app/api/learn/[action]/route";

const HOST = "math.life.help";
function call(action: string, body: unknown, headers: Record<string, string> = {}) {
  const req = new Request(`https://${HOST}/api/learn/${action}`, {
    method: "POST",
    headers: { host: HOST, origin: `https://${HOST}`, "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return POST(req, { params: Promise.resolve({ action }) } as never);
}

beforeEach(() => {
  currentUser = null;
  vi.stubEnv("APP_ENV", "production");
});

describe("learning API route", () => {
  it("rejects cross-origin, non-JSON and oversized requests", async () => {
    expect((await call("state", { site: "math" }, { origin: "https://evil.example" })).status).toBe(403);
    const noOrigin = new Request(`https://${HOST}/api/learn/state`, { method: "POST", headers: { host: HOST, "content-type": "application/json" }, body: "{}" });
    expect((await POST(noOrigin, { params: Promise.resolve({ action: "state" }) } as never)).status).toBe(403);
    const text = new Request(`https://${HOST}/api/learn/state`, { method: "POST", headers: { host: HOST, origin: `https://${HOST}`, "content-type": "text/plain" }, body: "x" });
    expect((await POST(text, { params: Promise.resolve({ action: "state" }) } as never)).status).toBe(415);
    const big = await call("state", { site: "math", pad: "x".repeat(70_000) });
    expect(big.status).toBe(413);
    expect((await call("nope", { site: "math" })).status).toBe(404);
    expect((await call("state", { site: "physics" })).status).toBe(400);
  });

  it("answers only on learning hostnames in production", async () => {
    const res = await call("state", { site: "math" }, { host: "korea.life.help", origin: "https://korea.life.help" });
    expect(res.status).toBe(404);
  });

  it("ignores client-supplied state for signed-in users (XP cannot be injected)", async () => {
    currentUser = "user-a";
    const forged = { site: "math", totalXp: 999999, coins: 999999, lessons: { "math-l4": { lessonId: "math-l4", stars: 3, completions: 9, placedOut: false, bestAccuracy: 1 } } };
    const res = await call("state", { site: "math", state: forged });
    const { state } = await res.json();
    expect(state.totalXp).toBe(0);
    expect(state.coins).toBe(0);
    expect(state.lessons).toEqual({});
    // and a locked lesson stays locked despite the forged completion
    expect((await call("start", { site: "math", kind: "lesson", lessonId: "math-l4", state: forged })).status).toBe(403);
  });

  it("ignores a userId in the body: data always belongs to the session user", async () => {
    currentUser = "user-a";
    const start = await (await call("start", { site: "math", kind: "lesson", lessonId: "math-l1", userId: "user-b" })).json();
    const r = await (await call("attempt", { site: "math", questionId: "m-expr-1", sessionId: start.sessionId, answer: "c", userId: "user-b" })).json();
    expect(r.correct).toBe(true);
    currentUser = "user-b";
    expect((await (await call("state", { site: "math" })).json()).state.totalXp).toBe(0);
    // B cannot use A's session either
    const cross = await call("attempt", { site: "math", questionId: "m-expr-2", sessionId: start.sessionId, answer: "-2" });
    expect(cross.status).toBe(403);
  });

  it("does not leak answers through any response, including errors", async () => {
    currentUser = "user-a";
    const start = await call("start", { site: "math", kind: "lesson", lessonId: "math-l1" });
    const body = await start.text();
    expect(body).not.toMatch(/"answer"|"explanation"|"hints"|accepted/);
    const sid = JSON.parse(body).sessionId;
    const wrong = await (await call("attempt", { site: "math", questionId: "m-expr-1", sessionId: sid, answer: "a" })).text();
    expect(wrong).not.toMatch(/"answer"\s*:\s*\{|"kind":"choice"/);
    expect(wrong).not.toContain("$2\\times3+1=6+1=7$"); // explanation withheld until resolved
  });

  it("replaying a correct attempt cannot be farmed for XP", async () => {
    currentUser = "user-farm";
    const start = await (await call("start", { site: "math", kind: "lesson", lessonId: "math-l1" })).json();
    const first = await (await call("attempt", { site: "math", questionId: "m-expr-1", sessionId: start.sessionId, answer: "c" })).json();
    expect(first.delta.xp).toBeGreaterThan(0);
    const again = await call("attempt", { site: "math", questionId: "m-expr-1", sessionId: start.sessionId, answer: "c" });
    expect(again.status).toBe(409);
    // fresh sessions for the same question pay diminishing XP, then nothing
    const gains: number[] = [];
    for (let i = 0; i < 3; i++) {
      const s = await (await call("start", { site: "math", kind: "lesson", lessonId: "math-l1" })).json();
      const r = await (await call("attempt", { site: "math", questionId: "m-expr-1", sessionId: s.sessionId, answer: "c" })).json();
      gains.push(r.delta.xp);
    }
    expect(gains[0]).toBeLessThan(first.delta.xp);
    expect(gains[2]).toBe(0);
  });
});
