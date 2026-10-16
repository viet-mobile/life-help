import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { locales as REGISTRY, languages } from "@/messages/registry";
import { LOCALES, localeDir } from "@/lib/learn/i18n";
import { parseLearnHost, learnOrigins } from "@/lib/learn/hosts";
import { SITE_CONFIG, isLevelOf } from "@/lib/learn/sites";
import { loadIndex } from "@/lib/learn/content/repository";
import { overlayFor } from "@/lib/learn/content/localize";
import { checkAnswer, validateResponse } from "@/lib/learn/domain/answers";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnService, type Actor } from "@/lib/learn/server/service";
import { KOREAN_LEVELS, SITES, type ContentBundle, type Question, type Site } from "@/lib/learn/types";

const HANGUL = /[가-힣ㄱ-ㆎ]/;
const key = (q: Question) => (q.answer.kind === "choice" ? q.answer.id : q.answer.kind === "numeric" ? String(q.answer.value) : q.answer.kind === "text" ? q.answer.accepted[0] : q.answer.ids);
const canonical = async (site: Site): Promise<ContentBundle> => (await loadIndex(site, { bank: false })).bundle; // stored content: the practice bank has its own wording checks (bank.test.ts)

describe("learner locales come from the registry", () => {
  it("is exactly the 47 registry locales, with rtl taken from the registry metadata", () => {
    expect([...LOCALES]).toEqual([...REGISTRY]);
    expect(LOCALES).toHaveLength(47);
    for (const l of LOCALES) expect(localeDir(l)).toBe(languages.find((x) => x.code === l)?.dir === "rtl" ? "rtl" : "ltr");
    expect(LOCALES.filter((l) => localeDir(l) === "rtl").sort()).toEqual(["ar", "arz", "fa", "he", "ur"]);
  });
  it("every registry locale has a learning UI dictionary with exactly the canonical keys", () => {
    const ko = Object.keys(JSON.parse(readFileSync("lib/learn/i18n/locales/en.json", "utf8"))).sort();
    for (const l of LOCALES.filter((x) => x !== "ko")) expect(Object.keys(JSON.parse(readFileSync(`lib/learn/i18n/locales/${l}.json`, "utf8"))).sort(), l).toEqual(ko);
  });
});

describe("deterministic host routing (explicit allowlist)", () => {
  it("maps the three learning sites on production, staging and local hosts", () => {
    expect(parseLearnHost("study.korean.life.help")).toEqual({ site: "korean", stage: "production" });
    expect(parseLearnHost("Study-Korean-Staging.life.help:443")).toEqual({ site: "korean", stage: "staging" });
    expect(parseLearnHost("korean.localhost:3000")).toEqual({ site: "korean", stage: "local" });
    expect(parseLearnHost("math.life.help")).toEqual({ site: "math", stage: "production" });
    expect(parseLearnHost("english-staging.life.help")).toEqual({ site: "english", stage: "staging" });
  });
  it("never captures country hosts or look-alikes", () => {
    for (const h of ["korea.life.help", "a.korean.life.help", "a.study.korean.life.help", "study.korean.life.help.evil.com", "study.korea.life.help", "korean-staging.life.help", "study-korean.life.help", "constructor.life.help", "__proto__"]) {
      expect(parseLearnHost(h), h).toBeNull();
    }
  });
  it("same-origin allowlist covers every production / staging learning host and no local host", () => {
    expect(learnOrigins().sort()).toEqual(["https://english-staging.life.help", "https://english.life.help", "https://korean.life.help", "https://math-staging.life.help", "https://math.life.help", "https://study-korean-staging.life.help", "https://study.korean.life.help"]);
  });
});

describe("study.korean content quality gates", () => {
  it("the committed course is exactly what the generator produces (all 46 overlays included)", () => {
    expect(() => execFileSync(process.execPath, ["scripts/learn/korean/build-korean-content.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });
  it("K1..K10: one course per level, nine lessons each (K2 and K3 eleven: signs, culture, messages, sounds; K7 fourteen: the five K6->K7 bridge skills), a placement pool per level, no duplicate ids", async () => {
    const b = await canonical("korean");
    const ACTIVE_KOREAN = ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9", "K10"];
    expect(b.catalog.courses.map((c) => c.grade)).toEqual(ACTIVE_KOREAN);
    const EXPECTED_LESSONS: Record<string, number> = { "korean-k2": 11, "korean-k3": 11, "korean-k7": 14 };
    for (const c of b.catalog.courses) expect(c.units[0].lessons, c.id).toHaveLength(EXPECTED_LESSONS[c.id] ?? 9);
    for (const lv of ACTIVE_KOREAN) expect(b.questions.filter((q) => q.role === "diagnostic" && q.id.startsWith(`k-${lv.toLowerCase()}-`)).length, lv).toBeGreaterThanOrEqual(2);
    expect(new Set(b.questions.map((q) => q.id)).size).toBe(b.questions.length);
  });
  it("every item is answerable by its own key, and target text / romanization are well formed", async () => {
    for (const q of (await canonical("korean")).questions) {
      expect(validateResponse(q, key(q)), q.id).toBeNull();
      expect(checkAnswer(q, key(q)), q.id).toBe(true);
      if (q.target) {
        expect(HANGUL.test(q.target.text), `${q.id} target is Korean`).toBe(true);
        if (q.target.romanization) expect(q.target.romanization, q.id).toMatch(/^[a-z .,?!·-]+$/);
      }
      if (q.audioText) expect(HANGUL.test(q.audioText), `${q.id} audio is Korean`).toBe(true);
      expect(HANGUL.test(q.prompt), `${q.id}: canonical presentation is English, Korean only as target`).toBe(false);
    }
  });
  it("every non-English locale overlay covers every item and keeps hints / option ids; Korean only as canonical target text", async () => {
    const b = await canonical("korean");
    const target = JSON.stringify(b);
    for (const l of LOCALES.filter((x) => x !== "en")) {
      const ov = JSON.parse(readFileSync(`content/learn-overlays/${l}/korean.json`, "utf8"));
      for (const q of b.questions) {
        const o = ov.questions[q.id];
        expect(o, `${l} ${q.id}`).toBeTruthy();
        expect(o.hints.length, `${l} ${q.id} hints`).toBe(q.hints.length);
        if (o.options) expect(Object.keys(o.options).sort(), `${l} ${q.id} options`).toEqual((q.options ?? []).map((x) => x.id).sort());
        if (l !== "ko") for (const w of `${o.prompt} ${o.explanation} ${o.hints.join(" ")}`.match(/[가-힣ㄱ-ㆎ]+/g) ?? []) expect(target.includes(w), `${l} ${q.id}: "${w}" is not canonical target text`).toBe(true);
      }
    }
  });
});

describe("content quality gates (canonical and every installed overlay)", () => {
  const texts = (o: unknown): string[] => (typeof o === "string" ? [o] : Array.isArray(o) ? o.flatMap(texts) : o && typeof o === "object" ? Object.values(o).flatMap(texts) : []);
  const files = [
    ...["elementary", "secondary", "demo"].flatMap((d) => [`lib/learn/content/${d}/math.json`, `lib/learn/content/${d}/english.json`]),
    "lib/learn/content/korean/korean.json",
    ...readdirSync("content/learn-overlays").filter((d) => !d.endsWith(".json")).flatMap((d) => readdirSync(`content/learn-overlays/${d}`).map((f) => `content/learn-overlays/${d}/${f}`)),
  ];
  it("no floating-point artifacts (e.g. 44.99999999999999) in any learner-facing number", () => {
    for (const f of files) for (const t of texts(JSON.parse(readFileSync(f, "utf8")))) expect(/\d\.\d{8,}/.test(t), `${f}: ${t.slice(0, 80)}`).toBe(false);
  });
  it("inline math is balanced: every $ opens and closes a formula (prices like $120 only in English reading passages)", () => {
    for (const f of files) for (const t of texts(JSON.parse(readFileSync(f, "utf8")))) {
      if (/\$\d+/.test(t) && !/\$[^$]*[\\^_{}=]/.test(t)) continue; // a dollar price in an English passage, not math
      expect((t.match(/\$/g) ?? []).length % 2, `${f}: ${t.slice(0, 80)}`).toBe(0);
    }
  });
});

describe("math / english overlays: presentation only", () => {
  it("every installed overlay addresses existing ids only, with the canonical hint count and option ids; coverage.json matches the files", async () => {
    const coverage = JSON.parse(readFileSync("content/learn-overlays/coverage.json", "utf8")) as Record<string, Record<string, string>>;
    for (const site of ["math", "english"] as const) {
      const b = await canonical(site);
      const byId = new Map(b.questions.map((q) => [q.id, q]));
      for (const l of readdirSync("content/learn-overlays").filter((d) => existsSync(`content/learn-overlays/${d}/${site}.json`))) {
        const ov = JSON.parse(readFileSync(`content/learn-overlays/${l}/${site}.json`, "utf8"));
        expect(coverage[l]?.[site], `${l}/${site} listed in coverage`).toBeTruthy();
        for (const [id, o] of Object.entries(ov.questions ?? {}) as [string, { hints?: string[]; options?: Record<string, string> }][]) {
          const q = byId.get(id);
          expect(q, `${l}/${site} ${id} exists`).toBeTruthy();
          if (o.hints) expect(o.hints.length, `${l}/${site} ${id} hints`).toBe(q!.hints.length);
          for (const oid of Object.keys(o.options ?? {})) expect((q!.options ?? []).some((x) => x.id === oid), `${l}/${site} ${id} option ${oid}`).toBe(true);
        }
        if (coverage[l][site] === "FULL") for (const q of b.questions) if (HANGUL.test(q.prompt)) expect(ov.questions[q.id]?.prompt, `${l}/${site} FULL but ${q.id} missing`).toBeTruthy();
      }
    }
  });
  it("there is no fallback layer: a locale's overlay is the only presentation layer (never English, never canonical Korean)", async () => {
    const b = await canonical("math");
    const q = b.questions.find((x) => HANGUL.test(x.prompt))!;
    const [de, en] = await Promise.all([overlayFor("de", "math"), overlayFor("en", "math")]);
    expect(de?.questions?.[q.id]?.prompt).toBeTruthy();
    expect(de!.questions![q.id]!.prompt).not.toBe(en?.questions?.[q.id]?.prompt);
    expect(HANGUL.test(de!.questions![q.id]!.prompt!)).toBe(false);
  });
});

describe("one engine, any learner locale: progress and grading never depend on the language", () => {
  let store: MemoryLearnStore;
  let svc: LearnService;
  const NOW = new Date("2026-10-07T03:00:00Z");
  beforeEach(() => {
    store = new MemoryLearnStore();
    let n = 0;
    svc = new LearnService({ store, now: () => NOW, newId: () => `session-${String(++n).padStart(4, "0")}` });
  });
  const actor = (locale: string): Actor => ({ userId: "u-1", locale: locale as Actor["locale"] });

  it("a K2 Korean level and an E3 math grade coexist for the same account (level per site, profile shared)", async () => {
    await svc.saveOnboarding(actor("en"), "math", { nickname: "tester", grade: "E3", goal: "habit", avatar: "fox" });
    await svc.saveOnboarding(actor("sw"), "korean", { nickname: "tester", grade: "K2", goal: "habit", avatar: "fox" });
    expect((await svc.getState(actor("mr"), "math")).profile?.grade).toBe("E3");
    expect((await svc.getState(actor("ur"), "korean")).profile?.grade).toBe("K2");
    await expect(svc.saveOnboarding(actor("en"), "korean", { nickname: "tester", grade: "E3", goal: "habit", avatar: "fox" })).rejects.toThrow(/invalid_grade/);
    await expect(svc.saveOnboarding(actor("en"), "math", { nickname: "tester", grade: "K1", goal: "habit", avatar: "fox" })).rejects.toThrow(/invalid_grade/);
    expect(isLevelOf("korean", "K6") && !isLevelOf("korean", "H3") && isLevelOf("english", "H3")).toBe(true);
  });

  it.each(SITES)("%s: the same lesson serves the same question ids in every locale, and the canonical key is accepted in each", async (site) => {
    const level = SITE_CONFIG[site].levels[site === "korean" ? 1 : 2];
    await svc.saveOnboarding(actor("ko"), site, { nickname: "tester", grade: level, goal: "habit", avatar: "fox" });
    const { bundle: scoped } = await loadIndex(site, { grade: level });
    const lessonId = scoped.catalog.courses[0].units[0].lessons[0].id;
    const b = await canonical(site);
    let first: string[] | null = null;
    for (const loc of LOCALES) {
      const s = await svc.startSession(actor(loc), site, { kind: "lesson", lessonId });
      const ids = s.questions.map((q: { id: string }) => q.id);
      if (!first) first = ids;
      expect(ids, `${site} ${loc}`).toEqual(first);
      const q = b.questions.find((x) => x.id === ids[0])!;
      const res = await svc.submitAttempt(actor(loc), site, { sessionId: s.sessionId, questionId: q.id, answer: key(q), attemptNo: 1, hintsUsed: 0, timeMs: 4000 });
      expect(res.correct, `${site} ${loc}`).toBe(true);
    }
  }, 240_000); // 47 locales x the 13k-question Korean bank: slow under a loaded full run
});
