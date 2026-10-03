import { beforeEach, describe, expect, it } from "vitest";
import { LearnService, type Actor } from "@/lib/learn/server/service";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnError } from "@/lib/learn/server/errors";
import { loadIndex } from "@/lib/learn/content/repository";
import { buildPath } from "@/lib/learn/domain/path";
import { ELEMENTARY_GRADES, SITES, type ContentBundle, type Grade, type Question, type Site } from "@/lib/learn/types";

/**
 * Elementary grades and the Vietnamese locale run through the SAME server authority as middle / high Korean mode: the server picks the
 * curriculum from the student's saved grade, judges every answer itself, awards XP once, and never trusts the client.
 */
const NOW = new Date("2026-03-01T03:00:00Z");
const HANGUL = /[가-힣]/;
let store: MemoryLearnStore;
let svc: LearnService;
let n = 0;

beforeEach(() => {
  store = new MemoryLearnStore();
  n = 0;
  svc = new LearnService({ store, now: () => NOW, newId: () => `session-${String(++n).padStart(4, "0")}` });
});

const key = (q: Question): string | string[] => {
  const k = q.answer;
  return k.kind === "choice" ? k.id : k.kind === "numeric" ? String(k.value) : k.kind === "text" ? k.accepted[0] : k.ids;
};
const wrong = (q: Question): string | string[] => {
  if (q.type === "numeric") return "987654";
  if (q.type === "true_false") return q.answer.kind === "choice" && q.answer.id === "true" ? "false" : "true";
  if (q.type === "multiple_choice") return q.options!.find((o) => q.answer.kind === "choice" && o.id !== q.answer.id)!.id;
  if (q.type === "ordering" && q.answer.kind === "order") return [...q.answer.ids].reverse();
  return "zzz";
};
const user = (id: string, locale?: "ko" | "vi"): Actor => ({ userId: id, locale });

async function onboard(actor: Actor, site: Site, grade: Grade) {
  return svc.saveOnboarding(actor, site, { nickname: "테스터", grade, goal: "habit", avatar: "fox" });
}
async function fullBundle(site: Site): Promise<ContentBundle> {
  return (await loadIndex(site)).bundle;
}
/** Runs the 6-question adaptive placement with every answer correct, like a real student would. */
async function placement(actor: Actor, site: Site) {
  const bundle = await fullBundle(site);
  let history: { questionId: string; correct: boolean }[] = [];
  let step = await svc.diagnosticStep(actor, site, { history: [] });
  const asked: string[] = [];
  for (let i = 0; i < 6 && !step.done; i++) {
    const q = bundle.questions.find((x) => x.id === (step as { next: { id: string } }).next.id)!;
    asked.push(q.id);
    step = await svc.diagnosticStep(actor, site, { history, answer: { questionId: q.id, value: key(q) } });
    history = [...history, { questionId: q.id, correct: true }];
  }
  return { step, asked };
}
async function currentLesson(actor: Actor, site: Site, grade: Grade) {
  const state = await svc.getState(actor, site);
  const { index } = await loadIndex(site, { grade });
  const node = buildPath(state, index).find((x) => x.status === "current")!;
  return { lessonId: node.lessonId, index, state };
}

describe.each(SITES)("elementary flows: %s", (site) => {
  it.each([...ELEMENTARY_GRADES])("grade %s: onboarding saves the grade, placement draws only that grade's questions, the lesson earns XP and mastery", async (grade) => {
    const actor = user(`student-${grade}`);
    const saved = await onboard(actor, site, grade);
    expect(saved.profile?.grade).toBe(grade);

    const { step, asked } = await placement(actor, site);
    expect(asked).toHaveLength(6);
    for (const id of asked) expect(id.includes(`-${grade.toLowerCase()}-`), `${grade} placement question ${id}`).toBe(true);
    expect(step.done).toBe(true);
    const afterPlacement = await svc.getState(actor, site);
    expect(afterPlacement.totalXp).toBe(30); // the welcome bonus, paid once

    const { lessonId, index } = await currentLesson(actor, site, grade);
    expect(lessonId.startsWith(site === "math" ? `math-${grade.toLowerCase()}-` : `en-${grade.toLowerCase()}-`)).toBe(true);
    const bundle = await fullBundle(site);
    const start = await svc.startSession(actor, site, { kind: "lesson", lessonId });
    expect(JSON.stringify(start)).not.toMatch(/"answer"|"explanation"|"hints"/); // server-only fields never reach the browser
    expect(start.questions).toHaveLength(5);
    let xp = 0;
    for (const pq of start.questions) {
      const q = bundle.questions.find((x) => x.id === pq.id)!;
      const r = await svc.submitAttempt(actor, site, { questionId: q.id, sessionId: start.sessionId, answer: key(q) });
      expect(r.correct).toBe(true);
      xp += r.delta.xp;
    }
    const done = await svc.completeLesson(actor, site, { sessionId: start.sessionId, lessonId });
    xp += done.delta.xp;
    expect(done.delta.xp).toBeGreaterThan(0);
    const state = await svc.getState(actor, site);
    expect(state.totalXp).toBe(30 + xp);
    expect(state.lessons[lessonId].completions).toBe(1);
    const skill = index.lessons.get(lessonId)!.lesson.skillIds[0];
    expect(state.mastery[skill]?.attempts ?? 0).toBeGreaterThan(0);
  });

  it("a grade-E1 student cannot reach another grade's or the secondary course (lessons, questions)", async () => {
    const actor = user("student-iso");
    await onboard(actor, site, "E1");
    const other = site === "math" ? ["math-e2-l1", "math-l1"] : ["en-e2-l1", "en-l1"];
    for (const lessonId of other) await expect(svc.startSession(actor, site, { kind: "lesson", lessonId })).rejects.toMatchObject({ code: "unknown_lesson" });
    const { lessonId } = await currentLesson(actor, site, "E1");
    const start = await svc.startSession(actor, site, { kind: "lesson", lessonId });
    const bundle = await fullBundle(site);
    const foreign = bundle.questions.find((q) => !q.id.includes("-e1-") && q.role === "core")!;
    await expect(svc.submitAttempt(actor, site, { questionId: foreign.id, sessionId: start.sessionId, answer: key(foreign) })).rejects.toMatchObject({ code: "unknown_question" });
  });

  it("middle / high students are unaffected: the secondary course, exactly as before", async () => {
    const actor = user("student-m1");
    await onboard(actor, site, "M1");
    const { lessonId } = await currentLesson(actor, site, "M1");
    expect(lessonId).toBe(site === "math" ? "math-l1" : "en-l1");
    const start = await svc.startSession(actor, site, { kind: "lesson", lessonId });
    expect(start.questions).toHaveLength(5);
    await expect(svc.startSession(actor, site, { kind: "lesson", lessonId: site === "math" ? "math-e1-l1" : "en-e1-l1" })).rejects.toMatchObject({ code: "unknown_lesson" });
  });

  it("changing the grade re-scopes the curriculum without creating a second identity", async () => {
    const actor = user("student-regrade");
    await onboard(actor, site, "E1");
    const first = (await currentLesson(actor, site, "E1")).lessonId;
    await onboard(actor, site, "E4");
    const state = await svc.getState(actor, site);
    expect(state.profile?.grade).toBe("E4");
    expect((await currentLesson(actor, site, "E4")).lessonId).not.toBe(first);
    await expect(svc.startSession(actor, site, { kind: "lesson", lessonId: first })).rejects.toMatchObject({ code: "unknown_lesson" });
  });
});

describe("server authority is the same for elementary and Vietnamese mode", () => {
  async function begin(actor: Actor, site: Site = "math", grade: Grade = "E2") {
    await onboard(actor, site, grade);
    const { lessonId } = await currentLesson(actor, site, grade);
    const bundle = await fullBundle(site);
    const start = await svc.startSession(actor, site, { kind: "lesson", lessonId });
    const qs = start.questions.map((p) => bundle.questions.find((x) => x.id === p.id)!);
    return { lessonId, start, qs };
  }

  it("the server judges the answer: forged client fields (correct / xp / delta / state) change nothing", async () => {
    const A = user("authority-a", "vi");
    const { start, qs } = await begin(A);
    const q = qs[0];
    const before = (await svc.getState(A, "math")).totalXp;
    const r = await svc.submitAttempt(A, "math", { questionId: q.id, sessionId: start.sessionId, answer: wrong(q), correct: true, xp: 99999, delta: { xp: 99999 }, state: { totalXp: 99999 } } as never);
    expect(r.correct).toBe(false);
    expect(r.delta.xp).toBe(0);
    expect((await svc.getState(A, "math")).totalXp).toBe(before);
  });

  it("a replayed correct attempt is rejected; completion pays once and a replay pays nothing", async () => {
    const A = user("idem-a", "vi");
    const { lessonId, start, qs } = await begin(A);
    let xp = 0;
    for (const q of qs) xp += (await svc.submitAttempt(A, "math", { questionId: q.id, sessionId: start.sessionId, answer: key(q) })).delta.xp;
    await expect(svc.submitAttempt(A, "math", { questionId: qs[0].id, sessionId: start.sessionId, answer: key(qs[0]) })).rejects.toMatchObject({ code: "already_resolved" });
    const first = await svc.completeLesson(A, "math", { sessionId: start.sessionId, lessonId });
    const total = (await svc.getState(A, "math")).totalXp;
    expect(first.delta.xp).toBeGreaterThan(0);
    const again = await svc.completeLesson(A, "math", { sessionId: start.sessionId, lessonId });
    expect(again.delta.xp).toBe(0);
    expect((await svc.getState(A, "math")).totalXp).toBe(total);
    expect(total).toBe(xp + first.delta.xp);
    // the XP ledger holds one entry per event: nothing was awarded twice
    const ledger = (store as unknown as { ledger?: unknown[] }).ledger;
    if (Array.isArray(ledger)) expect(new Set(ledger.map((e) => JSON.stringify(e))).size).toBe(ledger.length);
  });

  it("another student cannot read or write this student's session", async () => {
    const A = user("owner-a");
    const B = user("intruder-b");
    const { lessonId, start, qs } = await begin(A);
    await onboard(B, "math", "E2");
    await expect(svc.submitAttempt(B, "math", { questionId: qs[0].id, sessionId: start.sessionId, answer: key(qs[0]) })).rejects.toMatchObject({ code: "invalid_session", status: 403 });
    await expect(svc.completeLesson(B, "math", { sessionId: start.sessionId, lessonId })).rejects.toMatchObject({ status: 403 });
    expect((await svc.getState(B, "math")).totalXp).toBe(0);
  });

  it("completion before every question is resolved is refused (the client cannot claim a finished lesson)", async () => {
    const A = user("early-a");
    const { lessonId, start, qs } = await begin(A);
    await svc.submitAttempt(A, "math", { questionId: qs[0].id, sessionId: start.sessionId, answer: key(qs[0]) });
    await expect(svc.completeLesson(A, "math", { sessionId: start.sessionId, lessonId, firstTryCorrect: 5 })).rejects.toMatchObject({ code: "lesson_incomplete", status: 409 });
  });

  it("an invalid grade is rejected when saving the profile", async () => {
    for (const grade of ["E0", "E7", "X1", "", null, 3]) {
      await expect(svc.saveOnboarding(user("bad-grade"), "math", { nickname: "테스터", grade, goal: "habit", avatar: "fox" })).rejects.toBeInstanceOf(LearnError);
    }
  });
});

describe("Vietnamese mode through the service", () => {
  it("serves Vietnamese prompts, hints and explanations for elementary math, with identical grading and XP to Korean mode", async () => {
    const run = async (locale: "ko" | "vi") => {
      const local = new LearnService({ store: new MemoryLearnStore(), now: () => NOW, newId: () => "session-vi-0001" });
      const actor: Actor = { userId: `loc-${locale}`, locale };
      await local.saveOnboarding(actor, "math", { nickname: "An An", grade: "E3", goal: "habit", avatar: "fox" });
      const state0 = await local.getState(actor, "math");
      const { index } = await loadIndex("math", { grade: "E3", locale });
      const lessonId = buildPath(state0, index).find((x) => x.status === "current")!.lessonId;
      const bundle = (await loadIndex("math", { grade: "E3", locale })).bundle;
      const start = await local.startSession(actor, "math", { kind: "lesson", lessonId });
      const first = start.questions[0];
      const hint = await local.requestHint(actor, "math", { questionId: first.id, level: 1 });
      let deltas: number[] = [];
      let feedbackText = "";
      for (const pq of start.questions) {
        const q = bundle.questions.find((x) => x.id === pq.id)!;
        const r = await local.submitAttempt(actor, "math", { questionId: q.id, sessionId: start.sessionId, answer: key(q) });
        deltas.push(r.delta.xp);
        feedbackText += r.feedback.explanation ?? "";
      }
      return { start, hint, deltas, feedbackText, state: await local.getState(actor, "math") };
    };
    const ko = await run("ko");
    const vi = await run("vi");
    expect(vi.deltas).toEqual(ko.deltas); // XP is computed from the attempt, not from the language
    expect(vi.state.totalXp).toBe(ko.state.totalXp);
    expect(vi.start.questions.map((q) => q.id)).toEqual(ko.start.questions.map((q) => q.id));
    expect(vi.start.questions.some((q) => HANGUL.test(q.prompt))).toBe(false);
    expect(ko.start.questions.some((q) => HANGUL.test(q.prompt))).toBe(true);
    expect(HANGUL.test(vi.hint.hint)).toBe(false);
    expect(HANGUL.test(ko.hint.hint)).toBe(true);
    expect(HANGUL.test(vi.feedbackText)).toBe(false);
    expect(vi.feedbackText.length).toBeGreaterThan(0);
  });

  it("the English subject shows Vietnamese instructions but the English sentence and the accepted answer stay English", async () => {
    const A: Actor = { userId: "vi-english", locale: "vi" };
    await svc.saveOnboarding(A, "english", { nickname: "An An", grade: "E3", goal: "habit", avatar: "fox" });
    const { lessonId } = await currentLesson(A, "english", "E3");
    const start = await svc.startSession(A, "english", { kind: "lesson", lessonId });
    const bundle = (await loadIndex("english", { grade: "E3", locale: "vi" })).bundle;
    for (const pq of start.questions) {
      expect(HANGUL.test(pq.prompt), pq.prompt).toBe(false);
      for (const o of pq.options ?? []) expect(HANGUL.test(o.text), o.text).toBe(false);
    }
    const text = bundle.questions.find((q) => q.answer.kind === "text");
    if (text && text.answer.kind === "text") expect(text.answer.accepted.every((a) => !HANGUL.test(a) && /^[\x00-\x7f]+$/.test(a))).toBe(true);
    const q = bundle.questions.find((x) => start.questions[0].id === x.id)!;
    const r = await svc.submitAttempt(A, "english", { questionId: q.id, sessionId: start.sessionId, answer: key(q) });
    expect(r.correct).toBe(true);
  });

  it("an unknown or missing locale behaves as Korean", async () => {
    const A: Actor = { userId: "no-locale" };
    await onboard(A, "math", "E1");
    const { lessonId } = await currentLesson(A, "math", "E1");
    const start = await svc.startSession(A, "math", { kind: "lesson", lessonId });
    expect(start.questions.some((q) => HANGUL.test(q.prompt))).toBe(true);
  });
});
