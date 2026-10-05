import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = path.resolve(__dirname, "../..");
const MAIN_SERVICES_DIR = path.resolve(rootDir, "messages/generated/main-services");
const CANONICAL_JSON_PATH = path.resolve(rootDir, "scripts/generated/canonical-main-service.json");
const LAYOUT_RISK_REPORT = path.resolve(rootDir, "reports/generated/main-service-i18n-layout-risk.md");
const SEMANTIC_SAMPLE_REPORT = path.resolve(rootDir, "reports/generated/main-service-semantic-sample.md");

describe("Main Service Translations (Phase 2.2)", () => {
  const canonical = JSON.parse(fs.readFileSync(CANONICAL_JSON_PATH, "utf8"));
  const { keys: canonicalKeys, keyCount } = canonical;

  it("verifies canonical metadata defines exactly 21 keys", () => {
    expect(keyCount).toBe(21);
    expect(canonicalKeys.length).toBe(21);
    expect(canonicalKeys).toContain("study.chooser.goTo");
    expect(canonicalKeys).toContain("service.study");
    expect(canonicalKeys).toContain("service.aircon");
  });

  it("verifies all 35 non-reference locales are generated", () => {
    expect(fs.existsSync(MAIN_SERVICES_DIR)).toBe(true);
    const files = fs.readdirSync(MAIN_SERVICES_DIR).filter((f) => f.endsWith(".json"));
    expect(files.length).toBe(35);

    // Reference locales ko, en, vi must NOT be generated here
    expect(files).not.toContain("ko.json");
    expect(files).not.toContain("en.json");
    expect(files).not.toContain("vi.json");
  });

  it("verifies every generated locale has 100% key parity with canonical 21 keys", () => {
    const files = fs.readdirSync(MAIN_SERVICES_DIR).filter((f) => f.endsWith(".json"));
    const hangulRegex = /[\uac00-\ud7a3]/;

    for (const f of files) {
      const loc = f.replace(".json", "");
      const flat = JSON.parse(fs.readFileSync(path.join(MAIN_SERVICES_DIR, f), "utf8"));
      const keys = Object.keys(flat);

      expect(keys.length, `${loc} key count`).toBe(21);
      expect(keys.sort()).toEqual([...canonicalKeys].sort());

      for (const k of canonicalKeys) {
        const val = flat[k];
        expect(typeof val, `${loc}.${k} type`).toBe("string");
        expect(val.trim().length, `${loc}.${k} empty check`).toBeGreaterThan(0);

        // Security / layout invariants
        expect(val).not.toContain("<");
        expect(val).not.toContain(">");
        expect(val).not.toContain("\n");
        expect(val).not.toContain("$");
        expect(hangulRegex.test(val), `${loc}.${k} hangul leakage`).toBe(false);

        // Placeholder contract
        const placeholders = val.match(/\{[a-zA-Z0-9_]+\}/g) || [];
        if (k === "study.chooser.goTo") {
          expect(placeholders, `${loc}.${k} placeholder`).toEqual(["{site}"]);
        } else {
          expect(placeholders, `${loc}.${k} placeholder`).toEqual([]);
        }
      }
    }
  });

  it("verifies layout risk and semantic QA sample reports exist", () => {
    expect(fs.existsSync(LAYOUT_RISK_REPORT)).toBe(true);
    expect(fs.existsSync(SEMANTIC_SAMPLE_REPORT)).toBe(true);

    const layoutRiskContent = fs.readFileSync(LAYOUT_RISK_REPORT, "utf8");
    expect(layoutRiskContent).toContain("Main Service I18N Layout Risk & Expansion Report");
    expect(layoutRiskContent).toContain("Canonical Source Commit");

    const sampleContent = fs.readFileSync(SEMANTIC_SAMPLE_REPORT, "utf8");
    expect(sampleContent).toContain("Main Service Semantic QA Representative Sample");
    expect(sampleContent).toContain("Aircon Service Semantics");
  });

  it("validates that generate-main-service-translations.mjs --check runs cleanly", () => {
    const out = execSync("node scripts/generated/generate-main-service-translations.mjs --check", {
      cwd: rootDir,
      encoding: "utf8",
    });
    expect(out).toContain("OK: all 35 main-service translation files and reports in sync");
  });
});
