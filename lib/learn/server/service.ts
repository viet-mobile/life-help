import { learnConfig } from "@/lib/learn/config";
import { checkAnswer, describeAnswer, validateResponse } from "@/lib/learn/domain/answers";
import {
  computePlacement,
  nextDiagnosticQuestion,
  type DiagnosticAnswer,
} from "@/lib/learn/domain/diagnostic";
import {
  applyAttempt,
  applyDiagnosticResult,
  applyLessonCompletion,
} from "@/lib/learn/domain/engine";
import { levelForXp } from "@/lib/learn/domain/level";
import { buildPath } from "@/lib/learn/domain/path";
import { dueSkills } from "@/lib/learn/domain/srs";
import { toPublicQuestion, loadIndex } from "@/lib/learn/content/repository";
import type { LearnLocale } from "@/lib/learn/i18n";
import type { ContentIndex } from "@/lib/learn/content/indexer";
import type {
  AnswerValue,
  ContentBundle,
  EngineDelta,
  EngineResult,
  Grade,
  PlayerState,
  PublicQuestion,
  Question,
  Site,
  StudentProfile,
} from "@/lib/learn/types";
import { isGoal, isGrade } from "@/lib/learn/types";
import { LearnError } from "./errors";
import type { LearnStore } from "./store";
import { parsePlayerState } from "./stateCodec";

/**
 * Who is calling. Authenticated students have their state loaded from the
 * store; guests (demo mode) carry their own state in the request.
 */
export interface Actor {
  userId: string | null;
  guestState?: unknown;
  /** Presentation language of this request (Korean when absent). It never changes grading, XP or mastery. */
  locale?: LearnLocale;
}

export interface ServiceDeps {
  store: LearnStore | null;
  now?: () => Date;
  newId?: () => string;
}

const SESSION_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export class LearnService {
  constructor(private deps: ServiceDeps) {}

  private now() {
    return this.deps.now ? this.deps.now() : new Date();
  }
  private newId() {
    return this.deps.newId ? this.deps.newId() : crypto.randomUUID();
  }

  private requireStore(actor: Actor): LearnStore | null {
    if (!actor.userId) return null;
    if (!this.deps.store) throw new LearnError("store_unavailable", 503);
    return this.deps.store;
  }

  async getState(actor: Actor, site: Site): Promise<PlayerState> {
    const store = this.requireStore(actor);
    if (store && actor.userId) return store.loadState(actor.userId, site, this.now());
    return parsePlayerState(actor.guestState, site);
  }

  /**
   * The student's state plus the curriculum for THEIR grade, in THEIR language. Every entry point goes through this, so the path, the
   * placement pool, the skills and the quests are always computed over the same grade-scoped content (scopeToGrade).
   */
  private async load(actor: Actor, site: Site) {
    const state = await this.getState(actor, site);
    const grade: Grade = state.profile?.grade ?? "M1";
    const { bundle, index } = await loadIndex(site, { grade, locale: actor.locale ?? "ko" });
    return { state, grade, bundle, index };
  }

  /* ------------------------------ onboarding ------------------------------ */

  async saveOnboarding(
    actor: Actor,
    site: Site,
    input: { nickname: unknown; grade: unknown; goal: unknown; avatar: unknown },
  ): Promise<PlayerState> {
    const nickname = typeof input.nickname === "string" ? input.nickname.trim() : "";
    if (nickname.length < 2 || nickname.length > 16 || /[<>&"'`\\]/.test(nickname)) {
      throw new LearnError("invalid_nickname");
    }
    if (!isGrade(input.grade)) throw new LearnError("invalid_grade");
    if (!isGoal(input.goal)) throw new LearnError("invalid_goal");
    const avatar = typeof input.avatar === "string" && /^[a-z]{2,12}$/.test(input.avatar) ? input.avatar : "fox";
    const profile: StudentProfile = { nickname, grade: input.grade, goal: input.goal, avatar, onboardingDone: true };

    const store = this.requireStore(actor);
    if (store && actor.userId) {
      await store.saveProfile(actor.userId, profile);
      return store.loadState(actor.userId, site, this.now());
    }
    const state = parsePlayerState(actor.guestState, site);
    return { ...state, profile };
  }

  /* ------------------------------ diagnostic ------------------------------ */

  /**
   * One step of the adaptive placement test. Stateless on the server: the
   * client sends the answers so far; we grade the newest answer, pick the next
   * question, and when finished compute the placement and persist it.
   */
  async diagnosticStep(
    actor: Actor,
    site: Site,
    body: { history: DiagnosticAnswer[]; answer?: { questionId: string; value: unknown } },
  ) {
    const { state, grade, bundle, index } = await this.load(actor, site);

    const history: DiagnosticAnswer[] = (body.history ?? [])
      .filter((h) => index.questions.get(h.questionId)?.role === "diagnostic")
      .slice(0, learnConfig.diagnostic.maxQuestions)
      .map((h) => ({ questionId: h.questionId, correct: h.correct === true }));

    let lastCorrect: boolean | null = null;
    if (body.answer) {
      const q = bundle.questions.find((x) => x.id === body.answer!.questionId && x.role === "diagnostic");
      if (!q) throw new LearnError("unknown_question", 404);
      if (history.some((h) => h.questionId === q.id)) throw new LearnError("already_answered", 409);
      const bad = validateResponse(q, body.answer.value);
      if (bad) throw new LearnError(bad);
      lastCorrect = checkAnswer(q, body.answer.value as AnswerValue);
      history.push({ questionId: q.id, correct: lastCorrect });
    }

    const next = nextDiagnosticQuestion(grade, history, index);
    const nextFull = next ? bundle.questions.find((q) => q.id === next.id) : null;
    if (nextFull) {
      return {
        lastCorrect,
        next: toPublicQuestion(nextFull),
        answered: history.length,
        total: Math.min(learnConfig.diagnostic.maxQuestions, index.bundle.questions.filter((q) => q.role === "diagnostic").length),
        done: false as const,
      };
    }

    // Finished: place the student.
    const placement = computePlacement(grade, history, index);
    const result = applyDiagnosticResult(state, index, placement, this.now());
    const store = this.requireStore(actor);
    if (store && actor.userId) {
      await store.commitState(actor.userId, site, result.state, result.events);
    }
    return { lastCorrect, next: null, answered: history.length, done: true as const, state: result.state, delta: result.delta, placement };
  }

  /* ------------------------------- sessions ------------------------------- */

  private pickPractice(bundle: ContentBundle, skillIds: string[], count: number, seed: string): Question[] {
    const pool = bundle.questions.filter(
      (q) => skillIds.includes(q.skillId) && q.role !== "diagnostic" && q.status === "PUBLISHED",
    );
    // Deterministic shuffle keyed by the session id: stable within a session.
    const keyed = pool.map((q) => ({ q, k: hash(`${seed}:${q.id}`) }));
    keyed.sort((a, b) => a.k - b.k);
    // Prefer breadth: round-robin over skills.
    const bySkill = new Map<string, Question[]>();
    for (const { q } of keyed) bySkill.set(q.skillId, [...(bySkill.get(q.skillId) ?? []), q]);
    const out: Question[] = [];
    while (out.length < count && [...bySkill.values()].some((l) => l.length)) {
      for (const list of bySkill.values()) {
        const q = list.shift();
        if (q && out.length < count) out.push(q);
      }
    }
    return out;
  }

  async startSession(
    actor: Actor,
    site: Site,
    input: { kind: "lesson" | "review" | "practice"; lessonId?: string; skillId?: string },
  ) {
    const { state, bundle, index } = await this.load(actor, site);
    const sessionId = this.newId();
    const now = this.now();
    let questions: Question[] = [];
    let lessonId: string | null = null;

    if (input.kind === "lesson") {
      const found = input.lessonId ? index.lessons.get(input.lessonId) : undefined;
      if (!found) throw new LearnError("unknown_lesson", 404);
      const node = buildPath(state, index).find((n) => n.lessonId === found.lesson.id);
      if (!node || node.status === "locked") throw new LearnError("lesson_locked", 403);
      lessonId = found.lesson.id;
      const ids = [...found.lesson.questionIds, ...(found.lesson.challengeId ? [found.lesson.challengeId] : [])];
      questions = ids
        .map((id) => bundle.questions.find((q) => q.id === id))
        .filter((q): q is Question => !!q && q.status === "PUBLISHED");
    } else if (input.kind === "review") {
      const due = dueSkills(state.mastery, now).filter((m) => index.skills.has(m.skillId));
      if (due.length === 0) throw new LearnError("nothing_to_review", 409);
      questions = this.pickPractice(bundle, due.map((d) => d.skillId), learnConfig.quest.reviewTarget + 2, sessionId);
    } else {
      const skillId = input.skillId && index.skills.has(input.skillId) ? input.skillId : null;
      if (!skillId) throw new LearnError("unknown_skill", 404);
      questions = this.pickPractice(bundle, [skillId], learnConfig.quest.solveTarget, sessionId);
    }
    if (questions.length === 0) throw new LearnError("no_questions", 409);

    const store = this.requireStore(actor);
    if (store && actor.userId) {
      await store.createSession({ id: sessionId, userId: actor.userId, site, kind: input.kind, lessonId });
    }
    return {
      sessionId,
      kind: input.kind,
      lessonId,
      questions: questions.map(toPublicQuestion),
    };
  }

  /* ------------------------------- attempts ------------------------------- */

  async requestHint(actor: Actor, site: Site, body: { questionId: string; level: number }) {
    const { bundle } = await loadIndex(site, { locale: actor.locale ?? "ko" });
    const q = bundle.questions.find((x) => x.id === body.questionId);
    if (!q || q.status !== "PUBLISHED" || q.role === "diagnostic") throw new LearnError("unknown_question", 404);
    const level = Math.floor(body.level);
    if (!(level >= 1 && level <= q.hints.length)) throw new LearnError("no_more_hints", 409);
    return { level, hint: q.hints[level - 1], hasMore: level < q.hints.length };
  }

  async submitAttempt(
    actor: Actor,
    site: Site,
    body: {
      questionId: string;
      sessionId: string;
      answer: unknown;
      attemptNo?: number;
      hintsUsed?: number;
      timeMs?: number;
      isReview?: boolean;
      seenIds?: string[];
    },
  ) {
    if (typeof body.sessionId !== "string" || !SESSION_ID_RE.test(body.sessionId)) {
      throw new LearnError("invalid_session");
    }
    const { state, bundle, index } = await this.load(actor, site);
    const q = bundle.questions.find((x) => x.id === body.questionId);
    if (!q || q.status !== "PUBLISHED" || q.role === "diagnostic") throw new LearnError("unknown_question", 404);
    const bad = validateResponse(q, body.answer);
    if (bad) throw new LearnError(bad);

    const now = this.now();
    const store = this.requireStore(actor);
    let attemptNo = clampInt(body.attemptNo, 1, 3, 1);
    let sessionLessonId: string | null = null;
    if (store && actor.userId) {
      const session = await store.getSession(actor.userId, body.sessionId);
      if (!session || session.site !== site) throw new LearnError("invalid_session", 403);
      sessionLessonId = session.lessonId;
      // Authoritative attempt count comes from what was actually recorded.
      const summary = await store.sessionSummary(actor.userId, body.sessionId);
      const prior = summary.questions[q.id];
      if (prior?.correct || prior?.revealed) throw new LearnError("already_resolved", 409);
      attemptNo = (prior?.attempts ?? 0) + 1;
    }

    const correct = checkAnswer(q, body.answer as AnswerValue);
    const reveal = !correct && attemptNo >= 3;
    const skillDue = dueSkills(state.mastery, now).some((m) => m.skillId === q.skillId);

    const result = applyAttempt(
      state,
      index,
      {
        questionId: q.id,
        sessionId: body.sessionId,
        attemptNo,
        correct,
        hintsUsed: clampInt(body.hintsUsed, 0, q.hints.length, 0),
        timeMs: clampInt(body.timeMs, 0, 3_600_000, 0),
        isReview: body.isReview === true && skillDue,
        revealed: reveal,
        answer: (Array.isArray(body.answer) ? body.answer.join(",") : String(body.answer)).slice(0, 200),
      },
      now,
    );

    if (store && actor.userId) {
      await store.commit(actor.userId, site, result, { sessionId: body.sessionId, lessonId: sessionLessonId });
    }

    // Wrong answers escalate: small hint -> concrete hint -> worked explanation + similar question.
    let feedback: { hint?: string; hintLevel?: number; explanation?: string; answer?: string } = {};
    let followUp: PublicQuestion | null = null;
    if (correct) {
      feedback = { explanation: q.explanation };
    } else if (reveal) {
      feedback = { explanation: q.explanation, answer: describeAnswer(q) };
      followUp = this.pickFollowUp(bundle, index, q, body.seenIds ?? []);
    } else {
      const level = Math.min(attemptNo, q.hints.length);
      if (level >= 1) feedback = { hint: q.hints[level - 1], hintLevel: level };
    }

    return {
      correct,
      attemptNo,
      revealed: reveal,
      feedback,
      followUp,
      delta: result.delta,
      state: result.state,
    };
  }

  private pickFollowUp(bundle: ContentBundle, index: ContentIndex, q: Question, seenIds: string[]) {
    void index;
    const seen = new Set(seenIds);
    const candidates = bundle.questions
      .filter(
        (x) =>
          x.id !== q.id &&
          !seen.has(x.id) &&
          x.status === "PUBLISHED" &&
          x.role === "variant" &&
          x.skillId === q.skillId &&
          (q.family ? x.family === q.family : true),
      )
      .sort((a, b) => Math.abs(a.difficulty - q.difficulty) - Math.abs(b.difficulty - q.difficulty) || a.id.localeCompare(b.id));
    return candidates[0] ? toPublicQuestion(candidates[0]) : null;
  }

  /* ---------------------------- lesson completion ---------------------------- */

  async completeLesson(
    actor: Actor,
    site: Site,
    body: { sessionId: string; lessonId: string; firstTryCorrect?: number },
  ): Promise<{ state: PlayerState; delta: EngineDelta; stars: number; accuracy: number }> {
    if (typeof body.sessionId !== "string" || !SESSION_ID_RE.test(body.sessionId)) {
      throw new LearnError("invalid_session");
    }
    const { state, index } = await this.load(actor, site);
    const found = index.lessons.get(body.lessonId);
    if (!found) throw new LearnError("unknown_lesson", 404);
    const total = found.lesson.questionIds.length + (found.lesson.challengeId ? 1 : 0);
    const now = this.now();
    const store = this.requireStore(actor);

    let firstTryCorrect = clampInt(body.firstTryCorrect, 0, total, 0);
    if (store && actor.userId) {
      const session = await store.getSession(actor.userId, body.sessionId);
      if (!session || session.site !== site || session.kind !== "lesson" || session.lessonId !== body.lessonId) {
        throw new LearnError("invalid_session", 403);
      }
      if (session.completedAt) {
        // Retried request after a lost response: report the current state, award nothing.
        const current = await store.loadState(actor.userId, site, now);
        const done = current.lessons[body.lessonId];
        return {
          state: current,
          delta: {
            xp: 0,
            coins: 0,
            levelBefore: levelForXp(current.totalXp),
            levelAfter: levelForXp(current.totalXp),
            newAchievements: [],
            questCompleted: false,
            streakIncreased: false,
          },
          stars: done?.stars ?? 0,
          accuracy: done?.bestAccuracy ?? 0,
        };
      }
      const summary = await store.sessionSummary(actor.userId, body.sessionId);
      const ids = [...found.lesson.questionIds, ...(found.lesson.challengeId ? [found.lesson.challengeId] : [])];
      // Every lesson question must have been resolved (answered right, or shown the answer).
      const unresolved = ids.filter((id) => {
        const s = summary.questions[id];
        return !s || !(s.correct || s.revealed);
      });
      if (unresolved.length > 0) throw new LearnError("lesson_incomplete", 409);
      firstTryCorrect = ids.filter((id) => summary.questions[id]?.firstTryCorrect).length;
    }

    const result: EngineResult = applyLessonCompletion(
      state,
      index,
      { lessonId: body.lessonId, sessionId: body.sessionId, firstTryCorrect, total },
      now,
    );
    if (store && actor.userId) {
      await store.commit(actor.userId, site, result, { sessionId: body.sessionId, lessonId: body.lessonId });
      await store.markSessionComplete(actor.userId, body.sessionId, now);
    }
    const progress = result.state.lessons[body.lessonId];
    return {
      state: result.state,
      delta: result.delta,
      stars: progress?.stars ?? 0,
      accuracy: firstTryCorrect / total,
    };
  }
}

function clampInt(v: unknown, min: number, max: number, fallback: number) {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.floor(v))) : fallback;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
