import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("locale review export (scripts/learn/export-locale-review.mjs)", () => {
  it("exports every UI key and the new lessons for a locale, as JSON the reviewers' tools can read", () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "locale-review-"));
    execFileSync(process.execPath, ["scripts/learn/export-locale-review.mjs", "--locales", "sg", "--format", "json", "--out", out], { stdio: "pipe" });
    const data = JSON.parse(fs.readFileSync(path.join(out, "sg.json"), "utf8"));
    const ui = JSON.parse(fs.readFileSync("lib/learn/i18n/locales/sg.json", "utf8"));
    expect(data.ui.length).toBe(Object.keys(ui).length);
    expect(data.ui.every((r: { translation: string }) => r.translation !== "")).toBe(true);
    const ids = new Set(data.content.map((r: { id: string }) => r.id));
    for (const lesson of ["math-h1-mat1", "math-h3-cnt1", "en-e3-abc1", "en-m2-sum1", "math-h2-seq1", "korean-k3-l11"]) expect(ids.has(lesson), lesson).toBe(true);
    expect(data.content.some((r: { flags: string }) => r.flags.includes("MISSING"))).toBe(false); // a MISSING flag means a locale overlay lacks a new string
  });

  it("rejects an unknown locale", () => {
    expect(() => execFileSync(process.execPath, ["scripts/learn/export-locale-review.mjs", "--locales", "xx"], { stdio: "pipe" })).toThrow();
  });
});
