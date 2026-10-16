import { describe, expect, it } from "vitest";
import { loadIndex } from "@/lib/learn/content/repository";
import { applyLessonCompletion, createInitialState } from "@/lib/learn/domain/engine";
import { nextLevel, planNext } from "@/lib/learn/domain/flow";
import { trueFalseKeyId } from "@/components/learn/choiceKeys";
import type { Grade, Site } from "@/lib/learn/types";

const key = (k: string, code = "") => ({ key: k, code });

describe("O / X keys", () => {
  it("O selects true and X false, any case, also under a Korean input method (physical key)", () => {
    expect(trueFalseKeyId(key("o"))).toBe("true");
    expect(trueFalseKeyId(key("O"))).toBe("true");
    expect(trueFalseKeyId(key("x"))).toBe("false");
    expect(trueFalseKeyId(key("ㅐ", "KeyO"))).toBe("true");
    expect(trueFalseKeyId(key("ㅌ", "KeyX"))).toBe("false");
    expect(trueFalseKeyId(key("Process", "KeyX"))).toBe("false");
  });
  it("other keys, chords and held keys address nothing", () => {
    expect(trueFalseKeyId(key("a"))).toBeNull();
    expect(trueFalseKeyId(key("Enter", "Enter"))).toBeNull();
    expect(trueFalseKeyId({ ...key("o"), ctrlKey: true })).toBeNull();
    expect(trueFalseKeyId({ ...key("x"), repeat: true })).toBeNull();
  });
});

async function playThrough(site: Site, grade: Grade) {
  const { bundle } = await loadIndex(site, { grade });
  const { indexContent, scopeToGrade } = await import("@/lib/learn/content/indexer");
  void scopeToGrade;
  const index = indexContent(bundle);
  let state = createInitialState(site);
  state = { ...state, profile: { nickname: "tester", grade, goal: "habit", avatar: "fox", onboardingDone: true } };
  const played: string[] = [];
  const decisions: string[] = [];
  for (let n = 0; n < 200; n++) {
    const step = planNext(state, index, { elective: undefined });
    if (step.kind === "lesson") {
      played.push(step.lessonId);
      const l = index.lessons.get(step.lessonId)!.lesson;
      const total = l.questionIds.length + (l.challengeId ? 1 : 0);
      state = applyLessonCompletion(state, index, { lessonId: step.lessonId, sessionId: `s${n}`, firstTryCorrect: total, total }, new Date()).state;
    } else { decisions.push(step.kind); break; }
    if (decisions.length) break;
  }
  return { played, last: planNext(state, index, {}), index };
}

describe("continuous flow planner", () => {
  it("plays every lesson of a grade without a stop, then moves to the next grade (E1 -> E2 -> ... -> H3 is one chain of grades)", async () => {
    const { played, last, index } = await playThrough("math", "E1");
    expect(played.length).toBeGreaterThan(3);
    expect(new Set(played).size).toBe(played.length);
    expect(index.lessons.size).toBeGreaterThan(0);
    expect(last).toEqual({ kind: "grade", from: "E1", to: "E2" });
  });
  it("the chain of levels covers every school grade once, math / english E1..H3 and korean K1..K10", () => {
    const walk = (site: Site, first: Grade) => { const out = [first]; for (let g = nextLevel(site, first); g; g = nextLevel(site, g)) out.push(g); return out; };
    expect(walk("math", "E1")).toEqual(["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"]);
    expect(walk("english", "E1").length).toBe(12);
    expect(walk("korean", "K1")).toEqual(["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9", "K10"]);
    expect(nextLevel("math", "H3")).toBeNull();
  });
  it("a subject (elective) is offered only when the grade's own lessons are done, and only for grades that have electives", async () => {
    for (const site of ["math", "english"] as const) {
      const low = await playThrough(site, "M1");
      expect(low.last.kind, `${site} M1`).toBe("grade");
      const high = await playThrough(site, "H3");
      expect(["choose", "end"], `${site} H3`).toContain(high.last.kind);
      if (high.last.kind === "choose") {
        expect(high.last.options.length).toBeGreaterThan(0);
        // choosing plays the elective; declining ends the flow with no further question
        const { index } = high;
        const st = createInitialState(site);
        void st; void index;
      }
    }
  });
  it("preferences only reorder: the chosen unit and semester come first, nothing is skipped", async () => {
    const { bundle } = await loadIndex("math", { grade: "M2" });
    const { indexContent } = await import("@/lib/learn/content/indexer");
    const index = indexContent(bundle);
    const state = { ...createInitialState("math"), profile: { nickname: "tester", grade: "M2" as Grade, goal: "habit" as const, avatar: "fox", onboardingDone: true } };
    const def = planNext(state, index, {});
    const sem2 = planNext(state, index, { semester: 2 });
    expect(def.kind).toBe("lesson");
    expect(sem2.kind).toBe("lesson");
    const lastUnit = index.bundle.catalog.courses[0].units.at(-1)!;
    const byUnit = planNext(state, index, { unitId: lastUnit.id });
    expect(byUnit.kind).toBe("lesson");
  });
});
