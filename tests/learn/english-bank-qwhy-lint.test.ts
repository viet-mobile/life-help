import { describe, expect, it } from "vitest";
import fixtures from "./fixtures/qwhy-regressions.json";
import { lintQwhy, ackValid } from "../../scripts/learn/english-bank/qwhy-lint";

describe("qwhy lint: string-checkable regressions from the pilot review", () => {
  for (const c of fixtures.cases.filter((x) => x.kind === "lint")) {
    it(`${c.locale} ${c.id}: ${c.defect.slice(0, 60)}`, () => {
      const codes = lintQwhy(c.locale, c.srcQ!, c.srcWhy!, "", c.trQ!, c.trWhy!).map((f) => f.code);
      expect(codes).toEqual(c.expect);
    });
  }
  it("semantic and process cases are recorded (reviewer checklist), not lint", () => {
    expect(fixtures.cases.filter((x) => x.kind !== "lint").length).toBeGreaterThanOrEqual(4);
  });
  it("a lint exception needs independent evidence and a verified status; a sibling question or needs-recheck is not enough", () => {
    const ok = { status: "verified", sourceId: "eb-x", passageHash: "abc", evidenceKind: "passage", evidenceLocation: "line 2: 'Mr. Kim'", reason: "title" };
    expect(ackValid(ok)).toBe(true);
    expect(ackValid({ ...ok, status: "needs-recheck" })).toBe(false);
    expect(ackValid({ ...ok, evidenceKind: "sibling-question" })).toBe(false);
    expect(ackValid({ ...ok, evidenceLocation: "" })).toBe(false);
    expect(ackValid("some reason string")).toBe(false);
  });
});
