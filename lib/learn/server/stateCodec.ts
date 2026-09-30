import { GRADES, GOALS, type Goal, type Grade, type PlayerState, type Site } from "@/lib/learn/types";
import { createInitialState } from "@/lib/learn/domain/engine";
import { MAX_LEDGER_KEYS, pruneLedgerKeys } from "@/lib/learn/domain/ledger";

function num(v: unknown, min = 0, max = 1e9, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}
function str(v: unknown, max = 100): string | null {
  return typeof v === "string" && v.length <= max ? v : null;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function iso(v: unknown): string | null {
  const s = str(v, 40);
  return s && !Number.isNaN(Date.parse(s)) ? s : null;
}

/**
 * Parse a client-held (guest) player state defensively. Unknown fields are
 * dropped and numbers clamped. Guest progress is self-declared by nature; this
 * only guarantees the engine never receives malformed data.
 */
export function parsePlayerState(raw: unknown, site: Site): PlayerState {
  const base = createInitialState(site);
  if (!isRecord(raw) || raw.site !== site) return base;

  const profile = isRecord(raw.profile) ? raw.profile : null;
  const nickname = profile ? str(profile.nickname, 16) : null;
  const grade = profile && (GRADES as readonly unknown[]).includes(profile.grade) ? profile.grade : null;
  const goal = profile && (GOALS as readonly unknown[]).includes(profile.goal) ? profile.goal : null;

  const mastery: PlayerState["mastery"] = {};
  if (isRecord(raw.mastery)) {
    for (const [id, m] of Object.entries(raw.mastery).slice(0, 200)) {
      if (!isRecord(m) || id.length > 60) continue;
      mastery[id] = {
        skillId: id,
        score: num(m.score, 0, 100),
        attempts: num(m.attempts),
        correct: num(m.correct),
        streak: num(m.streak),
        box: Math.floor(num(m.box, 0, 10)),
        lastPracticedAt: iso(m.lastPracticedAt),
        nextReviewAt: iso(m.nextReviewAt),
      };
    }
  }

  const lessons: PlayerState["lessons"] = {};
  if (isRecord(raw.lessons)) {
    for (const [id, l] of Object.entries(raw.lessons).slice(0, 500)) {
      if (!isRecord(l) || id.length > 60) continue;
      lessons[id] = {
        lessonId: id,
        stars: Math.floor(num(l.stars, 0, 3)) as 0 | 1 | 2 | 3,
        bestAccuracy: num(l.bestAccuracy, 0, 1),
        completions: Math.floor(num(l.completions)),
        firstCompletedAt: iso(l.firstCompletedAt),
        lastCompletedAt: iso(l.lastCompletedAt),
        placedOut: l.placedOut === true,
      };
    }
  }

  const streak = isRecord(raw.streak) ? raw.streak : {};
  const counters = isRecord(raw.counters) ? raw.counters : {};
  const quest = isRecord(raw.quest) ? raw.quest : null;
  const questDay = quest ? str(quest.day, 10) : null;

  const strArray = (v: unknown, max: number) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length <= 120).slice(-max) : [];

  return {
    ...base,
    profile:
      nickname && grade && goal
        ? {
            nickname,
            grade: grade as Grade,
            goal: goal as Goal,
            avatar: str(profile?.avatar, 20) ?? "fox",
            onboardingDone: profile?.onboardingDone === true,
          }
        : null,
    totalXp: Math.floor(num(raw.totalXp)),
    coins: Math.floor(num(raw.coins)),
    xpByDay: isRecord(raw.xpByDay)
      ? Object.fromEntries(
          Object.entries(raw.xpByDay)
            .filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(k))
            .slice(-14)
            .map(([k, v]) => [k, num(v)]),
        )
      : {},
    questionRewardCount: isRecord(raw.questionRewardCount)
      ? Object.fromEntries(
          Object.entries(raw.questionRewardCount)
            .slice(-300)
            .map(([k, v]) => [k, Math.floor(num(v, 0, 1000))]),
        )
      : {},
    ledgerKeys: pruneLedgerKeys(strArray(raw.ledgerKeys, MAX_LEDGER_KEYS * 2)),
    mastery,
    lessons,
    streak: {
      current: Math.floor(num(streak.current)),
      best: Math.floor(num(streak.best)),
      lastActiveDay: typeof streak.lastActiveDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(streak.lastActiveDay) ? streak.lastActiveDay : null,
      freezes: Math.floor(num(streak.freezes, 0, 5)),
    },
    quest:
      quest && questDay && /^\d{4}-\d{2}-\d{2}$/.test(questDay) && Array.isArray(quest.items)
        ? {
            day: questDay,
            completedAt: iso(quest.completedAt),
            items: quest.items
              .filter(isRecord)
              .slice(0, 6)
              .flatMap((it) => {
                const kind = it.kind;
                const id = str(it.id, 20);
                if (!id || (kind !== "solve" && kind !== "review" && kind !== "lesson")) return [];
                return [
                  {
                    id,
                    kind,
                    target: Math.floor(num(it.target, 1, 50, 1)),
                    progress: Math.floor(num(it.progress, 0, 50)),
                    skillId: str(it.skillId, 60) ?? undefined,
                  },
                ];
              }),
          }
        : null,
    achievements: strArray(raw.achievements, 100),
    diagnosticDone: raw.diagnosticDone === true,
    counters: {
      questionsSolved: Math.floor(num(counters.questionsSolved)),
      correctAnswers: Math.floor(num(counters.correctAnswers)),
      lessonsCompleted: Math.floor(num(counters.lessonsCompleted)),
      mistakesReviewed: Math.floor(num(counters.mistakesReviewed)),
      vocabSolved: Math.floor(num(counters.vocabSolved)),
    },
  };
}
