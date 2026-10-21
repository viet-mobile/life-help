import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnService, attemptProof } from "@/lib/learn/server/service";
import { createInitialState } from "@/lib/learn/domain/engine";
import { loadIndex } from "@/lib/learn/content/repository";

/** A guest must not be able to claim a later attempt number to receive the answer key; the server proves the counter with an HMAC issued after each wrong answer. */
let n = 0;
const service = new LearnService({ store: new MemoryLearnStore(), newId: () => `sess-${String(++n).padStart(6, "0")}` });

describe("guest attempt counter", () => {
  beforeEach(() => { vi.stubEnv("LEARN_ATTEMPT_SECRET", "test-secret"); vi.stubEnv("NODE_ENV", "production"); });
  it("a forged attemptNo=3 without a proof is treated as attempt 1 (no answer key)", async () => {
    const { bundle } = await loadIndex("math", { grade: "E1", locale: "ko" });
    const q = bundle.questions.find((x) => x.status === "PUBLISHED" && x.role !== "diagnostic" && x.type === "multiple_choice")!;
    const wrong = (q.options ?? []).find((o) => !(q.answer.kind === "choice" && q.answer.id === o.id))!;
    const s = createInitialState("math"); s.profile = { nickname: "Tester", grade: "E1", goal: "habit", avatar: "fox", onboardingDone: true } as never;
    const a = { userId: null, guestState: s, locale: "ko" } as never;
    const res = await service.submitAttempt(a, "math", { questionId: q.id, sessionId: "sess-000001", answer: wrong.id, attemptNo: 3 });
    expect(res.revealed).toBe(false);
    expect(res.attemptNo).toBe(1);
    expect(res.feedback.answer).toBeUndefined();
    expect(res.attemptProof).toBe(await attemptProof(q.id, "sess-000001", 1));
    // the honest path: proof from attempt 1 unlocks attempt 2, proof from 2 unlocks 3 (reveal)
    const r2 = await service.submitAttempt(a, "math", { questionId: q.id, sessionId: "sess-000001", answer: wrong.id, attemptNo: 2, attemptProof: res.attemptProof });
    expect(r2.attemptNo).toBe(2);
    const r3 = await service.submitAttempt(a, "math", { questionId: q.id, sessionId: "sess-000001", answer: wrong.id, attemptNo: 3, attemptProof: r2.attemptProof });
    expect(r3.revealed).toBe(true);
    // a proof for another session/question does not transfer
    const bad = await service.submitAttempt(a, "math", { questionId: q.id, sessionId: "sess-000002", answer: wrong.id, attemptNo: 3, attemptProof: r2.attemptProof });
    expect(bad.revealed).toBe(false);
  });
});
