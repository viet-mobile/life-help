import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnService } from "@/lib/learn/server/service";
import { createInitialState } from "@/lib/learn/domain/engine";
import servedBank from "@/lib/learn/content/bank/english-draft.json";

/** The English bank is read from server-only assets: the HTTP API must serve it per skill/grade, grade it on the server, and never send keys, hints or explanations. */
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

type BankQ = { id: string; skillId: string; answer: { kind: string; id?: string; ids?: string[] }; hints: string[]; explanation: string };
const bank = new Map((servedBank as { questions: BankQ[] }).questions.map((q) => [q.id, q]));
const HOST = "english.life.help";
const call = (action: string, body: unknown) =>
  POST(new Request(`https://${HOST}/api/learn/${action}`, { method: "POST", headers: { host: HOST, origin: `https://${HOST}`, "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ action }) } as never);
beforeEach(() => vi.stubEnv("APP_ENV", "production"));

function state(grade: string) {
  const s = createInitialState("english");
  s.profile = { nickname: "Tester", grade, goal: "habit", avatar: "fox", onboardingDone: true } as never;
  return s;
}

describe("English bank through the learning API", () => {
  it("practice on a skill returns only that skill's bank questions; the response carries no key, hint or explanation", async () => {
    const res = await call("start", { site: "english", locale: "ko", state: state("E3"), kind: "practice", skillId: "e.e3.snd1" });
    expect(res.status).toBe(200);
    const text = await res.text();
    const data = JSON.parse(text);
    const eb = data.questions.filter((q: { id: string }) => q.id.startsWith("eb-"));
    expect(eb.length).toBeGreaterThan(0);
    for (const q of eb) {
      expect(bank.get(q.id)?.skillId).toBe("e.e3.snd1");
      expect(Object.keys(q)).not.toContain("answer");
      expect(Object.keys(q)).not.toContain("explanation");
      expect(Object.keys(q)).not.toContain("hints");
    }
    for (const q of eb.slice(0, 5)) expect(text).not.toContain(bank.get(q.id)!.explanation.slice(0, 40));
  });
  it("a hint request resolves the question's own shard and returns that question's hint; an unknown id is 404", async () => {
    const q = [...bank.values()].find((x) => x.skillId === "e.m3.cond")!;
    const res = await call("hint", { site: "english", locale: "ko", state: state("M3"), questionId: q.id, level: 1 });
    expect(res.status).toBe(200);
    expect((await res.json()).hint).toBe(q.hints[0]);
    expect((await call("hint", { site: "english", locale: "ko", state: state("M3"), questionId: "eb-nope-m", level: 1 })).status).toBe(404);
  });
  it("answers are graded on the server from the asset: the key is correct, another option is wrong; outside the learner's grade scope the question is unknown", async () => {
    const s = state("E3");
    const start = await (await call("start", { site: "english", locale: "ko", state: s, kind: "practice", skillId: "e.e3.snd1" })).json();
    const q = start.questions.find((x: { id: string; type: string }) => x.id.startsWith("eb-") && x.type === "multiple_choice");
    const key = bank.get(q.id)!.answer.id!;
    const right = await (await call("attempt", { site: "english", locale: "ko", state: s, questionId: q.id, sessionId: start.sessionId, answer: key })).json();
    expect(right, JSON.stringify(right)).toHaveProperty("correct", true);
    const other = q.options.find((o: { id: string }) => o.id !== key).id;
    const wrong = await (await call("attempt", { site: "english", locale: "ko", state: s, questionId: q.id, sessionId: start.sessionId, answer: other, attemptNo: 2 })).json();
    expect(wrong.correct).toBe(false);
    const high = [...bank.values()].find((x) => x.skillId.startsWith("e.h3."))!;
    expect((await call("attempt", { site: "english", locale: "ko", state: s, questionId: high.id, sessionId: start.sessionId, answer: "a" })).status).toBeGreaterThanOrEqual(400);
  });
  it("another learner language gets localized, Hangul-free bank questions through the API", async () => {
    const res = await call("start", { site: "english", locale: "vi", state: state("E3"), kind: "practice", skillId: "e.e3.snd1" });
    const data = await res.json();
    const eb = (data.questions ?? []).filter((q: { id: string }) => q.id.startsWith("eb-"));
    expect(eb.length).toBeGreaterThan(0);
    for (const q of eb) {
      expect(q.prompt).not.toMatch(/[가-힣ㄱ-ㆎ]/);
    }
  });
});
