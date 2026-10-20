import { extendThinkLabels, formatThinkExtra, type CoreThinkLang } from "./expandedUiExtra";
import bosses from "./bosses.json";
import lessonsTable from "./semester-lessons.json";
import type { ThinkLang } from "./lang";

/** Mid-boss = the thinking challenge offered after every 10 regular questions (lib/think/flow.ts). Final boss = the hardest task of a school
 *  semester (math / English) or of a Korean language level (1-6급), opened when the learner has finished that semester's lessons.
 *  Beating a final boss earns a trophy kept on this device (like the rest of the thinking progress). Choice: scripts/think/pick-bosses.py. */
const BOSS = bosses as Record<string, string>;
const LESSONS = lessonsTable as Record<string, string[]>;
const ID_TO_KEY: Record<string, string> = Object.fromEntries(Object.entries(BOSS).map(([k, id]) => [id, k]));

export const FINAL_BOSS_IDS = new Set(Object.values(BOSS));
export const isFinalBoss = (taskId: string): boolean => FINAL_BOSS_IDS.has(taskId);
export const bossKeyOf = (taskId: string): string | null => ID_TO_KEY[taskId] ?? null;
/** key of the final boss for a site / grade (or Korean level code L1-L6) / semester */
export const bossKey = (site: string, grade: string, semester: 1 | 2): string => (site === "korean" ? `korean|${grade}` : `${site}|${grade}|${semester}`);
export const finalBossFor = (key: string): string | null => BOSS[key] ?? null;

/** the lessons that must be finished before this boss opens (empty = no lesson data: the boss is open) */
export const lessonsForBoss = (key: string): string[] => LESSONS[key] ?? [];
export type LessonDone = Record<string, { completions?: number; placedOut?: boolean } | undefined>;
export function bossProgress(key: string, lessons: LessonDone): { done: number; total: number; open: boolean } {
  const need = lessonsForBoss(key);
  const done = need.filter((id) => (lessons[id]?.completions ?? 0) > 0 || lessons[id]?.placedOut).length;
  return { done, total: need.length, open: need.length === 0 || done >= need.length };
}

export interface Trophy { key: string; taskId: string; at: string }
export const trophyKey = (site: string) => `learn:think:trophies:${site}`;
export function readTrophies(site: string): Record<string, Trophy> {
  try { return JSON.parse(window.localStorage.getItem(trophyKey(site)) ?? "{}"); } catch { return {}; }
}
export function addTrophy(site: string, taskId: string, now = new Date()): Trophy | null {
  const key = bossKeyOf(taskId);
  if (!key) return null;
  const all = readTrophies(site);
  if (all[key]) return all[key];
  const t: Trophy = { key, taskId, at: now.toISOString() };
  try { window.localStorage.setItem(trophyKey(site), JSON.stringify({ ...all, [key]: t })); } catch { /* storage unavailable: the reward is shown now only */ }
  return t;
}

export interface BossText { mid: string; final: string; locked: (done: number, total: number) => string; open: string; defeated: string; trophies: string; title: (name: string) => string; reward: string }
const CORE_BOSS_TEXT: Record<CoreThinkLang, BossText> = {
  ko: { mid: "중간 보스", final: "최종 보스", locked: (d, t) => `레슨 ${d}/${t}개를 마치면 도전할 수 있어요`, open: "최종 보스가 기다리고 있어요!", defeated: "처치 완료", trophies: "내 트로피", title: (n) => `${n} 최종 보스 처치`, reward: "최종 보스를 물리쳤어요! 트로피를 받았어요." },
  en: { mid: "Mid-boss", final: "Final boss", locked: (d, t) => `Finish ${t - d} more lesson${t - d === 1 ? "" : "s"} (${d}/${t}) to face it`, open: "The final boss is waiting!", defeated: "Defeated", trophies: "My trophies", title: (n) => `${n} final boss defeated`, reward: "You defeated the final boss! Trophy earned." },
  "zh-Hans": { mid: "中期首领", final: "最终首领", locked: (d, t) => `完成课程 ${d}/${t} 后即可挑战`, open: "最终首领正在等你！", defeated: "已击败", trophies: "我的奖杯", title: (n) => `击败${n}最终首领`, reward: "你击败了最终首领！获得奖杯。" },
  "zh-Hant": { mid: "中期首領", final: "最終首領", locked: (d, t) => `完成課程 ${d}/${t} 後即可挑戰`, open: "最終首領正在等你！", defeated: "已擊敗", trophies: "我的獎盃", title: (n) => `擊敗${n}最終首領`, reward: "你擊敗了最終首領！獲得獎盃。" },
  ja: { mid: "中ボス", final: "ラスボス", locked: (d, t) => `レッスンを${d}/${t}個終えると挑戦できます`, open: "ラスボスが待っています！", defeated: "撃破", trophies: "マイトロフィー", title: (n) => `${n}ラスボス撃破`, reward: "ラスボスを倒しました！トロフィーを獲得。" },
  vi: { mid: "Trùm giữa", final: "Trùm cuối", locked: (d, t) => `Hoàn thành bài học ${d}/${t} để thách đấu`, open: "Trùm cuối đang chờ bạn!", defeated: "Đã hạ gục", trophies: "Cúp của tôi", title: (n) => `Hạ gục trùm cuối ${n}`, reward: "Bạn đã hạ trùm cuối! Nhận được cúp." },
};

export const BOSS_TEXT = extendThinkLabels(CORE_BOSS_TEXT,p=>({...p.boss,locked:(done:number,total:number)=>formatThinkExtra(p.boss.locked,{done,total}),title:(name:string)=>formatThinkExtra(p.boss.title,{name})}));
