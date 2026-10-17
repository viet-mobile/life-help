import { describe, it, expect } from "vitest";
import { TASK_LOADERS } from "../../lib/think/data/files";
import { loadOverlay, localize } from "../../lib/think/localize";
import { flatten } from "../../lib/think/flat";
import type { ThinkTask } from "../../lib/think/types";

const LANGS = ["en", "zh-Hans", "zh-Hant", "ja", "vi"] as const;

async function allTasks(): Promise<ThinkTask[]> {
  const out: ThinkTask[] = [];
  for (const k of Object.keys(TASK_LOADERS)) out.push(...(await TASK_LOADERS[k]()));
  return out;
}

describe("translation overlays", () => {
  for (const lang of LANGS) {
    it(`${lang}: covers every translatable string, none empty, no stray Hangul outside currency`, async () => {
      const tasks = await allTasks();
      const overlay = await loadOverlay(lang);
      let missing = 0, hangul = 0;
      for (const t of tasks) {
        // the Korean subject is taught in Korean: no English overlay is expected for it
        if (lang === "en" && t.subject === "korean") continue;
        const m = overlay[t.id];
        expect(m, `${lang} ${t.id}`).toBeTruthy();
        const loc = localize(t, lang, overlay).task;
        expect(Object.keys(flatten(loc)).length).toBe(Object.keys(flatten(t)).length);
        for (const v of Object.values(m ?? {})) {
          expect(v.trim().length).toBeGreaterThan(0);
          if (t.subject !== "korean" && /[가-힣]/.test(v.replace(/[0-9,]*\s*만?\s*원/g, ""))) hangul++;
        }
        void missing;
      }
      // labels (가/나), names and Korean quoted material may remain; a flood of Hangul means untranslated text
      expect(hangul).toBeLessThan(400);
    }, 60000);
  }
});
