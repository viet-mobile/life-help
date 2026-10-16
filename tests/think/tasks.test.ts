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
