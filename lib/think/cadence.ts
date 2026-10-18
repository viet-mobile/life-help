import type { ThinkLang } from "./lang";

/** One thinking challenge is earned for every PER regular questions answered on a site. */
export const REGULAR_PER_THINK = 10;

export interface ThinkCadence { earned: number; owed: number; toNext: number }

/** earned = floor(answered / 10); owed = earned minus the challenges already tried on this device (never negative). */
export function thinkCadence(answered: number, tried: number, per = REGULAR_PER_THINK): ThinkCadence {
  const a = Math.max(0, Math.floor(answered));
  const earned = Math.floor(a / per);
  return { earned, owed: Math.max(0, earned - Math.max(0, tried)), toNext: per - (a % per) };
}

export const CADENCE_TEXT: Record<ThinkLang, { unlocked: (n: number) => string; toNext: (n: number) => string }> = {
  ko: { unlocked: (n) => `일반 문제 10개를 풀어 사고력 도전 ${n}개가 열렸어요`, toNext: (n) => `일반 문제 ${n}개를 더 풀면 사고력 도전이 열려요` },
  en: { unlocked: (n) => `${n} thinking challenge${n > 1 ? "s" : ""} unlocked by your regular practice`, toNext: (n) => `${n} more regular question${n > 1 ? "s" : ""} to unlock a thinking challenge` },
  "zh-Hans": { unlocked: (n) => `做完常规题已解锁 ${n} 个思维力挑战`, toNext: (n) => `再做 ${n} 道常规题即可解锁一个思维力挑战` },
  "zh-Hant": { unlocked: (n) => `完成一般題已解鎖 ${n} 個思考力挑戰`, toNext: (n) => `再做 ${n} 道一般題即可解鎖一個思考力挑戰` },
  ja: { unlocked: (n) => `通常の問題で思考力チャレンジが${n}個解放されました`, toNext: (n) => `通常の問題をあと${n}問解くと思考力チャレンジが解放されます` },
  vi: { unlocked: (n) => `Đã mở ${n} thử thách tư duy nhờ luyện tập thường`, toNext: (n) => `Làm thêm ${n} câu thường để mở một thử thách tư duy` },
};
