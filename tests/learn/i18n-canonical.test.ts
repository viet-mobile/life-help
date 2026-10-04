import { describe, expect, it } from "vitest";
import { ko } from "@/lib/learn/i18n/ko";
import { vi } from "@/lib/learn/i18n/vi";
import { en } from "@/lib/learn/i18n/en";

const keys = (o: object) => Object.keys(o).sort();
const ph = (s: string) => (s.match(/\{[A-Za-z0-9_]+\}/g) ?? []).sort().join(",");
const HANGUL = /[ㄱ-ㆎ가-힣]/;

describe("canonical English learning locale", () => {
  it("has exactly the same keys as ko and vi", () => {
    expect(keys(en)).toEqual(keys(ko));
    expect(keys(vi)).toEqual(keys(ko));
    expect(keys(ko).length).toBeGreaterThan(300);
  });
  it("has no empty value and no leading / trailing space", () => {
    for (const [k, v] of Object.entries(en)) { expect(v.length, k).toBeGreaterThan(0); expect(v, k).toBe(v.trim()); }
  });
  it("uses the same {placeholders} as Korean and Vietnamese in every string", () => {
    for (const k of Object.keys(ko) as (keyof typeof ko)[]) { expect(ph(en[k]), `en ${k}`).toBe(ph(ko[k])); expect(ph(vi[k]), `vi ${k}`).toBe(ph(ko[k])); }
  });
  it("has no Korean leakage (the language names in locale.* are the only native-script exceptions) and no math delimiters or line breaks", () => {
    for (const [k, v] of Object.entries(en)) { if (k !== "locale.ko") expect(v, k).not.toMatch(HANGUL); expect(v, k).not.toMatch(/\$|\n/); }
  });
  it("only uses brace syntax for placeholders: no ICU plural or select", () => {
    for (const [k, v] of Object.entries(en)) expect(v.replace(/\{[A-Za-z0-9_]+\}/g, ""), k).not.toMatch(/[{}]/);
  });
  it("covers the vocabulary of the foundation groups (plans, certification states, scholarship states, proficiency)", () => {
    for (const k of ["plan.free", "plan.plus", "plan.certification", "plan.institution", "cert.status.certified", "cert.status.revoked", "scholarship.status.awarded", "scholarship.status.paid", "proficiency.dim.practicalInformation", "study.targetLanguage", "study.uiLanguage", "keyboard.enter.next"]) expect(Object.keys(en)).toContain(k);
  });
  it("makes no promise: foundation labels contain no verbs about money or guarantees", () => {
    const labels = Object.entries(en).filter(([k]) => /^(plan|cert|scholarship)\./.test(k)).map(([, v]) => v.toLowerCase());
    for (const v of labels) expect(v).not.toMatch(/guarantee|unhackable|official cefr|free money|win /);
  });
});
