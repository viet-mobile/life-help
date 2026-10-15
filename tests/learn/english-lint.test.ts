import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Regression gate for the English bank: generator-level defects found by independent review (answer exposed by a sibling question, article before a
// cloze blank, positional references in explanations of shuffled options, Korean particle slips). Run with `node scripts/learn/english-bank/lint.mjs`.
describe("english bank lint", () => {
  it("has no findings over served and pending questions", () => {
    const script = path.resolve(__dirname, "../../scripts/learn/english-bank/lint.mjs");
    let out = "";
    try { out = execFileSync("node", [script], { encoding: "utf8" }); } catch (e) { out = String((e as { stdout?: string }).stdout ?? e); throw new Error(`lint findings:\n${out}`); }
    expect(out).toMatch(/findings 0/);
  });
});
