import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/learn/i18n";
import { loadIndex } from "@/lib/learn/content/repository";
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
  /रुपय|रुपये|रुपए|रूपये|रुपया|ರೂಪಾಯಿ|ಪೈಸೆ|രൂപ|ரூபாய்|రూపాయ|ਰੁਪਏ|રૂપિયા|روپ|\bfrancs?\b|\bdollars?\b|\beuros?\b|\byuan\b|(?<![韩韓])元|\bpesos?\b|shilingi|\bbirr\b|ብር|টাকা|\blira\b|рубл|гривн|₹|€|£|¥|บาท|đồng|paise|पैस|पैश/i;
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

describe.each(SITES)("%s: 47-locale parity and semantic policy", (site: Site) => {
  it.each([...LOCALES])("%s", async (locale) => {
    const canon = (await loadIndex(site)).bundle;
    const loc = (await loadIndex(site, { locale })).bundle;
    expect(structure(loc), "ANSWER / DIFFICULTY / SKILL parity: catalog").toEqual(structure(canon));
    expect(loc.questions.map(parityView), "ANSWER / DIFFICULTY / SKILL parity: questions").toEqual(canon.questions.map(parityView));
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
