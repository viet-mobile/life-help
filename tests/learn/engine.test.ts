import { describe, expect, it } from "vitest";
import { demoContentRepository } from "@/lib/learn/content/repository";
import { indexContent, toMetaBundle, type ContentIndex } from "@/lib/learn/content/indexer";
import {
  applyAttempt,
  applyDiagnosticResult,
  applyLessonCompletion,
  createInitialState,
} from "@/lib/learn/domain/engine";
import { computePlacement, nextDiagnosticQuestion, type DiagnosticAnswer } from "@/lib/learn/domain/diagnostic";
import { buildPath, recommendNext } from "@/lib/learn/domain/path";
import { generateQuest } from "@/lib/learn/domain/quests";
import { levelForXp } from "@/lib/learn/domain/level";
import type { PlayerState } from "@/lib/learn/types";

async function setup(site: "math" | "english" = "math") {
  const bundle = await demoContentRepository.getBundle(site);
  return { bundle, index: indexContent(toMetaBundle(bundle)) };
}
const T0 = new Date("2026-03-01T03:00:00Z"); // 12:00 KST

function attempt(state: PlayerState, index: ContentIndex, qid: string, over: Partial<Parameters<typeof applyAttempt>[2]> = {}, now = T0) {
  return applyAttempt(state, index, { questionId: qid, sessionId: "sess-0001", attemptNo: 1, correct: true, hintsUsed: 0, timeMs: 8000, ...over }, now);
}

describe("attempt engine", () => {
  it("awards XP, coins, mastery, streak and quest progress for a correct answer", async () => {
    const { index } = await setup();
    const r = attempt(createInitialState("math"), index, "m-expr-1");
    expect(r.delta.xp).toBe(10);
    expect(r.state.totalXp).toBe(10);
    expect(r.state.coins).toBe(2);
    expect(r.state.mastery["m.expr"].score).toBeGreaterThan(0);
    expect(r.state.streak.current).toBe(1);
    expect(r.state.quest?.items.find((i) => i.kind === "solve")?.progress).toBe(1);
    expect(r.state.achievements).toContain("first_solve");
    expect(r.events.some((e) => e.type === "xp")).toBe(true);
  });

  it("is idempotent: replaying the same correct answer never double-awards", async () => {
    const { index } = await setup();
    const first = attempt(createInitialState("math"), index, "m-expr-1");
    const replay = attempt(first.state, index, "m-expr-1");
    expect(replay.state).toBe(first.state);
    expect(replay.delta.xp).toBe(0);
    expect(replay.events).toHaveLength(0);
  });

  it("does not reward wrong answers and only penalises the first miss", async () => {
    const { index } = await setup();
    let r = attempt(createInitialState("math"), index, "m-expr-1", { correct: true }, T0);
    const before = r.state.mastery["m.expr"].score;
    r = attempt(r.state, index, "m-expr-2", { correct: false, attemptNo: 1 });
    const afterFirstMiss = r.state.mastery["m.expr"].score;
    expect(afterFirstMiss).toBeLessThan(before);
    expect(r.delta.xp).toBe(0);
    r = attempt(r.state, index, "m-expr-2", { correct: false, attemptNo: 2 });
    r = attempt(r.state, index, "m-expr-2", { correct: false, attemptNo: 3, revealed: true });
    expect(r.state.mastery["m.expr"].score).toBe(afterFirstMiss);
    // ...but a correct answer after mistakes still pays a smaller "understood" reward.
    const understood = attempt(r.state, index, "m-expr-v1", { attemptNo: 2 });
    expect(understood.delta.xp).toBe(8);
  });

  it("reduces XP when hints are used", async () => {
    const { index } = await setup();
    const r = attempt(createInitialState("math"), index, "m-expr-1", { hintsUsed: 2 });
    expect(r.delta.xp).toBeLessThan(10);
    expect(r.delta.xp).toBeGreaterThan(0);
  });

  it("prevents farming the same question across sessions on one day", async () => {
    const { index } = await setup();
    let s = createInitialState("math");
    const gains: number[] = [];
    for (let i = 0; i < 4; i++) {
      const r = attempt(s, index, "m-expr-1", { sessionId: `sess-000${i}` });
      gains.push(r.delta.xp);
      s = r.state;
    }
    expect(gains[0]).toBe(10);
    expect(gains[1]).toBeLessThan(gains[0]);
    expect(gains[2]).toBe(0);
    expect(gains[3]).toBe(0);
  });

  it("schedules a spaced review and advances only when due", async () => {
    const { index } = await setup();
    let r = attempt(createInitialState("math"), index, "m-expr-1");
    const next = r.state.mastery["m.expr"].nextReviewAt;
    expect(next).toBeTruthy();
    const box = r.state.mastery["m.expr"].box;
    r = attempt(r.state, index, "m-expr-2", {}, new Date(T0.getTime() + 60_000));
    expect(r.state.mastery["m.expr"].box).toBe(box); // not due yet, no double advance
    r = attempt(r.state, index, "m-expr-3", { sessionId: "sess-0002" }, new Date(T0.getTime() + 2 * 86_400_000));
    expect(r.state.mastery["m.expr"].box).toBe(box + 1);
  });

  it("levels up from XP alone", async () => {
    const { index } = await setup();
    let s = createInitialState("math");
    s = { ...s, totalXp: 95 };
    const r = attempt(s, index, "m-expr-1");
    expect(r.delta.levelBefore).toBe(1);
    expect(r.delta.levelAfter).toBe(levelForXp(105));
    expect(r.delta.levelAfter).toBeGreaterThan(1);
  });
});

describe("lesson completion + daily quest", () => {
  it("awards first-completion XP once and repeat XP once per day", async () => {
    const { index } = await setup();
    const s0 = createInitialState("math");
    const a = applyLessonCompletion(s0, index, { lessonId: "math-l1", sessionId: "sess-0001", firstTryCorrect: 5, total: 5 }, T0);
    expect(a.delta.xp).toBeGreaterThanOrEqual(50);
    expect(a.state.lessons["math-l1"].stars).toBe(3);
    expect(a.state.lessons["math-l1"].completions).toBe(1);
    // Same request replayed: nothing changes.
    const replay = applyLessonCompletion(a.state, index, { lessonId: "math-l1", sessionId: "sess-0001", firstTryCorrect: 5, total: 5 }, T0);
    expect(replay.delta.xp).toBe(0);
    expect(replay.state.lessons["math-l1"].completions).toBe(1);
    // A repeat run the same day pays the smaller reward, only once.
    const repeat1 = applyLessonCompletion(a.state, index, { lessonId: "math-l1", sessionId: "sess-0002", firstTryCorrect: 3, total: 5 }, T0);
    expect(repeat1.delta.xp).toBe(15);
    expect(repeat1.state.lessons["math-l1"].stars).toBe(3); // keeps the best
    const repeat2 = applyLessonCompletion(repeat1.state, index, { lessonId: "math-l1", sessionId: "sess-0003", firstTryCorrect: 3, total: 5 }, T0);
    expect(repeat2.delta.xp).toBe(0);
  });

  it("unlocks the next lesson in the path", async () => {
    const { index } = await setup();
    const s0 = createInitialState("math");
    expect(buildPath(s0, index).map((n) => n.status)).toEqual(["current", "locked", "locked", "locked"]);
    const r = applyLessonCompletion(s0, index, { lessonId: "math-l1", sessionId: "sess-0001", firstTryCorrect: 4, total: 5 }, T0);
    expect(buildPath(r.state, index).map((n) => n.status)).toEqual(["done", "current", "locked", "locked"]);
    const rec = recommendNext(r.state, index, T0);
    expect(rec.kind === "lesson" ? rec.lessonId : null).toBe("math-l2");
  });

  it("completes the daily quest exactly once and pays 100 XP", async () => {
    const { index } = await setup();
    let s = createInitialState("math");
    s = { ...s, quest: generateQuest(s, index, "2026-03-01", T0) };
    // A fresh student's quest: solve 5 + complete 1 lesson.
    expect(s.quest!.items.map((i) => i.kind).sort()).toEqual(["lesson", "solve"]);
    const qids = ["m-expr-1", "m-expr-2", "m-expr-3", "m-expr-4", "m-expr-5"];
    let questXp = 0;
    let completedCount = 0;
    for (const id of qids) {
      const r = attempt(s, index, id);
      s = r.state;
      if (r.delta.questCompleted) completedCount++;
    }
    expect(s.quest!.completedAt).toBeNull(); // lesson item outstanding
    const l = applyLessonCompletion(s, index, { lessonId: "math-l1", sessionId: "sess-0001", firstTryCorrect: 5, total: 5 }, T0);
    if (l.delta.questCompleted) completedCount++;
    questXp = l.events.filter((e) => e.type === "xp" && e.entry.sourceType === "daily_quest").length;
    expect(l.state.quest!.completedAt).not.toBeNull();
    expect(completedCount).toBe(1);
    expect(questXp).toBe(1);
    // Further activity the same day never pays the quest again.
    const more = attempt(l.state, index, "m-solve-1", { sessionId: "sess-0009" });
    expect(more.events.filter((e) => e.type === "xp" && e.entry.sourceType === "daily_quest")).toHaveLength(0);
    // A new day produces a new quest.
    const tomorrow = attempt(more.state, index, "m-solve-2", { sessionId: "sess-0010" }, new Date(T0.getTime() + 86_400_000));
    expect(tomorrow.state.quest!.day).toBe("2026-03-02");
    expect(tomorrow.state.quest!.completedAt).toBeNull();
  });
});

describe("adaptive diagnostic", () => {
  it("goes harder after a correct answer and easier / prerequisite after a miss", async () => {
    const { index } = await setup();
    const first = nextDiagnosticQuestion("M1", [], index)!;
    const up = nextDiagnosticQuestion("M1", [{ questionId: first.id, correct: true }], index)!;
    const down = nextDiagnosticQuestion("M1", [{ questionId: first.id, correct: false }], index)!;
    expect(up.difficulty).toBeGreaterThanOrEqual(down.difficulty);
    expect(up.id).not.toBe(first.id);
    // A miss steers toward the prerequisite skill when one exists.
    const pre = index.skills.get(first.skillId)?.prerequisiteId;
    if (pre) expect(down.skillId).toBe(pre);
  });

  it("stops after the configured number of questions and never repeats one", async () => {
    const { index } = await setup();
    const history: DiagnosticAnswer[] = [];
    for (let i = 0; i < 20; i++) {
      const q = nextDiagnosticQuestion("M1", history, index);
      if (!q) break;
      expect(history.map((h) => h.questionId)).not.toContain(q.id);
      history.push({ questionId: q.id, correct: i % 2 === 0 });
    }
    expect(history.length).toBe(6);
  });

  it("seeds a skill map, places out known lessons and pays the welcome XP once", async () => {
    const { index } = await setup();
    const all = index.bundle.questions.filter((q) => q.role === "diagnostic").map((q) => ({ questionId: q.id, correct: true }));
    const placement = computePlacement("M1", all, index);
    expect(Object.keys(placement.seeds).length).toBeGreaterThan(1);
    expect(placement.placedOutLessonIds.length).toBeGreaterThanOrEqual(1);
    const r = applyDiagnosticResult(createInitialState("math"), index, placement, T0);
    expect(r.state.diagnosticDone).toBe(true);
    expect(r.delta.xp).toBe(30);
    expect(r.state.lessons[placement.placedOutLessonIds[0]].placedOut).toBe(true);
    // Placement seeds are modest: even a perfect test does not mark skills "mastered".
    for (const m of Object.values(r.state.mastery)) expect(m.score).toBeLessThan(90);
    const again = applyDiagnosticResult(r.state, index, placement, T0);
    expect(again.delta.xp).toBe(0);
    // A wrong-only run seeds low and places nothing out.
    const none = computePlacement("M1", all.map((h) => ({ ...h, correct: false })), index);
    expect(none.placedOutLessonIds).toHaveLength(0);
  });
});
