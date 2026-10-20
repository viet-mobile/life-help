import { extendThinkLabels, formatThinkExtra, type CoreThinkLang } from "./expandedUiExtra";
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

const CORE_CADENCE_TEXT: Record<CoreThinkLang, { unlocked: (n: number) => string; toNext: (n: number) => string }> = {
  ko: { unlocked: (n) => `일반 문제를 풀어서 중간 보스 ${n}명이 기다리고 있어요`, toNext: (n) => `일반 문제 ${n}개를 더 풀면 중간 보스가 나타나요` },
  en: { unlocked: (n) => `${n} mid-boss${n > 1 ? "es are" : " is"} waiting after your regular practice`, toNext: (n) => `${n} more regular question${n > 1 ? "s" : ""} until the next mid-boss` },
  "zh-Hans": { unlocked: (n) => `做完常规题，${n} 个中期首领在等你`, toNext: (n) => `再做 ${n} 道常规题，中期首领就会出现` },
  "zh-Hant": { unlocked: (n) => `做完一般題，${n} 個中期首領在等你`, toNext: (n) => `再做 ${n} 道一般題，中期首領就會出現` },
  ja: { unlocked: (n) => `通常の問題を解いて、中ボスが${n}体待っています`, toNext: (n) => `通常の問題をあと${n}問解くと中ボスが現れます` },
  vi: { unlocked: (n) => `${n} trùm giữa đang chờ sau phần luyện tập thường`, toNext: (n) => `Làm thêm ${n} câu thường để trùm giữa xuất hiện` },
};

export const CADENCE_TEXT = extendThinkLabels(CORE_CADENCE_TEXT,p=>({unlocked:(n:number)=>formatThinkExtra(p.cadence.unlocked,{n}),toNext:(n:number)=>formatThinkExtra(p.cadence.toNext,{n})}));
