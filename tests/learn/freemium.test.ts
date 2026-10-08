import { beforeEach, describe, expect, it } from "vitest";
import { buildAccessPlan, freeCount, resolveAccess, accessibleBundle, type EntitlementRecord } from "@/lib/learn/domain/access";
import { loadIndex } from "@/lib/learn/content/repository";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnService, type Actor } from "@/lib/learn/server/service";
import { SITES, type ContentBundle, type Grade, type Question, type Site } from "@/lib/learn/types";

/**
 * 50 / 50 Free / Premium on canonical content, enforced on the server. Payment is NOT connected: entitlements here are records the
 * database would hold (admin grant / promotion / future subscription), and every check runs through the real LearnService.
 */
const NOW = new Date("2026-10-08T03:00:00Z");
const key = (q: Question) => (q.answer.kind === "choice" ? q.answer.id : q.answer.kind === "numeric" ? String(q.answer.value) : q.answer.kind === "text" ? q.answer.accepted[0] : q.answer.ids);
const canonical = async (site: Site): Promise<ContentBundle> => (await loadIndex(site)).bundle;
const grant = (over: Partial<EntitlementRecord> = {}): EntitlementRecord => ({ scope: "all", source: "grant", startsAt: "2026-01-01T00:00:00Z", expiresAt: null, revokedAt: null, ...over });

describe("canonical 50 / 50 split", () => {
  it("floor(n / 2) free, the rest premium (20 -> 10 / 10, 25 -> 12 / 13)", () => {
    expect([20, 25, 5, 4, 3].map((n) => [freeCount(n), n - freeCount(n)])).toEqual([[10, 10], [12, 13], [2, 3], [2, 2], [1, 2]]);
  });
  it.each(SITES)("%s: every course gives exactly floor(n / 2) items free, in curriculum order, at most one lesson split", async (site) => {
    const b = await canonical(site);
    const plan = buildAccessPlan(b.catalog, b.questions);
    for (const c of plan.courses) {
      expect(c.freeUnits, c.courseId).toBe(Math.floor(c.totalUnits / 2));
      expect(c.freeUnits + c.premiumUnits).toBe(c.totalUnits);
      expect(c.freeUnits > 0 && c.premiumUnits > 0, `${c.courseId} has both tiers`).toBe(true);
    }
    for (const course of b.catalog.courses) {
      const lessons = course.units.flatMap((u) => u.lessons);
      const tiers = lessons.map((l) => plan.lessonTier.get(l.id));
      const order = { FREE: 0, PARTIAL: 1, PREMIUM: 2 } as const;
      expect(tiers.map((t) => order[t!]), `${course.id}: free -> partial -> premium`).toEqual([...tiers.map((t) => order[t!])].sort());
      expect(tiers.filter((t) => t === "PARTIAL").length).toBeLessThanOrEqual(1);
      const items = lessons.flatMap((l) => [...l.questionIds, ...(l.challengeId ? [l.challengeId] : [])]);
      const free = items.filter((q) => plan.questionTier.get(q) === "FREE");
      expect(free, `${course.id}: free items are a prefix`).toEqual(items.slice(0, free.length));
      expect(free.length).toBe(Math.floor(items.length / 2));
    }
  });
  it("covers Math E1-H3, English E1-H3 and Korean K1-K6 (one course per grade / level)", async () => {
    const grades = async (site: Site) => buildAccessPlan((await canonical(site)).catalog, []).courses.map((c) => c.grade).sort();
    expect(await grades("math")).toEqual(["E1", "E2", "E3", "E4", "E5", "E6", "H1", "H2", "H3", "M1", "M2", "M3"]);
    expect(await grades("english")).toEqual(["E1", "E2", "E3", "E4", "E5", "E6", "H1", "H2", "H3", "M1", "M2", "M3"]);
    expect(await grades("korean")).toEqual(["K1", "K2", "K3", "K4", "K5", "K6"]);
  });
  it("the split is computed on canonical ids, so every locale has exactly the same boundary", async () => {
    const plan = buildAccessPlan((await canonical("math")).catalog, (await canonical("math")).questions);
    const ur = await loadIndex("math", { locale: "ur" });
    expect(buildAccessPlan(ur.bundle.catalog, ur.bundle.questions).lessonTier).toEqual(plan.lessonTier);
  });
});

describe("entitlement resolution (server-side records only)", () => {
  it("active / expired / revoked / not yet started / other scope", () => {
    expect(resolveAccess([], "math", NOW)).toEqual({ tier: "FREE", status: "none" });
    expect(resolveAccess([grant()], "math", NOW).tier).toBe("PREMIUM");
    expect(resolveAccess([grant({ expiresAt: "2026-10-01T00:00:00Z" })], "math", NOW)).toMatchObject({ tier: "FREE", status: "expired" });
    expect(resolveAccess([grant({ revokedAt: "2026-05-01T00:00:00Z" })], "math", NOW).tier).toBe("FREE");
    expect(resolveAccess([grant({ startsAt: "2027-01-01T00:00:00Z" })], "math", NOW).tier).toBe("FREE");
    expect(resolveAccess([grant({ scope: "korean" })], "math", NOW).tier).toBe("FREE");
    expect(resolveAccess([grant({ scope: "korean" })], "korean", NOW).tier).toBe("PREMIUM");
    for (const source of ["subscription", "one_time_purchase", "promotion", "grant"] as const) expect(resolveAccess([grant({ source })], "math", NOW).source).toBe(source);
  });
});

describe.each(SITES)("server-authoritative premium payload protection: %s", (site) => {
  let store: MemoryLearnStore;
  let svc: LearnService;
  const level: Grade = site === "korean" ? "K2" : "E3";
  const user: Actor = { userId: "u-premium-test", locale: "en" };
  beforeEach(() => {
    store = new MemoryLearnStore();
    let n = 0;
    svc = new LearnService({ store, now: () => NOW, newId: () => `session-${String(++n).padStart(4, "0")}` });
  });
  const firstPremium = async () => {
    const plan = await svc.accessPlan(site);
    const { bundle } = await loadIndex(site, { grade: level });
    const lessons = bundle.catalog.courses[0].units.flatMap((u) => u.lessons);
    const premium = lessons.find((l) => plan.lessonTier.get(l.id) === "PREMIUM")!;
    const free = lessons.filter((l) => plan.lessonTier.get(l.id) === "FREE");
    const partial = lessons.find((l) => plan.lessonTier.get(l.id) === "PARTIAL");
    return { premium, free, partial, plan };
  };
  /** Mark every free lesson as done so the premium lesson is next on the path (only the entitlement can then block it). */
  const reachPremium = async (actor: Actor) => {
    await svc.saveOnboarding(actor, site, { nickname: "tester", grade: level, goal: "habit", avatar: "fox" });
    const { free, partial } = await firstPremium();
    const state = await svc.getState(actor, site);
    for (const l of [...free, ...(partial ? [partial] : [])]) state.lessons[l.id] = { lessonId: l.id, stars: 3, bestAccuracy: 1, completions: 1, firstCompletedAt: NOW.toISOString(), lastCompletedAt: NOW.toISOString(), placedOut: false };
    state.totalXp = 1234;
    await store.commitState(actor.userId!, site, state, []);
  };

  it("free learner: premium lesson, hint, attempt and completion are refused; free lessons work", async () => {
    await reachPremium(user);
    const { premium, free, plan } = await firstPremium();
    await expect(svc.startSession(user, site, { kind: "lesson", lessonId: premium.id })).rejects.toMatchObject({ code: "premium_required", status: 403 });
    const pq = premium.questionIds[0];
    await expect(svc.requestHint(user, site, { questionId: pq, level: 1 })).rejects.toMatchObject({ code: "premium_required" });
    await expect(svc.submitAttempt(user, site, { questionId: pq, sessionId: "session-forged-01", answer: "a" })).rejects.toMatchObject({ code: "premium_required" });
    await expect(svc.completeLesson(user, site, { sessionId: "session-forged-01", lessonId: premium.id })).rejects.toMatchObject({ code: "premium_required" });
    const ok = await svc.startSession(user, site, { kind: "lesson", lessonId: free[0].id });
    for (const q of ok.questions) expect(plan.questionTier.get(q.id), q.id).toBe("FREE");
  });

  it("the lesson the boundary falls in: free learners get only its free items and cannot complete it; Premium gets all of it", async () => {
    const { partial, plan } = await firstPremium();
    if (!partial) return; // an even course (e.g. 20 items) splits exactly between lessons
    await svc.saveOnboarding(user, site, { nickname: "tester", grade: level, goal: "habit", avatar: "fox" });
    const state = await svc.getState(user, site);
    for (const l of (await firstPremium()).free) state.lessons[l.id] = { lessonId: l.id, stars: 3, bestAccuracy: 1, completions: 1, firstCompletedAt: NOW.toISOString(), lastCompletedAt: NOW.toISOString(), placedOut: false };
    await store.commitState(user.userId!, site, state, []);
    const s = await svc.startSession(user, site, { kind: "lesson", lessonId: partial.id });
    const items = [...partial.questionIds, ...(partial.challengeId ? [partial.challengeId] : [])];
    expect(s.questions.map((q) => q.id)).toEqual(items.filter((q) => plan.questionTier.get(q) === "FREE"));
    expect(s.premiumLocked).toBe(items.filter((q) => plan.questionTier.get(q) === "PREMIUM").length);
    expect(s.premiumLocked).toBeGreaterThan(0);
    await expect(svc.completeLesson(user, site, { sessionId: s.sessionId, lessonId: partial.id })).rejects.toMatchObject({ code: "premium_required" });
    store.entitlements.set(user.userId!, [grant()]);
    const full = await svc.startSession(user, site, { kind: "lesson", lessonId: partial.id });
    expect(full.questions.map((q) => q.id)).toEqual(items);
    expect(full.premiumLocked).toBe(0);
  });

  it("practice / review never hand out a premium question, even when asked for a premium skill", async () => {
    await reachPremium(user);
    const { premium } = await firstPremium();
    await expect(svc.startSession(user, site, { kind: "practice", skillId: premium.skillIds[0] })).rejects.toMatchObject({ status: expect.any(Number) });
  });

  it("locale switching and client-held flags cannot bypass access", async () => {
    await reachPremium(user);
    const { premium } = await firstPremium();
    for (const locale of ["ko", "ur", "ar", "sw", "mr", "ja"] as const) {
      await expect(svc.startSession({ ...user, locale }, site, { kind: "lesson", lessonId: premium.id })).rejects.toMatchObject({ code: "premium_required" });
    }
    // a guest forging "premium" in the state it sends is still a guest: access is never read from the client
    const forged = { site, premium: true, access: { tier: "PREMIUM", status: "active" }, entitlement: "PREMIUM", profile: { nickname: "x", grade: level, goal: "habit", avatar: "fox" } };
    expect((await svc.getAccess({ userId: null, guestState: forged }, site)).tier).toBe("FREE");
  });

  it("active Premium opens the premium lesson; expiry closes it again but keeps every bit of progress; renewal restores it", async () => {
    await reachPremium(user);
    const { premium } = await firstPremium();
    store.entitlements.set(user.userId!, [grant({ expiresAt: "2026-12-31T00:00:00Z" })]);
    const s = await svc.startSession(user, site, { kind: "lesson", lessonId: premium.id });
    expect(s.questions.length).toBeGreaterThan(0);
    const q = (await canonical(site)).questions.find((x) => x.id === s.questions[0].id)!;
    expect((await svc.submitAttempt(user, site, { questionId: q.id, sessionId: s.sessionId, answer: key(q), attemptNo: 1, hintsUsed: 0, timeMs: 3000 })).correct).toBe(true);
    const before = await svc.getState(user, site);

    store.entitlements.set(user.userId!, [grant({ expiresAt: "2026-10-01T00:00:00Z" })]); // expired
    await expect(svc.startSession(user, site, { kind: "lesson", lessonId: premium.id })).rejects.toMatchObject({ code: "premium_expired", status: 403 });
    const after = await svc.getState(user, site);
    expect(after.totalXp).toBe(before.totalXp);
    expect(after.mastery).toEqual(before.mastery);
    expect(after.lessons).toEqual(before.lessons);

    store.entitlements.set(user.userId!, [grant({ expiresAt: "2026-10-01T00:00:00Z" }), grant({ source: "subscription", startsAt: "2026-10-05T00:00:00Z", expiresAt: null })]);
    expect((await svc.startSession(user, site, { kind: "lesson", lessonId: premium.id })).questions.length).toBeGreaterThan(0);
  });

  it("free learners receive no premium teaching text in the catalog and no premium question in their bundle", async () => {
    const { bundle } = await loadIndex(site);
    const plan = buildAccessPlan(bundle.catalog, bundle.questions);
    const free = accessibleBundle(bundle, plan, { tier: "FREE", status: "none" });
    for (const l of free.catalog.courses.flatMap((c) => c.units.flatMap((u) => u.lessons))) {
      if (plan.lessonTier.get(l.id) === "PREMIUM") expect([l.concept, l.example]).toEqual(["", ""]);
      else expect(l.concept.length).toBeGreaterThan(0);
    }
    expect(free.questions.every((q) => plan.questionTier.get(q.id) === "FREE")).toBe(true);
    expect(accessibleBundle(bundle, plan, { tier: "PREMIUM", status: "active" })).toBe(bundle);
  });
});
