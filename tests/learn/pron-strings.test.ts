import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/learn/i18n";
import { ko } from "@/lib/learn/i18n/ko";

describe("pronunciation tip strings", () => {
  const dir = path.join(process.cwd(), "lib/learn/i18n/locales");
  const keys = Object.keys(ko).filter((k) => k.startsWith("pron."));
  it("the tip component only uses existing keys and all 46 languages translate them (no key, no Hangul, placeholders kept)", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "components/learn/PronTip.tsx"), "utf8");
    const used = new Set([...src.matchAll(/\bt\("([a-z.]+)"/g)].map((m) => m[1]));
    for (const r of ["final", "liaison", "nasal", "lateral", "tense"]) used.add(`pron.${r}`);
    for (const k of used) expect(Object.keys(ko), k).toContain(k);
    expect(keys.length).toBe(9);
    for (const loc of LOCALES.filter((l) => l !== "ko")) {
      const m = JSON.parse(fs.readFileSync(path.join(dir, `${loc}.json`), "utf8")) as Record<string, string>;
      for (const k of keys) {
        expect(typeof m[k], `${loc} ${k}`).toBe("string");
        expect(/[가-힣]/.test(m[k]), `${loc} ${k} Hangul`).toBe(false);
        for (const ph of (ko as Record<string, string>)[k].match(/\{\w+\}/g) ?? []) expect(m[k], `${loc} ${k} ${ph}`).toContain(ph);
      }
    }
  });
});
