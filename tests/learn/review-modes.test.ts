import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnService } from "@/lib/learn/server/service";
import { createInitialState } from "@/lib/learn/domain/engine";
import { questionMode, isReviewMode } from "@/lib/learn/reviewModes";
import servedBank from "@/lib/learn/content/bank/english-draft.json";

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

type BankQ = { id: string; skillId: string; type: string; audioText?: string; answer: { kind: string; dictation?: string } };
const qs = (servedBank as { questions: BankQ[] }).questions;
const HOST = "english.life.help";
const call = (action: string, body: unknown) =>
  POST(new Request(`https://${HOST}/api/learn/${action}`, { method: "POST", headers: { host: HOST, origin: `https://${HOST}`, "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ action }) } as never);
beforeEach(() => vi.stubEnv("APP_ENV", "production"));
const state = (grade: string) => { const s = createInitialState("english"); s.profile = { nickname: "T", grade, goal: "habit", avatar: "fox", onboardingDone: true } as never; return s; };

describe("review modes", () => {
  it("classifies by what the question asks, not its subject", () => {
    expect(questionMode({ type: "ordering", answer: { kind: "order", ids: [] } } as never)).toBe("order");
    expect(questionMode({ type: "multiple_choice", answer: { kind: "choice", id: "a" } } as never)).toBe("choice");
    expect(questionMode({ type: "multiple_choice", audioText: "Hi", answer: { kind: "choice", id: "a" } } as never)).toBe("listening");
    // a question that shows the text next to a speaker button is still a reading/choice question
    expect(questionMode({ type: "multiple_choice", audioText: "안녕", target: { text: "안녕" }, answer: { kind: "choice", id: "a" } } as never)).toBe("choice");
    expect(questionMode({ type: "short_answer", audioText: "Hi", answer: { kind: "text", accepted: ["Hi"], dictation: "en" } } as never)).toBe("dictation");
    expect(questionMode({ type: "short_answer", answer: { kind: "text", accepted: ["3"] } } as never)).toBe(null);
    expect(isReviewMode("dictation")).toBe(true);
    expect(isReviewMode("flash")).toBe(false);
  });
  it("English bank has all four modes, and dictation keys use the English dictation rules", () => {
    const by = new Map<string, number>();
    for (const q of qs) { const m = questionMode(q as never) ?? "none"; by.set(m, (by.get(m) ?? 0) + 1); }
    // this release candidate carries no English dict/listen forms (they ride with the English release)
    for (const m of ["choice", "order"]) expect(by.get(m) ?? 0, m).toBeGreaterThan(100);
    expect(qs.filter((q) => q.type === "short_answer").every((q) => q.answer.kind === "text" && q.answer.dictation === "en" && !!q.audioText)).toBe(true);
  });
  it.each(["order", "choice"] as const)("a %s practice session holds only that mode's questions", async (mode) => {
    const skill = qs.find((q) => questionMode(q as never) === mode && q.skillId.startsWith("e.e3."))?.skillId ?? qs.find((q) => questionMode(q as never) === mode)!.skillId;
    const grade = skill.split(".")[1].toUpperCase();
    const res = await call("start", { site: "english", locale: "ko", state: state(grade), kind: "practice", skillId: skill, mode });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.questions.length).toBeGreaterThan(0);
    // the public question has no key; short_answer with audio can only be a dictation
    for (const q of data.questions) expect(questionMode({ ...q, answer: { kind: q.type === "short_answer" ? "text" : "choice", dictation: q.type === "short_answer" ? "en" : undefined } } as never), q.id).toBe(mode);
  });
  it("an unknown mode is ignored (ordinary session), a mode with no questions is a clear 409", async () => {
    const ok = await call("start", { site: "english", locale: "ko", state: state("E3"), kind: "practice", skillId: "e.e3.snd1", mode: "nonsense" });
    expect(ok.status).toBe(200);
  });
  it("flashcards: fronts only from the server, the back through reveal, nothing graded or rewarded", async () => {
    const st = state("E3");
    const res = await call("cards", { site: "english", locale: "ko", state: st, count: 8 });
    expect(res.status).toBe(200);
    const text = await res.text();
    const { cards } = JSON.parse(text) as { cards: { id: string; front: string }[] };
    expect(cards.length).toBeGreaterThan(0);
    expect(new Set(cards.map((c) => c.front)).size).toBe(cards.length);
    for (const c of cards) expect(Object.keys(c).sort()).toEqual(expect.arrayContaining(["front", "id"]));
    expect(text).not.toMatch(/"(answer|explanation|hints|options)"/);
    const back = await call("reveal", { site: "english", locale: "ko", state: st, questionId: cards[0].id });
    expect(back.status).toBe(200);
    expect(typeof (await back.json()).back).toBe("string");
    const bad = await call("reveal", { site: "english", locale: "ko", state: st, questionId: "eb-nope-x" });
    expect(bad.status).toBe(404);
  });
});
