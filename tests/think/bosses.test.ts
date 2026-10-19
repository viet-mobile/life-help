import { describe, expect, it } from "vitest";
import { BOSS_TEXT, FINAL_BOSS_IDS, bossKey, bossKeyOf, bossProgress, finalBossFor, isFinalBoss, lessonsForBoss } from "@/lib/think/bosses";
import { FILE_META, TASK_LOADERS } from "@/lib/think/data/files";
import { CADENCE_TEXT } from "@/lib/think/cadence";

describe("final bosses", () => {
  it("every boss is a real task, used for one slot only, and a semester has at most one", async () => {
    const all = new Map<string, { subject: string; grade?: string }>();
    for (const m of FILE_META) for (const t of await TASK_LOADERS[m.key]()) all.set(t.id, t);
    const seen = new Set<string>();
    for (const id of FINAL_BOSS_IDS) { expect(all.has(id), id).toBe(true); expect(seen.has(id), id).toBe(false); seen.add(id); expect(bossKeyOf(id)).toBeTruthy(); expect(isFinalBoss(id)).toBe(true); }
    expect(isFinalBoss("m-01")).toBe(false);
    // every regular math grade has a boss for each semester; Korean has one per level that has tasks
    for (const g of ["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"]) for (const s of [1, 2] as const) expect(finalBossFor(bossKey("math", g, s)), `math ${g} ${s}`).toBeTruthy();
    for (let n = 1; n <= 5; n++) expect(finalBossFor(`korean|L${n}`), `korean L${n}`).toBeTruthy();
  });
  it("a boss opens when every lesson of that semester is finished (or placed out)", () => {
    const key = bossKey("math", "E1", 1);
    const need = lessonsForBoss(key);
    expect(need.length).toBeGreaterThan(0);
    expect(bossProgress(key, {})).toEqual({ done: 0, total: need.length, open: false });
    const some = Object.fromEntries(need.slice(0, need.length - 1).map((id) => [id, { completions: 1 }]));
    expect(bossProgress(key, some).open).toBe(false);
    const all = { ...some, [need[need.length - 1]]: { placedOut: true } };
    expect(bossProgress(key, all)).toEqual({ done: need.length, total: need.length, open: true });
    expect(bossProgress("nothing|here", {}).open).toBe(true); // no lesson data: never locked forever
  });
  it("names mid-boss and final boss in all six languages", () => {
    for (const l of ["ko", "en", "zh-Hans", "zh-Hant", "ja", "vi"] as const) {
      expect(BOSS_TEXT[l].mid.length).toBeGreaterThan(1);
      expect(BOSS_TEXT[l].final.length).toBeGreaterThan(1);
      expect(BOSS_TEXT[l].locked(1, 3).length).toBeGreaterThan(3);
      expect(CADENCE_TEXT[l].toNext(5).length).toBeGreaterThan(3);
    }
    expect(BOSS_TEXT.ko.mid).toBe("중간 보스");
    expect(BOSS_TEXT.ko.final).toBe("최종 보스");
    expect(CADENCE_TEXT.ko.toNext(3)).toContain("중간 보스");
  });
});
