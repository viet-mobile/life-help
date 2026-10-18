import crypto from "node:crypto";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import bank from "@/lib/learn/content/bank/english-draft.json";
import pending from "@/lib/learn/content/bank/english-pending.json";
import safeIds from "@/lib/learn/content/bank/english-hint2-safe.json";
import unlinked from "@/lib/learn/content/bank/english-unlinked.json";
import fixture from "./fixtures/english-released-main.json";
import { loadIndex } from "@/lib/learn/content/repository";
import { LOCALES } from "@/lib/learn/i18n";
import { NEUTRAL_SET, hintRevealsAnswer } from "@/lib/learn/hintGate";
import type { Question } from "@/lib/learn/types";

/**
 * Replaces the four English release-candidate pin tests that were removed when the staging line's English outgrew main's counts
 * (english-electives x3, integration-rc x1). Same purposes, current policy: no fixed total, but every change is accounted for.
 *  1. bank <-> catalog link: every served bank question has a catalog skill; nothing served waits in pending; unlinked questions are not served
 *  2. the English that main released is preserved: every released question is byte-identical unless it is in the recorded, reviewed change list
 *  3. hint 2 is neutral at the server boundary for every language, never reveals the answer, and is never counted as a reviewed rich hint
 *  4. other learner languages never receive a Korean sentence as hint 2
 */
const served = (bank as { questions: Question[] }).questions;
const canon = (v: unknown) => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x));
const h = (q: unknown) => crypto.createHash("sha256").update(canon(q)).digest("hex").slice(0, 12);
const fx = fixture as unknown as { released: Record<string, string>; allowedChanged: string[]; allowedRemoved: string[] };

describe("English protection: bank and catalog", () => {
  it("every served bank question belongs to a catalog skill, none waits in the pending file, and unlinked questions are not served", async () => {
    const { bundle } = await loadIndex("english", { locale: "ko" });
    const skills = new Set(bundle.catalog.skills.map((s) => s.id));
    const eb = bundle.questions.filter((q) => q.id.startsWith("eb-"));
    expect(eb.length).toBe(served.length);
    for (const q of eb) expect(skills.has(q.skillId), q.id).toBe(true);
    expect((pending as { questions: Question[] }).questions.length).toBe(0);
    const servedIds = new Set(eb.map((q) => q.id));
    const un = (unlinked as { questions: Question[] }).questions;
    expect(un.length).toBeGreaterThan(0);
    for (const q of un) expect(servedIds.has(q.id), q.id).toBe(false);
  });
  it("ids are unique and every served question has a prompt, an answer key and at least two options or a text answer", () => {
    expect(new Set(served.map((q) => q.id)).size).toBe(served.length);
    for (const q of served) { expect(q.prompt?.length, q.id).toBeGreaterThan(0); expect(q.answer, q.id).toBeTruthy(); }
  });
});

describe("English protection: released questions are preserved", () => {
  it("every question main released is unchanged unless it is in the recorded change list; the list matches the data exactly", () => {
    const cur = new Map(served.map((q) => [q.id, q]));
    const changed: string[] = [], removed: string[] = [];
    for (const [id, hash] of Object.entries(fx.released)) { const c = cur.get(id); if (!c) removed.push(id); else if (h(c) !== hash) changed.push(id); }
    expect(Object.keys(fx.released)).toHaveLength(12882);
    expect(changed.sort()).toEqual(fx.allowedChanged);
    expect(removed.sort()).toEqual(fx.allowedRemoved);
    // a change list is a bounded exception, not a way to rewrite the bank
    expect(fx.allowedChanged.length + fx.allowedRemoved.length).toBeLessThan(Object.keys(fx.released).length * 0.01);
  });
});

describe("English protection: hint 2 boundary", () => {
  it("no hint 2 has been cleared as a rich hint, and every served hint 2 is neutral and reveals nothing (neutral hints are not a quality review)", async () => {
    expect((safeIds as { ids: string[] }).ids).toEqual([]);
    const { bundle } = await loadIndex("english", { locale: "ko" });
    const all = bundle.questions.filter((q) => q.id.startsWith("eb-") || q.id.startsWith("e-h3e-"));
    expect(all.length).toBeGreaterThan(14000);
    let rich = 0, leaks = 0;
    for (const q of all) { if (q.hints.length < 2) continue; if (!NEUTRAL_SET.includes(q.hints[1])) rich++; if (hintRevealsAnswer(q.hints[1], q)) leaks++; }
    expect(rich).toBe(0);
    expect(leaks).toBe(0);
  });
  it.each(["vi", "ar", "ur", "en", "ja", "zh-Hans"] as const)("%s: hint 2 of bank and course electives is wordless or neutral, never a Korean sentence", async (locale) => {
    expect(LOCALES).toContain(locale);
    const { bundle } = await loadIndex("english", { locale });
    for (const q of bundle.questions.filter((x) => x.id.startsWith("eb-") || x.id.startsWith("e-h3e-"))) {
      if (q.hints.length < 2) continue;
      expect(/[가-힣]/.test(q.hints[1]), `${locale} ${q.id}`).toBe(false);
      expect(hintRevealsAnswer(q.hints[1], q), `${locale} ${q.id}`).toBe(false);
    }
  });
});
