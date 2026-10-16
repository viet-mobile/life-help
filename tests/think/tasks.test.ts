import { describe, expect, it } from "vitest";
import example from "@/lib/think/data/example-math.json";
import { evalExpr, ExprError } from "@/lib/think/expr";
import { validateSet } from "@/lib/think/validate";
import type { ThinkTask } from "@/lib/think/types";

describe("expression language", () => {
  it("evaluates arithmetic, comparisons and logic without eval", () => {
    expect(evalExpr("2*(a+b)==20 && a>0", { a: 5, b: 5 })).toBe(1);
    expect(evalExpr("2*(a+b)==20", { a: 6, b: 6 })).toBe(0);
    expect(evalExpr("gcd(12, 18)", {})).toBe(6);
    expect(evalExpr("isPrime(13) && !isPrime(15)", {})).toBe(1);
    expect(evalExpr("-2^2 + 10 % 4", {})).toBe(-2);
    expect(evalExpr("2^3^2", {})).toBe(512);
  });
  it("refuses unknown names, calls and division by zero instead of guessing", () => {
    expect(() => evalExpr("x+1", {})).toThrow(ExprError);
    expect(() => evalExpr("process(1)", {})).toThrow(ExprError);
    expect(() => evalExpr("1/0", {})).toThrow(ExprError);
    expect(() => evalExpr("a b", { a: 1, b: 2 })).toThrow(ExprError);
    expect(() => evalExpr("constructor", {})).toThrow(ExprError);
  });
});

describe("task validator", () => {
  it("the example task is valid (model answers pass their checks, bad answers do not)", () => {
    expect(validateSet(example as unknown as ThinkTask[])).toEqual([]);
  });
  it("catches a model answer that fails its own checks and a bad answer that passes", () => {
    const t = JSON.parse(JSON.stringify(example)) as ThinkTask[];
    const w = t[0].steps[2] as { modelAnswers: Array<{ text: string }>; badAnswers: Array<{ text: string }> };
    w.modelAnswers[0].text = "그냥 아닌 것 같아";
    w.badAnswers[0].text = "예: 5×5는 25, 9×1은 9라서 항상 같지 않다. 다를 수 있어.";
    const problems = validateSet(t);
    expect(problems.some((p) => p.includes("model answer fails"))).toBe(true);
    expect(problems.some((p) => p.includes("bad answer passes"))).toBe(true);
  });
  it("catches a build step whose model rows violate a constraint", () => {
    const t = JSON.parse(JSON.stringify(example)) as ThinkTask[];
    (t[0].steps[1] as { modelRows: Array<Record<string, number>> }).modelRows[0] = { a: 6, b: 6 };
    expect(validateSet(t).some((p) => p.includes("modelRows"))).toBe(true);
  });
});

describe("pilot set: 36 tasks, 12 per subject", async () => {
  const { pilotTasks: allTasks } = await import("@/lib/think/tasks");
  it("every task is valid (structure, model answers vs checks, model rows vs constraints)", () => {
    expect(validateSet(allTasks)).toEqual([]);
  });
  it("12 per subject, levels 4/4/4, at least 4 generative tasks per subject, ids unique", () => {
    expect(allTasks).toHaveLength(36);
    for (const s of ["math", "english", "korean"] as const) {
      const ts = allTasks.filter((t) => t.subject === s);
      expect(ts, s).toHaveLength(12);
      for (const lv of [1, 2, 3]) expect(ts.filter((t) => t.level === lv), `${s} level ${lv}`).toHaveLength(4);
      expect(ts.filter((t) => t.generative).length, `${s} generative`).toBeGreaterThanOrEqual(4);
      expect(new Set(ts.map((t) => t.format)).size, `${s} formats`).toBeGreaterThanOrEqual(4);
    }
    expect(new Set(allTasks.map((t) => t.id)).size).toBe(36);
    const formats = new Set(allTasks.map((t) => t.format));
    for (const f of ["judge-evidence-explain", "find-error-fix", "build-many-verify", "choose-needed-info", "reveal-and-revise", "rewrite-for-audience", "make-your-own"]) expect(formats.has(f as never), f).toBe(true);
  });
  it("not everything is a choice question: every subject mixes at least 3 step kinds", () => {
    for (const s of ["math", "english", "korean"] as const) {
      const kinds = new Set(allTasks.filter((t) => t.subject === s).flatMap((t) => t.steps.map((x) => x.kind)));
      expect(kinds.size, s).toBeGreaterThanOrEqual(3);
    }
  });
  it("Korean-subject tasks give instructions in English and keep Korean as the target; math/english instructions are Korean", () => {
    for (const t of allTasks) expect(t.uiLang).toBe(t.subject === "korean" ? "en" : "ko");
    for (const t of allTasks.filter((x) => x.subject === "korean")) expect(/[가-힣]/.test(JSON.stringify({ m: t.material, s: t.steps.map((x) => (x.kind === "pickLine" ? x.lines : x.kind === "choose" ? x.options : x.kind === "reveal" ? x.stages : x.prompt)) })), t.id).toBe(true);
  });
  it("curriculum is only given with a standard and a note saying one task does not fulfil it", () => {
    for (const t of allTasks) if (t.curriculum) expect(t.curriculum.note.length, t.id).toBeGreaterThan(10);
  });
});

describe("choice feedback", async () => {
  const { checkChoose } = await import("@/lib/think/check");
  const step = { id: "s", kind: "choose", prompt: "p", hints: ["a", "b"], multi: true, correct: ["a", "b"], explain: "E", options: [
    { id: "a", text: "A", reveals: "missing-a" }, { id: "b", text: "B", reveals: "missing-b" }, { id: "c", text: "C", reveals: "picked-c" }] } as never;
  it("a full match explains; a wrong pick shows what it reveals; leaving a key option out shows what that reveals, never the key", () => {
    expect(checkChoose(step, ["a", "b"]).status).toBe("match");
    expect(checkChoose(step, ["a", "b", "c"]).message).toBe("picked-c");
    const partial = checkChoose(step, ["a"]);
    expect(partial.status).toBe("not-match");
    expect(partial.message).toBe("missing-b");
    expect(partial.message).not.toContain("E");
  });
});

describe("later batches (per grade / level / elective subject)", async () => {
  const { extraTasks, allTasks } = await import("@/lib/think/tasks");
  it("every extra task is valid and carries grade + topic; ids are unique across all tasks", () => {
    expect(validateSet(extraTasks)).toEqual([]);
    for (const t of extraTasks) { expect(t.grade, t.id).toBeTruthy(); expect(t.topic, t.id).toBeTruthy(); }
    expect(new Set(allTasks.map((t) => t.id)).size).toBe(allTasks.length);
  });
  it("a grade's tasks mix step kinds and are not all choice questions", () => {
    const by = new Map<string, Set<string>>();
    for (const t of extraTasks) { const k = `${t.subject}:${t.grade}`; const set = by.get(k) ?? new Set(); t.steps.forEach((x) => set.add(x.kind)); by.set(k, set); }
    for (const [k, kinds] of by) expect(kinds.size, k).toBeGreaterThanOrEqual(3);
  });
  it("reveal tasks: at most 3 of the batch keep the identical reasonable answer at every stage (those do not force a revision; listed in REVIEW.md as a known limit); single-choice keys vary within a grade", () => {
    const same: string[] = [];
    for (const t of extraTasks) for (const s of t.steps) if (s.kind === "reveal" && new Set(s.stages.map((st) => [...st.reasonable].sort().join("+"))).size === 1) same.push(t.id);
    expect(same.length, same.join(",")).toBeLessThanOrEqual(3);
    const by = new Map<string, string[]>();
    for (const t of extraTasks) for (const s of t.steps) if (s.kind === "choose" && !s.multi) { const k = `${t.subject}:${t.grade}`; by.set(k, [...(by.get(k) ?? []), s.correct[0]]); }
    for (const [k, keys] of by) if (keys.length >= 6) expect(new Set(keys).size, `${k} keys ${keys.join("")}`).toBeGreaterThan(1);
  });
});

describe("no write check passes vacuous answers", async () => {
  const { allTasks } = await import("@/lib/think/tasks");
  const { checkWrite } = await import("@/lib/think/check");
  it("ten generic non-answers (ok, 네, I don't know, ...) never pass every check of any write step", () => {
    const VAC = ["ok", "네", "I don't know", "모르겠어요", "...", "yes no maybe", "그냥 그래요", "asdf qwer zxcv", "맞아요", "good"];
    const bad: string[] = [];
    for (const t of allTasks) for (const s of t.steps) {
      const ws = s.kind === "write" ? [s] : s.kind === "build" && s.because ? [s.because] : [];
      for (const w of ws) for (const v of VAC) { const r = checkWrite(w, v); if (r.longEnough && r.results.every((x) => x.ok)) bad.push(`${t.id}: ${v}`); }
    }
    expect(bad).toEqual([]);
  });
});
