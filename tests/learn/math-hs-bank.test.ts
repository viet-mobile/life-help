/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import hsJson from "@/lib/learn/content/bank/math-hs.json";
import mathJson from "@/lib/learn/content/bank/math.json";
import { BANKS, expandBank, type BankData } from "@/lib/learn/content/bank";
import { checkAnswer } from "@/lib/learn/domain/answers";
import elementary from "@/lib/learn/content/elementary/math.json";
import demo from "@/lib/learn/content/demo/math.json";
import secondary from "@/lib/learn/content/secondary/math.json";
import standardsFile from "@/scripts/learn/bank/hs/standards.json";

/**
 * The high-school tranche (lib/learn/content/bank/math-hs.json) is a DRAFT: nothing in the runtime loads it, the existing 6,672-question
 * bank is unchanged, every row's answer was re-computed by the independent Python/sympy verifier (docs/learning/math-hs-bank/verification.json
 * pins the exact bytes it checked) and the wording is complete in Korean and English.
 */
const hs = hsJson as unknown as BankData & { status: string; sets: (BankData["sets"][number] & { module: string; standards: string[]; strategy: string; evidence: string })[] };
const root = path.resolve(__dirname, "../..");
const skills = new Set<string>();
for (const b of [elementary, demo, secondary] as any[]) for (const s of b.catalog.skills) skills.add(s.id);
const all = expandBank(hs, null, skills);
const old = expandBank(BANKS.math as BankData, null, skills);
const holes = (s: string) => [...new Set([...s.matchAll(/\{([A-Za-z_]\w+)\}/g)].map((m) => m[1]))].sort().join(",");

describe("math high-school draft bank", () => {
  it("is a DRAFT in the bank format, and the runtime never loads it", () => {
    expect(hs.format).toBe(1);
    expect(hs.status).toBe("DRAFT");
    expect(hs.site).toBe("math");
    expect(hs.sets.length).toBeGreaterThan(100);
    for (const dir of ["lib", "app", "components", "proxy.ts"]) {
      const walk = (p: string): string[] => (fs.statSync(p).isDirectory() ? fs.readdirSync(p).flatMap((f) => walk(path.join(p, f))) : [p]);
      for (const f of walk(path.join(root, dir)).filter((x) => /\.(ts|tsx)$/.test(x))) expect(fs.readFileSync(f, "utf8"), f).not.toMatch(/bank\/math-hs/);
    }
  });

  it("leaves the existing 6,672-question bank unchanged", () => {
    expect((mathJson as any).sets.length).toBe(194);
    expect((mathJson as any).sets.reduce((n: number, s: any) => n + s.rows.length, 0)).toBe(6672);
    expect(old.length).toBe(6672);
    const ids = new Set(old.map((q) => q.id));
    for (const q of all) expect(ids.has(q.id), q.id).toBe(false);
  });

  it("question ids are unique, every skill exists, every answer is numeric and graded correctly (and a wrong value is not)", () => {
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
    expect(all.length).toBeGreaterThanOrEqual(5500);
    for (const set of hs.sets) expect(skills.has(set.skillId), `${set.id} -> ${set.skillId}`).toBe(true);
    for (const q of all) {
      const k = q.answer as { kind: "numeric"; value: number; tolerance?: number };
      expect(k.kind).toBe("numeric");
      expect(checkAnswer(q, String(k.value)), q.id).toBe(true);
      expect(checkAnswer(q, String(k.value + (k.tolerance ?? 0) * 2 + 1)), q.id).toBe(false);
    }
  });

  it("every template placeholder of a set is one of its columns (or {ans}); LaTeX groups are not placeholders", () => {
    for (const set of hs.sets) {
      const t = hs.templates[set.template] as any;
      const names = new Set([...set.cols, "ans"]);
      for (const s of [t.prompt, ...t.hints, t.explanation]) for (const m of s.matchAll(/\{([A-Za-z_]\w+)\}/g)) expect(names.has(m[1]), `${set.id}: {${m[1]}}`).toBe(true);
    }
  });

  it("two hints, an explanation, an explanation that ends with the answer's context, no duplicate prompt", () => {
    const seen = new Set<string>();
    const oldPrompts = new Set(old.map((q) => q.prompt.replace(/\s+/g, "")));
    for (const q of all) {
      // (placeholders are checked on the templates below; a filled text legitimately contains LaTeX braces such as e^{ax})
      expect(q.hints).toHaveLength(2);
      expect(q.explanation.length).toBeGreaterThan(5);
      const key = q.prompt.replace(/\s+/g, "");
      expect(seen.has(key), `duplicate prompt ${q.id}`).toBe(false);
      expect(oldPrompts.has(key), `duplicate of the existing bank ${q.id}`).toBe(false);
      seen.add(key);
    }
  });

  it("every set cites official high-school standards, never an unverifiable (class X) one, with an honest evidence label", () => {
    const s = (standardsFile as any).s as Record<string, [string, string]>;
    for (const set of hs.sets) {
      expect(set.standards.length, set.id).toBeGreaterThan(0);
      for (const code of set.standards) { expect(s[code], `${set.id}: ${code}`).toBeDefined(); expect(s[code][0], `${set.id}: ${code}`).not.toBe("X"); }
      expect(set.strategy, set.id).toBeTruthy();
      expect(["calc", "concept", "application", "reverse", "counting", "representation"]).toContain(set.evidence);
    }
  });

  it("the wording is complete in Korean (canonical) and English, with the same placeholders", () => {
    const en = JSON.parse(fs.readFileSync(path.join(root, "scripts/learn/bank/hs/kit/en.json"), "utf8")).q;
    for (const [k, t] of Object.entries(hs.templates) as [string, any][]) {
      const e = en[k];
      expect(e, k).toBeDefined();
      expect(e.hints).toHaveLength(t.hints.length);
      expect(holes(e.prompt), k).toBe(holes(t.prompt));
      expect(holes(e.expl), k).toBe(holes(t.explanation));
      e.hints.forEach((h: string, i: number) => expect(holes(h), k).toBe(holes(t.hints[i])));
      for (const s of [e.prompt, e.expl, ...e.hints]) expect(s, k).not.toMatch(/[가-힣]/);
    }
  });

  it("the independent verification covers exactly these bytes and every row passed", () => {
    const v = JSON.parse(fs.readFileSync(path.join(root, "docs/learning/math-hs-bank/verification.json"), "utf8"));
    const sha = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "lib/learn/content/bank/math-hs.json"))).digest("hex");
    expect(v.bankSha256, "verification.json is stale: rebuild, then run scripts/learn/bank/hs/verify/run.py").toBe(sha);
    expect(v.failures).toBe(0);
    expect(v.rows).toBe(all.length);
    for (const [t, r] of Object.entries(v.templates) as [string, any][]) expect(r.verified, t).toBe(r.rows);
    expect(Object.keys(v.templates).sort()).toEqual(Object.keys(hs.templates).sort());
  });
});
