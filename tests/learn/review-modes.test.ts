import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnService } from "@/lib/learn/server/service";
import { createInitialState } from "@/lib/learn/domain/engine";
import { questionMode, isReviewMode } from "@/lib/learn/reviewModes";
import type { Site } from "@/lib/learn/types";

const store = new MemoryLearnStore();
let n = 0;
const service = new LearnService({ store, newId: () => `sess-${String(++n).padStart(6, "0")}` });
vi.mock("@/lib/learn/server/runtime", () => ({
  getLearnService: () => service,
  getUserId: async () => null,
  accountsEnabled: () => true,
  resolveActor: async (guestState?: unknown) => ({ userId: null, guestState }),
}));
import { POST } from "@/app/api/learn/[action]/route";

const call = (site: Site, action: string, body: Record<string, unknown>) => {
  const host = `${site}.life.help`;
  return POST(new Request(`https://${host}/api/learn/${action}`, { method: "POST", headers: { host, origin: `https://${host}`, "content-type": "application/json" }, body: JSON.stringify({ site, locale: site === "korean" ? "en" : "ko", ...body }) }), { params: Promise.resolve({ action }) } as never);
};
const state = (site: Site, grade: string) => { const s = createInitialState(site); s.profile = { nickname: "T", grade, goal: "habit", avatar: "fox", onboardingDone: true } as never; return s; };
beforeEach(() => vi.stubEnv("APP_ENV", "production"));

describe("review modes (Korean only in this release)", () => {
  it("classifies by what the question asks, not its subject", () => {
    expect(questionMode({ type: "ordering", answer: { kind: "order", ids: [] } } as never)).toBe("order");
    expect(questionMode({ type: "multiple_choice", answer: { kind: "choice", id: "a" } } as never)).toBe("choice");
    expect(questionMode({ type: "multiple_choice", audioText: "Hi", answer: { kind: "choice", id: "a" } } as never)).toBe("listening");
    expect(questionMode({ type: "multiple_choice", audioText: "안녕", target: { text: "안녕" }, answer: { kind: "choice", id: "a" } } as never)).toBe("choice");
    expect(questionMode({ type: "short_answer", audioText: "Hi", answer: { kind: "text", accepted: ["Hi"], dictation: "en" } } as never)).toBe("dictation");
    expect(questionMode({ type: "short_answer", answer: { kind: "text", accepted: ["3"] } } as never)).toBe(null);
    expect(isReviewMode("dictation")).toBe(true);
    expect(isReviewMode("flash")).toBe(false);
  });
  it.each(["choice", "listening", "order"] as const)("a Korean %s practice session holds only that mode's questions", async (mode) => {
    const res = await call("korean", "start", { state: state("korean", "K5"), kind: "practice", mode });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.questions.length).toBeGreaterThan(0);
    for (const q of data.questions) expect(questionMode({ ...q, answer: { kind: q.type === "short_answer" ? "text" : "choice", dictation: q.type === "short_answer" ? "ko" : undefined } } as never), q.id).toBe(mode);
  });
  it("a mode with no questions for a new learner is a clear 409, never an empty session", async () => {
    const res = await call("korean", "start", { state: state("korean", "K1"), kind: "practice", mode: "dictation" });
    expect(res.status).toBe(409);
  });
  it("an unknown mode is ignored (ordinary session)", async () => {
    const ok = await call("korean", "start", { state: state("korean", "K1"), kind: "practice", skillId: "k.k1.vowels", mode: "nonsense" });
    expect(ok.status).toBe(200);
  });
  it("flashcards: fronts only from the server, the back through reveal, nothing graded or rewarded", async () => {
    const st = state("korean", "K3");
    const res = await call("korean", "cards", { state: st, count: 8 });
    expect(res.status).toBe(200);
    const text = await res.text();
    const { cards } = JSON.parse(text) as { cards: { id: string; front: string }[] };
    expect(cards.length).toBeGreaterThan(0);
    expect(new Set(cards.map((c) => c.front)).size).toBe(cards.length);
    expect(text).not.toMatch(/"(answer|explanation|hints|options)"/);
    const back = await call("korean", "reveal", { state: st, questionId: cards[0].id });
    expect(back.status).toBe(200);
    expect(typeof (await back.json()).back).toBe("string");
    expect((await call("korean", "reveal", { state: st, questionId: "kb-nope-x" })).status).toBe(404);
  });
  it("Math and English keep their existing behaviour: no flashcard API, the mode parameter is ignored", async () => {
    for (const site of ["english", "math"] as const) {
      expect((await call(site, "cards", { state: state(site, site === "english" ? "E3" : "E3"), count: 4 })).status, `${site} cards`).toBe(404);
      expect((await call(site, "reveal", { state: state(site, "E3"), questionId: "x" })).status, `${site} reveal`).toBe(404);
    }
    const plain = await call("english", "start", { state: state("english", "E3"), kind: "practice", skillId: "e.e3.snd1" });
    const withMode = await call("english", "start", { state: state("english", "E3"), kind: "practice", skillId: "e.e3.snd1", mode: "order" });
    expect(plain.status).toBe(200);
    expect(withMode.status).toBe(200);
    const a = (await plain.json()).questions.length, b = (await withMode.json()).questions.length;
    expect(b).toBe(a); // the mode did not narrow an English session
  });
});
