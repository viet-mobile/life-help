import { describe, expect, it } from "vitest";
import { ADULT_DOMAIN, INITIAL_ADULT_TARGETS, adultHost, adultStagingHost, createTargetRegistry } from "@/lib/learn/products/registry";
import { adultContext, legacyRedirect, resolveProductHost, schoolContext } from "@/lib/learn/products/resolve";
import { PROFICIENCY_DIMENSIONS, describeMapping, makeProficiency } from "@/lib/learn/products/proficiency";
import type { TargetLanguage } from "@/lib/learn/products/types";

/** TEST FIXTURE ONLY: the six initial products with invented metadata; the real registry is generated from messages/index.ts. */
const NAMES: Record<string, [string, string]> = { ko: ["한국어", "Korean"], en: ["English", "English"], ja: ["日本語", "Japanese"], "zh-Hans": ["简体中文", "Chinese"], id: ["Bahasa Indonesia", "Indonesian"], vi: ["Tiếng Việt", "Vietnamese"] };
const target = (t: (typeof INITIAL_ADULT_TARGETS)[number], over: Partial<TargetLanguage> = {}): TargetLanguage => ({
  id: t.id, slug: t.slug, nativeName: NAMES[t.id][0], englishName: NAMES[t.id][1], host: adultHost(t.slug), writingSystem: "latin", rtl: false, status: "LIVE",
  legacyHosts: t.legacyHosts, availableContent: ["vocabulary", "grammar"], availableUiLocales: ["ko", "vi", "en", "fr", "ar"], ...over,
});
const registry = createTargetRegistry(INITIAL_ADULT_TARGETS.map((t) => target(t)));

describe("school and adult products are separate concepts", () => {
  it("english.life.help is the SCHOOL subject, study.english.life.help is the ADULT product with target English", () => {
    const school = resolveProductHost("english.life.help", registry);
    const adult = resolveProductHost("study.english.life.help", registry);
    expect(school).toEqual({ ok: true, value: { family: "SCHOOL", subject: "english", stage: "production" } });
    expect(adult.ok && adult.value.family === "ADULT_LANGUAGE" && adult.value.targetLanguage.id).toBe("en");
  });
  it("resolves staging and local hosts for both families, ignoring case and port", () => {
    expect(resolveProductHost("MATH-staging.life.help:443", registry)).toMatchObject({ ok: true, value: { family: "SCHOOL", subject: "math", stage: "staging" } });
    expect(resolveProductHost("study-korean-staging.life.help", registry)).toMatchObject({ ok: true, value: { family: "ADULT_LANGUAGE", stage: "staging" } });
    expect(resolveProductHost("study.japanese.localhost:3000", registry)).toMatchObject({ ok: true, value: { family: "ADULT_LANGUAGE", stage: "local" } });
  });
  it("rejects invalid host / type combinations: unknown slug, unknown host, lookalikes, deeper labels", () => {
    expect(resolveProductHost("study.klingon.life.help", registry)).toMatchObject({ ok: false, error: "UNKNOWN_TARGET_LANGUAGE" });
    for (const h of ["life.help", "study.life.help", "study.korean.example.com", "study.korean.life.help.evil.com", "evil-study.korean.life.help", "a.study.korean.life.help", "math.korean.life.help", "study.math.life.help", "study.korean.viet.mobile"]) expect(resolveProductHost(h, registry).ok, h).toBe(false);
  });
  it("a school product needs a grade E1..H3 and an adult product never gets one", () => {
    const school = resolveProductHost("math.life.help", registry);
    const adult = resolveProductHost("study.korean.life.help", registry);
    if (!school.ok || !adult.ok) throw new Error("fixture");
    expect(schoolContext(school.value, "M2", "vi")).toEqual({ ok: true, value: { family: "SCHOOL", schoolSubject: "math", studentGrade: "M2", uiLocale: "vi" } });
    expect(schoolContext(school.value, "L6", "vi")).toMatchObject({ ok: false, error: "INVALID_GRADE" });
    expect(schoolContext(adult.value, "E3", "ko")).toMatchObject({ ok: false, error: "WRONG_FAMILY" });
    expect(adultContext(school.value, "ko")).toMatchObject({ ok: false, error: "WRONG_FAMILY" });
    expect(Object.keys((adultContext(adult.value, "ko") as any).value)).not.toContain("studentGrade");
  });
});

describe("target language is independent of the UI locale", () => {
  it("study.english.life.help can be used with any UI locale the product is translated into", () => {
    const p = resolveProductHost("study.english.life.help", registry);
    if (!p.ok) throw new Error("fixture");
    for (const ui of ["ko", "vi", "fr", "ar", "en"]) expect(adultContext(p.value, ui)).toEqual({ ok: true, value: { family: "ADULT_LANGUAGE", targetLanguageId: "en", uiLocale: ui } });
    expect(adultContext(p.value, "xx")).toMatchObject({ ok: false, error: "UNSUPPORTED_UI_LOCALE" });
  });
  it("the same UI locale across different targets keeps the targets distinct", () => {
    const a = resolveProductHost("study.korean.life.help", registry), b = resolveProductHost("study.vietnamese.life.help", registry);
    if (!a.ok || !b.ok) throw new Error("fixture");
    const ca = adultContext(a.value, "vi"), cb = adultContext(b.value, "vi");
    expect(ca.ok && cb.ok && ca.value.targetLanguageId !== cb.value.targetLanguageId && ca.value.uiLocale === cb.value.uiLocale).toBe(true);
  });
});

describe("legacy host migration (six initial products)", () => {
  const MAP: [string, string][] = [
    ["study.korean.viet.mobile", "study.korean.life.help"], ["study.english.viet.mobile", "study.english.life.help"], ["study.japanese.viet.mobile", "study.japanese.life.help"],
    ["zhong.wen.viet.mobile", "study.chinese.life.help"], ["bahasa.indonesia.viet.mobile", "study.indonesian.life.help"], ["hoc.tieng.viet.mobile", "study.vietnamese.life.help"],
  ];
  it("maps every legacy host to its new host, case-insensitively, with no wildcard", () => {
    for (const [from, to] of MAP) { expect(legacyRedirect(from, registry)).toBe(to); expect(legacyRedirect(from.toUpperCase() + ":443", registry)).toBe(to); }
    expect(legacyRedirect("other.viet.mobile", registry)).toBeNull();
    expect(legacyRedirect("evil.zhong.wen.viet.mobile", registry)).toBeNull();
  });
  it("derives hosts under life.help; staging is a single label so the wildcard certificate covers it", () => {
    expect(adultHost("chinese")).toBe(`study.chinese.${ADULT_DOMAIN}`);
    expect(adultStagingHost("chinese")).toBe("study-chinese-staging.life.help");
    expect(adultStagingHost("chinese").split(".").length).toBe(3);
  });
});

describe("registry validation", () => {
  const ok = INITIAL_ADULT_TARGETS.map((t) => target(t));
  it("rejects duplicate id / slug / legacy host, a wrong derived host, bad slugs, wildcard or life.help legacy hosts", () => {
    expect(() => createTargetRegistry([ok[0], { ...ok[1], id: "ko" }])).toThrow(/duplicate id/);
    expect(() => createTargetRegistry([ok[0], { ...ok[1], slug: "korean", host: adultHost("korean") }])).toThrow(/duplicate slug/);
    expect(() => createTargetRegistry([ok[0], { ...ok[1], legacyHosts: ok[0].legacyHosts }])).toThrow(/already belongs/);
    expect(() => createTargetRegistry([{ ...ok[0], host: "study.other.life.help" }])).toThrow(/host must be/);
    expect(() => createTargetRegistry([{ ...ok[0], slug: "Korean-1", host: adultHost("Korean-1") }])).toThrow(/slug must be/);
    expect(() => createTargetRegistry([{ ...ok[0], legacyHosts: ["*.viet.mobile"] }])).toThrow(/exact external host/);
    expect(() => createTargetRegistry([{ ...ok[0], legacyHosts: ["study.korean.life.help"] }])).toThrow(/exact external host/);
    expect(() => createTargetRegistry([{ ...ok[0], availableUiLocales: [] }])).toThrow(/UI locale/);
  });
  it("does not hard-code a language list: the registry is whatever was generated and validated", () => {
    expect(createTargetRegistry([]).all()).toHaveLength(0);
    expect(registry.all()).toHaveLength(6);
  });
});

describe("adult proficiency L1..L10", () => {
  it("derives overall from the seven dimensions and clamps to 1..10", () => {
    const m = makeProficiency({ reading: 6, listening: 4, speaking: 2, writing: 3, vocabulary: 7, grammar: 5, practicalInformation: 9 });
    expect(Object.keys(m.levels)).toEqual([...PROFICIENCY_DIMENSIONS]);
    expect(m.overall).toBe(5);
    expect(makeProficiency({ reading: 99, listening: 99, speaking: 99, writing: 99, vocabulary: 99, grammar: 99, practicalInformation: 99 }).overall).toBe(10);
    expect(makeProficiency({ reading: -3, listening: 0, speaking: 0, writing: 0, vocabulary: 0, grammar: 0, practicalInformation: 0 }).levels.reading).toBe(1);
  });
  it("external framework mappings are estimates and never claim an official result", () => {
    const text = describeMapping({ framework: "CEFR", approximateBand: "B1", official: false });
    expect(text).toMatch(/estimate, not an official CEFR result/);
    expect(text).not.toMatch(/official CEFR certification/i);
  });
});
