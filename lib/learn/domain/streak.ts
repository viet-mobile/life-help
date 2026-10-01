import { learnConfig } from "@/lib/learn/config";
import type { StreakState } from "@/lib/learn/types";
import { diffDays } from "./dates";

export function newStreak(): StreakState {
  return { current: 0, best: 0, lastActiveDay: null, freezes: 0 };
}

/**
 * Record learning activity on `today`. Missing a single day consumes a streak
 * freeze if one is available; otherwise the streak restarts at 1 (best is kept
 * so a break never erases history).
 */
export function recordActivity(prev: StreakState, today: string): StreakState {
  if (prev.lastActiveDay === today) return prev;
  const cfg = learnConfig.streak;
  let { current, freezes } = prev;
  if (!prev.lastActiveDay) {
    current = 1;
  } else {
    const gap = diffDays(prev.lastActiveDay, today);
    if (gap <= 0) return prev; // clock skew: ignore
    if (gap === 1) current += 1;
    else if (gap - 1 <= freezes) {
      freezes -= gap - 1;
      current += 1;
    } else current = 1;
  }
  if (current > 0 && current % cfg.freezeEveryDays === 0 && current !== prev.current) {
    freezes = Math.min(cfg.maxFreezes, freezes + 1);
  }
  return {
    current,
    best: Math.max(prev.best, current),
    lastActiveDay: today,
    freezes,
  };
}

/** What to display today: a stale streak that can no longer be saved reads as 0. */
export function displayStreak(s: StreakState, today: string): number {
  if (!s.lastActiveDay) return 0;
  const gap = diffDays(s.lastActiveDay, today);
  if (gap <= 1) return s.current;
  return gap - 1 <= s.freezes ? s.current : 0;
}
