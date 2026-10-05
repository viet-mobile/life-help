import type { RightsDecision } from "./rights";
/**
 * Content contracts of the ONE adult-study engine.
 *
 * The six legacy sites are not six engines: every target language shares these shapes. What differs per language lives in a typed `extension`, never in a
 * separate model or a separate code path. These are TARGET contracts for importing and authoring content; they are not a claim about what the legacy
 * sites contain (their content model has not been mechanically established, see docs/learning/review-bulk-phase1.md).
 *
 * Authority: exercise answers belong to the server (the same rule as the school bank). A pack is validated before import; nothing is trusted by shape alone.
 */
import type { ProficiencyLevel } from "./proficiency";

/** learner-language text keyed by UI locale ("ko", "vi", "en", ...). The TARGET text is never translated. */
export type Translations = Record<string, string>;
export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "pronoun" | "particle" | "numeral" | "classifier" | "conjunction" | "interjection" | "phrase" | "other";

export interface AdultExample { target: string; translations: Translations }

/* ------------------------------ per-target extensions (discriminated by `kind`) ------------------------------ */
export interface JapaneseExtension { kind: "ja"; hiragana: string; kanji?: string; katakana?: string; furigana?: string; romaji?: string }
export interface ChineseExtension { kind: "zh"; simplified: string; traditional?: string; /** tone marks (nǐ hǎo) or tone numbers (ni3 hao3) */ pinyin: string }
export interface VietnameseExtension { kind: "vi"; /** 'ma' 'má' 'mà' ... : the six tones are part of the word, so the diacritic form is the identity */ diacriticFree?: string; register?: "formal" | "neutral" | "informal"; region?: "north" | "central" | "south" | "standard" }
export interface KoreanExtension { kind: "ko"; hangul: string; /** decomposed jamo */ jamo?: string[]; /** eojeol (space-delimited units) */ eojeol?: string[]; romanization?: string }
export interface IndonesianExtension { kind: "id"; root?: string; affixes?: string[] }
export interface EnglishExtension { kind: "en"; irregularForms?: string[]; phrasalVerb?: boolean }
export interface GenericExtension { kind: "generic" }
export type TargetExtension = JapaneseExtension | ChineseExtension | VietnameseExtension | KoreanExtension | IndonesianExtension | EnglishExtension | GenericExtension;
export type ExtensionKind = TargetExtension["kind"];

/** which extension a target language id (as in messages/index.ts) must use */
export const EXTENSION_FOR_TARGET: Record<string, ExtensionKind> = { ja: "ja", "zh-Hans": "zh", "zh-Hant": "zh", vi: "vi", ko: "ko", id: "id", en: "en" };
export const extensionKindOf = (targetLanguageId: string): ExtensionKind => EXTENSION_FOR_TARGET[targetLanguageId] ?? "generic";

/* ------------------------------ entries ------------------------------ */
export interface AdultVocabularyEntry {
  id: string;
  targetLanguageId: string;
  /** the word or phrase in the target language */
  target: string;
  translations: Translations;
  partOfSpeech: PartOfSpeech;
  /** internal L1..L10 (not a school grade) */
  level: ProficiencyLevel;
  lessonId: string;
  examples: AdultExample[];
  extension: TargetExtension;
}
export interface AdultGrammarUnit {
  id: string;
  targetLanguageId: string;
  title: Translations;
  explanation: Translations;
  level: ProficiencyLevel;
  lessonId: string;
  examples: AdultExample[];
  patterns?: string[];
}

export type AdultExercise =
  | { id: string; type: "multiple_choice"; lessonId: string; level: ProficiencyLevel; prompt: Translations; options: string[]; /** index into options, SERVER ONLY */ answerIndex: number }
  | { id: string; type: "fill_blank"; lessonId: string; level: ProficiencyLevel; prompt: Translations; template: string; /** accepted fillers, SERVER ONLY */ accepted: string[] }
  | { id: string; type: "match"; lessonId: string; level: ProficiencyLevel; prompt: Translations; pairs: { left: string; right: string }[] }
  | { id: string; type: "translation"; lessonId: string; level: ProficiencyLevel; prompt: Translations; sourceText: string; /** accepted target-language answers, SERVER ONLY */ accepted: string[] }
  | { id: string; type: "word_order"; lessonId: string; level: ProficiencyLevel; prompt: Translations; /** the correct sequence, SERVER ONLY */ tokens: string[] };

export interface AdultLesson {
  id: string;
  targetLanguageId: string;
  level: ProficiencyLevel;
  order: number;
  title: Translations;
  vocabularyIds: string[];
  grammarIds: string[];
  exerciseIds: string[];
}
export interface ContentProvenance { source: string; licence: string; importedFrom?: string; importedAt: string; /** rights decision covering the pack: required to publish (see rights.ts) */ rights?: RightsDecision }
export interface AdultContentPack {
  schemaVersion: 1;
  targetLanguageId: string;
  vocabulary: AdultVocabularyEntry[];
  grammar: AdultGrammarUnit[];
  lessons: AdultLesson[];
  exercises: AdultExercise[];
  provenance: ContentProvenance;
}

/* ------------------------------ validation ------------------------------ */
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/;
const TONED_PINYIN = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]|[a-z]+[1-5]\b/i;
const nonEmpty = (s: unknown): s is string => typeof s === "string" && s.trim().length > 0;
const levelOk = (n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 10;

/** Returns every problem (empty = importable). `uiLocales` is the set of locales translations may use. */
export function validateContentPack(pack: AdultContentPack, uiLocales: readonly string[]): string[] {
  const problems: string[] = [];
  const add = (m: string) => problems.push(m);
  if (pack.schemaVersion !== 1) add("schemaVersion must be 1");
  if (!nonEmpty(pack.targetLanguageId)) add("targetLanguageId required");
  if (!nonEmpty(pack.provenance?.source) || !nonEmpty(pack.provenance?.licence) || !nonEmpty(pack.provenance?.importedAt)) add("provenance needs source, licence and importedAt");
  const kind = extensionKindOf(pack.targetLanguageId);
  const ids = new Set<string>();
  const unique = (id: string, what: string) => { if (!nonEmpty(id)) add(`${what}: id required`); else if (ids.has(id)) add(`${what} ${id}: duplicate id`); ids.add(id); };
  const tr = (t: Translations, where: string) => {
    const keys = Object.keys(t ?? {});
    if (!keys.length) add(`${where}: at least one translation`);
    for (const k of keys) { if (!uiLocales.includes(k)) add(`${where}: unknown UI locale ${k}`); if (!nonEmpty(t[k])) add(`${where}: empty translation ${k}`); }
  };
  const lessons = new Set(pack.lessons.map((l) => l.id));
  const vocab = new Set(pack.vocabulary.map((v) => v.id)), grammar = new Set(pack.grammar.map((g) => g.id)), exercises = new Set(pack.exercises.map((e) => e.id));

  for (const v of pack.vocabulary) {
    unique(v.id, "vocabulary");
    if (v.targetLanguageId !== pack.targetLanguageId) add(`vocabulary ${v.id}: targetLanguageId differs from the pack`);
    if (!nonEmpty(v.target)) add(`vocabulary ${v.id}: target required`);
    if (!levelOk(v.level)) add(`vocabulary ${v.id}: level 1..10`);
    if (!lessons.has(v.lessonId)) add(`vocabulary ${v.id}: unknown lesson ${v.lessonId}`);
    tr(v.translations, `vocabulary ${v.id}`);
    for (const e of v.examples) { if (!nonEmpty(e.target)) add(`vocabulary ${v.id}: example without target text`); tr(e.translations, `vocabulary ${v.id} example`); }
    if (v.extension.kind !== kind) { add(`vocabulary ${v.id}: extension "${v.extension.kind}" does not fit target ${pack.targetLanguageId} (needs "${kind}")`); continue; }
    const x = v.extension;
    if (x.kind === "ja" && !nonEmpty(x.hiragana)) add(`vocabulary ${v.id}: Japanese entries need hiragana`);
    if (x.kind === "zh" && (!nonEmpty(x.simplified) || !nonEmpty(x.pinyin) || !TONED_PINYIN.test(x.pinyin))) add(`vocabulary ${v.id}: Chinese entries need simplified text and toned pinyin`);
    if (x.kind === "ko" && (!nonEmpty(x.hangul) || !HANGUL.test(x.hangul))) add(`vocabulary ${v.id}: Korean entries need Hangul`);
    if (x.kind === "id" && x.affixes && x.affixes.some((a) => !nonEmpty(a))) add(`vocabulary ${v.id}: empty affix`);
  }
  for (const g of pack.grammar) {
    unique(g.id, "grammar");
    if (g.targetLanguageId !== pack.targetLanguageId) add(`grammar ${g.id}: targetLanguageId differs from the pack`);
    if (!levelOk(g.level)) add(`grammar ${g.id}: level 1..10`);
    if (!lessons.has(g.lessonId)) add(`grammar ${g.id}: unknown lesson ${g.lessonId}`);
    tr(g.title, `grammar ${g.id} title`); tr(g.explanation, `grammar ${g.id} explanation`);
  }
  for (const e of pack.exercises) {
    unique(e.id, "exercise");
    if (!levelOk(e.level)) add(`exercise ${e.id}: level 1..10`);
    if (!lessons.has(e.lessonId)) add(`exercise ${e.id}: unknown lesson ${e.lessonId}`);
    tr(e.prompt, `exercise ${e.id} prompt`);
    if (e.type === "multiple_choice" && (e.options.length < 2 || new Set(e.options).size !== e.options.length || !Number.isInteger(e.answerIndex) || e.answerIndex < 0 || e.answerIndex >= e.options.length)) add(`exercise ${e.id}: needs 2+ distinct options and a valid answerIndex`);
    if ((e.type === "fill_blank" || e.type === "translation") && !e.accepted.some(nonEmpty)) add(`exercise ${e.id}: needs an accepted answer`);
    if (e.type === "fill_blank" && !e.template.includes("___")) add(`exercise ${e.id}: template needs a ___ blank`);
    if (e.type === "match" && (e.pairs.length < 2 || new Set(e.pairs.map((p) => p.left)).size !== e.pairs.length)) add(`exercise ${e.id}: needs 2+ pairs with distinct left sides`);
    if (e.type === "word_order" && e.tokens.length < 2) add(`exercise ${e.id}: needs 2+ tokens`);
  }
  for (const l of pack.lessons) {
    unique(l.id, "lesson");
    if (l.targetLanguageId !== pack.targetLanguageId) add(`lesson ${l.id}: targetLanguageId differs from the pack`);
    if (!levelOk(l.level)) add(`lesson ${l.id}: level 1..10`);
    tr(l.title, `lesson ${l.id} title`);
    for (const id of l.vocabularyIds) if (!vocab.has(id)) add(`lesson ${l.id}: unknown vocabulary ${id}`);
    for (const id of l.grammarIds) if (!grammar.has(id)) add(`lesson ${l.id}: unknown grammar ${id}`);
    for (const id of l.exerciseIds) if (!exercises.has(id)) add(`lesson ${l.id}: unknown exercise ${id}`);
  }
  if (new Set(pack.lessons.map((l) => l.order)).size !== pack.lessons.length) add("lesson order values must be unique");
  return problems;
}

/** What may be sent to a browser: exercises without their answers. */
export function publicExercise(e: AdultExercise): Record<string, unknown> {
  const { id, type, lessonId, level, prompt } = e;
  switch (e.type) {
    case "multiple_choice": return { id, type, lessonId, level, prompt, options: e.options };
    case "fill_blank": return { id, type, lessonId, level, prompt, template: e.template };
    case "match": return { id, type, lessonId, level, prompt, left: e.pairs.map((p) => p.left), right: [...e.pairs.map((p) => p.right)].sort() };
    case "translation": return { id, type, lessonId, level, prompt, sourceText: e.sourceText };
    case "word_order": return { id, type, lessonId, level, prompt, tokens: [...e.tokens].sort() };
  }
}
