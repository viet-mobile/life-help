import { describe, expect, it } from "vitest";
import fixtures from "./fixtures/qwhy-regressions.json";
import { lintQwhy } from "../../scripts/learn/english-bank/qwhy-lint";

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
});
