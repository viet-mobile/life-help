import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("bank evidence for the math standards", () => {
  it("covers every standard with real bank sets and sample ids", () => {
    const out = execFileSync("node", ["scripts/learn/bank-evidence.mjs", "x", "--check"], { encoding: "utf8" });
    expect(out).toContain("bank-evidence ok");
  });
});
