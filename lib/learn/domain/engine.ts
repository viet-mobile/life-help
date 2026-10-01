import { learnConfig } from "@/lib/learn/config";
import type { ContentIndex } from "@/lib/learn/content/indexer";
import type {
  AttemptInput,
  EngineDelta,
  EngineResult,
  LearnEvent,
  LessonProgress,
  PlayerState,
  Site,
  SkillMastery,
  XpEntry,
} from "@/lib/learn/types";
import { newlyEarned } from "./achievements";
import { dayKey } from "./dates";
import { applyPlacement, type Placement } from "./diagnostic";
import { pruneLedgerKeys } from "./ledger";
import { levelForXp } from "./level";
import { effectiveMastery, newMastery, updateMastery } from "./mastery";
import { advanceQuest, DAILY_QUEST_XP_KEY, ensureQuest, isQuestComplete } from "./quests";
import { scheduleReview } from "./srs";
import { newStreak, recordActivity } from "./streak";
import { coinsForXp, DAILY_QUEST_XP, xpForCorrect, xpForLessonCompletion } from "./xp";

export function createInitialState(site: Site): PlayerState {
  return {
    site,
    profile: null,
    totalXp: 0,
    coins: 0,
    xpByDay: {},
    questionRewardCount: {},
    ledgerKeys: [],
    mastery: {},
    lessons: {},
    streak: newStreak(),
    quest: null,
    achievements: [],
    diagnosticDone: false,
    counters: {
      questionsSolved: 0,
      correctAnswers: 0,
      lessonsCompleted: 0,
      mistakesReviewed: 0,
      vocabSolved: 0,
    },
  };
}

const emptyDelta = (state: PlayerState): EngineDelta => ({
  xp: 0,
  coins: 0,
  levelBefore: levelForXp(state.totalXp),
  levelAfter: levelForXp(state.totalXp),
  newAchievements: [],
  questCompleted: false,
  streakIncreased: false,
});

export function ledgerKey(sourceType: string, sourceId: string) {
  return `${sourceType}:${sourceId}`;
}

/**
 * Append an XP ledger entry unless its idempotency key was already applied.
 * Returns the (possibly unchanged) state and the entry that was written.
 */
function award(
  state: PlayerState,
  sourceType: string,
  sourceId: string,
  xp: number,
  day: string,
  now: Date,
): { state: PlayerState; entry: XpEntry | null } {
  const key = ledgerKey(sourceType, sourceId);
  if (state.ledgerKeys.includes(key)) return { state, entry: null };
  const coins = coinsForXp(xp);
  const entry: XpEntry = { sourceType, sourceId, xp, coins, at: now.toISOString() };
  return {
    entry,
    state: {
      ...state,
      totalXp: state.totalXp + xp,
      coins: state.coins + coins,
      xpByDay: { ...state.xpByDay, [day]: (state.xpByDay[day] ?? 0) + xp },
      ledgerKeys: pruneLedgerKeys([...state.ledgerKeys, key]),
    },
  };
}

/** Apply a finished quest reward (once per day, idempotent) if all items are done. */
function settleQuest(
  state: PlayerState,
  day: string,
  now: Date,
  events: LearnEvent[],
): { state: PlayerState; completed: boolean; xp: number; coins: number } {
  if (!state.quest || state.quest.completedAt || !isQuestComplete(state.quest)) {
    return { state, completed: false, xp: 0, coins: 0 };
  }
  const quest = { ...state.quest, completedAt: now.toISOString() };
  let next: PlayerState = { ...state, quest };
  const r = award(next, "daily_quest", DAILY_QUEST_XP_KEY(state.site, day), DAILY_QUEST_XP, day, now);
  next = r.state;
  events.push({ type: "quest", quest });
  if (r.entry) events.push({ type: "xp", entry: r.entry });
  return { state: next, completed: true, xp: r.entry?.xp ?? 0, coins: r.entry?.coins ?? 0 };
}

function withAchievements(
  state: PlayerState,
  index: ContentIndex,
  now: Date,
  events: LearnEvent[],
): { state: PlayerState; earned: string[] } {
  const earned = newlyEarned(state, [...index.skills.keys()]);
  if (earned.length === 0) return { state, earned };
  for (const code of earned) events.push({ type: "achievement", code, at: now.toISOString() });
  return { state: { ...state, achievements: [...state.achievements, ...earned] }, earned };
}

/**
 * Apply one graded attempt. Pure: returns new state + persistable events.
 * Replaying the same (session, question) correct answer is a no-op, so retried
 * requests can never double-award XP or mastery.
 */
export function applyAttempt(
  prev: PlayerState,
  index: ContentIndex,
  input: AttemptInput,
  now: Date,
): EngineResult {
  const q = index.questions.get(input.questionId);
  if (!q) return { state: prev, events: [], delta: emptyDelta(prev) };

  const day = dayKey(now);
  const events: LearnEvent[] = [];
  const levelBefore = levelForXp(prev.totalXp);
  const solvedKey = ledgerKey("question", `${input.sessionId}:${q.id}`);

  // Idempotency: this exact correct answer was already recorded.
  if (input.correct && prev.ledgerKeys.includes(solvedKey)) {
    return { state: prev, events: [], delta: emptyDelta(prev) };
  }

  let state = prev;
  const skill = state.mastery[q.skillId] ?? newMastery(q.skillId);
  const masteryBefore = effectiveMastery(skill, now);
  const firstTry = input.attemptNo === 1;

  // Streak: any genuine attempt counts as showing up today.
  const streakBefore = state.streak;
  const streak = recordActivity(state.streak, day);
  state = { ...state, streak };
  if (streak !== streakBefore) events.push({ type: "streak", streak });

  // Mastery: correct answers, plus the *first* miss only (repeated misses and
  // reveals must not punish a student who is already struggling).
  const counts = input.correct || (firstTry && !input.revealed);
  let updated: SkillMastery = skill;
  if (counts) {
    const rewardsToday = state.questionRewardCount[`${day}:${q.id}`] ?? 0;
    updated = updateMastery(skill, {
      correct: input.correct,
      difficulty: q.difficulty,
      hintsUsed: input.hintsUsed,
      timeMs: input.timeMs,
      expectedSeconds: q.expectedSeconds,
      repeatedRecently: rewardsToday >= 1,
      firstTry,
      now,
    });
    const good = input.correct && firstTry && input.hintsUsed < 2;
    // Advance the SRS box only when a review is actually due (or a miss resets it).
    const dueOrNew =
      !updated.nextReviewAt || new Date(updated.nextReviewAt).getTime() <= now.getTime();
    if (!input.correct || dueOrNew) updated = scheduleReview(updated, good, now);
    state = { ...state, mastery: { ...state.mastery, [q.skillId]: updated } };
    events.push({ type: "mastery", mastery: updated });
  }

  events.push({
    type: "attempt",
    input,
    skillId: q.skillId,
    lessonId: null,
    difficulty: q.difficulty,
    masteryBefore,
    masteryAfter: effectiveMastery(updated, now),
    at: now.toISOString(),
  });

  let xpGained = 0;
  let coinsGained = 0;

  if (input.correct) {
    const rewardsToday = state.questionRewardCount[`${day}:${q.id}`] ?? 0;
    const xp = xpForCorrect({
      difficulty: q.difficulty,
      hintsUsed: input.hintsUsed,
      firstTry,
      isReview: !!input.isReview,
      skillMastery: masteryBefore,
      rewardsToday,
      xpToday: state.xpByDay[day] ?? 0,
    });
    const r = award(state, "question", `${input.sessionId}:${q.id}`, xp, day, now);
    state = {
      ...r.state,
      questionRewardCount: { ...r.state.questionRewardCount, [`${day}:${q.id}`]: rewardsToday + 1 },
      counters: {
        ...r.state.counters,
        correctAnswers: r.state.counters.correctAnswers + 1,
        mistakesReviewed: r.state.counters.mistakesReviewed + (input.isReview ? 1 : 0),
        vocabSolved: r.state.counters.vocabSolved + (q.tags?.includes("vocab") ? 1 : 0),
      },
    };
    if (r.entry) {
      events.push({ type: "xp", entry: r.entry });
      xpGained += r.entry.xp;
      coinsGained += r.entry.coins;
    }
  }
  if (firstTry) {
    state = {
      ...state,
      counters: { ...state.counters, questionsSolved: state.counters.questionsSolved + 1 },
    };
  }

  // Daily quest progress.
  let quest = ensureQuest(state, index, day, now);
  if (input.correct) {
    quest = advanceQuest(quest, "solve");
    if (input.isReview) quest = advanceQuest(quest, "review");
  }
  state = { ...state, quest };
  const settled = settleQuest(state, day, now, events);
  state = settled.state;
  if (!settled.completed) events.push({ type: "quest", quest });
  xpGained += settled.xp;
  coinsGained += settled.coins;

  const ach = withAchievements(state, index, now, events);
  state = ach.state;

  return {
    state,
    events,
    delta: {
      xp: xpGained,
      coins: coinsGained,
      levelBefore,
      levelAfter: levelForXp(state.totalXp),
      newAchievements: ach.earned,
      questCompleted: settled.completed,
      streakIncreased: streak.current > streakBefore.current,
    },
  };
}

export interface LessonCompletionInput {
  lessonId: string;
  sessionId: string;
  /** Questions answered correctly on the first try. */
  firstTryCorrect: number;
  total: number;
}

export function starsForAccuracy(accuracy: number): 0 | 1 | 2 | 3 {
  const [three, two] = learnConfig.session.starThresholds;
  if (accuracy >= three) return 3;
  if (accuracy >= two) return 2;
  return 1;
}

export function applyLessonCompletion(
  prev: PlayerState,
  index: ContentIndex,
  input: LessonCompletionInput,
  now: Date,
): EngineResult {
  const found = index.lessons.get(input.lessonId);
  if (!found || input.total <= 0) return { state: prev, events: [], delta: emptyDelta(prev) };

  const sessionMarker = ledgerKey("session_done", input.sessionId);
  // The same session can only complete a lesson once (retries are no-ops).
  if (prev.ledgerKeys.includes(sessionMarker)) {
    return { state: prev, events: [], delta: emptyDelta(prev) };
  }

  const day = dayKey(now);
  const events: LearnEvent[] = [];
  const levelBefore = levelForXp(prev.totalXp);
  const existing = prev.lessons[input.lessonId];
  const firstCompletion = !existing || existing.completions === 0;
  const accuracy = Math.min(1, input.firstTryCorrect / input.total);
  const stars = starsForAccuracy(accuracy);

  const sourceId = firstCompletion ? input.lessonId : `${input.lessonId}:${day}`;
  const sourceType = firstCompletion ? "lesson_first" : "lesson_repeat";
  const alreadyRewarded = prev.ledgerKeys.includes(ledgerKey(sourceType, sourceId));

  const progress: LessonProgress = {
    lessonId: input.lessonId,
    stars: Math.max(existing?.stars ?? 0, stars) as 0 | 1 | 2 | 3,
    bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, accuracy),
    // A replayed request for the same session must not inflate completions.
    completions: (existing?.completions ?? 0) + (alreadyRewarded ? 0 : 1),
    firstCompletedAt: existing?.firstCompletedAt ?? now.toISOString(),
    lastCompletedAt: now.toISOString(),
    placedOut: existing?.placedOut ?? false,
  };

  let state: PlayerState = {
    ...prev,
    lessons: { ...prev.lessons, [input.lessonId]: progress },
    ledgerKeys: pruneLedgerKeys([...prev.ledgerKeys, sessionMarker]),
  };
  events.push({ type: "lesson", progress });

  let xpGained = 0;
  let coinsGained = 0;
  if (!alreadyRewarded) {
    const xp = xpForLessonCompletion({ firstCompletion, stars });
    const r = award(state, sourceType, sourceId, xp, day, now);
    state = {
      ...r.state,
      counters: {
        ...r.state.counters,
        lessonsCompleted: r.state.counters.lessonsCompleted + 1,
      },
    };
    if (r.entry) {
      events.push({ type: "xp", entry: r.entry });
      xpGained += r.entry.xp;
      coinsGained += r.entry.coins;
    }
  }

  const streakBefore = state.streak;
  const streak = recordActivity(state.streak, day);
  state = { ...state, streak };
  if (streak !== streakBefore) events.push({ type: "streak", streak });

  let quest = ensureQuest(state, index, day, now);
  if (!alreadyRewarded) quest = advanceQuest(quest, "lesson");
  state = { ...state, quest };
  const settled = settleQuest(state, day, now, events);
  state = settled.state;
  if (!settled.completed) events.push({ type: "quest", quest });
  xpGained += settled.xp;
  coinsGained += settled.coins;

  const ach = withAchievements(state, index, now, events);
  state = ach.state;

  return {
    state,
    events,
    delta: {
      xp: xpGained,
      coins: coinsGained,
      levelBefore,
      levelAfter: levelForXp(state.totalXp),
      newAchievements: ach.earned,
      questCompleted: settled.completed,
      streakIncreased: streak.current > streakBefore.current,
    },
  };
}

/** Apply the outcome of the placement test: seed mastery, place out mastered lessons. */
export function applyDiagnosticResult(
  prev: PlayerState,
  index: ContentIndex,
  placement: Placement,
  now: Date,
): EngineResult {
  const day = dayKey(now);
  const events: LearnEvent[] = [];
  const levelBefore = levelForXp(prev.totalXp);
  let state = applyPlacement(prev, placement, now);
  for (const skillId of Object.keys(placement.seeds)) {
    const m = state.mastery[skillId];
    if (m && m !== prev.mastery[skillId]) events.push({ type: "mastery", mastery: m });
  }
  for (const id of placement.placedOutLessonIds) {
    if (state.lessons[id] && state.lessons[id] !== prev.lessons[id]) {
      events.push({ type: "lesson", progress: state.lessons[id] });
    }
  }
  let xp = 0;
  let coins = 0;
  const r = award(state, "diagnostic", state.site, learnConfig.xp.diagnosticComplete, day, now);
  state = r.state;
  if (r.entry) {
    events.push({ type: "xp", entry: r.entry });
    xp = r.entry.xp;
    coins = r.entry.coins;
  }
  const ach = withAchievements(state, index, now, events);
  state = ach.state;
  return {
    state,
    events,
    delta: {
      xp,
      coins,
      levelBefore,
      levelAfter: levelForXp(state.totalXp),
      newAchievements: ach.earned,
      questCompleted: false,
      streakIncreased: false,
    },
  };
}
