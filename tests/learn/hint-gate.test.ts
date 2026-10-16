import { beforeEach, describe, expect, it, vi } from "vitest";
import english from "@/lib/learn/content/bank/english-draft.json";
import secondary from "@/lib/learn/content/secondary/english.json";
import { NEUTRAL_HINT2, NEUTRAL_SET, NEUTRAL_TYPED, gateHints, hintRevealsAnswer } from "@/lib/learn/hintGate";
import { loadIndex } from "@/lib/learn/content/repository";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnService } from "@/lib/learn/server/service";
import { createInitialState } from "@/lib/learn/domain/engine";
import type { Question } from "@/lib/learn/types";

const mc = (id: string, texts: string[], correct: number, hints: [string, string]): Question => ({
  id, site: "english", skillId: "e.x", type: "multiple_choice", difficulty: 1, prompt: "p", options: texts.map((t, i) => ({ id: "abcd"[i], text: t })),
  answer: { kind: "choice", id: "abcd"[correct] }, hints, explanation: "e", role: "variant", status: "PUBLISHED",
} as Question);

const store = new MemoryLearnStore(); let nId = 0;
const service = new LearnService({ store, newId: () => `sess-${String(++nId).padStart(6, "0")}` });
vi.mock("@/lib/learn/server/runtime", () => ({ getLearnService: () => service, getUserId: async () => null, accountsEnabled: () => true, resolveActor: async (g?: unknown) => ({ userId: null, guestState: g }) }));

describe("leak detector (the second line of defence behind the fail-closed gate)", () => {
  const q = mc("eb-1-m", ["has gone", "have gone", "is going", "gone"], 0, ["h1", "h2"]);
  it("the whole key, whatever the case / punctuation / spacing", () => {
    expect(hintRevealsAnswer("정답은 has gone 이에요", q)).toBe(true);
    expect(hintRevealsAnswer("HAS   GONE!", q)).toBe(true);
    expect(hintRevealsAnswer("has-gone", q)).toBe(true);
    expect(hintRevealsAnswer("주어가 3인칭 단수예요", q)).toBe(false);
  });
  it("two or more options listed (elimination gives the answer away); one option alone is only a quote", () => {
    expect(hintRevealsAnswer("is going 과 gone 은 아니에요", q)).toBe(true);
    expect(hintRevealsAnswer("is going 은 진행형이에요", q)).toBe(false);
  });
  it("numeric answers: a standalone number only", () => {
    const n = { ...mc("eb-2-m", ["12", "21", "112", "120"], 0, ["a", "b"]), answer: { kind: "numeric", value: 12 } } as unknown as Question;
    expect(hintRevealsAnswer("답은 12 예요", n)).toBe(true);
    expect(hintRevealsAnswer("112 를 보세요", n)).toBe(false);
  });
  it("short-answer / sentence completion / ordering / dictation keys: any word of the key counts (e.g. the first word of a dictation)", () => {
    const t = { ...mc("eb-3-dict", [], 0, ["a", "b"]), options: undefined, type: "short_answer", answer: { kind: "text", accepted: ["She goes to school."], dictation: "en" } } as unknown as Question;
    expect(hintRevealsAnswer("첫 단어: “She”", t)).toBe(true);
    expect(hintRevealsAnswer("모두 4단어예요", t)).toBe(false);
    const o = { ...mc("eb-4-order", ["I", "like", "tea"], 0, ["a", "b"]), type: "ordering", answer: { kind: "order", ids: ["a", "b", "c"] } } as unknown as Question;
    expect(hintRevealsAnswer("첫 단어: like", o)).toBe(true);
    const c = mc("eb-5-cloze", ["has", "have", "is", "be"], 0, ["a", "b"]);
    expect(hintRevealsAnswer("빈칸 뒤 단수 주어", c)).toBe(false);
    expect(hintRevealsAnswer("has 가 알맞아요", c)).toBe(true);
  });
});

describe("gate: hint 2 is neutral unless cleared AND clean; hint 1 is untouched; data is not deleted", () => {
  const q = mc("eb-9-m", ["has", "have", "is", "be"], 0, ["문법 규칙을 떠올려요", "정답은 has 예요"]);
  it("fail-closed by default", () => {
    const g = gateHints(q);
    expect(g.hints).toEqual(["문법 규칙을 떠올려요", NEUTRAL_HINT2]);
    expect(q.hints[1]).toBe("정답은 has 예요"); // the original object is not mutated
  });
  it("a cleared id keeps its rich hint 2 only while the detector finds nothing in it", () => {
    const clean = mc("eb-9-m", ["has", "have", "is", "be"], 0, ["h1", "주어가 단수인지 확인해요"]);
    expect(gateHints(clean, new Set(["eb-9-m"])).hints[1]).toBe("주어가 단수인지 확인해요");
    expect(gateHints(q, new Set(["eb-9-m"])).hints[1]).toBe(NEUTRAL_HINT2); // cleared but leaking: still neutral
    expect(gateHints(clean, new Set(["other"])).hints[1]).toBe(NEUTRAL_HINT2);
  });
  it("only English bank / elective ids are gated", () => {
    const old = mc("e-m2-perf-1", ["a", "b", "c", "d"], 0, ["x", "정답은 a"]);
    expect(gateHints(old)).toBe(old);
    expect(gateHints({ ...old, id: "e-h3e-conv-1" }).hints[1]).toBe(NEUTRAL_HINT2);
    expect(gateHints({ ...old, id: "kb-x" })).toEqual({ ...old, id: "kb-x" });
  });
  it("the neutral hint itself reveals nothing for any served English question (bank, derived dictation/listening, electives)", () => {
    const all = [...(english as { questions: Question[] }).questions, ...(secondary as unknown as { questions: Question[] }).questions.filter((x) => x.id.startsWith("e-h3e-"))];
    expect(all.length).toBeGreaterThan(16000);
    let n = 0, fallback = 0;
    for (const x of all) { const h = gateHints({ ...x, hints: [x.hints[0], "rich"] }).hints[1]; if (hintRevealsAnswer(h, x)) n++; if (h !== NEUTRAL_HINT2) fallback++; expect(NEUTRAL_SET).toContain(h); }
    expect(n).toBe(0);
    expect(fallback).toBeLessThan(2200); // option questions use the primary neutral hint; text / ordering questions their own
    const dict = all.find((x) => x.id.endsWith("-dict"))!; const ord = all.find((x) => x.type === "ordering")!;
    expect(gateHints(dict).hints[1]).toBe(NEUTRAL_TYPED.text); // never "look at the options" for a question that has none
    expect(gateHints(ord).hints[1]).toBe(NEUTRAL_TYPED.order);
  });
});

describe("gate at the real loading path and HTTP API (no locale / grade / direct-id route around it)", () => {
  it("loadIndex: every English bank and elective question has the neutral hint 2 and its original hint 1, for every grade and with a direct question id", async () => {
    const raw = new Map((english as { questions: Question[] }).questions.map((x) => [x.id, x]));
    let checked = 0;
    for (const grade of ["E3", "M2", "H1", "H3"] as const) {
      const { bundle } = await loadIndex("english", { grade });
      for (const x of bundle.questions) {
        if (!/^(eb-|e-h3e-)/.test(x.id)) continue;
        expect(NEUTRAL_SET, x.id).toContain(x.hints[1]);
        const r = raw.get(x.id); if (r) expect(x.hints[0], x.id).toBe(r.hints[0]);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(2000);
    const any = (english as { questions: Question[] }).questions.find((x) => x.skillId === "e.e3.snd1")!;
    const { bundle } = await loadIndex("english", { bankQuestionId: any.id });
    expect(NEUTRAL_SET).toContain(bundle.questions.find((x) => x.id === any.id)!.hints[1]);
  });
  beforeEach(() => vi.stubEnv("APP_ENV", "production"));
  const call = async (action: string, body: unknown, host = "english.life.help") => {
    const { POST } = await import("@/app/api/learn/[action]/route");
    return POST(new Request(`https://${host}/api/learn/${action}`, { method: "POST", headers: { host, origin: `https://${host}`, "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ action }) } as never);
  };
  it("POST /api/learn/hint level 2 returns the neutral hint (any locale), level 1 the original; electives and derived dictation too", async () => {
    const st = createInitialState("english"); st.profile = { nickname: "T", grade: "E3", goal: "habit", avatar: "fox", onboardingDone: true } as never;
    const qs = (english as { questions: Question[] }).questions;
    const pick = [qs.find((x) => x.skillId === "e.e3.snd1")!, qs.find((x) => x.id.endsWith("-dict"))!, qs.find((x) => x.id.endsWith("-listen"))!];
    for (const q of pick) {
      for (const locale of ["ko", "en", "ar"]) {
        const st2 = createInitialState("english"); st2.profile = { nickname: "T", grade: q.skillId.split(".")[1].toUpperCase().slice(0, 2), goal: "habit", avatar: "fox", onboardingDone: true } as never;
        const r1 = await call("hint", { site: "english", locale, state: st2, questionId: q.id, level: 1 });
        const r2 = await call("hint", { site: "english", locale, state: st2, questionId: q.id, level: 2 });
        if (locale === "ko") { expect(r2.status, q.id).toBe(200); expect(NEUTRAL_SET, q.id).toContain((await r2.json()).hint); expect((await r1.json()).hint, q.id).toBe(q.hints[0]); }
        else expect([200, 404], `${locale} ${q.id}`).toContain(r2.status); // other locales never receive the Korean English-bank at all
        if (locale !== "ko" && r2.status === 200) expect(NEUTRAL_SET).toContain((await r2.json()).hint);
      }
    }
    void st;
  });
});

describe("gate on the wrong-answer feedback path", () => {
  it("hints returned with wrong attempts never include the authored hint 2", async () => {
    const { POST } = await import("@/app/api/learn/[action]/route");
    const post = (action: string, body: unknown) => POST(new Request(`https://english.life.help/api/learn/${action}`, { method: "POST", headers: { host: "english.life.help", origin: "https://english.life.help", "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ action }) } as never);
    vi.stubEnv("APP_ENV", "production");
    const raw = new Map((english as { questions: Question[] }).questions.map((x) => [x.id, x]));
    const st = createInitialState("english"); st.profile = { nickname: "T", grade: "E3", goal: "habit", avatar: "fox", onboardingDone: true } as never;
    const start = await (await post("start", { site: "english", locale: "ko", state: st, kind: "practice", skillId: "e.e3.snd1" })).json();
    const sessionId = start.sessionId as string;
    let seen = 0, state = start.state ?? st;
    for (const pq of start.questions.filter((x: { id: string; type: string }) => raw.has(x.id) && raw.get(x.id)!.type === "multiple_choice").slice(0, 3)) {
      const q = raw.get(pq.id)!;
      const wrong = q.options!.find((o) => o.id !== (q.answer as { id: string }).id)!.id;
      for (let attemptNo = 1; attemptNo <= 3; attemptNo++) {
        const res = await (await post("attempt", { site: "english", locale: "ko", state, sessionId, questionId: q.id, answer: wrong, attemptNo, hintsUsed: 0, timeMs: 1000 })).json();
        if (res.state) state = res.state;
        const h = res.feedback?.hint as string | undefined;
        if (h) { seen++; expect(h).not.toBe(q.hints[1]); expect(h === q.hints[0] || NEUTRAL_SET.includes(h), `${q.id}#${attemptNo}`).toBe(true); }
        if (res.revealed || res.feedback?.answer) break;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});
