import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = path.resolve(__dirname, "../..");
const auditScript = path.resolve(rootDir, "scripts/generated/audit-calibration-provenance.mjs");
const sampleSizeReport = path.resolve(rootDir, "reports/generated/calibration-sample-size-audit.md");
const sampleSizeJson = path.resolve(rootDir, "data/learning-calibration/sample-size-audit.json");
const distributionReport = path.resolve(rootDir, "reports/generated/calibration-distribution-report.md");
const distributionJson = path.resolve(rootDir, "data/learning-calibration/distribution-summary.json");

describe("Calibration Provenance and Metrics Audit (Phase 1.5)", () => {
  it("audit script passes --check deterministic mode", () => {
    const res = execFileSync("node", [auditScript, "--check"], { cwd: rootDir, encoding: "utf8" });
    expect(res).toContain("OK: all generated calibration audit files in sync");
  });

  it("sample-size audit classifies all 260 empirical rows as ASSESSMENT rather than ITEM", () => {
    expect(fs.existsSync(sampleSizeJson)).toBe(true);
    const data = JSON.parse(fs.readFileSync(sampleSizeJson, "utf8"));
    expect(data.baselineSha).toBe("d522da41caf2b9030d9b0ec0bcce6674dce57249");
    expect(data.summary.ITEM).toBe(0);
    expect(data.summary.ASSESSMENT).toBe(260);
    expect(data.summary.POPULATION).toBe(0);

    const md = fs.readFileSync(sampleSizeReport, "utf8");
    expect(md).toContain("`ASSESSMENT`");
    expect(md).toContain("matrix booklet");
  });

  it("distribution audit confirms valid percentiles, no 0/1 extremes, and unique canonical keys", () => {
    expect(fs.existsSync(distributionJson)).toBe(true);
    const data = JSON.parse(fs.readFileSync(distributionJson, "utf8"));
    expect(data.distributions.length).toBe(7);

    for (const d of data.distributions) {
      expect(d.itemCount).toBeGreaterThan(0);
      expect(d.min).toBeGreaterThan(0);
      expect(d.max).toBeLessThan(1);
      expect(d.median).toBeGreaterThanOrEqual(d.p25);
      expect(d.median).toBeLessThanOrEqual(d.p75);
      expect(d.suspiciousZeroExtremes).toBe(0);
      expect(d.suspiciousOneExtremes).toBe(0);
    }

    const md = fs.readFileSync(distributionReport, "utf8");
    expect(md).toContain("Extreme Zeroes (`correct_rate = 0.00`)");
    expect(md).toContain("Extreme Ones (`correct_rate = 1.00`)");
    expect(md).toContain("Conflicting Item Values**: **0 conflicts**");
    expect(md).toContain("Duplicate Canonical Identifiers**: **0 duplicates**");
  });
});
