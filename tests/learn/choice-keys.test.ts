import { describe, expect, it } from "vitest";
import { choiceKeyIndex, isTextTarget } from "@/components/learn/choiceKeys";

const k = (key: string, code = `Key${key.toUpperCase()}`, extra: Record<string, unknown> = {}) => ({ key, code, ...extra });

describe("A / B / C / D select an option exactly like a click", () => {
  it("lower and upper case letters map to the printed option letters", () => {
    expect(["a", "b", "c", "d"].map((c) => choiceKeyIndex(k(c), 4))).toEqual([0, 1, 2, 3]);
    expect(["A", "B", "C", "D"].map((c) => choiceKeyIndex(k(c), 4))).toEqual([0, 1, 2, 3]);
  });
  it("works under a Korean input method: the typed character is a jamo (or 'Process'), the physical key still says A-D", () => {
    expect(choiceKeyIndex({ key: "ㅁ", code: "KeyA" }, 4)).toBe(0); // 2-set Hangul: A -> ㅁ
    expect(choiceKeyIndex({ key: "ㅠ", code: "KeyB" }, 4)).toBe(1);
    expect(choiceKeyIndex({ key: "ㅊ", code: "KeyC" }, 4)).toBe(2);
    expect(choiceKeyIndex({ key: "ㅇ", code: "KeyD" }, 4)).toBe(3);
    expect(choiceKeyIndex({ key: "Process", code: "KeyB" }, 4)).toBe(1);
  });
  it("only letters that exist as options count (3 options: D is nothing; 5 options: E exists)", () => {
    expect(choiceKeyIndex(k("d"), 3)).toBe(-1);
    expect(choiceKeyIndex(k("e"), 4)).toBe(-1);
    expect(choiceKeyIndex(k("e"), 5)).toBe(4);
  });
  it("shortcuts and held keys are not answers", () => {
    for (const mod of ["ctrlKey", "metaKey", "altKey"]) expect(choiceKeyIndex(k("a", "KeyA", { [mod]: true }), 4), mod).toBe(-1);
    expect(choiceKeyIndex(k("a", "KeyA", { repeat: true }), 4)).toBe(-1);
    expect(choiceKeyIndex(k("a", "KeyA", { defaultPrevented: true }), 4)).toBe(-1);
    expect(choiceKeyIndex(k("a", "KeyA", { shiftKey: true }), 4)).toBe(0); // typing a capital A
  });
  it("non-letters and other keys are ignored", () => {
    for (const e of [k("1", "Digit1"), k("Enter", "Enter"), k(" ", "Space"), k("ArrowLeft", "ArrowLeft"), k("Escape", "Escape"), { key: "Tab", code: "Tab" }]) expect(choiceKeyIndex(e, 4)).toBe(-1);
  });
  it("typing into a field is text, not an answer", () => {
    const el = (match: boolean) => ({ closest: () => (match ? {} : null) }) as unknown as EventTarget;
    expect(isTextTarget(el(true))).toBe(true);
    expect(isTextTarget(el(false))).toBe(false);
    expect(isTextTarget(null)).toBe(false);
  });
});
