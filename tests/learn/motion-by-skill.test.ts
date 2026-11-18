import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import motion from "@/lib/learn/content/motion-by-skill.json";

const root = path.resolve(__dirname, "../..");
const skillIds = new Set(["elementary/math.json", "secondary/math.json", "demo/math.json"].flatMap((f) => JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content", f), "utf8")).catalog.skills.map((s: { id: string }) => s.id)));
const episodes = new Set((JSON.parse(fs.readFileSync(path.join(root, "public/math-motion/episodes.public.json"), "utf8")).episodes as { id: string }[]).map((e) => e.id));

describe("math motion videos placed in lessons", () => {
  const entries = Object.entries(motion as Record<string, string[]>);
  it("every mapped skill and video exists; at most six per skill; poster file present", () => {
    expect(entries.length).toBeGreaterThan(90);
    for (const [skill, ids] of entries) {
      expect(skillIds.has(skill), skill).toBe(true);
      expect(ids.length).toBeLessThanOrEqual(6);
      for (const id of ids) {
        expect(episodes.has(id), id).toBe(true);
        expect(fs.existsSync(path.join(root, `public/math-motion/posters/${id}-240.png`)), id).toBe(true);
      }
    }
  });
  it("a video appears under one skill only (no duplicate placement)", () => {
    const all = entries.flatMap(([, ids]) => ids);
    expect(new Set(all).size).toBe(all.length);
  });
});
