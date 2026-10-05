import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import demo from "@/lib/learn/content/demo/english.json";
import elementary from "@/lib/learn/content/elementary/english.json";
import secondary from "@/lib/learn/content/secondary/english.json";
import viEnglish from "@/lib/learn/content/vi/english.json";
import viSecondary from "@/lib/learn/content/vi/secondary-english.json";
import { EXAMPLE_EXCLUDED, EXAMPLE_KO } from "@/lib/learn/content/listening/examples-ko";
import { PASSAGE_KO } from "@/lib/learn/content/listening/passages-ko";
import { buildQueue } from "@/lib/learn/listen/queue";
import { exampleItems, exampleSegments, passageSegments, passageText, splitSentences } from "@/lib/learn/listen/segments";

/**
 * Hard gate of the English + Korean listening content: 100 % canonical Korean for every listenable English segment, pairs aligned with the
 * English derived from the canonical lessons, and a mechanical QA of every pair (numbers, negation, names, leftovers). A meaning review was done
 * by hand (docs/learning/english-bilingual-listening-review.md); this test catches drift when the English changes later.
 */
type Lesson = { id: string; example: string };
type Q = { id: string; prompt: string; site: string };
const bundles = [demo, elementary, secondary] as unknown as { catalog: { courses: { grade: string; units: { lessons: Lesson[] }[] }[] }; questions: Q[] }[];
const lessons = bundles.flatMap((b) => b.catalog.courses.flatMap((c) => c.units.flatMap((u) => u.lessons)));
const questions = bundles.flatMap((b) => b.questions);
const passages = [...new Set(questions.map((q) => passageText(q.prompt)).filter((p): p is string => !!p))];
const HANGUL = /[가-힯]/;

/** every (english, korean) pair of the content */
const pairs: { where: string; en: string; ko: string }[] = [
  ...lessons.flatMap((l) => exampleSegments(`ex-${l.id}`, l.example, EXAMPLE_KO[l.id]).map((s) => ({ where: s.id, en: s.en, ko: s.ko ?? "" }))),
  ...passages.flatMap((p, k) => splitSentences(p).map((en, i) => ({ where: `passage-${k + 1}:${i}`, en, ko: PASSAGE_KO[p]?.[i] ?? "" }))),
];

describe("coverage: every listenable English segment has canonical Korean (MISSING_CANONICAL_KOREAN = 0)", () => {
  it("lesson examples: one Korean per English item, for every lesson; excluded lessons have no English to speak and a recorded reason", () => {
    expect(lessons.length).toBe(59);
    for (const l of lessons) {
      const items = exampleItems(l.example);
      expect(EXAMPLE_KO[l.id], l.id).toBeDefined();
      expect(EXAMPLE_KO[l.id].length, `${l.id}: ${l.example}`).toBe(items.length);
      if (!items.length) expect(EXAMPLE_EXCLUDED[l.id], `${l.id} needs an exclusion reason`).toMatch(/.{20,}/);
      else expect(EXAMPLE_EXCLUDED[l.id], `${l.id} is listenable and must not be excluded`).toBeUndefined();
    }
    expect(Object.keys(EXAMPLE_KO).sort()).toEqual(lessons.map((l) => l.id).sort()); // no orphan entries
  });
  it("an inline lesson meaning ('library = 도서관') and the authored Korean are the same text", () => {
    for (const l of lessons) exampleItems(l.example).forEach((it, i) => { if (it.ko) expect(EXAMPLE_KO[l.id][i], `${l.id}:${i}`).toBe(it.ko); });
  });
  it("reading passages: every passage of every question has one Korean sentence per English sentence; no orphan entries", () => {
    expect(passages.length).toBe(58);
    for (const p of passages) {
      expect(PASSAGE_KO[p], p).toBeDefined();
      expect(PASSAGE_KO[p].length, p).toBe(splitSentences(p).length);
    }
    expect(Object.keys(PASSAGE_KO).sort()).toEqual([...passages].sort());
  });
  it("totals: 241 segments, all paired", () => {
    expect(pairs.length).toBe(241);
    expect(pairs.filter((p) => !p.ko || !HANGUL.test(p.ko))).toEqual([]);
  });
  it("the Vietnamese UI derives exactly the same English segments, so the same pairs apply", () => {
    const viL = { ...(viEnglish as { lessons: Record<string, { example: string }> }).lessons, ...(viSecondary as { lessons: Record<string, { example: string }> }).lessons };
    const viQ = { ...(viEnglish as { questions: Record<string, { prompt?: string }> }).questions, ...(viSecondary as { questions: Record<string, { prompt?: string }> }).questions };
    for (const l of lessons) if (viL[l.id]) expect(exampleItems(viL[l.id].example).map((x) => x.en), l.id).toEqual(exampleItems(l.example).map((x) => x.en));
    for (const q of questions) if (passageText(q.prompt) && viQ[q.id]?.prompt) expect(passageText(viQ[q.id].prompt!), q.id).toBe(passageText(q.prompt));
  });
});

// ------------------------------------------------------------------ mechanical QA of every pair
const NUMBER_WORDS: Record<string, string[]> = { one: ["1", "한", "하나", "일"], two: ["2", "두", "둘"], three: ["3", "세", "셋"], five: ["5", "다섯"], six: ["6", "여섯"], seven: ["7", "일곱"], eight: ["8", "여덟"], ten: ["10", "열"], thirty: ["30", "서른"] };
const NAMES: Record<string, string> = { Mina: "미나", Tom: "톰", Ben: "벤", Amy: "에이미", Sam: "샘", Jin: "진", Ken: "켄", Busan: "부산", Jina: "지나", Jiho: "지호", Jisu: "지수", Daegu: "대구", Chris: "크리스", Kim: "김", Hana: "하나", Yuna: "유나", Ann: "앤", Lena: "레나", Mia: "미아", Jack: "잭", Jeju: "제주", Canada: "캐나다", Sunday: "일요일", Saturday: "토요일", Tuesday: "화요일", Thursday: "목요일", Friday: "금요일" };
/** idioms whose Korean meaning is negative although the English has no negation word (reviewed by hand) */
const NEGATION_IDIOMS = new Set(['His boss said, "This is the last straw."']);

describe("QA of every pair (meaning was reviewed by hand; these catch drift)", () => {
  it("NUMBER_PARITY: every number in the English is in the Korean (digits; number words as digits or Korean numerals)", () => {
    for (const p of pairs) {
      for (const n of (p.en.replace(/(\d),(\d{3})/g, "$1$2").match(/\d+/g) ?? [])) expect(p.ko.replace(/(\d),(\d{3})/g, "$1$2"), `${p.where}: ${p.en}`).toMatch(new RegExp(`(^|\\D)${n}(\\D|$)`));
      for (const [w, forms] of Object.entries(NUMBER_WORDS)) if (new RegExp(`\\b${w}\\b`, "i").test(p.en)) expect(forms.some((f) => p.ko.includes(f)), `${p.where}: "${w}" in ${p.en} -> ${p.ko}`).toBe(true);
    }
  });
  it("NEGATION_PARITY: a negated English sentence is negated in Korean, and the Korean adds no negation", () => {
    const enNeg = (s: string) => /\b(not|never|no)\b|n't\b/i.test(s.replace(/\bno matter\b/i, ""));
    // 아니 only as the copula negation (아니다 / 아니라 / 아니에요), not the question ending of 알다 (아니?); 안 only as a standalone word (not 동안)
    const koNeg = (s: string) => /않|못|없|아니(다|라|에요|야|요)|(^|\s)안 /.test(s);
    for (const p of pairs) {
      if (enNeg(p.en)) expect(koNeg(p.ko), `${p.where}: ${p.en} -> ${p.ko}`).toBe(true);
      else if (!NEGATION_IDIOMS.has(p.en)) expect(koNeg(p.ko), `${p.where}: added negation? ${p.en} -> ${p.ko}`).toBe(false);
    }
  });
  it("ENTITY_PARITY: every name, place and weekday is carried over", () => {
    for (const p of pairs) for (const [en, ko] of Object.entries(NAMES)) if (new RegExp(`\\b${en}\\b`).test(p.en)) expect(p.ko, `${p.where}: ${en}`).toContain(ko);
  });
  it("no English left in the Korean (only labels (A)/(B)/(C) and the unit cm), no markup, no empty text", () => {
    for (const p of pairs) {
      const latin = (p.ko.match(/[A-Za-z]+/g) ?? []).filter((w) => !["A", "B", "C", "cm"].includes(w));
      expect(latin, `${p.where}: ${p.ko}`).toEqual([]);
      expect(p.ko, p.where).not.toMatch(/[<>\n]|\$/);
      expect(p.ko.trim().length, p.where).toBeGreaterThan(0);
    }
  });
  it("labels (A)/(B)/(C) and quotes are kept; long sentences are not cut short (no obvious omission)", () => {
    for (const p of pairs) {
      for (const lab of p.en.match(/\([ABC]\)/g) ?? []) expect(p.ko, p.where).toContain(lab);
      if (/"/.test(p.en)) expect(p.ko, p.where).toMatch(/"/);
      if (p.en.length > 40) expect(p.ko.length / p.en.length, `${p.where}: ${p.en} -> ${p.ko}`).toBeGreaterThan(0.25);
    }
  });
});

describe("the queue works for every paired segment", () => {
  it("English + Korean alternates EN, KO for every lesson and passage, with the English and Korean voices", () => {
    const groups = [...lessons.map((l) => exampleSegments(l.id, l.example, EXAMPLE_KO[l.id])), ...passages.map((p, k) => passageSegments(`p${k}`, `"${p}" 질문: ?`, PASSAGE_KO[p])!)];
    for (const segs of groups.filter((g) => g.length)) {
      const q = buildQueue(segs, { mode: "en+ko" });
      expect(q.length).toBe(segs.length * 2);
      q.forEach((u, i) => {
        expect(u.lang).toBe(i % 2 === 0 ? "en-US" : "ko-KR");
        expect(u.text).toBe(i % 2 === 0 ? segs[i >> 1].en : segs[i >> 1].ko);
      });
      expect(buildQueue(segs, { mode: "en" }).map((u) => u.text)).toEqual(segs.map((s) => s.en));
    }
  });
});

describe("the passage Korean is server-only (it would help answer the question)", () => {
  it("no client component or page imports passages-ko; the API attaches it only to solved / revealed feedback", () => {
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    const clientish = [...walk("components"), ...walk("app")].filter((f) => /\.(tsx?|jsx?)$/.test(f));
    for (const f of clientish) expect(fs.readFileSync(f, "utf8"), f).not.toMatch(/passages-ko/);
    const svc = fs.readFileSync("lib/learn/server/service.ts", "utf8");
    expect(svc).toMatch(/feedback = \{ explanation: q\.explanation, \.\.\.\(passageKo/);
    expect(svc).toMatch(/feedback = \{ explanation: q\.explanation, answer: describeAnswer\(q\), \.\.\.\(passageKo/);
    expect(svc).not.toMatch(/hint: q\.hints\[level - 1\], hintLevel: level, .*passageKo/);
  });
});
