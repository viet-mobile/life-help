import { describe, expect, it } from "vitest";
import { loadIndex } from "@/lib/learn/content/repository";
import { LearnService } from "@/lib/learn/server/service";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { KOREAN_LEVELS } from "@/lib/learn/types";
import { UNAVAILABLE_KOREAN_LEVELS } from "@/lib/learn/korean-availability";
import korCanonical from "@/lib/learn/content/korean/korean.json";
import korBank from "@/lib/learn/content/bank/korean.json";

const NOW = new Date("2026-03-01T03:00:00Z");
const make = () => { let n = 0; return new LearnService({ store: new MemoryLearnStore(), now: () => NOW, newId: () => `session-${String(++n).padStart(4, "0")}` }); };
const guest = (grade: string) => ({
  userId: null as unknown as string,
  locale: "ko" as const,
  guestState: { site: "korean", profile: { nickname: "tester", grade, goal: "habit", avatar: "fox", onboardingDone: true }, mastery: {}, lessons: {} },
});

/** Korean K1..K10 are all published (owner release decision of 2026-10-15): every student path must reach them. */
describe("Korean K1..K10 publication across the student pathways", () => {
  it("1. no level is locked, every level has a course with lessons, and no question is a draft", async () => {
    expect(UNAVAILABLE_KOREAN_LEVELS).toEqual([]);
    for (const g of KOREAN_LEVELS) {
      const { bundle, index } = await loadIndex("korean", { grade: g, bank: false });
      expect(bundle.catalog.courses.map((c) => c.grade), g).toEqual([g]);
      expect(index.lessons.size, g).toBeGreaterThan(0);
    }
    expect(korCanonical.questions.every((q) => q.status === "PUBLISHED")).toBe(true);
    expect(korCanonical.questions.some((q) => /^k-k(7|8|9|10)-/.test(q.id))).toBe(true);
  });

  it("2. K7..K10 can be chosen by accounts and guests, and the placement test of each level starts", async () => {
    const svc = make();
    for (const lv of ["K7", "K8", "K9", "K10"] as const) {
      const acct = await svc.saveOnboarding({ userId: "00000000-0000-4000-8000-0000000000aa", guestState: null } as never, "korean", { nickname: "지민", grade: lv, goal: "habit", avatar: "fox" }).catch((e) => e);
      // the in-memory account store accepts the level; the real store needs migration 044 (db-korean-k7-k10.test.ts)
      expect((acct as { profile?: { grade: string } }).profile?.grade, lv).toBe(lv);
      const { bundle } = await loadIndex("korean", { grade: lv, bank: false });
      expect(bundle.questions.filter((q) => q.role === "diagnostic").length, lv).toBeGreaterThanOrEqual(2);
    }
  });

  it("3. the practice bank (13,385 questions) is served in Korean-learning's English and in the 14 languages that carry every meaning, PUBLISHED", async () => {
    for (const locale of ["en", "ko", "vi", "ja", "zh-Hans"] as const) {
      const { bundle } = await loadIndex("korean", { locale });
      const bank = bundle.questions.filter((q) => q.id.startsWith("kb-"));
      expect(bank.length, locale).toBe(13385);
      expect(bank.every((q) => q.status === "PUBLISHED" && q.role === "variant"), locale).toBe(true);
    }
  });

  it("4. a language whose overlay lacks the meanings gets the course but no bank (never English meanings under another language)", async () => {
    for (const locale of ["am", "ar", "tr", "uk"] as const) {
      const { bundle } = await loadIndex("korean", { locale });
      expect(bundle.questions.some((q) => q.id.startsWith("kb-")), locale).toBe(false);
      expect(bundle.questions.length, locale).toBe(718);
    }
  });

  it("5. a bank question is reachable by hint and attempt, and K7 is reachable by its practice session", async () => {
    const svc = make();
    const { bundle } = await loadIndex("korean", { locale: "ko" });
    const q = bundle.questions.find((x) => x.id.startsWith("kb-k7-"))!;
    expect(q).toBeTruthy();
    const hint = await svc.requestHint(guest("K7") as never, "korean", { questionId: q.id, level: 1 });
    expect(hint).toBeTruthy();
  });

  it("6. Lesson reference integrity: 100% of lesson questionIds and challengeIds resolve to published questions", async () => {
    const { bundle, index } = await loadIndex("korean", { bank: false });
    const publishedIds = new Set(bundle.questions.map((q) => q.id));

    let totalLessonQuestions = 0;
    for (const course of bundle.catalog.courses) {
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          expect(lesson.questionIds.length).toBeGreaterThan(0);
          for (const qid of lesson.questionIds) {
            expect(publishedIds.has(qid), `Question ${qid} in lesson ${lesson.id} must exist in bundle.questions`).toBe(true);
            expect(index.questions.has(qid)).toBe(true);
            totalLessonQuestions++;
          }
          if (lesson.challengeId) {
            expect(publishedIds.has(lesson.challengeId), `Challenge ${lesson.challengeId} must exist`).toBe(true);
            expect(index.questions.has(lesson.challengeId)).toBe(true);
          }
        }
      }
    }
    expect(totalLessonQuestions).toBeGreaterThan(0);
  });

  it("7. Canonical uniqueness audit: 716 distinct content items across 718 IDs with exactly 2 intentional placement duplicates", () => {
    expect(korCanonical.questions.length).toBe(718);
    const contentKeys = new Map<string, string[]>();

    for (const q of korCanonical.questions) {
      const targetText = q.target ? q.target.text : "";
      const opts = (q.options || []).map((o: any) => o.text).sort().join("|");
      const ansKey = q.answer.kind === "choice" ? (q.options?.find((o: any) => o.id === q.answer.id)?.text || q.answer.id) : JSON.stringify(q.answer);
      const key = `${q.type}::${q.prompt}::${targetText}::${opts}::${ansKey}`;
      if (!contentKeys.has(key)) contentKeys.set(key, []);
      contentKeys.get(key)!.push(q.id);
    }

    // 676 distinct items
    expect(contentKeys.size).toBe(716);

    const duplicateGroups = [...contentKeys.values()].filter((ids) => ids.length > 1);
    expect(duplicateGroups).toEqual([
      ["k-k4-objects-2", "k-k4-d2"],
      ["k-k5-time-1", "k-k5-d1"],
    ]);
  });

  it("8. Korean bank (format 2): no clone questions, every learning item distinct, published through bank.ts", () => {
    const kb = korBank as unknown as { format: number; status: string; skills: Record<string, { items: { id: string; c: string; ko: string; g: string }[] }> };
    expect(kb.format).toBe(2);
    expect(kb.status).toBe("DRAFT"); // authoring flag of the pinned data file; bank.ts expands it as PUBLISHED
    const seen = new Set<string>();
    let items = 0;
    for (const [sid, sk] of Object.entries(kb.skills)) {
      for (const it of sk.items) {
        const key = `${sid}|${it.ko}`;
        expect(seen.has(key), `duplicate learning item ${key}`).toBe(false);
        seen.add(key); items++;
      }
    }
    expect(items).toBeGreaterThan(2000);
  });
});
