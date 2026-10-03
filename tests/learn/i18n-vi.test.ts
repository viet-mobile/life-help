import { describe, expect, it } from "vitest";
import { createTranslator, isLocale, parseLocale, LOCALES, LOCALE_COOKIE } from "@/lib/learn/i18n";
import { ko, type MessageKey } from "@/lib/learn/i18n/ko";
import { vi } from "@/lib/learn/i18n/vi";
import { GRADES, SITES, type ContentBundle, type Site } from "@/lib/learn/types";
import { localizeBundle, localizedBundle, overlayFor } from "@/lib/learn/content/localize";
import { demoContentRepository } from "@/lib/learn/content/repository";
import { checkAnswer } from "@/lib/learn/domain/answers";
import { ACHIEVEMENTS } from "@/lib/learn/domain/achievements";

const HANGUL = /[가-힣]/;
const VI_DIACRITIC = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const PLACEHOLDER = /(todo|tbd|fixme|lorem|xxx|\?\?\?|\{\{|\}\}|undefined|null|\[object)/i;
const keys = Object.keys(ko) as MessageKey[];
// Keys whose value is intentionally the same in every locale (brand names, units, a language's own name).
const NEUTRAL = new Set<MessageKey>(["brand.math", "brand.english", "diag.progress", "dash.xp", "lesson.xp", "locale.ko", "locale.vi"]);
const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("Vietnamese dictionary (locale vi)", () => {
  it("has exactly the Korean keys: none missing, none extra", () => {
    expect(Object.keys(vi).sort()).toEqual([...keys].sort());
  });
  it("has no empty or whitespace-only string", () => {
    for (const k of keys) expect(vi[k].trim().length, k).toBeGreaterThan(0);
  });
  it("leaks no Korean in the learner UI (the Korean language name in the switcher is the one intended exception)", () => {
    for (const k of keys) {
      if (k === "locale.ko") continue;
      expect(HANGUL.test(vi[k]), `${k}: ${vi[k]}`).toBe(false);
    }
    expect(vi["locale.ko"]).toBe("한국어"); // a language is named in its own script so a Korean speaker can find it
  });
  it("has no developer placeholder / machine-copy marker", () => {
    for (const k of keys) expect(PLACEHOLDER.test(vi[k]), `${k}: ${vi[k]}`).toBe(false);
  });
  it("keeps every {placeholder} the Korean string has (same variables, so interpolation never breaks)", () => {
    for (const k of keys) expect(vars(vi[k]), k).toEqual(vars(ko[k]));
  });
  it("is genuinely translated: no string is a copy of the Korean one, and prose is not English", () => {
    for (const k of keys) {
      if (NEUTRAL.has(k)) continue;
      expect(vi[k], `${k} was copied`).not.toBe(ko[k]);
      const words = vi[k].replace(/\{\w+\}/g, "").trim().split(/\s+/).filter(Boolean);
      // A Vietnamese sentence of several words always carries diacritics; plain ASCII prose would be untranslated English.
      if (words.length >= 4) expect(VI_DIACRITIC.test(vi[k]), `${k} looks untranslated: ${vi[k]}`).toBe(true);
    }
  });
  it("renders the twelve grade labels as Lớp 1 .. Lớp 12 (age-aligned: elementary 1-6, middle 7-9, high 10-12)", () => {
    const t = createTranslator("vi");
    expect(GRADES.map((g) => t(`grade.${g}` as MessageKey))).toEqual(["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5", "Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12"]);
    expect(t("grade.group.elementary")).toBe("Lớp 1–6");
    expect(t("grade.group.secondary")).toBe("Lớp 7–12");
  });
  it("covers every achievement title / description, level title and avatar the UI can show", () => {
    for (const a of ACHIEVEMENTS) {
      expect(vi[`ach.${a.code}.title` as MessageKey], a.code).toBeTruthy();
      expect(vi[`ach.${a.code}.desc` as MessageKey], a.code).toBeTruthy();
    }
    for (const k of keys.filter((x) => x.startsWith("level.") || x.startsWith("avatar."))) expect(vi[k].trim().length).toBeGreaterThan(0);
  });
  it("includes the account flow: sign-up, sign-in, sign-out, email-confirmation guidance, errors and empty states", () => {
    for (const k of ["auth.title.login", "auth.title.signup", "auth.email", "auth.password", "auth.submit.login", "auth.submit.signup", "auth.confirm", "auth.error", "auth.unavailable", "profile.logout", "profile.login", "common.loading", "common.error", "lesson.error", "lesson.empty", "dash.skills.empty", "learn.notFound"] as MessageKey[]) {
      expect(vi[k], k).toBeTruthy();
    }
    expect(vi["auth.confirm"]).toMatch(/email/i);
  });
});

describe("translator and locale resolution", () => {
  it("interpolates variables in both locales and falls back to Korean, then to the key", () => {
    expect(createTranslator("vi")("dash.hello", { name: "An" })).toBe("Chào An, hôm nay chơi một ván nhé?");
    expect(createTranslator("ko")("dash.hello", { name: "미나" })).toContain("미나");
    expect(createTranslator("vi")("nope.key" as MessageKey)).toBe("nope.key");
  });
  it("parses the cookie value strictly: only ko / vi, anything else is Korean", () => {
    expect([...LOCALES]).toEqual(["ko", "vi"]);
    expect(LOCALE_COOKIE).toBe("learn_lang");
    for (const v of ["ko", "vi"]) expect(isLocale(v)).toBe(true);
    for (const bad of ["VI", "en", "vi-VN", "", undefined, null, 5, "ko;vi", "vi "]) expect(parseLocale(bad), String(bad)).toBe("ko");
    expect(parseLocale("vi")).toBe("vi");
  });
});

describe.each(SITES)("Vietnamese content overlay: %s", (site: Site) => {
  it("covers every skill, course, unit, lesson and question of the whole curriculum (elementary + middle / high)", async () => {
    const bundle = await demoContentRepository.getBundle(site);
    const ov = overlayFor("vi", site)!;
    for (const s of bundle.catalog.skills) expect(ov.skills?.[s.id], `skill ${s.id}`).toBeTruthy();
    for (const c of bundle.catalog.courses) {
      expect(ov.courses?.[c.id]?.title, `course ${c.id}`).toBeTruthy();
      expect(ov.courses?.[c.id]?.world?.name, `world ${c.id}`).toBeTruthy();
      expect(ov.courses?.[c.id]?.world?.tagline, `tagline ${c.id}`).toBeTruthy();
      for (const u of c.units) {
        expect(ov.units?.[u.id], `unit ${u.id}`).toBeTruthy();
        for (const l of u.lessons) {
          expect(ov.lessons?.[l.id]?.title, `lesson ${l.id}`).toBeTruthy();
          expect(ov.lessons?.[l.id]?.concept, `concept ${l.id}`).toBeTruthy();
          expect(ov.lessons?.[l.id]?.example, `example ${l.id}`).toBeTruthy();
        }
      }
    }
    for (const q of bundle.questions) {
      const needs = HANGUL.test(q.prompt) || q.hints.some((h) => HANGUL.test(h)) || HANGUL.test(q.explanation);
      const o = ov.questions?.[q.id];
      if (needs) expect(o, `question ${q.id}`).toBeTruthy();
      if (!o) continue;
      expect(o.hints?.length ?? q.hints.length, `${q.id} hint count`).toBe(q.hints.length);
      for (const opt of q.options ?? []) if (HANGUL.test(opt.text)) expect(o.options?.[opt.id], `${q.id} option ${opt.id}`).toBeTruthy();
    }
  });

  it("never leaves Korean in the localised bundle and has no empty or placeholder text", async () => {
    const bundle = localizeBundle(await demoContentRepository.getBundle(site), "vi");
    const strings: [string, string][] = [];
    for (const s of bundle.catalog.skills) strings.push([`skill ${s.id}`, s.title]);
    for (const c of bundle.catalog.courses) {
      strings.push([`course ${c.id}`, c.title], [`world ${c.id}`, c.world.name], [`tagline ${c.id}`, c.world.tagline]);
      for (const u of c.units) {
        strings.push([`unit ${u.id}`, u.title]);
        for (const l of u.lessons) strings.push([`lesson ${l.id}`, l.title], [`concept ${l.id}`, l.concept], [`example ${l.id}`, l.example]);
      }
    }
    for (const q of bundle.questions) {
      strings.push([`${q.id} prompt`, q.prompt], [`${q.id} explanation`, q.explanation]);
      q.hints.forEach((h, i) => strings.push([`${q.id} hint${i}`, h]));
      for (const o of q.options ?? []) strings.push([`${q.id} option ${o.id}`, o.text]);
    }
    for (const [where, text] of strings) {
      expect(text.trim().length, where).toBeGreaterThan(0);
      expect(HANGUL.test(text), `${where}: ${text}`).toBe(false);
      expect(PLACEHOLDER.test(text), `${where}: ${text}`).toBe(false);
    }
  });

  it("changes ONLY presentation: ids, types, option ids, answer keys, difficulty, roles and skills are identical to the canonical bundle", async () => {
    const base = await demoContentRepository.getBundle(site);
    const vib = localizeBundle(base, "vi");
    expect(vib.questions.length).toBe(base.questions.length);
    base.questions.forEach((q, i) => {
      const v = vib.questions[i];
      expect(v.id).toBe(q.id);
      expect(v.type).toBe(q.type);
      expect(v.answer).toEqual(q.answer); // the key is never localised
      expect(v.difficulty).toBe(q.difficulty);
      expect(v.role).toBe(q.role);
      expect(v.skillId).toBe(q.skillId);
      expect(v.family).toBe(q.family);
      expect((v.options ?? []).map((o) => o.id)).toEqual((q.options ?? []).map((o) => o.id));
      expect(v.hints.length).toBe(q.hints.length);
    });
    expect(vib.catalog.courses.map((c) => [c.id, c.grade])).toEqual(base.catalog.courses.map((c) => [c.id, c.grade]));
    expect(vib.catalog.skills.map((s) => [s.id, s.prerequisiteId])).toEqual(base.catalog.skills.map((s) => [s.id, s.prerequisiteId]));
  });

  it("grades identically in both locales: the canonical correct response is accepted by the Vietnamese question too", async () => {
    const base = await demoContentRepository.getBundle(site);
    const vib = localizeBundle(base, "vi");
    for (const [i, q] of base.questions.entries()) {
      const k = q.answer;
      const resp = k.kind === "choice" ? k.id : k.kind === "numeric" ? String(k.value) : k.kind === "text" ? k.accepted[0] : k.ids;
      expect(checkAnswer(vib.questions[i], resp), q.id).toBe(true);
    }
  });

  it("is memoised and the Korean locale returns the canonical bundle object itself", async () => {
    const base = await demoContentRepository.getBundle(site);
    expect(localizeBundle(base, "ko")).toBe(base);
    expect(localizedBundle(base, "vi")).toBe(localizedBundle(base, "vi"));
  });
});

describe("English subject in Vietnamese mode: instructions localised, the English target is not", () => {
  it("answer keys, ordering tiles and English option texts are byte-identical to the canonical bundle", async () => {
    const base: ContentBundle = await demoContentRepository.getBundle("english");
    const vib = localizeBundle(base, "vi");
    base.questions.forEach((q, i) => {
      const v = vib.questions[i];
      if (q.type === "ordering") expect((v.options ?? []).map((o) => o.text), q.id).toEqual((q.options ?? []).map((o) => o.text));
      for (const o of q.options ?? []) if (!HANGUL.test(o.text)) expect(v.options!.find((x) => x.id === o.id)!.text, `${q.id} ${o.id}`).toBe(o.text);
      if (q.answer.kind === "text") expect(v.answer).toEqual(q.answer);
    });
  });
  it("a Vietnamese English-lesson prompt keeps the English sentence verbatim", async () => {
    const base: ContentBundle = await demoContentRepository.getBundle("english");
    const vib = localizeBundle(base, "vi");
    const q = vib.questions.find((x) => x.id === "e-e3-build-3")!;
    expect(q.prompt).toContain("He ____ soccer.");
    expect(HANGUL.test(q.prompt)).toBe(false);
    const read = vib.questions.find((x) => x.id === "e-e2-read-1")!;
    expect(read.prompt).toContain("Mina has a cat. The cat is white.");
  });
});
