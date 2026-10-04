import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { generate, BANK_API_VERSION, REGISTRY } from "../../scripts/learn/bank/engine.mjs";

const rootDir = path.resolve(__dirname, "../..");
const REPORT_DATE = "2026-10-05";
const JSON_REPORT = path.resolve(rootDir, `reports/generated/bank-stress-${REPORT_DATE}.json`);
const MD_REPORT = path.resolve(rootDir, "reports/generated/bank-stress-report.md");

describe("Question Bank Stress Tests (Package 3)", () => {
  it("verifies frozen bank-api-1 surface and supported registries", () => {
    expect(BANK_API_VERSION).toBe("bank-api-1");
    expect(Object.keys(REGISTRY).sort()).toEqual(["english", "math"]);
  });

  it("verifies exact item shape matches frozen contract", () => {
    const EXPECTED_ITEM_KEYS = [
      "cognitive",
      "difficulty",
      "featureClass",
      "features",
      "fingerprint",
      "grade",
      "id",
      "level",
      "overlay",
      "predictedLevel",
      "provisional",
      "question",
      "reasoning",
      "reasoningTags",
      "template",
    ];

    for (const subject of ["math", "english"]) {
      const res = generate({ subject, level: 3, count: 2, seed: 99 });
      expect(res.items.length).toBe(2);
      for (const item of res.items) {
        expect(Object.keys(item).sort()).toEqual(EXPECTED_ITEM_KEYS);
        expect(item.provisional).toBe(true);
        expect(item.difficulty.difficultyBasis).toBe("PROVISIONAL");
        expect(Math.abs(item.predictedLevel - item.level)).toBeLessThanOrEqual(1);
        expect(item.question.hints.length).toBe(2);
        expect(typeof item.question.prompt).toBe("string");
        expect(typeof item.overlay.prompt).toBe("string");
      }
    }
  });

  it("verifies generator is deterministic across identical parameters", () => {
    const run1 = generate({ subject: "math", level: 5, count: 4, seed: "vitest-seed-42" });
    const run2 = generate({ subject: "math", level: 5, count: 4, seed: "vitest-seed-42" });
    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });

  it("verifies boundary condition errors are cleanly thrown", () => {
    expect(() => generate({ subject: "unknown", level: 1 })).toThrow(/unknown subject/);
    expect(() => generate({ subject: "math", level: 0 })).toThrow(/level must be an integer 1\.\.10/);
    expect(() => generate({ subject: "math", level: 11 })).toThrow(/level must be an integer 1\.\.10/);
    expect(() => generate({ subject: "math", level: 1.5 })).toThrow(/level must be an integer 1\.\.10/);
  });

  it("verifies generated stress report schema and --check execution", () => {
    expect(fs.existsSync(JSON_REPORT)).toBe(true);
    expect(fs.existsSync(MD_REPORT)).toBe(true);

    const data = JSON.parse(fs.readFileSync(JSON_REPORT, "utf8"));
    expect(data.bankApiVersion).toBe("bank-api-1");
    expect(data.baselineSha).toBe("b3f51bd36ddf617bf801f92c438c9bc453ec2ac7");
    expect(data.summary.totalRuns).toBeGreaterThanOrEqual(1000);
    expect(data.summary.totalItems).toBeGreaterThanOrEqual(5000);
    expect(data.summary.determinismMismatches).toBe(0);
    expect(data.summary.toleranceViolations).toBe(0);
    expect(data.summary.unexpectedThrows).toBe(0);

    const checkOutput = execSync("node scripts/generated/stress-question-bank.mjs --check", {
      cwd: rootDir,
      encoding: "utf8",
    });
    expect(checkOutput).toContain("OK: Bank stress test reports exist");
  });
});
