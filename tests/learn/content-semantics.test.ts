import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/learn/i18n";
import { loadIndex } from "@/lib/learn/content/repository";
import { MATH_HS_DATA } from "@/lib/learn/content/bank";
import { SITES, type ContentBundle, type Question, type Site } from "@/lib/learn/types";

/**
 * Parity and semantic policy for every learner locale (registry-derived, 47): the localized bundle a learner receives must be the
 * canonical bundle with only presentation text replaced.
 *   parity:    same ids, order, answer key, difficulty, skill, role, type, status, option ids, hint count; same catalog structure
 *   coverage:  math / english canonical text is Korean; no learner-facing string may still be Korean in any other locale (no fallback)
 *   semantics: an amount in won stays won (no currency is LOCALE_ADAPTABLE in this content); math survives localization - every
 *              number written in the canonical math is still there (a locale may write 0,36 or C(5,2) or "x-axis" in words), `$`
 *              delimiters stay balanced and no LaTeX command loses its backslash; nothing learner-facing is empty
 */
const WON = /\d[\d,]*\s*원|만\s*원|원짜리/;
const FOREIGN =
  /रुपय|रुपये|रुपए|रूपये|रुपया|ರೂಪಾಯಿ|ಪೈಸೆ|രൂപ|ரூபாய்|రూపాయ|ਰੁਪਏ|રૂપિયા|روپ|\bfrancs?\b|\bdollars?\b|\beuros?\b|\byuan\b|(?<![韩韓])元(?!音)|\bpesos?\b|shilingi|\bbirr\b|ብር|টাকা|\blira\b|рубл|гривн|₹|€|£|¥|บาท|đồng|paise|पैस|पैश/i;
const HANGUL = /[가-힣]/;
const MATH = /\$[^$]+\$/g;
const NUM = /\d+/g;
/** a LaTeX command that lost its backslash inside math ($angle C=90^circ$) renders as plain words */
const BARE_COMMAND = /(?<![\\a-zA-Z])(?:angle|circ|frac|sqrt|times|cdot|cdots|overline|dot|sigma|int|sum|le|ge)(?![a-zA-Z])/;
const dollars = (s: string) => (s.match(/(?<!\\)\$/g) ?? []).length;
const multiset = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());

const parityView = (q: Question) => ({
  id: q.id, type: q.type, skillId: q.skillId, role: q.role, status: q.status, difficulty: q.difficulty, answer: q.answer,
  options: (q.options ?? []).map((o) => o.id), hints: q.hints.length,
});
const structure = (b: ContentBundle) => ({
  skills: b.catalog.skills.map((s) => s.id),
  courses: b.catalog.courses.map((c) => ({ id: c.id, grade: c.grade, units: c.units.map((u) => ({ id: u.id, lessons: u.lessons.map((l) => [l.id, l.questionIds, l.challengeId, l.skillIds]) })) })),
});
/** learner-facing text of a question, field by field */
const fields = (q: Question): [string, string][] => [
  ["prompt", q.prompt], ["explanation", q.explanation ?? ""],
  ...q.hints.map((h, i): [string, string] => [`hint${i}`, h]),
  ...(q.options ?? []).map((o): [string, string] => [`option:${o.id}`, o.text ?? ""]),
];

/**
 * Banks whose wording does not exist in every language yet (published 2026-10-15). A language without wording gets NONE of that bank, never
 * the bank in another language, so its question list is the canonical list minus exactly that bank. Everything else stays in parity.
 *   math    high-school tranche (math-hs.json): Korean + English wording only
 *   english Claude English practice bank: Korean instructions only
 *   korean  practice bank: only the languages whose overlay carries every meaning (14 + the site's English)
 */
const HS_IDS = new Set(MATH_HS_DATA.sets.flatMap((s) => s.rows.map((_, i) => `${s.id}-${String(i + 1).padStart(3, "0")}`)));
const bankOnly = (site: Site, id: string) => (site === "math" ? HS_IDS.has(id) : site === "english" ? id.startsWith("eb-") : id.startsWith("kb-"));

describe.each(SITES)("%s: 47-locale parity and semantic policy", (site: Site) => {
  it.each([...LOCALES])("%s", async (locale) => {
    const canon = (await loadIndex(site)).bundle;
    const loc = (await loadIndex(site, { locale })).bundle;
    expect(structure(loc), "ANSWER / DIFFICULTY / SKILL parity: catalog").toEqual(structure(canon));
    const served = new Set(loc.questions.map((q) => q.id));
    const gap = canon.questions.filter((q) => bankOnly(site, q.id) && !served.has(q.id));
    // math / korean banks are all-or-nothing per locale; english bank uses the per-question completeness gate (english-bank.ts)
    if (gap.length) {
      const all = canon.questions.filter((q) => bankOnly(site, q.id)).length;
      if (site === "english") {
        expect(locale).not.toBe("ko");
        expect(all - gap.length, `${site}/${locale}: localized English bank questions served`).toBeGreaterThan(6000);
      } else {
        expect(gap.length, `${site}/${locale}: a bank is withheld whole or not at all`).toBe(all);
        if (site === "math") expect(["ko", "en"]).not.toContain(locale);
      }
    }
    const gapIds = new Set(gap.map((q) => q.id));
    expect(loc.questions.map(parityView), "ANSWER / DIFFICULTY / SKILL parity: questions").toEqual(canon.questions.filter((q) => !gapIds.has(q.id)).map(parityView));
    const byId = new Map(canon.questions.map((q) => [q.id, q]));
    const errors: string[] = [];
    for (const q of loc.questions) {
      const c = byId.get(q.id)!;
      const cf = new Map(fields(c));
      for (const [f, text] of fields(q)) {
        const src = cf.get(f) ?? "";
        if (src.trim() && !text.trim()) errors.push(`${q.id} ${f}: empty`);
        if (site !== "korean" && locale !== "ko" && HANGUL.test(text)) errors.push(`${q.id} ${f}: not localized`);
        if (WON.test(src) && FOREIGN.test(text)) errors.push(`${q.id} ${f}: currency changed (${text.match(FOREIGN)![0]})`);
        if (site === "math") {
          if (dollars(src) % 2 === 0 && dollars(text) % 2 !== 0) errors.push(`${q.id} ${f}: unbalanced $ in ${JSON.stringify(text)}`);
          for (const m of text.match(MATH) ?? []) if (BARE_COMMAND.test(m.replace(/\\text\{[^}]*\}/g, ""))) errors.push(`${q.id} ${f}: LaTeX command without backslash in ${m}`);
          const need = multiset((src.match(MATH) ?? []).filter((m) => !HANGUL.test(m)).flatMap((m) => m.match(NUM) ?? []));
          const have = multiset(text.match(NUM) ?? []);
          for (const [n, k] of need) if ((have.get(n) ?? 0) < k) errors.push(`${q.id} ${f}: number ${n} from the math is missing`);
        }
      }
    }
    if (site !== "korean" && locale !== "ko") {
      const catalog = loc.catalog.courses.flatMap((c) => [c.title, c.world.name, c.world.tagline, ...c.units.flatMap((u) => [u.title, ...u.lessons.flatMap((l) => [l.title, l.concept, l.example])])]);
      for (const t of [...catalog, ...loc.catalog.skills.map((s) => s.title)]) if (HANGUL.test(t ?? "")) errors.push(`catalog: not localized: ${t}`);
    }
    expect(errors, `${site}/${locale}`).toEqual([]);
  });
});
