import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { TASK_LOADERS } from "../../lib/think/data/files";
import { loadOverlay, localize } from "../../lib/think/localize";
import { flatten, needsTranslation } from "../../lib/think/flat";
import type { ThinkTask } from "../../lib/think/types";
import { readFileSync } from "node:fs";
import path from "node:path";
import pendingList from "./translation-pending.json";

/** Tasks that exist but have no translation overlay yet, per language. They are tracked here, never counted as translated; the list must match reality exactly (no hiding, no stale entries). */
const PENDING = pendingList as Record<string, string[]>;

const LANGS = ["en", "zh-Hans", "zh-Hant", "ja", "vi", "ko"] as const;

async function allTasks(): Promise<ThinkTask[]> {
  const out: ThinkTask[] = [];
  for (const k of Object.keys(TASK_LOADERS)) out.push(...(await TASK_LOADERS[k]()));
  return out;
}

describe("translation overlays", () => {
  beforeAll(() => { vi.stubGlobal("fetch", async (url: string) => {
    if (!/^\/think-assets\/[a-f0-9]{64}\.json$/.test(url)) throw new Error("Unexpected asset request");
    return new Response(readFileSync(path.join(process.cwd(), "public", url)));
  }); });
  afterAll(() => vi.unstubAllGlobals());
  for (const lang of LANGS) {
    it(`${lang}: covers every translatable string, none empty, no stray Hangul outside currency`, async () => {
      const tasks = await allTasks();
      const overlay = await loadOverlay(lang);
      let hangul = 0;
      const pending = new Set(PENDING[lang] ?? []);
      const actuallyMissing: string[] = [];
      for (const t of tasks) {
        // the Korean subject is authored with English instructions: no English overlay is expected for it
        if (lang === "en" && t.subject === "korean") continue;
        // Korean overlays exist only for the Korean subject (the other subjects are authored in Korean)
        if (lang === "ko" && t.subject !== "korean") continue;
        const m = overlay[t.id];
        if (!m) { actuallyMissing.push(t.id); continue; }
        const loc = localize(t, lang, overlay).task;
        expect(Object.keys(flatten(loc)).length).toBe(Object.keys(flatten(t)).length);
        for (const v of Object.values(m ?? {})) {
          expect(v.trim().length).toBeGreaterThan(0);
          if (t.subject !== "korean") {
            // labels (가/나), romanized-name sources and currency may stay; count only strings that are mostly Hangul
            const rest = v.replace(/[0-9,]*\s*만?\s*원/g, "");
            const h = (rest.match(/[가-힣]/g) ?? []).length;
            if (h > 0 && h / ((rest.match(/\p{L}/gu) ?? []).length || 1) > 0.5) hangul++;
          }
        }
      }
      // every string that needs a translation HAS one: a half-translated task would show the authored language between translated sentences
      const gaps: string[] = [];
      for (const t of tasks) {
        if (lang === "en" && t.subject === "korean") continue;
        if (lang === "ko" && t.subject !== "korean") continue;
        const m = overlay[t.id];
        if (!m) continue;
        const holes = Object.entries(flatten(t)).filter(([p, s]) => needsTranslation(t.subject, s) && !(typeof m[p] === "string" && m[p].trim())).map(([p]) => p);
        if (holes.length) gaps.push(`${t.id}: ${holes.slice(0, 3).join(",")}${holes.length > 3 ? ` (+${holes.length - 3})` : ""}`);
      }
      expect(gaps.slice(0, 10), `${lang}: ${gaps.length} tasks have untranslated strings`).toEqual([]);
      expect(actuallyMissing.sort(), `translation-pending.json for ${lang} must list exactly the tasks without an overlay`).toEqual([...pending].sort());
      // labels (가/나), names and Korean quoted material may remain; a flood of Hangul means untranslated text
      expect(hangul).toBeLessThan(150);
    }, 60000);
  }
});
