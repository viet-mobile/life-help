import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = path.resolve(__dirname, "../..");
const inventoryDir = path.resolve(rootDir, "data/learning-study/inventory");
const reportPath = path.resolve(rootDir, "reports/generated/legacy-study-inventory-report.md");
const generatorScript = path.resolve(rootDir, "scripts/generated/inventory-legacy-study-sites.mjs");

const expectedSites = [
  "study.korean.viet.mobile",
  "study.english.viet.mobile",
  "study.japanese.viet.mobile",
  "zhong.wen.viet.mobile",
  "bahasa.indonesia.viet.mobile",
  "hoc.tieng.viet.mobile",
];

describe("Legacy Adult Study Sites Inventory (Package C)", () => {
  it("generator script runs with --check and returns 0", () => {
    const res = execFileSync("node", [generatorScript, "--check"], { cwd: rootDir, encoding: "utf8" });
    expect(res).toContain("OK: all generated legacy study inventory files in sync");
  });

  it("all 6 legacy sites have machine-readable inventory JSON files", () => {
    for (const domain of expectedSites) {
      const file = path.resolve(inventoryDir, `${domain}.json`);
      expect(fs.existsSync(file)).toBe(true);

      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      expect(data.domain).toBe(domain);
      expect(data.accessible).toBe(true);
      expect(typeof data.framework).toBe("string");
      expect(typeof data.build_system).toBe("string");
      expect(data.route_count).toBeGreaterThanOrEqual(12);
      expect(Array.isArray(data.routes)).toBe(true);
      expect(Array.isArray(data.tabs)).toBe(true);
      expect(data.ui_locales.count).toBe(12);
      expect(data.security_and_storage.authentication).toContain("None");
      expect(data.security_and_storage.progress_persistence).toContain("localStorage");
    }
  });

  it("aggregate-summary.json exists and summarizes all 6 sites", () => {
    const aggFile = path.resolve(inventoryDir, "aggregate-summary.json");
    expect(fs.existsSync(aggFile)).toBe(true);

    const agg = JSON.parse(fs.readFileSync(aggFile, "utf8"));
    expect(agg.baselineSha).toBe("d522da41caf2b9030d9b0ec0bcce6674dce57249");
    expect(agg.totalSites).toBe(6);
    expect(agg.accessibleSitesCount).toBe(6);
    expect(agg.sitesSummary.length).toBe(6);
    expect(agg.sharedArchitectureFacts.legacyUILocaleCount).toBe(12);
  });

  it("report markdown exists and contains required facts and baseline", () => {
    expect(fs.existsSync(reportPath)).toBe(true);
    const md = fs.readFileSync(reportPath, "utf8");
    expect(md).toContain("d522da41caf2b9030d9b0ec0bcce6674dce57249");
    for (const domain of expectedSites) {
      expect(md).toContain(domain);
    }
    expect(md).toContain("study.korean.life.help");
    expect(md).toContain("study.english.life.help");
    expect(md).toContain("study.japanese.life.help");
    expect(md).toContain("study.chinese.life.help");
    expect(md).toContain("study.indonesian.life.help");
    expect(md).toContain("study.vietnamese.life.help");
  });
});
