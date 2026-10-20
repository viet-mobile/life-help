import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { EXTRA_TASK_LANGS, TASK_LANGS, THINK_LANGS, TASK_LANG_NAMES, isThinkLang, taskLangFor, thinkLangFor } from "../../lib/think/lang";
import { localize, localizeFor } from "../../lib/think/localize";
import { flatten, flattenLearnerExtras, needsTranslation } from "../../lib/think/flat";
import type { ThinkTask } from "../../lib/think/types";

const root = path.resolve(__dirname, "../..");
const registry = fs.readFileSync(path.join(root, "messages/registry.ts"), "utf8");
const LOCALES = [...registry.match(/export const locales = \[([\s\S]*?)\] as const/)![1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

describe("Task language registry and legacy fallback policy", () => {
  it("13 interface locales plus 40 other task locales match all 53 service languages", () => {
    expect([...TASK_LANGS].sort()).toEqual([...LOCALES].sort());
    expect(EXTRA_TASK_LANGS.length).toBe(40);
    expect(new Set(TASK_LANGS).size).toBe(53);
    for (const l of TASK_LANGS) expect(TASK_LANG_NAMES[l], l).toBeTruthy();
  });
  it("legacy locales without native interface text retain their existing English interface fallback", () => {
    expect(thinkLangFor("th", "math")).toBe("en");
    expect(isThinkLang("th")).toBe(false);
    expect(taskLangFor("th")).toBe("th");
    expect(taskLangFor("vi")).toBe("vi");
    expect(taskLangFor("xx")).toBe("en");
    expect((THINK_LANGS as readonly string[]).includes("th")).toBe(false);
  });
  const task = { id: "t1", subject: "math", title: "제목", topic: "", goal: "목표", material: "자료", thinking: [], prerequisites: [], steps: [] } as unknown as ThinkTask;
  const englishOf = (): Record<string, Record<string, string>> => ({ t1: Object.fromEntries(Object.entries(flatten(task)).filter(([, s]) => needsTranslation("math", s)).map(([p]) => [p, `EN ${p}`])) });
  it("a language without a complete translation gets exactly what an English learner gets; a complete one is shown in the learner's language", () => {
    const en = englishOf();
    const none = localizeFor(task, "th", { primary: {}, fallback: en });
    expect(none.translated).toBe(true);
    expect(none.lang).toBe("en");
    expect(none.task.title).toBe("EN title");
    const th: Record<string, Record<string, string>> = { t1: Object.fromEntries(Object.keys(en.t1).map((p) => [p, `TH ${p}`])) };
    const full = localizeFor(task, "th", { primary: th, fallback: en });
    expect(full.lang).toBe("th");
    expect(full.task.title).toBe("TH title");
    const partial = localizeFor(task, "th", { primary: { t1: { title: "TH only the title" } }, fallback: en });
    expect(partial.lang).toBe("en"); // never half-translated
    expect(partial.task.title).toBe("EN title");
  });
  it("a language of the six still hides an incomplete task (unchanged behaviour)", () => {
    const r = localizeFor(task, "vi", { primary: { t1: { title: "x" } }, fallback: {} });
    expect(r.translated).toBe(false);
    expect(localize(task, "vi", { t1: { title: "x" } }).translated).toBe(false);
  });
  it("every overlay folder of an extra language (once translations exist) only addresses real tasks and paths, with no empty values", async () => {
    const { FILE_META, TASK_LOADERS } = await import("../../lib/think/data/files");
    const flats = new Map<string, Record<string, string>>();
    for (const m of FILE_META) for (const t of await TASK_LOADERS[m.key]()) flats.set(t.id, { ...flatten(t), ...flattenLearnerExtras(t) });
    for (const l of EXTRA_TASK_LANGS) {
      const dir = path.join(root, "lib/think/i18n", l);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
        const ov = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Record<string, Record<string, string>>;
        for (const [id, m] of Object.entries(ov)) {
          expect(flats.has(id), `${l}/${f}: unknown task ${id}`).toBe(true);
          for (const [p, v] of Object.entries(m)) { expect(p in flats.get(id)!, `${l} ${id} ${p}`).toBe(true); expect(v.trim().length, `${l} ${id} ${p}`).toBeGreaterThan(0); }
        }
      }
    }
  }, 60_000);
});
