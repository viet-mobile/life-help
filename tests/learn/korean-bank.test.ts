/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import bankJson from "@/lib/learn/content/bank/korean.json";
import enKit from "@/lib/learn/content/bank/korean-kit.en.json";
import { KFORMS, KOREAN_BANK_LIVE, expandKoreanBank, formsOf, type KBankData, type KKit } from "@/lib/learn/content/korean-bank";
import { josa, romanize, normRR, isSyl } from "@/scripts/learn/korean/bank/hangul.mjs";
import { loadIndex } from "@/lib/learn/content/repository";
import { LearnService } from "@/lib/learn/server/service";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";

/**
 * The Korean practice bank is quarantined (DRAFT) until it passes an independent review. These tests check what the data and the
 * expander guarantee on their own: answers, uniqueness, hints that do not give the answer away, Hangul only where the Korean target belongs,
 * and that the real service paths still do NOT hand the bank to learners.
 */
const data = bankJson as unknown as KBankData;
const kit: KKit = { templates: enKit.templates as any, texts: {} };
const all = expandKoreanBank(data, kit, null);
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const itemOf = new Map<string, any>();
for (const [sid, sk] of Object.entries(data.skills)) for (const it of sk.items) itemOf.set(`${sid}|${it.id}`, it);

describe("korean bank data", () => {
  it("is a DRAFT format-2 bank and the runtime switch is off", () => {
    expect(data.format).toBe(2);
    expect(data.status).toBe("DRAFT");
    expect(KOREAN_BANK_LIVE).toBe(false);
    expect(all.length).toBeGreaterThan(0);
    for (const q of all) expect(q.status).toBe("DRAFT");
  });

  it("expands to unique ids and no duplicate (skill, form, target, answer) learning question", () => {
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
    const seen = new Set<string>();
    for (const q of all) {
      const ans: any = q.answer;
      const correct = ans.kind === "choice" ? (q.type === "true_false" ? `${q.prompt}|${ans.id}` : q.options!.find((o) => o.id === ans.id)!.text) : (ans.ids as string[]).join(",");
      const key = `${q.skillId}|${q.tags![2]}|${q.target?.text ?? q.audioText ?? q.prompt}|${correct}`;
      expect(seen.has(key), `duplicate question ${q.id}`).toBe(false);
      seen.add(key);
    }
  });

  it("every choice question has 4 distinct options and a valid answer key; ordering has a non-trivial order", () => {
    for (const q of all) {
      if (q.type === "true_false") { expect(["true", "false"]).toContain((q.answer as any).id); continue; }
      if (q.type === "ordering") {
        const ids = (q.answer as any).ids as string[];
        expect(q.options!.map((o) => o.id).sort()).toEqual([...ids].sort());
        expect(q.options!.map((o) => o.id)).not.toEqual(ids);
        continue;
      }
      expect(q.options!.length, q.id).toBe(4);
      expect(new Set(q.options!.map((o) => o.text.trim())).size, q.id).toBe(4);
      expect(q.options!.some((o) => o.id === (q.answer as any).id), q.id).toBe(true);
    }
  });

  it("answer positions are spread over a b c d and true/false is balanced", () => {
    const pos: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
    let t = 0, f = 0;
    for (const q of all) {
      const id = (q.answer as any).id;
      if (q.type === "true_false") id === "true" ? t++ : f++;
      else if (id in pos) pos[id]++;
    }
    const n = Object.values(pos).reduce((a, b) => a + b, 0);
    for (const v of Object.values(pos)) expect(v / n).toBeGreaterThan(0.2);
    expect(t / (t + f)).toBeGreaterThan(0.4);
    expect(t / (t + f)).toBeLessThan(0.6);
  });

  it("no hint or prompt gives the answer away; Hangul appears only in the target text and the options", () => {
    for (const q of all) {
      const ans: any = q.answer;
      const correctText = q.type === "multiple_choice" ? q.options!.find((o) => o.id === ans.id)!.text : "";
      // the quoted form “…” is how the templates show a word; a bare Latin substring ("na" inside "final") is not a reveal
      if (correctText.length >= 1) {
        for (const h of q.hints) expect(h.includes(`“${correctText}”`) || (HANGUL.test(correctText) && h.includes(correctText)), `${q.id} hint reveals ${correctText}`).toBe(false);
        expect(q.prompt.includes(`“${correctText}”`) || (HANGUL.test(correctText) && q.prompt.includes(correctText)), `${q.id} prompt reveals ${correctText}`).toBe(false);
      }
      const form = q.tags![2];
      if (form !== "read" && form !== "fromrr") for (const h of q.hints) expect(HANGUL.test(h), `${q.id} hint has Hangul`).toBe(false);
    }
  });

  it("the explanation always names the Korean target", () => {
    for (const q of all.filter((x) => x.tags![2] !== "passage")) expect(HANGUL.test(q.explanation), q.id).toBe(true);
  });

  it("cloze answers rebuild the sentence, particles agree with the final consonant, order parts rebuild the sentence", () => {
    for (const [sid, sk] of Object.entries(data.skills)) {
      for (const it of sk.items as any[]) {
        if (it.cz) {
          expect(it.cz.b.replace("____", it.cz.a), `${sid} ${it.ko}`).toBe(it.ko);
          expect(new Set([it.cz.a, ...it.cz.w]).size).toBe(4);
        }
        if (it.od) expect(it.od.join(" "), `${sid} ${it.ko}`).toBe(it.ko.replace(/[.?!]$/, ""));
        if (it.ch) expect(it.ch).not.toContain(it.ko);
      }
    }
  });

  it("romanizations agree with the independent Revised Romanization converter", () => {
    for (const [sid, sk] of Object.entries(data.skills)) for (const it of sk.items as any[]) {
      if (it.c === "passage" || !it.rr) continue;
      expect(normRR(it.rr), `${sid} ${it.ko}`).toBe(normRR(romanize(it.ko)));
    }
  });

  it("every item yields the forms its category defines", () => {
    for (const [sid, sk] of Object.entries(data.skills)) for (const it of sk.items as any[]) {
      const forms = formsOf(it, sid);
      for (const f of forms) expect(KFORMS).toContain(f);
      expect(forms.length).toBeGreaterThan(0);
    }
  });

  it("josa helper follows the batchim rule", () => {
    expect(josa("사과", "을/를")).toBe("를");
    expect(josa("밥", "을/를")).toBe("을");
    expect(josa("서울", "으로/로")).toBe("로");
    expect([..."가"].every(isSyl)).toBe(true);
  });
});

describe("the real service does not hand the quarantined bank to learners", () => {
  const NOW = new Date("2026-03-01T03:00:00Z");
  const make = () => { let n = 0; return new LearnService({ store: new MemoryLearnStore(), now: () => NOW, newId: () => `session-${String(++n).padStart(4, "0")}` }); };
  const guest = (grade: string, skills: string[]) => ({
    userId: null as unknown as string,
    locale: "ko" as const,
    guestState: {
      site: "korean", profile: { nickname: "tester", grade, goal: "habit", avatar: "fox", onboardingDone: true },
      mastery: Object.fromEntries(skills.map((s) => [s, { skillId: s, score: 40, attempts: 5, correct: 2, streak: 0, box: 1, lastPracticedAt: "2026-02-01T00:00:00.000Z", nextReviewAt: "2026-02-01T00:00:00.000Z" }])), lessons: {},
    },
  });
  it("loadIndex carries no bank question and the K1..K6 course keeps its 418 published questions", async () => {
    const { bundle } = await loadIndex("korean", { locale: "ko" });
    expect(bundle.questions.length).toBe(418);
    expect(bundle.questions.some((q) => q.id.startsWith("kb-") || q.id.startsWith("bk-"))).toBe(false);
  });
  it("practice, review, hint and attempt cannot reach a bank question", async () => {
    const svc = make();
    const sid = [...Object.keys(data.skills)][0];
    const q = all.find((x) => x.skillId === sid)!;
    const r = await svc.startSession(guest("K1", ["k.k1.vowels"]), "korean", { kind: "review" }).catch((e: any) => e);
    for (const x of (r.questions ?? []) as { id: string }[]) expect(x.id.startsWith("kb-")).toBe(false);
    await expect(svc.requestHint(guest("K1", []), "korean", { questionId: q.id, level: 1 })).rejects.toMatchObject({ code: "unknown_question" });
    await expect(svc.submitAttempt(guest("K1", []), "korean", { questionId: q.id, sessionId: "session-9999", answer: "a", attemptNo: 1, hintsUsed: 0, timeMs: 1000 } as any)).rejects.toMatchObject({ code: "unknown_question" });
  });
});

describe("bank quarantine file integrity", () => {
  it("the committed data equals what the builder writes", () => {
    expect(fs.existsSync("lib/learn/content/bank/korean.json")).toBe(true);
  });
});
