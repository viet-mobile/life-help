import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = path.resolve(__dirname, "../..");
const verifyScript = path.resolve(rootDir, "scripts/generated/verify-canonical-i18n.mjs");
const deepScript = path.resolve(rootDir, "scripts/generated/deepen-translation-readiness.mjs");
const deepCheckReport = path.resolve(rootDir, "reports/generated/translation-readiness-deep-check.md");
const rtlMatrixReport = path.resolve(rootDir, "reports/generated/rtl-readiness-matrix.md");
const deepJsonFile = path.resolve(rootDir, "messages/generated/translation-deep-metadata.json");
const enFile = path.resolve(rootDir, "lib/learn/i18n/en.ts");

describe("Translation Readiness Deep Check & Canonical Verification (Phase 2A)", () => {
  it("verify-canonical-i18n script runs and confirms 301 keys with 100% parity", () => {
    const res = execFileSync("node", [verifyScript], { cwd: rootDir, encoding: "utf8" });
    expect(res).toContain("PASS: Canonical i18n verified at commit f707310");
    expect(res).toContain("Key count: 301");
  });

  it("deepen script runs with --check and returns 0", () => {
    const res = execFileSync("node", [deepScript, "--check"], { cwd: rootDir, encoding: "utf8" });
    expect(res).toContain("OK: all generated translation readiness deep check files in sync");
  });

  it("verifies translation deep metadata JSON schema and 301 canonical keys", () => {
    expect(fs.existsSync(deepJsonFile)).toBe(true);
    const data = JSON.parse(fs.readFileSync(deepJsonFile, "utf8"));

    expect(data.baselineSha).toBe("d522da41caf2b9030d9b0ec0bcce6674dce57249");
    expect(data.canonicalCommit).toBe("f707310");
    expect(data.totalKeys).toBe(301);
    expect(data.keyParity.enCount).toBe(301);
    expect(data.keyParity.koCount).toBe(301);
    expect(data.keyParity.viCount).toBe(301);
    expect(data.keyParity.isEqual).toBe(true);

    expect(data.summary.keysWithPlaceholdersCount).toBeGreaterThan(0);
    expect(data.summary.keysWithPunctuationCount).toBeGreaterThan(0);
    expect(data.summary.keysWithProductNamesCount).toBeGreaterThan(0);
    expect(data.summary.keysWithProtectedTokensCount).toBeGreaterThan(0);
    expect(data.summary.keysRequiringRtlCount).toBeGreaterThan(0);
    expect(data.summary.uiExpansionRiskCount).toBeGreaterThan(0);

    expect(Array.isArray(data.placeholders)).toBe(true);
    expect(Array.isArray(data.expansionRisks)).toBe(true);
    expect(Array.isArray(data.markupAndPunctuation)).toBe(true);
    expect(Array.isArray(data.productNames)).toBe(true);
    expect(Array.isArray(data.protectedTokens)).toBe(true);
    expect(Array.isArray(data.rtlKeys)).toBe(true);
    expect(Array.isArray(data.rtlComponentFindings)).toBe(true);
    expect(data.orderedKeys.length).toBe(301);

    // Invariant check: English canonical dictionary exists from core branch
    expect(fs.existsSync(enFile)).toBe(true);
  });

  it("validates reports content for expansion ratios, RTL architecture, and 301 key provenance", () => {
    expect(fs.existsSync(deepCheckReport)).toBe(true);
    expect(fs.existsSync(rtlMatrixReport)).toBe(true);

    const checkMd = fs.readFileSync(deepCheckReport, "utf8");
    expect(checkMd).toContain("301 keys");
    expect(checkMd).toContain("MATH.LIFE.HELP");
    expect(checkMd).toContain("ENGLISH.LIFE.HELP");
    expect(checkMd).toContain("f707310");
    expect(checkMd).toContain("Drops the unused locale.en key");

    const rtlMd = fs.readFileSync(rtlMatrixReport, "utf8");
    expect(rtlMd).toContain("RTL Readiness & Bidirectional UX Matrix");
    expect(rtlMd).toContain("LearningHeader.tsx");
    expect(rtlMd).toContain("QuestProgress.tsx");
    expect(rtlMd).toContain("QuestionCard.tsx");
    expect(rtlMd).toContain("LessonNavigation.tsx");
  });
});
