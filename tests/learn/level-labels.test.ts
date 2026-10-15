import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/learn/i18n";
import { SITE_CONFIG } from "@/lib/learn/sites";
import { SITES } from "@/lib/learn/types";
import { ko } from "@/lib/learn/i18n/ko";

const dir = path.resolve(__dirname, "../../lib/learn/i18n/locales");
const keys = SITES.flatMap((s) => SITE_CONFIG[s].levels.map((g) => `grade.${g}`));

describe("every level the picker offers has a label in every language (a missing key would print the key itself)", () => {
  it("the canonical Korean table", () => {
    for (const k of keys) expect((ko as Record<string, string>)[k], k).toBeTruthy();
  });
  it.each([...LOCALES].filter((l) => l !== "ko"))("%s", (loc) => {
    const t = JSON.parse(fs.readFileSync(path.join(dir, `${loc}.json`), "utf8")) as Record<string, string>;
    for (const k of keys) {
      expect(t[k], `${loc} ${k}`).toBeTruthy();
      expect(t[k], `${loc} ${k} is not the key`).not.toBe(k);
    }
    // K1..K10 share the language's own "level N" wording and differ from each other
    const korean = Array.from({ length: 10 }, (_, i) => t[`grade.K${i + 1}`]);
    expect(new Set(korean).size, loc).toBe(10);
  });
});
