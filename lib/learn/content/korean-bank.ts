/**
 * The study.korean practice bank (lib/learn/content/bank/korean.json, format 2).
 *
 * Target material (Korean text, its Revised Romanization, the reviewed Vietnamese reading aid, the answer keys and distractors) is stored ONCE
 * in the data and is never localized. Everything the learner reads around it (prompts, hints, explanations, English meanings, grammar notes)
 * comes from a presentation kit: the canonical English kit (korean-bank-kit.ts) or the bank section of a locale overlay
 * (`bank.templates[form]` and `bank.texts["g:<id>" | "s:<id>" | "n:<key>"]`), exactly like the course (scripts/learn/korean/kit/*).
 *
 * PUBLISHED (owner's release decision of 2026-10-15): KOREAN_BANK_LIVE is true and bank.ts expands it as PUBLISHED practice questions. The
 * content is AI-written and AI-reviewed; it has had no native-speaker or teacher review, and no screen may say otherwise.
 * Expanding is a pure function of (data, kit); ids and answer keys are identical in every language.
 */
import type { Question, QuestionOption } from "@/lib/learn/types";

export const KOREAN_BANK_LIVE = true as boolean;

export type KCat = "word" | "phrase" | "sentence" | "expr" | "passage" | "syl";
export interface KItem {
  id: string;
  c: KCat;
  ko: string;
  g: string;
  s?: string;
  n?: string;
  rr?: string;
  vi?: string;
  cz?: { b: string; a: string; w: string[] };
  ch?: string[];
  od?: string[];
  rd?: { t: string; f: string[] };
}
export interface KBankData {
  format: 2;
  site: "korean";
  status: "DRAFT" | "PUBLISHED";
  skills: Record<string, { notes: Record<string, string>; items: KItem[] }>;
}
export type KForm = "meaning" | "toko" | "listen" | "tf" | "read" | "fromrr" | "sit" | "cloze" | "choose" | "order" | "passage" | "dict";
export interface KTemplate { prompt: string; hints: string[]; explanation: string; /** used instead of `hints` when the romanization would give the meaning away (loanwords: 라디오 = “radio”) */ hintsSafe?: string[] }
export interface KKit { templates: Record<KForm, KTemplate>; texts: Record<string, string> }
export const KFORMS: KForm[] = ["meaning", "toko", "listen", "tf", "read", "fromrr", "sit", "cloze", "choose", "order", "passage"];

const OPT = ["a", "b", "c", "d"];
const levelOf = (skillId: string) => Number(skillId.split(".")[1].slice(1));
export const skillKey = (skillId: string) => skillId.replace(/^k\./, "").replace(/\./g, "-");
export const questionId = (skillId: string, itemId: string, form: KForm) => `kb-${skillKey(skillId)}-${itemId}-${form}`;

/** FNV-1a: stable across runtimes. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** Which question forms an item yields. Word-level romanization practice stays in the beginner levels. */
export function formsOf(item: KItem, skillId: string): KForm[] {
  const lv = levelOf(skillId);
  switch (item.c) {
    case "syl": return ["read", "listen", "fromrr"];
    case "word":
    case "phrase": return ["meaning", "toko", "listen", "tf", ...(lv <= 3 ? (["read"] as KForm[]) : [])];
    case "expr": return ["meaning", "toko", ...(item.s ? (["sit"] as KForm[]) : []), "listen", "tf"];
    case "sentence": return ["meaning", "toko", "listen", "tf", ...(item.cz ? (["cloze"] as KForm[]) : []), ...(item.ch ? (["choose"] as KForm[]) : []), ...(item.od ? (["order"] as KForm[]) : []), ...(item.od && item.ko.length >= 5 && item.ko.length <= 40 ? (["dict"] as KForm[]) : [])];
    case "passage": return ["passage"];
  }
}

const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)).replace(/([.?!])([”"»」』]?)[.。]/gu, "$1$2");

const sylCount = (s: string) => [...s].filter((c) => c >= "가" && c <= "힣").length;
const firstSyl = (s: string) => [...s].find((c) => c >= "가" && c <= "힣") ?? s[0];

/** Pick `n` other values deterministically (stable per seed) from `pool`, skipping any rejected by `ok`. */
function pick<T>(pool: T[], n: number, seed: string, key: (t: T) => string, ok: (t: T) => boolean): T[] {
  const seen = new Set<string>();
  const ranked = pool
    .filter(ok)
    .map((t) => ({ t, k: hash(`${seed}:${key(t)}`) }))
    .sort((a, b) => a.k - b.k || (key(a.t) < key(b.t) ? -1 : 1));
  const out: T[] = [];
  for (const { t } of ranked) {
    const k = key(t);
    if (seen.has(k)) continue;
    seen.add(k); out.push(t);
    if (out.length === n) break;
  }
  return out;
}

/** Same-looking syllables first (shared onset or vowel), so the drill tests the sound, not the shape. */
const sylNear = (a: string, b: string) => {
  const ca = a.charCodeAt(0) - 0xac00, cb = b.charCodeAt(0) - 0xac00;
  return Math.floor(ca / 588) === Math.floor(cb / 588) || Math.floor((ca % 588) / 28) === Math.floor((cb % 588) / 28);
};

function shuffleOptions(id: string, texts: string[]): { options: QuestionOption[]; answerId: string } {
  const ranked = texts.map((t, i) => ({ t, i, k: hash(`${id}:${i}`) })).sort((a, b) => a.k - b.k);
  const options = ranked.map((r, j) => ({ id: OPT[j], text: r.t }));
  return { options, answerId: OPT[ranked.findIndex((r) => r.i === 0)] };
}

export interface ExpandOptions { vi?: boolean; draft?: boolean }

export function expandItem(skillId: string, item: KItem, pool: KItem[], notes: Record<string, string>, kit: KKit, form: KForm, opts: ExpandOptions = {}): Question {
  const qid = questionId(skillId, item.id, form);
  const lv = levelOf(skillId);
  const tpl = kit.templates[form];
  const gl = (it: KItem) => kit.texts[`g:${it.id}`] ?? it.g;
  const reading = (it: KItem) => (opts.vi ? it.vi ?? it.rr ?? "" : it.rr ?? "");
  const sameKind = (it: KItem) => it.id !== item.id && (item.c === "word" || item.c === "phrase" ? it.c === "word" || it.c === "phrase" : it.c === item.c);
  const others = (n: number, ok: (it: KItem) => boolean = () => true, key = (it: KItem) => it.id) => {
    const same = pick(pool, n, qid, key, (it) => sameKind(it) && ok(it));
    if (same.length === n) return same;
    const rest = pick(pool, n - same.length, qid + "+", key, (it) => it.id !== item.id && !same.includes(it) && ok(it) && (item.c === "passage" || it.c !== "passage")); // a long passage gloss as a distractor is trivially eliminated
    return [...same, ...rest];
  };
  /**
   * Distractors are drawn from other items of the skill, so a long sentence could be set against short words and stand out by length alone.
   * When the first draw makes the key clearly the longest (or shortest) option, draw again among items of a similar length (when enough exist).
   */
  const lengthFair = (n: number, ok: (it: KItem) => boolean, keyOf: (it: KItem) => string, lenOf: (it: KItem) => number): KItem[] => {
    const first = others(n, ok, keyOf);
    const kl = lenOf(item);
    const ls = first.map(lenOf);
    const cue = kl >= 14 && ls.length > 0 && (kl >= 1.6 * Math.max(...ls) || kl * 1.6 <= Math.min(...ls));
    if (!cue) return first;
    const near = others(n, (it) => ok(it) && lenOf(it) >= 0.6 * kl && lenOf(it) <= 1.7 * kl, keyOf);
    return near.length === n ? near : first;
  };
  const base = Math.min(5, 1 + Math.floor((lv - 1) / 2));
  let type: Question["type"] = "multiple_choice";
  let options: QuestionOption[] | undefined;
  let answer: Question["answer"];
  let difficulty = base;
  let target: Question["target"] | undefined;
  let audioText: string | undefined;
  let prompt: string;
  const vars: Record<string, string | number> = { ko: item.ko, rr: reading(item), gloss: gl(item), meaning: gl(item), first: firstSyl(item.ko), n: sylCount(item.ko) };

  const choice = (texts: string[]) => {
    const r = shuffleOptions(qid, texts);
    options = r.options; answer = { kind: "choice", id: r.answerId };
  };
  switch (form) {
    case "meaning": {
      const w = lengthFair(3, (it) => it.g !== item.g && gl(it) !== gl(item), (it) => gl(it), (it) => gl(it).length);
      choice([gl(item), ...w.map(gl)]);
      target = { text: item.ko, romanization: item.rr, romanizationVi: item.vi }; audioText = item.ko; break;
    }
    case "toko": {
      const w = lengthFair(3, (it) => it.ko !== item.ko, (it) => it.id, (it) => it.ko.length);
      choice([item.ko, ...w.map((x) => x.ko)]); vars.gloss = gl(item); break;
    }
    case "listen": {
      const w = item.c === "syl" ? pick(pool, 3, qid, (it) => it.ko, (it) => it.ko !== item.ko && sylNear(it.ko, item.ko)) : lengthFair(3, (it) => it.ko !== item.ko, (it) => it.id, (it) => it.ko.length);
      const fillw = w.length === 3 ? w : [...w, ...pick(pool, 3 - w.length, qid + "+", (it) => it.ko, (it) => it.ko !== item.ko && !w.includes(it))];
      choice([item.ko, ...fillw.map((x) => x.ko)]); audioText = item.ko; difficulty = Math.max(1, base - (item.c === "syl" ? 0 : 0)); break;
    }
    case "tf": {
      type = "true_false";
      const truth = hash(qid) % 2 === 0;
      const other = others(1, (it) => gl(it) !== gl(item), (it) => gl(it))[0];
      vars.gloss = truth ? gl(item) : gl(other);
      answer = { kind: "choice", id: truth ? "true" : "false" };
      target = { text: item.ko, romanization: item.rr, romanizationVi: item.vi }; audioText = item.ko; difficulty = Math.max(1, base - 1); break;
    }
    case "read": {
      const near = item.c === "syl" ? pick(pool, 3, qid, (it) => reading(it), (it) => reading(it) !== reading(item) && sylNear(it.ko, item.ko))
        : pick(pool, 3, qid, (it) => reading(it), (it) => it.id !== item.id && reading(it) !== reading(item) && sylCount(it.ko) === sylCount(item.ko));
      const w = near.length === 3 ? near : [...near, ...pick(pool, 3 - near.length, qid + "+", (it) => reading(it), (it) => it.id !== item.id && reading(it) !== reading(item) && !near.includes(it))];
      choice([reading(item), ...w.map(reading)]);
      target = { text: item.ko }; audioText = item.ko; break;
    }
    case "fromrr": {
      const w = pick(pool, 3, qid, (it) => it.ko, (it) => it.ko !== item.ko && sylNear(it.ko, item.ko));
      const fillw = w.length === 3 ? w : [...w, ...pick(pool, 3 - w.length, qid + "+", (it) => it.ko, (it) => it.ko !== item.ko && !w.includes(it))];
      choice([item.ko, ...fillw.map((x) => x.ko)]); vars.rr = reading(item); break;
    }
    case "sit": {
      const w0 = others(3, (it) => !!it.s && it.ko !== item.ko, (it) => it.ko);
      const w = w0.length === 3 ? w0 : [...w0, ...pick(pool, 3 - w0.length, qid + "+s", (it) => it.ko, (it) => it.ko !== item.ko && !w0.includes(it) && it.c !== "passage")];
      choice([item.ko, ...w.map((x) => x.ko)]); vars.gloss = kit.texts[`s:${item.id}`] ?? item.s ?? ""; difficulty = Math.min(5, base + 1); break;
    }
    case "cloze": {
      choice([item.cz!.a, ...item.cz!.w]); target = { text: item.cz!.b }; difficulty = Math.min(5, base + 1); break;
    }
    case "choose": {
      choice([item.ko, ...item.ch!]); difficulty = Math.min(5, base + 1); break;
    }
    case "order": {
      type = "ordering";
      const ids = item.od!.map((_, i) => `w${i + 1}`);
      const r = 1 + (hash(qid) % (ids.length - 1));
      const shown = ids.map((_, i) => ids[(i + r) % ids.length]);
      options = shown.map((wid) => ({ id: wid, text: item.od![Number(wid.slice(1)) - 1] }));
      answer = { kind: "order", ids }; audioText = item.ko; vars.first = item.od![0]; difficulty = Math.min(5, base + 1); break;
    }
    case "dict": {
      // dictation: hear the sentence, type it. Korean spacing and spelling are NOT forgiven (normalizeDictation "ko" only forgives punctuation / stray spaces at the ends)
      type = "short_answer";
      answer = { kind: "text", accepted: [item.ko], dictation: "ko" }; audioText = item.ko; vars.n = item.ko.replace(/\s+/g, "").length; vars.first = item.od![0]; difficulty = Math.min(5, base + 2); break;
    }
    case "passage": {
      choice([item.rd!.t, ...item.rd!.f]); target = { text: item.ko }; audioText = item.ko.replace(/(^|\s)[A-Z가-힣]:\s*/g, "$1").replace(/\n/g, " ").replace(/\s+/g, " ").trim(); // every "A:" / "B:" label, also on one line vars.gloss = gl(item); difficulty = Math.min(5, base + 1); break;
    }
  }
  prompt = fill(tpl.prompt, vars);
  const letters = (x: string) => x.toLowerCase().replace(/[^a-z]/g, "");
  const leaks = !item.rr && (form === "meaning" || form === "tf") || (form === "meaning" || form === "tf") && letters(String(vars.rr)).length >= 3 && letters(String(vars.meaning)).length >= 3 && (letters(String(vars.rr)).includes(letters(String(vars.meaning))) || letters(String(vars.meaning)).includes(letters(String(vars.rr))));
  const hints = (leaks && tpl.hintsSafe ? tpl.hintsSafe : tpl.hints).map((h) => fill(h, vars));
  const tidy = (x: string) => x.replace(/\s*\(\s*\)/g, "");
  const note = item.n && (kit.texts[`n:${skillId}:${item.n}`] ?? notes[item.n]);
  const explanation = tidy(fill(tpl.explanation, vars)) + (note ? ` ${note}` : "");
  return {
    id: qid, site: "korean", skillId, type, difficulty: difficulty as Question["difficulty"], prompt, hints, explanation,
    family: `kb-${skillKey(skillId)}`, role: "variant", expectedSeconds: 30, tags: ["korean", "bank", form],
    status: opts.draft === false ? "PUBLISHED" : "DRAFT", answer: answer!, ...(options ? { options } : {}), ...(target ? { target } : {}), ...(audioText ? { audioText } : {}),
  } as Question;
}

/** Pure: every question of the bank for one presentation kit. `skills` limits the result to skills the bundle really has. */
export function expandKoreanBank(data: KBankData, kit: KKit, skills: ReadonlySet<string> | null, opts: ExpandOptions = {}): Question[] {
  const out: Question[] = [];
  for (const [skillId, sk] of Object.entries(data.skills)) {
    if (skills && !skills.has(skillId)) continue;
    for (const item of sk.items) for (const form of formsOf(item, skillId)) if (form !== "dict" || kit.templates.dict) out.push(expandItem(skillId, item, sk.items, sk.notes, kit, form, { draft: data.status === "DRAFT", ...opts }));
  }
  return out;
}
