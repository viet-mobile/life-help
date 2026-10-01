import { learnConfig } from "@/lib/learn/config";
import type { DailyQuest, PlayerState, QuestItem, QuestKind } from "@/lib/learn/types";
import type { ContentIndex } from "@/lib/learn/content/indexer";
import { buildPath, weakestSkills } from "./path";
import { dueSkills } from "./srs";

/** Build today's quest deterministically from the student's state. */
export function generateQuest(
  state: PlayerState,
  index: ContentIndex,
  day: string,
  now: Date,
): DailyQuest {
  const cfg = learnConfig.quest;
  const items: QuestItem[] = [];
  const weak = weakestSkills(state, index, now, 1)[0];
  items.push({ id: "solve", kind: "solve", target: cfg.solveTarget, progress: 0, skillId: weak?.id });

  const due = dueSkills(state.mastery, now).filter((m) => index.skills.has(m.skillId));
  if (due.length > 0) {
    items.push({
      id: "review",
      kind: "review",
      target: cfg.reviewTarget,
      progress: 0,
      skillId: due[0].skillId,
    });
  }
  const hasLessonLeft = buildPath(state, index).some(
    (n) => n.status === "current",
  );
  if (hasLessonLeft) {
    items.push({ id: "lesson", kind: "lesson", target: cfg.lessonTarget, progress: 0 });
  }
  return { day, items, completedAt: null };
}

/** Make sure `state.quest` is today's quest (new day => new quest). */
export function ensureQuest(
  state: PlayerState,
  index: ContentIndex,
  day: string,
  now: Date,
): DailyQuest {
  if (state.quest && state.quest.day === day) return state.quest;
  return generateQuest(state, index, day, now);
}

export function advanceQuest(quest: DailyQuest, kind: QuestKind, amount = 1): DailyQuest {
  if (quest.completedAt) return quest;
  return {
    ...quest,
    items: quest.items.map((it) =>
      it.kind === kind ? { ...it, progress: Math.min(it.target, it.progress + amount) } : it,
    ),
  };
}

export function isQuestComplete(quest: DailyQuest): boolean {
  return quest.items.length > 0 && quest.items.every((i) => i.progress >= i.target);
}

/** Idempotency id for the once-per-day quest reward. */
export const DAILY_QUEST_XP_KEY = (site: string, day: string) => `${site}:${day}`;
