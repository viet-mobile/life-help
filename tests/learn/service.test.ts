import { beforeEach, describe, expect, it } from "vitest";
import { LearnService, type Actor } from "@/lib/learn/server/service";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnError } from "@/lib/learn/server/errors";
import { demoContentRepository } from "@/lib/learn/content/repository";
import type { Question } from "@/lib/learn/types";

const NOW = new Date("2026-03-01T03:00:00Z");
let store: MemoryLearnStore;
let svc: LearnService;
let n = 0;
const A: Actor = { userId: "user-a" };
const B: Actor = { userId: "user-b" };

beforeEach(() => {
  store = new MemoryLearnStore();
  n = 0;
  svc = new LearnService({ store, now: () => NOW, newId: () => `session-${String(++n).padStart(4, "0")}` });
});

async function bundle(site: "math" | "english" = "math") {
  return demoContentRepository.getBundle(site);
}
function correctFor(q: Question): string | string[] {
  const k = q.answer;
  if (k.kind === "choice") return k.id;
  if (k.kind === "numeric") return String(k.value);
  if (k.kind === "text") return k.accepted[0];
  return k.kind === "order" ? k.ids : k.ids;
}
function wrongFor(q: Question): string | string[] {
  if (q.type === "numeric") return "999";
  if (q.type === "true_false") return q.answer.kind === "choice" && q.answer.id === "true" ? "false" : "true";
  if (q.type === "multiple_choice") return q.options!.find((o) => q.answer.kind === "choice" && o.id !== q.answer.id)!.id;
  if (q.type === "ordering") return [...q.options!].reverse().map((o) => o.id);
  return "zzz";
}

async function playLesson(actor: Actor, lessonId: string, opts: { site?: "math" | "english" } = {}) {
  const site = opts.site ?? "math";
  const b = await bundle(site);
  const start = await svc.startSession(actor, site, { kind: "lesson", lessonId });
  let last;
  for (const pq of start.questions) {
    const q = b.questions.find((x) => x.id === pq.id)!;
    last = await svc.submitAttempt(actor, site, { questionId: q.id, sessionId: start.sessionId, answer: correctFor(q) });
  }
  return { start, last };
}

describe("public payloads", () => {
  it("never include answers, hints or explanations when a session starts", async () => {
    const start = await svc.startSession(A, "math", { kind: "lesson", lessonId: "math-l1" });
    const json = JSON.stringify(start);
    expect(json).not.toContain('"answer"');
    expect(json).not.toContain('"explanation"');
    expect(json).not.toContain('"hints"');
    expect(start.questions.length).toBe(5);
  });
});

describe("hint ladder", () => {
  it("gives a small hint, then a concrete hint, then the explanation plus a similar question", async () => {
    const start = await svc.startSession(A, "math", { kind: "lesson", lessonId: "math-l1" });
    const b = await bundle();
    const q = b.questions.find((x) => x.id === "m-expr-1")!;
    const r1 = await svc.submitAttempt(A, "math", { questionId: q.id, sessionId: start.sessionId, answer: wrongFor(q) });
    expect(r1.correct).toBe(false);
    expect(r1.feedback.hint).toBe(q.hints[0]);
    expect(r1.feedback.explanation).toBeUndefined();
    const r2 = await svc.submitAttempt(A, "math", { questionId: q.id, sessionId: start.sessionId, answer: wrongFor(q) });
    expect(r2.feedback.hint).toBe(q.hints[1]);
    expect(r2.attemptNo).toBe(2);
    const r3 = await svc.submitAttempt(A, "math", { questionId: q.id, sessionId: start.sessionId, answer: wrongFor(q), seenIds: start.questions.map((x) => x.id) });
    expect(r3.revealed).toBe(true);
    expect(r3.feedback.explanation).toBe(q.explanation);
    expect(r3.feedback.answer).toBeTruthy();
    expect(r3.followUp).not.toBeNull();
    expect(r3.followUp!.id).not.toBe(q.id);
    expect(JSON.stringify(r3.followUp)).not.toContain('"answer"');
    // Once resolved, the same question cannot be attempted again in the session.
    await expect(svc.submitAttempt(A, "math", { questionId: q.id, sessionId: start.sessionId, answer: correctFor(q) })).rejects.toMatchObject({ code: "already_resolved" });
  });

  it("serves voluntary hints only up to what exists", async () => {
    expect((await svc.requestHint(A, "math", { questionId: "m-expr-1", level: 1 })).hint).toContain("$x$");
    await expect(svc.requestHint(A, "math", { questionId: "m-expr-1", level: 3 })).rejects.toMatchObject({ code: "no_more_hints" });
    await expect(svc.requestHint(A, "math", { questionId: "nope", level: 1 })).rejects.toBeInstanceOf(LearnError);
  });

  it("does not let a client fake its attempt number (server counts recorded attempts)", async () => {
    const start = await svc.startSession(A, "math", { kind: "lesson", lessonId: "math-l1" });
    const b = await bundle();
    const q = b.questions.find((x) => x.id === "m-expr-1")!;
    await svc.submitAttempt(A, "math", { questionId: q.id, sessionId: start.sessionId, answer: wrongFor(q), attemptNo: 1 });
    // Client claims this is attempt 1 again to earn full first-try XP.
    const r = await svc.submitAttempt(A, "math", { questionId: q.id, sessionId: start.sessionId, answer: correctFor(q), attemptNo: 1 });
    expect(r.attemptNo).toBe(2);
    expect(r.delta.xp).toBe(8);
  });
});

describe("lesson flow with persistence", () => {
  it("completes a lesson, awards XP once, and persists progress across reloads", async () => {
    const { start } = await playLesson(A, "math-l1");
    const done = await svc.completeLesson(A, "math", { sessionId: start.sessionId, lessonId: "math-l1", firstTryCorrect: 0 });
    // firstTryCorrect from the client is ignored for signed-in students: derived from records.
    expect(done.accuracy).toBe(1);
    expect(done.stars).toBe(3);
    expect(done.delta.xp).toBeGreaterThanOrEqual(65);

    const xpAfter = (await svc.getState(A, "math")).totalXp;
    expect(xpAfter).toBeGreaterThan(done.delta.xp);
    // Page refresh / retried request: no extra XP.
    const retry = await svc.completeLesson(A, "math", { sessionId: start.sessionId, lessonId: "math-l1" });
    expect(retry.delta.xp).toBe(0);
    expect((await svc.getState(A, "math")).totalXp).toBe(xpAfter);
    expect((await svc.getState(A, "math")).lessons["math-l1"].completions).toBe(1);
  });

  it("refuses to complete a lesson whose questions were not all resolved", async () => {
    const start = await svc.startSession(A, "math", { kind: "lesson", lessonId: "math-l1" });
    const b = await bundle();
    const q = b.questions.find((x) => x.id === "m-expr-1")!;
    await svc.submitAttempt(A, "math", { questionId: q.id, sessionId: start.sessionId, answer: correctFor(q) });
    await expect(svc.completeLesson(A, "math", { sessionId: start.sessionId, lessonId: "math-l1", firstTryCorrect: 5 })).rejects.toMatchObject({ code: "lesson_incomplete" });
    expect((await svc.getState(A, "math")).lessons["math-l1"]).toBeUndefined();
  });

  it("keeps lessons locked until the previous one is done", async () => {
    await expect(svc.startSession(A, "math", { kind: "lesson", lessonId: "math-l3" })).rejects.toMatchObject({ code: "lesson_locked", status: 403 });
    const { start } = await playLesson(A, "math-l1");
    await svc.completeLesson(A, "math", { sessionId: start.sessionId, lessonId: "math-l1" });
    await expect(svc.startSession(A, "math", { kind: "lesson", lessonId: "math-l2" })).resolves.toBeTruthy();
  });

  it("rejects an invalid answer shape without recording anything", async () => {
    const start = await svc.startSession(A, "math", { kind: "lesson", lessonId: "math-l1" });
    await expect(svc.submitAttempt(A, "math", { questionId: "m-expr-1", sessionId: start.sessionId, answer: { evil: true } })).rejects.toMatchObject({ code: "invalid_choice" });
    expect(store.eventLog).toHaveLength(0);
    expect((await svc.getState(A, "math")).totalXp).toBe(0);
  });
});

describe("authorization & isolation", () => {
  it("student A cannot use student B's session, and their data stays separate", async () => {
    const start = await svc.startSession(A, "math", { kind: "lesson", lessonId: "math-l1" });
    const b = await bundle();
    const q = b.questions.find((x) => x.id === "m-expr-1")!;
    await expect(svc.submitAttempt(B, "math", { questionId: q.id, sessionId: start.sessionId, answer: correctFor(q) })).rejects.toMatchObject({ status: 403 });
    await expect(svc.completeLesson(B, "math", { sessionId: start.sessionId, lessonId: "math-l1" })).rejects.toMatchObject({ status: 403 });

    await playLesson(A, "math-l1");
    expect((await svc.getState(A, "math")).totalXp).toBeGreaterThan(0);
    const bState = await svc.getState(B, "math");
    expect(bState.totalXp).toBe(0);
    expect(bState.mastery).toEqual({});
    expect(bState.lessons).toEqual({});
  });

  it("a session cannot be used on the other site", async () => {
    const start = await svc.startSession(A, "math", { kind: "lesson", lessonId: "math-l1" });
    await expect(svc.submitAttempt(A, "english", { questionId: "e-vocab-1", sessionId: start.sessionId, answer: "a" })).rejects.toMatchObject({ status: 403 });
  });

  it("rejects malformed session ids", async () => {
    await expect(svc.submitAttempt(A, "math", { questionId: "m-expr-1", sessionId: "../../x", answer: "7" })).rejects.toMatchObject({ code: "invalid_session" });
  });

  it("math and english progress are separate but share the engine", async () => {
    await playLesson(A, "math-l1");
    const en = await playLesson(A, "en-l1", { site: "english" });
    await svc.completeLesson(A, "english", { sessionId: en.start.sessionId, lessonId: "en-l1" });
    expect((await svc.getState(A, "english")).lessons["en-l1"].completions).toBe(1);
    expect(Object.keys((await svc.getState(A, "math")).lessons)).not.toContain("en-l1");
  });
});

describe("guest (demo) mode", () => {
  it("works without a store, carrying state in the request", async () => {
    const guest: Actor = { userId: null, guestState: null };
    const start = await svc.startSession(guest, "math", { kind: "lesson", lessonId: "math-l1" });
    const b = await bundle();
    const q = b.questions.find((x) => x.id === "m-expr-1")!;
    const r = await svc.submitAttempt(guest, "math", { questionId: q.id, sessionId: start.sessionId, answer: correctFor(q) });
    expect(r.correct).toBe(true);
    expect(r.state.totalXp).toBe(10);
    // Second request carries the returned state; replaying the same correct answer stays idempotent.
    const again = await svc.submitAttempt({ userId: null, guestState: r.state }, "math", { questionId: q.id, sessionId: start.sessionId, answer: correctFor(q) });
    expect(again.state.totalXp).toBe(10);
  });

  it("sanitises a tampered guest state instead of crashing", async () => {
    const st = await svc.getState({ userId: null, guestState: { site: "math", totalXp: "lots", mastery: { x: 5 }, lessons: 7, streak: null } }, "math");
    expect(st.totalXp).toBe(0);
    expect(st.mastery).toEqual({});
  });

  it("validates onboarding input", async () => {
    await expect(svc.saveOnboarding({ userId: null }, "math", { nickname: "<b>", grade: "M1", goal: "habit", avatar: "fox" })).rejects.toMatchObject({ code: "invalid_nickname" });
    await expect(svc.saveOnboarding({ userId: null }, "math", { nickname: "민수", grade: "X9", goal: "habit", avatar: "fox" })).rejects.toMatchObject({ code: "invalid_grade" });
    const st = await svc.saveOnboarding(A, "math", { nickname: "민수", grade: "M2", goal: "habit", avatar: "fox" });
    expect(st.profile?.grade).toBe("M2");
  });
});

describe("diagnostic service", () => {
  it("runs a full placement, persists it, and never returns answers", async () => {
    await svc.saveOnboarding(A, "math", { nickname: "민수", grade: "M1", goal: "fill_gaps", avatar: "fox" });
    const b = await bundle();
    let history: { questionId: string; correct: boolean }[] = [];
    let step = await svc.diagnosticStep(A, "math", { history });
    let guard = 0;
    while (!step.done && guard++ < 10) {
      expect(JSON.stringify(step)).not.toContain('"answer"');
      const q = b.questions.find((x) => x.id === step.next!.id)!;
      step = await svc.diagnosticStep(A, "math", { history, answer: { questionId: q.id, value: correctFor(q) } });
      history = [...history, { questionId: q.id, correct: true }];
    }
    expect(step.done).toBe(true);
    const state = await svc.getState(A, "math");
    expect(state.diagnosticDone).toBe(true);
    expect(Object.keys(state.mastery).length).toBeGreaterThan(0);
    expect(state.totalXp).toBe(30);
  });
});
