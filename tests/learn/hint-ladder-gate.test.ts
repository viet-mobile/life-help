import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LearnService, hintProof, type Actor } from "@/lib/learn/server/service";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";

/** Hint N is only served against the proof issued with hint N-1 (learn-10). */
const A: Actor = { userId: "user-a" };
let svc: LearnService;

beforeEach(() => {
  vi.stubEnv("LEARN_ATTEMPT_SECRET", "test-secret");
  svc = new LearnService({ store: new MemoryLearnStore(), now: () => new Date("2026-03-01T03:00:00Z") });
});
afterEach(() => vi.unstubAllEnvs());

describe("hint ladder gate", () => {
  it("rejects hint 2 without hint 1's proof, accepts it with the proof", async () => {
    const sessionId = "sess-ladder-1";
    await expect(svc.requestHint(A, "math", { questionId: "m-expr-1", level: 2, sessionId })).rejects.toMatchObject({ code: "hint_locked" });
    await expect(svc.requestHint(A, "math", { questionId: "m-expr-1", level: 2 })).rejects.toMatchObject({ code: "hint_locked" });
    const h1 = await svc.requestHint(A, "math", { questionId: "m-expr-1", level: 1, sessionId });
    expect(h1.hintProof).toBe(await hintProof("m-expr-1", sessionId, 1));
    const h2 = await svc.requestHint(A, "math", { questionId: "m-expr-1", level: 2, sessionId, prevProof: h1.hintProof });
    expect(h2.level).toBe(2);
  });

  it("a proof does not transfer to another session, question or level", async () => {
    const p = await hintProof("m-expr-1", "sess-ladder-1", 1);
    await expect(svc.requestHint(A, "math", { questionId: "m-expr-1", level: 2, sessionId: "sess-ladder-2", prevProof: p })).rejects.toMatchObject({ code: "hint_locked" });
    expect(await hintProof("m-expr-1", "sess-ladder-1", 2)).not.toBe(p);
  });

  it("is not enforced without a secret (local / test)", async () => {
    vi.stubEnv("LEARN_ATTEMPT_SECRET", "");
    expect((await svc.requestHint(A, "math", { questionId: "m-expr-1", level: 2 })).level).toBe(2);
  });
});
