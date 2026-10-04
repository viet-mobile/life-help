import { describe, expect, it } from "vitest";
import { extensionKindOf, publicExercise, validateContentPack, type AdultContentPack } from "@/lib/learn/products/content";

/** SYNTHETIC fixtures (invented words): they test the contract, they are not content and not an import of any legacy site. */
const UI = ["ko", "vi", "en"];
const tr = (t: string) => ({ ko: t, vi: t, en: t });
const base = (targetLanguageId: string, extension: unknown, target = "X"): AdultContentPack => ({
  schemaVersion: 1, targetLanguageId,
  vocabulary: [{ id: "v1", targetLanguageId, target, translations: tr("t"), partOfSpeech: "noun", level: 1, lessonId: "l1", examples: [{ target: "ex", translations: tr("e") }], extension: extension as never }],
  grammar: [{ id: "g1", targetLanguageId, title: tr("g"), explanation: tr("e"), level: 2, lessonId: "l1", examples: [] }],
  exercises: [
    { id: "e1", type: "multiple_choice", lessonId: "l1", level: 1, prompt: tr("p"), options: ["a", "b", "c"], answerIndex: 1 },
    { id: "e2", type: "fill_blank", lessonId: "l1", level: 1, prompt: tr("p"), template: "a ___ b", accepted: ["x"] },
    { id: "e3", type: "match", lessonId: "l1", level: 1, prompt: tr("p"), pairs: [{ left: "a", right: "1" }, { left: "b", right: "2" }] },
    { id: "e4", type: "translation", lessonId: "l1", level: 1, prompt: tr("p"), sourceText: "s", accepted: ["t"] },
    { id: "e5", type: "word_order", lessonId: "l1", level: 1, prompt: tr("p"), tokens: ["c", "a", "b"] },
  ],
  lessons: [{ id: "l1", targetLanguageId, level: 1, order: 1, title: tr("L"), vocabularyIds: ["v1"], grammarIds: ["g1"], exerciseIds: ["e1", "e2", "e3", "e4", "e5"] }],
  provenance: { source: "synthetic", licence: "test", importedAt: "2030-01-01T00:00:00Z" },
});
const ja = base("ja", { kind: "ja", hiragana: "あ", kanji: "亜", romaji: "a" });
const zh = base("zh-Hans", { kind: "zh", simplified: "你好", pinyin: "nǐ hǎo" });
const ko = base("ko", { kind: "ko", hangul: "안녕", eojeol: ["안녕"] });
const vi = base("vi", { kind: "vi", region: "standard", register: "neutral" });
const id = base("id", { kind: "id", root: "baca", affixes: ["mem-"] });
const en = base("en", { kind: "en", irregularForms: ["go", "went", "gone"], phrasalVerb: false });

describe("one engine, typed per-target extensions", () => {
  it("accepts a valid pack for each of the six initial targets with the same universal shape", () => {
    for (const p of [ja, zh, ko, vi, id, en]) expect(validateContentPack(p, UI), p.targetLanguageId).toEqual([]);
  });
  it("maps targets to extensions and falls back to generic for the other languages", () => {
    expect(["ja", "zh-Hans", "zh-Hant", "ko", "vi", "id", "en"].map(extensionKindOf)).toEqual(["ja", "zh", "zh", "ko", "vi", "id", "en"]);
    expect(extensionKindOf("th")).toBe("generic");
    expect(validateContentPack(base("th", { kind: "generic" }), UI)).toEqual([]);
  });
  it("refuses an extension of another language (no per-language escape hatch)", () => {
    expect(validateContentPack(base("ja", { kind: "zh", simplified: "好", pinyin: "hǎo" }), UI).join()).toMatch(/does not fit target ja/);
    expect(validateContentPack(base("th", { kind: "ko", hangul: "한" }), UI).join()).toMatch(/needs "generic"/);
  });
  it("enforces what each target needs: hiragana, toned pinyin, Hangul", () => {
    expect(validateContentPack(base("ja", { kind: "ja", hiragana: "" }), UI).join()).toMatch(/hiragana/);
    expect(validateContentPack(base("zh-Hans", { kind: "zh", simplified: "你好", pinyin: "ni hao" }), UI).join()).toMatch(/toned pinyin/);
    expect(validateContentPack(base("zh-Hans", { kind: "zh", simplified: "你好", pinyin: "ni3 hao3" }), UI)).toEqual([]);
    expect(validateContentPack(base("ko", { kind: "ko", hangul: "abc" }), UI).join()).toMatch(/Hangul/);
    expect(validateContentPack(base("id", { kind: "id", affixes: [""] }), UI).join()).toMatch(/empty affix/);
  });
  it("checks identity and references: duplicate ids, unknown lessons or ids, levels, locales, provenance", () => {
    const p = structuredClone(ja);
    p.vocabulary.push({ ...p.vocabulary[0] });
    p.lessons[0].vocabularyIds.push("ghost");
    p.grammar[0].level = 11 as never;
    p.vocabulary[0].translations = { xx: "t" };
    p.provenance.licence = "";
    const out = validateContentPack(p, UI).join("\n");
    expect(out).toMatch(/duplicate id/);
    expect(out).toMatch(/unknown vocabulary ghost/);
    expect(out).toMatch(/level 1\.\.10/);
    expect(out).toMatch(/unknown UI locale xx/);
    expect(out).toMatch(/provenance needs/);
  });
  it("validates exercises: options, blanks, pairs, tokens", () => {
    const p = structuredClone(ja);
    (p.exercises[0] as { options: string[]; answerIndex: number }).options = ["a", "a"];
    (p.exercises[1] as { template: string }).template = "no blank";
    (p.exercises[2] as { pairs: { left: string; right: string }[] }).pairs = [{ left: "a", right: "1" }];
    (p.exercises[4] as { tokens: string[] }).tokens = ["only"];
    const out = validateContentPack(p, UI).join("\n");
    expect(out).toMatch(/exercise e1: needs 2\+ distinct options/);
    expect(out).toMatch(/exercise e2: template needs a ___ blank/);
    expect(out).toMatch(/exercise e3: needs 2\+ pairs/);
    expect(out).toMatch(/exercise e5: needs 2\+ tokens/);
  });
  it("never sends answers to the browser", () => {
    for (const e of ja.exercises) {
      const text = JSON.stringify(publicExercise(e));
      expect(text).not.toMatch(/answerIndex|accepted/);
    }
    const w = publicExercise(ja.exercises[4]) as { tokens: string[] };
    expect(w.tokens).toEqual(["a", "b", "c"]); // shuffled-by-sort: the correct order is not exposed
  });
});
