import type { SupabaseClient } from "@supabase/supabase-js";
import { createInitialState } from "@/lib/learn/domain/engine";
import { dayKey } from "@/lib/learn/domain/dates";
import { pruneLedgerKeys } from "@/lib/learn/domain/ledger";
import type { EngineResult, LearnEvent, PlayerState, Site, StudentProfile } from "@/lib/learn/types";
import { isGoal, isGrade } from "@/lib/learn/types";
import type { LearnStore, SessionKind, SessionRecord, SessionSummary } from "./store";

/* ---------------------------- pure mappers (unit tested) ---------------------------- */

type Json = Record<string, unknown>;

/** Engine events -> the JSON shape consumed by public.learn_commit_events(). */
export function eventsToRpc(events: LearnEvent[]): Json[] {
  return events.map((ev): Json => {
    switch (ev.type) {
      case "attempt":
        return {
          type: "attempt",
          sessionId: ev.input.sessionId,
          questionId: ev.input.questionId,
          skillId: ev.skillId,
          lessonId: ev.lessonId,
          attemptNo: ev.input.attemptNo,
          answer: ev.input.answer ?? null,
          correct: ev.input.correct,
          revealed: !!ev.input.revealed,
          isReview: !!ev.input.isReview,
          hintsUsed: ev.input.hintsUsed,
          timeMs: ev.input.timeMs,
          difficulty: ev.difficulty,
          masteryBefore: round2(ev.masteryBefore),
          masteryAfter: round2(ev.masteryAfter),
          day: dayKey(new Date(ev.at)),
        };
      case "mastery":
        return { type: "mastery", ...ev.mastery };
      case "xp":
        return {
          type: "xp",
          sourceType: ev.entry.sourceType,
          sourceId: ev.entry.sourceId,
          xp: ev.entry.xp,
          coins: ev.entry.coins,
          day: dayKey(new Date(ev.entry.at)),
        };
      case "lesson":
        return { type: "lesson", ...ev.progress };
      case "streak":
        return { type: "streak", ...ev.streak };
      case "quest":
        return { type: "quest", day: ev.quest.day, items: ev.quest.items, completedAt: ev.quest.completedAt };
      case "achievement":
        return { type: "achievement", code: ev.code, at: ev.at };
    }
  });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Result of public.learn_load_state() -> PlayerState. */
export function rpcToState(raw: unknown, site: Site, day: string): PlayerState {
  const base = createInitialState(site);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, any>;

  const p = r.profile;
  const profile: StudentProfile | null =
    p && isGrade(p.grade) && isGoal(p.goal) && typeof p.nickname === "string"
      ? { nickname: p.nickname, grade: p.grade, goal: p.goal, avatar: p.avatar ?? "fox", onboardingDone: true }
      : null;

  const mastery: PlayerState["mastery"] = {};
  for (const m of (r.mastery ?? []) as any[]) {
    mastery[m.skill_code] = {
      skillId: m.skill_code,
      score: Number(m.score),
      attempts: m.attempts,
      correct: m.correct,
      streak: m.streak,
      box: m.srs_box,
      lastPracticedAt: m.last_practiced_at ?? null,
      nextReviewAt: m.next_review_at ?? null,
    };
  }
  const lessons: PlayerState["lessons"] = {};
  for (const l of (r.lessons ?? []) as any[]) {
    lessons[l.lesson_code] = {
      lessonId: l.lesson_code,
      stars: l.stars,
      bestAccuracy: Number(l.best_accuracy),
      completions: l.completions,
      firstCompletedAt: l.first_completed_at ?? null,
      lastCompletedAt: l.last_completed_at ?? null,
      placedOut: !!l.placed_out,
    };
  }
  const s = r.streak;
  const counters = { ...base.counters, ...((r.meta?.counters as object) ?? {}) };
  const rewards: Record<string, number> = {};
  for (const [q, c] of Object.entries((r.rewardsToday ?? {}) as Record<string, number>)) rewards[`${day}:${q}`] = Number(c);

  return {
    ...base,
    profile,
    totalXp: Number(r.totalXp ?? 0),
    coins: Number(r.coins ?? 0),
    xpByDay: { [day]: Number(r.xpToday ?? 0) },
    questionRewardCount: rewards,
    ledgerKeys: pruneLedgerKeys((r.ledgerKeys ?? []) as string[]),
    mastery,
    lessons,
    streak: s
      ? { current: s.current_days, best: s.best_days, lastActiveDay: s.last_active_day ?? null, freezes: s.freezes }
      : base.streak,
    quest: r.quest
      ? { day: r.quest.quest_day, items: r.quest.items ?? [], completedAt: r.quest.completed_at ?? null }
      : null,
    achievements: (r.achievements ?? []) as string[],
    diagnosticDone: !!r.meta?.diagnostic_done,
    counters,
  };
}

/* --------------------------------- Supabase store --------------------------------- */

function fail(what: string, error: { message: string } | null): never {
  // Never surface DB internals to students; log for operators.
  console.error(`[learn] ${what}:`, error?.message);
  throw new Error(`learn_store_${what}`);
}

export class SupabaseLearnStore implements LearnStore {
  constructor(private db: SupabaseClient) {}

  async loadState(userId: string, site: Site, now: Date): Promise<PlayerState> {
    const day = dayKey(now);
    const { data, error } = await this.db.rpc("learn_load_state", { p_user: userId, p_site: site, p_day: day });
    if (error) fail("load_state", error);
    return rpcToState(data, site, day);
  }

  async saveProfile(userId: string, profile: StudentProfile) {
    const { error } = await this.db.from("learn_student_profiles").upsert(
      { user_id: userId, nickname: profile.nickname, grade: profile.grade, goal: profile.goal, avatar: profile.avatar, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) fail("save_profile", error);
  }

  async createSession(rec: Omit<SessionRecord, "completedAt">) {
    const { error } = await this.db.from("learn_sessions").insert({
      id: rec.id,
      user_id: rec.userId,
      site: rec.site,
      kind: rec.kind,
      lesson_code: rec.lessonId,
    });
    if (error) fail("create_session", error);
  }

  async getSession(userId: string, sessionId: string): Promise<SessionRecord | null> {
    const { data, error } = await this.db
      .from("learn_sessions")
      .select("id, user_id, site, kind, lesson_code, completed_at")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) fail("get_session", error);
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      site: data.site as Site,
      kind: data.kind as SessionKind,
      lessonId: data.lesson_code,
      completedAt: data.completed_at,
    };
  }

  async sessionSummary(userId: string, sessionId: string): Promise<SessionSummary> {
    const { data, error } = await this.db
      .from("learn_attempts")
      .select("question_code, attempt_no, is_correct, revealed")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .limit(500);
    if (error) fail("session_summary", error);
    const questions: SessionSummary["questions"] = {};
    for (const a of data ?? []) {
      const cur = questions[a.question_code] ?? { attempts: 0, correct: false, firstTryCorrect: false, revealed: false };
      cur.attempts += 1;
      if (a.is_correct) {
        cur.correct = true;
        if (a.attempt_no === 1) cur.firstTryCorrect = true;
      }
      if (a.revealed) cur.revealed = true;
      questions[a.question_code] = cur;
    }
    return { questions };
  }

  private async rpcCommit(userId: string, site: Site, state: PlayerState, events: LearnEvent[]) {
    const { error } = await this.db.rpc("learn_commit_events", {
      p_user: userId,
      p_site: site,
      p_events: eventsToRpc(events),
      p_meta: { counters: state.counters, diagnosticDone: state.diagnosticDone },
    });
    if (error) fail("commit", error);
  }

  async commit(userId: string, site: Site, result: EngineResult, ctx: { sessionId: string | null; lessonId: string | null }) {
    // The lesson id is only known at the service layer for attempts inside a lesson session.
    const events = result.events.map((ev) =>
      ev.type === "attempt" && ctx.lessonId ? { ...ev, lessonId: ctx.lessonId } : ev,
    );
    await this.rpcCommit(userId, site, result.state, events);
  }

  async commitState(userId: string, site: Site, state: PlayerState, events: LearnEvent[]) {
    await this.rpcCommit(userId, site, state, events);
  }

  async markSessionComplete(userId: string, sessionId: string, now: Date) {
    const { error } = await this.db
      .from("learn_sessions")
      .update({ completed_at: now.toISOString() })
      .eq("id", sessionId)
      .eq("user_id", userId)
      .is("completed_at", null);
    if (error) fail("complete_session", error);
  }
}
