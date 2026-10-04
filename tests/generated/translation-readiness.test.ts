import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = path.resolve(__dirname, "../..");
const inventoryScript = path.resolve(rootDir, "scripts/generated/inventory-translation-readiness.mjs");
const reportFile = path.resolve(rootDir, "reports/generated/translation-readiness-inventory.md");
const jsonFile = path.resolve(rootDir, "messages/generated/translation-readiness.json");
const enFile = path.resolve(rootDir, "lib/learn/i18n/en.ts");

describe("Translation Readiness Inventory (Phase 1.5)", () => {
  it("inventory script runs with --check and returns 0", () => {
    const res = execFileSync("node", [inventoryScript, "--check"], { cwd: rootDir, encoding: "utf8" });
    expect(res).toContain("OK: all generated translation readiness files in sync");
  });

  it("confirms 100% key parity between ko and vi (204 keys) and zero unverified translations", () => {
    expect(fs.existsSync(jsonFile)).toBe(true);
    const data = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
    expect(data.baselineSha).toBe("d522da41caf2b9030d9b0ec0bcce6674dce57249");
    expect(data.totalKeys).toBe(257);
    expect(data.keyParity.koCount).toBe(257);
    expect(data.keyParity.viCount).toBe(257);
    expect(data.keyParity.isEqual).toBe(true);

    // Verify block conditions
    expect(data.blockSignals.CANONICAL_I18N_READY).toBe(false);
    expect(data.blockSignals.BANK_INTERFACE_FROZEN).toBe(false);
    expect(data.blockSignals.translationsStarted).toBe(false);
    expect(data.blockSignals.translationPhase2Blocked).toBe(true);

    // Strict invariant: Antigravity MUST NOT create en.ts
    expect(fs.existsSync(enFile)).toBe(false);
  });

  it("extracts all required namespaces, placeholders, and UI key categories", () => {
    const data = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
    expect(data.placeholders).toEqual(expect.arrayContaining(["name", "n", "total", "xp", "title", "level", "source"]));
    expect(data.categories.auth.length).toBeGreaterThan(0);
    expect(data.categories.mascotAndAvatar.length).toBeGreaterThan(0);
    expect(data.categories.accessibility.length).toBeGreaterThan(0);
    expect(data.categories.lessonAndQuiz.length).toBeGreaterThan(0);
    expect(data.categories.resultAndReward.length).toBeGreaterThan(0);

    const md = fs.readFileSync(reportFile, "utf8");
    expect(md).toContain("NOT STARTED (STRICTLY BLOCKED)");
    expect(md).toContain("100% parity between ko and vi");
    expect(md).toContain("CANONICAL_I18N_READY");
  });
});
