import koreanCourse from "@/lib/learn/content/korean/korean.json";
import koreanBank from "@/lib/learn/content/bank/korean.json";
import kitEn from "@/lib/learn/content/bank/korean-kit.en.json";
import { localizeBundle, overlayFor } from "@/lib/learn/content/localize";
import { formsOf, expandItem, type KBankData, type KForm, type KKit } from "@/lib/learn/content/korean-bank";
import { LOCALES, isLocale, type LearnLocale } from "@/lib/learn/i18n";
import { KOREAN_LEVELS, type ContentBundle, type Question } from "@/lib/learn/types";

/**
 * Data for the Korean review console: the WHOLE unpublished Korean material (course K1..K10 including the K6->K7 bridge, and the
 * practice bank), each question in one presentation language, with its identity and where its wording comes from.
 * Pure data assembly; access control is lib/learn/review/access.ts. Nothing here marks anything as reviewed.
 */
const course = koreanCourse as unknown as ContentBundle;
const bank = koreanBank as unknown as KBankData;
const REVIEW_LEVELS = KOREAN_LEVELS;
export type ReviewLevel = (typeof REVIEW_LEVELS)[number];
export const isReviewLevel = (v: unknown): v is ReviewLevel => typeof v === "string" && (REVIEW_LEVELS as readonly string[]).includes(v);
export const reviewLevels = REVIEW_LEVELS;
export { isLocale, LOCALES };

export type WordingState = "canonical" | "localized" | "fallback";
export interface ReviewRow {
  id: string;
  level: ReviewLevel;
  skillId: string;
  skillTitle: string;
  source: "course" | "bridge" | "bank";
  form: string;
  status: string;
  prompt: string;
  target?: Question["target"];
  options: { id: string; text: string; correct: boolean }[];
  /** answer kind: choice (the correct option is marked), order (answerText is the tile order), text, numeric */
  kind: string;
  answerText: string;
  hints: string[];
  explanation: string;
  /** canonical = English source text, localized = this language's own text, fallback = this language lacks (part of) the wording, English is shown */
  wording: WordingState;
  fallback: string[];
}
export interface ReviewPage { level: ReviewLevel; locale: LearnLocale; total: number; rows: ReviewRow[]; skills: { id: string; title: string; count: number }[]; error?: string }

const levelOfSkill = (skillId: string) => `K${skillId.split(".")[1].slice(1)}` as ReviewLevel;
const answerOf = (q: Question) => {
  const a = q.answer;
  if (a.kind === "choice") return q.options?.find((o) => o.id === a.id)?.text ?? a.id;
  if (a.kind === "numeric") return String(a.value);
  if (a.kind === "text") return a.accepted.join(" / ");
  return a.ids.map((id) => q.options?.find((o) => o.id === id)?.text ?? id).join(" ");
};
function toRow(q: Question, skillTitle: string, source: ReviewRow["source"], wording: WordingState, fallback: string[]): ReviewRow {
  const a = q.answer;
  return {
    id: q.id, level: levelOfSkill(q.skillId), skillId: q.skillId, skillTitle, source,
    form: q.tags?.find((t) => t !== "korean" && t !== "bank") ?? q.type,
    status: q.status, prompt: q.prompt, target: q.target,
    options: (q.options ?? []).map((o) => ({ id: o.id, text: o.text, correct: a.kind === "choice" && a.id === o.id })),
    kind: a.kind, answerText: answerOf(q), hints: q.hints, explanation: q.explanation, wording, fallback,
  };
}

/** Everything of one level in one language. `skill` narrows to a skill, `offset` / `limit` page the rows (the full level is 1,000-2,000 rows). */
export async function loadReviewLevel(level: ReviewLevel, locale: LearnLocale, opts: { skill?: string; offset?: number; limit?: number } = {}): Promise<ReviewPage> {
  const skillTitleEn = new Map(course.catalog.skills.map((s) => [s.id, s.title]));
  let ov: Awaited<ReturnType<typeof overlayFor>> = null;
  let error: string | undefined;
  if (locale !== "en") {
    try { ov = await overlayFor(locale, "korean"); } catch (e) { error = `The ${locale} overlay could not be loaded (${(e as Error).message}); English is shown.`; }
  }
  const localized = ov ? localizeBundle(course, ov) : course;
  const skillTitle = new Map(localized.catalog.skills.map((s) => [s.id, s.title]));
  const rows: ReviewRow[] = [];
  const wordingCourse: WordingState = locale === "en" ? "canonical" : ov ? "localized" : "fallback";
  for (const q of localized.questions) {
    if (levelOfSkill(q.skillId) !== level) continue;
    rows.push(toRow(q, skillTitle.get(q.skillId) ?? skillTitleEn.get(q.skillId) ?? q.skillId, q.skillId.startsWith("k.k7.bridge_") ? "bridge" : "course", wordingCourse, wordingCourse === "fallback" ? ["course"] : []));
  }
  const tpl = (ov?.bank?.templates ?? {}) as Partial<Record<KForm, KKit["templates"][KForm]>>;
  const texts = ov?.bank?.texts ?? {};
  const kit: KKit = { templates: { ...(kitEn.templates as unknown as KKit["templates"]), ...tpl }, texts };
  for (const [skillId, sk] of Object.entries(bank.skills)) {
    if (levelOfSkill(skillId) !== level) continue;
    for (const item of sk.items) for (const form of formsOf(item, skillId)) {
      if (form === "dict" && !kit.templates.dict) continue;
      const q = expandItem(skillId, item, sk.items, sk.notes, kit, form, { draft: bank.status === "DRAFT", vi: locale === "vi" });
      const fb: string[] = [];
      if (locale !== "en") {
        if (!tpl[form]) fb.push(`template:${form}`);
        if (item.c !== "syl" && texts[`g:${item.id}`] === undefined) fb.push("meaning");
        if (item.s && texts[`s:${item.id}`] === undefined) fb.push("situation");
        if (item.n && texts[`n:${skillId}:${item.n}`] === undefined) fb.push("note");
      }
      rows.push(toRow(q, skillTitle.get(skillId) ?? skillTitleEn.get(skillId) ?? skillId, "bank", locale === "en" ? "canonical" : fb.length ? "fallback" : "localized", fb));
    }
  }
  const bySkill = new Map<string, number>();
  for (const r of rows) bySkill.set(r.skillId, (bySkill.get(r.skillId) ?? 0) + 1);
  const skills = [...bySkill].map(([id, count]) => ({ id, title: skillTitle.get(id) ?? skillTitleEn.get(id) ?? id, count }));
  const filtered = opts.skill ? rows.filter((r) => r.skillId === opts.skill) : rows;
  const offset = Math.max(0, opts.offset ?? 0), limit = Math.min(100, Math.max(1, opts.limit ?? 25));
  return { level, locale, total: filtered.length, rows: filtered.slice(offset, offset + limit), skills, error };
}

/** Locale independent counts per level (course + bridge + bank), for the console's start page. */
export function reviewCounts(): Record<ReviewLevel, { course: number; bridge: number; bank: number; items: number }> {
  const out = Object.fromEntries(REVIEW_LEVELS.map((l) => [l, { course: 0, bridge: 0, bank: 0, items: 0 }])) as Record<ReviewLevel, { course: number; bridge: number; bank: number; items: number }>;
  for (const q of course.questions) { const o = out[levelOfSkill(q.skillId)]; if (q.skillId.startsWith("k.k7.bridge_")) o.bridge++; else o.course++; }
  for (const [skillId, sk] of Object.entries(bank.skills)) {
    const o = out[levelOfSkill(skillId)];
    for (const item of sk.items) { if (item.c !== "syl") o.items++; o.bank += formsOf(item, skillId).filter((f) => f !== "dict" || (kitEn.templates as Record<string, unknown>).dict).length; }
  }
  return out;
}
