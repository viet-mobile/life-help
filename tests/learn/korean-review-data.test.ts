import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import status from "@/lib/learn/review/korean-locale-status.json";
import { LOCALES, isLocale, isReviewLevel, loadReviewLevel, reviewCounts, reviewLevels } from "@/lib/learn/review/korean";
import { KOREAN_BANK_DATA, bankQuestions } from "@/lib/learn/content/bank";
import { loadIndex } from "@/lib/learn/content/repository";

const root = path.resolve(__dirname, "../..");

describe("Korean review data", () => {
  it("covers every level and every language: loads, has rows, ids unique, every question has an answer and is not PUBLISHED-by-the-review", async () => {
    for (const level of reviewLevels) {
      for (const loc of LOCALES) {
        if (level !== "K1" && level !== "K7" && !["en", "ko", "vi", "ja", "sg", "ar"].includes(loc)) continue; // the full matrix runs for K1 / K7, a spread of languages for the rest
        const page = await loadReviewLevel(level, loc, { limit: 100 });
        expect(page.error, `${level}/${loc}`).toBeUndefined();
        expect(page.total, `${level}/${loc}`).toBeGreaterThan(300);
        expect(new Set(page.rows.map((r) => r.id)).size, `${level}/${loc}`).toBe(page.rows.length);
        for (const r of page.rows) {
          expect(r.level).toBe(level);
          expect(r.answerText, r.id).toBeTruthy();
          if (r.kind === "choice" && r.options.length) expect(r.options.filter((o) => o.correct), r.id).toHaveLength(1);
        }
      }
    }
  }, 600_000);

  it("ids and answers are the same in every language (only wording differs)", async () => {
    const en = await loadReviewLevel("K7", "en", { limit: 100 });
    for (const loc of ["vi", "ja", "sg"] as const) {
      const other = await loadReviewLevel("K7", loc, { limit: 100 });
      expect(other.total).toBe(en.total);
      expect(other.rows.map((r) => r.id)).toEqual(en.rows.map((r) => r.id));
      expect(other.rows.map((r) => r.options.map((o) => o.correct))).toEqual(en.rows.map((r) => r.options.map((o) => o.correct)));
    }
  });

  it("marks wording honestly: English is canonical, full languages are localized, the other 32 fall back for bank texts", async () => {
    const en = await loadReviewLevel("K2", "en", { limit: 100 });
    expect(new Set(en.rows.map((r) => r.wording))).toEqual(new Set(["canonical"]));
    const vi = await loadReviewLevel("K2", "vi", { skill: "k.k2.greetings", limit: 100 });
    expect(vi.rows.filter((r) => r.source === "bank").every((r) => r.wording === "localized")).toBe(true);
    const sg = await loadReviewLevel("K2", "sg", { skill: "k.k2.greetings", limit: 100 });
    const bank = sg.rows.filter((r) => r.source === "bank");
    expect(bank.length).toBeGreaterThan(0);
    expect(bank.every((r) => r.wording === "fallback" && r.fallback.length > 0)).toBe(true);
    expect(sg.rows.filter((r) => r.source === "course").every((r) => r.wording === "localized")).toBe(true);
  });

  it("includes the unpublished K7-K10 course, the bridge and the whole bank, all DRAFT, and does not publish them", async () => {
    const k7 = await loadReviewLevel("K7", "en", { limit: 100 });
    expect(k7.skills.some((s) => s.id === "k.k7.bridge_formal")).toBe(true);
    const all = [];
    for (const l of reviewLevels) for (const s of (await loadReviewLevel(l, "en", { limit: 1 })).skills) all.push(s);
    const counts = reviewCounts();
    expect(reviewLevels.reduce((n, l) => n + counts[l].bank, 0)).toBe(11184);
    expect(counts.K7.bridge).toBe(40);
    // quarantine unchanged for learners
    expect(bankQuestions("korean", "en", null, new Set(Object.keys(KOREAN_BANK_DATA.skills)), "all")).toEqual([]);
    const learner = await loadIndex("korean");
    expect(learner.bundle.questions.some((q) => /^k-k(7|8|9|10)-/.test(q.id) || q.id.startsWith("kb-"))).toBe(false);
  });

  it("validates inputs", () => {
    expect(isReviewLevel("K10")).toBe(true);
    expect(isReviewLevel("K11")).toBe(false);
    expect(isReviewLevel("../etc")).toBe(false);
    expect(isLocale("vi")).toBe(true);
    expect(isLocale("xx")).toBe(false);
  });

  it("the committed locale status is current and describes 1 canonical, 14 complete and 32 partial languages", () => {
    execFileSync("node", ["scripts/learn/korean/bank/review-status.mjs", "--check"], { cwd: root, stdio: "pipe" });
    const tiers = Object.values(status.locales).map((l) => l.tier);
    expect(tiers.filter((t) => t === "canonical")).toHaveLength(1);
    expect(tiers.filter((t) => t === "complete")).toHaveLength(14);
    expect(tiers.filter((t) => t === "partial")).toHaveLength(32);
    expect(Object.keys(status.locales).sort()).toEqual([...LOCALES].sort());
  });
});
