import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../../lib/learn/i18n/en";
import { ko } from "../../lib/learn/i18n/ko";
import { run, verifyLocale } from "../../scripts/learn/i18n/verify-generated-locales.mjs";

/**
 * Acceptance gate for re-delivered generated locales. Fixtures are synthetic (no real translation): they reproduce the defects found in the Phase-2 package
 * (a locale written in the wrong language, one locale copied into another, broken placeholders, Hangul leakage, untranslated English).
 */
const KEEP = /(\{[A-Za-z0-9_]+\}|MATH\.LIFE\.HELP|ENGLISH\.LIFE\.HELP|XP|\p{Extended_Pictographic})/u;
const flatEn = en as unknown as Record<string, string>;
/** a pseudo-translation: letters replaced by `ch` (own-script stand-in), placeholders, brands and emoji kept byte-identical, locale.* names untouched */
function pseudo(ch: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(flatEn)) {
    if (k.startsWith("locale.")) { out[k] = k === "locale.ko" ? (ko as unknown as Record<string, string>)[k] : v; continue; }
    out[k] = v.split(KEEP).map((p, i) => (i % 2 ? p : p.replace(/\p{L}/gu, ch))).join("");
  }
  return out;
}

describe("generated-locale verifier", () => {
  it("accepts a structurally clean pseudo-translation in the locale's own script", () => {
    const r = verifyLocale("th", pseudo("ก"));
    expect(r.problems).toEqual([]);
  });
  it("flags a locale written in the wrong language (Latin text where Thai script is expected)", () => {
    const wrong = pseudo("a");
    expect(verifyLocale("th", wrong).problems.join("\n")).toMatch(/WRONG LANGUAGE/);
  });
  it("flags missing keys, broken placeholders, Hangul, markup and untranslated English", () => {
    const flat = pseudo("ก");
    const withPh = Object.keys(flat).find((k) => /\{[a-z]+\}/.test(flatEn[k]))!;
    delete flat[Object.keys(flat)[0]];
    flat[withPh] = flat[withPh].replace(/\{[a-z]+\}/, "{wrong}");
    const hk = Object.keys(flat)[5]; flat[hk] = "한국어";
    const mk = Object.keys(flat)[6]; flat[mk] = "a<b>c\nd $x$";
    const same = Object.keys(flat).find((k) => !k.startsWith("locale.") && !["brand.math", "brand.english", "dash.xp", "common.diff"].includes(k) && k !== hk && k !== mk && k !== withPh)!; flat[same] = flatEn[same];
    const p = verifyLocale("th", flat).problems.join("\n");
    expect(p).toMatch(/missing 1/);
    expect(p).toMatch(/phBad/);
    expect(p).toMatch(/hangul/);
    expect(p).toMatch(/markup/);
    expect(verifyLocale("th", flat).notes.identicalToEnglish).toBeGreaterThanOrEqual(1);
  });
  it("flags a translation that changes a number of the canonical text (nickname 2-16 became 2-12, a duration dropped), native digits allowed", () => {
    const flat = pseudo("ก");
    flat["onboarding.nickname.hint"] = flat["onboarding.nickname.hint"].replace("16", "12");
    flat["diag.intro.title"] = flat["diag.intro.title"].replace(/\d/g, "");
    const r = verifyLocale("th", flat);
    expect(r.problems.join("\n")).toMatch(/numDiff 2/);
    const thai = pseudo("ก"); thai["onboarding.nickname.hint"] = thai["onboarding.nickname.hint"].replace(/\d/g, (d) => String.fromCodePoint(0x0e50 + Number(d)));
    expect(verifyLocale("th", thai).problems).toEqual([]);
  });
  it("number words: correct Hebrew / Arabic word forms of a value pass; a dropped duration or a changed range still fails", () => {
    const he = pseudo("א");
    he["landing.cta.start"] = "התחילו בדקה אחת";
    he["diag.intro.title"] = "בדיקת רמה בשתי דקות";
    expect(verifyLocale("he", he).problems.join("\n")).not.toMatch(/numDiff/);
    he["landing.cta.start"] = "התחילו עכשיו"; // the one-minute meaning is gone
    expect(verifyLocale("he", he).problems.join("\n")).toMatch(/numDiff 1: landing\.cta\.start/);

    const arz = pseudo("ا");
    arz["landing.cta.start"] = "ابدأ في دقيقة واحدة";
    arz["diag.intro.title"] = "اختبار مستوى في دقيقتين";
    arz["onboarding.nickname.hint"] = "اسم مستعار من حرفين لـ ١٦ حرف كفاية";
    expect(verifyLocale("arz", arz).problems.join("\n")).not.toMatch(/numDiff/);
    arz["onboarding.nickname.hint"] = "اسم مستعار من حرفين لـ ١٢ حرف كفاية"; // 2-16 became 2-12
    arz["site.math.description"] = "مسار تعلم مخصص لكل طالب"; // the 3-10 minute range is gone
    expect(verifyLocale("arz", arz).problems.join("\n")).toMatch(/numDiff 2: .*onboarding\.nickname\.hint/);
  });
  it("a range that loses one end (3-10 -> 3) fails, and an arz two-minute word form still passes", () => {
    const th = pseudo("ก");
    th["landing.how1.body"] = th["landing.how1.body"].replace(/-?10/, "").replace("3", "3");
    expect(verifyLocale("th", th).problems.join("\n")).toMatch(/numDiff 1: landing\.how1\.body/);
    const arz = pseudo("ا");
    arz["diag.intro.title"] = "اختبار مستوى في دقيقتين";
    expect(verifyLocale("arz", arz).problems.join("\n")).not.toMatch(/diag\.intro\.title/);
  });
  it("flags a locale whose strings were copied from another language, and a generated reference locale", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "locales-"));
    try {
      fs.writeFileSync(path.join(dir, "th.json"), JSON.stringify(pseudo("ก")));
      fs.writeFileSync(path.join(dir, "ja.json"), JSON.stringify(pseudo("ก")));
      fs.writeFileSync(path.join(dir, "ko.json"), JSON.stringify(pseudo("ก")));
      const r = run(dir);
      expect(r.sharedStrings.length).toBeGreaterThan(0);
      expect(r.problems.join("\n")).toMatch(/copied between languages/);
      expect(r.problems.join("\n")).toMatch(/ko: reference locale must not be generated/);
      expect(r.problems.join("\n")).toMatch(/missing file/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
  it("the Phase-2 package would not have passed (guard: the gate requires every expected locale)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "locales-"));
    try { expect(run(dir).problems.length).toBeGreaterThanOrEqual(35); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});
