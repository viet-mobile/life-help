import { learnConfig } from "@/lib/learn/config";

/** Total XP required to *reach* level n (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  const { base, growth, max } = learnConfig.level;
  const n = Math.min(Math.max(1, Math.floor(level)), max);
  if (n <= 1) return 0;
  return Math.round((base * (Math.pow(growth, n - 1) - 1)) / (growth - 1));
}

export function levelForXp(totalXp: number): number {
  const xp = Math.max(0, totalXp);
  let level = 1;
  while (level < learnConfig.level.max && xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

export interface LevelProgress {
  level: number;
  titleKey: string;
  xpIntoLevel: number;
  xpForNext: number;
  /** 0..1 */
  ratio: number;
  isMax: boolean;
}

export function levelProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp);
  const titles = learnConfig.level.titles;
  const titleKey = titles[Math.min(level - 1, titles.length - 1)];
  const isMax = level >= learnConfig.level.max;
  const floor = xpForLevel(level);
  const next = isMax ? floor : xpForLevel(level + 1);
  const span = Math.max(1, next - floor);
  const into = Math.max(0, totalXp - floor);
  return {
    level,
    titleKey,
    xpIntoLevel: into,
    xpForNext: isMax ? 0 : span,
    ratio: isMax ? 1 : Math.min(1, into / span),
    isMax,
  };
}
