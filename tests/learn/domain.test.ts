import { describe, expect, it } from "vitest";
import { checkAnswer, parseNumeric, validateResponse } from "@/lib/learn/domain/answers";
import { levelForXp, levelProgress, xpForLevel } from "@/lib/learn/domain/level";
import { effectiveMastery, masteryLabel, newMastery, updateMastery } from "@/lib/learn/domain/mastery";
import { displayStreak, newStreak, recordActivity } from "@/lib/learn/domain/streak";
import { intervalDays, scheduleReview } from "@/lib/learn/domain/srs";
import { xpForCorrect } from "@/lib/learn/domain/xp";
import { addDays, dayKey, diffDays } from "@/lib/learn/domain/dates";
import type { Question } from "@/lib/learn/types";

const baseQ: Question = {
  id: "q", site: "math", skillId: "s", type: "numeric", difficulty: 2, prompt: "p",
  answer: { kind: "numeric", value: 4 }, hints: ["a", "b"], explanation: "e", role: "core", status: "PUBLISHED",
};

describe("answer checking", () => {
  it("parses numbers, fractions and x= forms", () => {
    expect(parseNumeric("12")).toBe(12);
    expect(parseNumeric(" −3.5 ")).toBe(-3.5);
    expect(parseNumeric("3/4")).toBe(0.75);
    expect(parseNumeric("x = -4")).toBe(-4);
    expect(parseNumeric("1/0")).toBeNull();
    expect(parseNumeric("abc")).toBeNull();
    expect(parseNumeric("1e3")).toBeNull();
  });
  it("checks numeric answers, tolerating equivalent forms", () => {
    expect(checkAnswer(baseQ, "4")).toBe(true);
    expect(checkAnswer(baseQ, "x=4")).toBe(true);
    expect(checkAnswer(baseQ, "8/2")).toBe(true);
    expect(checkAnswer(baseQ, "5")).toBe(false);
    expect(checkAnswer(baseQ, "")).toBe(false);
  });
  it("checks text answers case-insensitively and ignores trailing punctuation", () => {
    const q: Question = { ...baseQ, type: "fill_blank", answer: { kind: "text", accepted: ["goes"] } };
    expect(checkAnswer(q, " Goes. ")).toBe(true);
    expect(checkAnswer(q, "go")).toBe(false);
  });
  it("checks choice, multi-select and ordering", () => {
    const mc: Question = { ...baseQ, type: "multiple_choice", options: [{ id: "a", text: "1" }, { id: "b", text: "2" }], answer: { kind: "choice", id: "b" } };
    expect(checkAnswer(mc, "b")).toBe(true);
    expect(checkAnswer(mc, "a")).toBe(false);
    expect(validateResponse(mc, "zzz")).not.toBeNull();
    const ms: Question = { ...mc, type: "multiple_select", answer: { kind: "choices", ids: ["a", "b"] } };
    expect(checkAnswer(ms, ["b", "a"])).toBe(true);
    expect(checkAnswer(ms, ["a"])).toBe(false);
    const ord: Question = { ...mc, type: "ordering", answer: { kind: "order", ids: ["b", "a"] } };
    expect(checkAnswer(ord, ["b", "a"])).toBe(true);
    expect(checkAnswer(ord, ["a", "b"])).toBe(false);
    expect(validateResponse(ord, ["a", "a"])).not.toBeNull();
  });
  it("rejects oversized or wrong-typed responses", () => {
    expect(validateResponse(baseQ, "x".repeat(500))).not.toBeNull();
    expect(validateResponse(baseQ, { a: 1 })).not.toBeNull();
    expect(validateResponse(baseQ, ["1"])).not.toBeNull();
  });
});

describe("level curve", () => {
  it("is monotonic and derived from XP", () => {
    expect(levelForXp(0)).toBe(1);
    expect(xpForLevel(1)).toBe(0);
    for (let l = 1; l < 30; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
    expect(levelForXp(xpForLevel(5))).toBe(5);
    expect(levelForXp(xpForLevel(5) - 1)).toBe(4);
    const p = levelProgress(xpForLevel(3) + 10);
    expect(p.level).toBe(3);
    expect(p.xpIntoLevel).toBe(10);
    expect(p.ratio).toBeGreaterThan(0);
  });
});

describe("mastery", () => {
  const now = new Date("2026-01-10T00:00:00Z");
  const step = (m = newMastery("s"), o: Partial<Parameters<typeof updateMastery>[1]> = {}) =>
    updateMastery(m, { correct: true, difficulty: 3, hintsUsed: 0, timeMs: 10000, repeatedRecently: false, firstTry: true, now, ...o });

  it("never reaches 100 from a single correct answer", () => {
    const m = step();
    expect(m.score).toBeGreaterThan(0);
    expect(m.score).toBeLessThan(30);
  });
  it("grows with repeated success but stays bounded", () => {
    let m = newMastery("s");
    for (let i = 0; i < 40; i++) m = step(m, { difficulty: 4 });
    expect(m.score).toBeGreaterThan(90);
    expect(m.score).toBeLessThanOrEqual(100);
  });
  it("hints, late success and repetition reduce the gain", () => {
    const clean = step().score;
    expect(step(undefined, { hintsUsed: 2 }).score).toBeLessThan(clean);
    expect(step(undefined, { firstTry: false }).score).toBeLessThan(clean);
    expect(step(undefined, { repeatedRecently: true }).score).toBeLessThan(clean);
    expect(step(undefined, { difficulty: 5 }).score).toBeGreaterThan(step(undefined, { difficulty: 1 }).score);
  });
  it("penalises a wrong answer mildly, more on easy questions", () => {
    const start = { ...newMastery("s"), score: 60, attempts: 5, lastPracticedAt: now.toISOString() };
    const easy = step(start, { correct: false, difficulty: 1 });
    const hard = step(start, { correct: false, difficulty: 5 });
    expect(easy.score).toBeLessThan(60);
    expect(easy.score).toBeGreaterThan(40);
    expect(hard.score).toBeGreaterThan(easy.score);
  });
  it("decays with time but never below the floor", () => {
    const m = { ...newMastery("s"), score: 80, lastPracticedAt: "2026-01-01T00:00:00Z", box: 0 };
    expect(effectiveMastery(m, new Date("2026-01-05T00:00:00Z"))).toBe(80);
    const later = effectiveMastery(m, new Date("2026-02-15T00:00:00Z"));
    expect(later).toBeLessThan(80);
    expect(later).toBeGreaterThanOrEqual(80 * 0.6 - 0.001);
  });
  it("labels bands without negative wording keys", () => {
    expect(masteryLabel(95)).toBe("mastered");
    expect(masteryLabel(80)).toBe("strong");
    expect(masteryLabel(60)).toBe("learning");
    expect(masteryLabel(10)).toBe("growth");
  });
});

describe("spaced repetition", () => {
  it("advances the box on success and resets on a miss", () => {
    const now = new Date("2026-01-10T00:00:00Z");
    let m = { ...newMastery("s"), score: 70 };
    m = scheduleReview(m, true, now);
    expect(m.box).toBe(1);
    expect(new Date(m.nextReviewAt!).getTime() - now.getTime()).toBe(1 * 86400000);
    m = scheduleReview({ ...m, box: 3 }, false, now);
    expect(m.box).toBe(1);
  });
  it("stretches intervals for strong skills and shrinks for weak ones", () => {
    expect(intervalDays(2, 95)).toBeGreaterThan(intervalDays(2, 65));
    expect(intervalDays(2, 30)).toBeLessThan(intervalDays(2, 65));
  });
});

describe("streak", () => {
  it("counts consecutive days and ignores same-day repeats", () => {
    let s = recordActivity(newStreak(), "2026-03-01");
    s = recordActivity(s, "2026-03-01");
    expect(s.current).toBe(1);
    s = recordActivity(s, "2026-03-02");
    expect(s.current).toBe(2);
  });
  it("earns a freeze at 7 days and uses it to survive one missed day", () => {
    let s = newStreak();
    for (let i = 0; i < 7; i++) s = recordActivity(s, addDays("2026-03-01", i));
    expect(s.current).toBe(7);
    expect(s.freezes).toBe(1);
    s = recordActivity(s, addDays("2026-03-01", 8)); // missed the 8th
    expect(s.current).toBe(8);
    expect(s.freezes).toBe(0);
  });
  it("restarts but keeps the best when the gap is too large", () => {
    let s = recordActivity(newStreak(), "2026-03-01");
    s = recordActivity(s, "2026-03-02");
    s = recordActivity(s, "2026-03-10");
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
    expect(displayStreak(s, "2026-03-15")).toBe(0);
  });
  it("computes day keys in the configured timezone", () => {
    expect(dayKey(new Date("2026-03-01T16:00:00Z"))).toBe("2026-03-02"); // KST
    expect(diffDays("2026-03-01", "2026-03-04")).toBe(3);
  });
});

describe("xp rules", () => {
  const ctx = { difficulty: 2 as const, hintsUsed: 0, firstTry: true, isReview: false, skillMastery: 30, rewardsToday: 0, xpToday: 0 };
  it("rewards hard questions more and hints less", () => {
    expect(xpForCorrect({ ...ctx, difficulty: 4 })).toBeGreaterThan(xpForCorrect(ctx));
    expect(xpForCorrect({ ...ctx, hintsUsed: 2 })).toBeLessThan(xpForCorrect(ctx));
  });
  it("blocks farming: repeats, too-easy on mastered skills and the daily soft cap", () => {
    expect(xpForCorrect({ ...ctx, rewardsToday: 1 })).toBeLessThan(xpForCorrect(ctx));
    expect(xpForCorrect({ ...ctx, rewardsToday: 2 })).toBe(0);
    expect(xpForCorrect({ ...ctx, skillMastery: 95, difficulty: 1 })).toBeLessThan(xpForCorrect(ctx));
    expect(xpForCorrect({ ...ctx, xpToday: 10_000 })).toBeLessThan(xpForCorrect(ctx));
  });
  it("gives a smaller reward for understanding after a mistake", () => {
    expect(xpForCorrect({ ...ctx, firstTry: false })).toBeLessThan(xpForCorrect(ctx));
    expect(xpForCorrect({ ...ctx, firstTry: false })).toBeGreaterThan(0);
  });
});
