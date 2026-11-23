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
  ko: { unlocked: (n) => `일반 문제를 풀어서 중간 보스 ${n}명이 기다리고 있어요`, toNext: (n) => `일반 문제 ${n}개를 더 풀면 중간 보스가 나타나요` },
  en: { unlocked: (n) => `${n} mid-boss${n > 1 ? "es are" : " is"} waiting after your regular practice`, toNext: (n) => `${n} more regular question${n > 1 ? "s" : ""} until the next mid-boss` },
  "zh-Hans": { unlocked: (n) => `做完常规题，${n} 个中期首领在等你`, toNext: (n) => `再做 ${n} 道常规题，中期首领就会出现` },
  "zh-Hant": { unlocked: (n) => `做完一般題，${n} 個中期首領在等你`, toNext: (n) => `再做 ${n} 道一般題，中期首領就會出現` },
  ja: { unlocked: (n) => `通常の問題を解いて、中ボスが${n}体待っています`, toNext: (n) => `通常の問題をあと${n}問解くと中ボスが現れます` },
  vi: { unlocked: (n) => `${n} trùm giữa đang chờ sau phần luyện tập thường`, toNext: (n) => `Làm thêm ${n} câu thường để trùm giữa xuất hiện` },
};

const EXTENDED_CADENCE: Record<string, { unlocked: (n: number) => string; toNext: (n: number) => string }> = {
  ...CADENCE_TEXT,
  th: {
    unlocked: (n) => `ทำโจทย์ทั่วไปแล้วมีบอสระดับกลาง ${n} ตัวกำลังรอคุณอยู่`,
    toNext: (n) => `ทำโจทย์ทั่วไปอีก ${n} ข้อเพื่อพบกับบอสระดับกลาง`,
  },
  my: {
    unlocked: (n) => `ပုံမှန်မေးခွန်းများဖြေဆိုပြီးနောက် အလယ်အလတ်ဘော့စ် ${n} ကောင် စောင့်နေပါသည်`,
    toNext: (n) => `နောက်ထပ် ပုံမှန်မေးခွန်း ${n} ခု ဖြေဆိုပါက အလယ်အလတ်ဘော့စ် ပေါ်လာပါမည်`,
  },
  km: {
    unlocked: (n) => `មេប្រយុទ្ធកណ្តាលចំនួន ${n} កំពុងរង់ចាំបន្ទាប់ពីការអនុវត្តធម្មតា`,
    toNext: (n) => `ដោះស្រាយសំណួរធម្មតាចំនួន ${n} បន្ថែមទៀតដើម្បីឱ្យមេប្រយុទ្ធកណ្តាលបង្ហាញខ្លួន`,
  },
  ar: {
    unlocked: (n) => `بعد إكمال التدريب المعتاد، هناك ${n} زعيم مرحلي في انتظارك`,
    toNext: (n) => `حل ${n} أسئلة عادية أخرى ليظهر الزعيم المرحلي`,
  },
  ru: {
    unlocked: (n) => `После обычных заданий вас ждут мини-боссы (${n})`,
    toNext: (n) => `Решите ещё ${n} обычных заданий, чтобы появился мини-босс`,
  },
  fr: {
    unlocked: (n) => `${n} mini-boss vous attend${n > 1 ? "ent" : ""} après vos exercices réguliers`,
    toNext: (n) => `Résolvez encore ${n} question${n > 1 ? "s" : ""} ordinaire${n > 1 ? "s" : ""} pour faire apparaître le mini-boss`,
  },
  es: {
    unlocked: (n) => `${n} jefe${n > 1 ? "s" : ""} intermedio${n > 1 ? "s te esperan" : " te espera"} tras la práctica regular`,
    toNext: (n) => `Resuelve ${n} pregunta${n > 1 ? "s" : ""} regular${n > 1 ? "es" : ""} más para que aparezca el jefe intermedio`,
  },
  de: {
    unlocked: (n) => `${n} Zwischenboss${n > 1 ? "e warten" : " wartet"} nach den regulären Übungen`,
    toNext: (n) => `Löse noch ${n} reguläre Aufgabe${n > 1 ? "n" : ""}, damit der Zwischenboss erscheint`,
  },
};

export function getCadenceString(locale: string, count: number, isUnlocked: boolean): string {
  const entry = EXTENDED_CADENCE[locale] || EXTENDED_CADENCE.en;
  return isUnlocked ? entry.unlocked(count) : entry.toNext(count);
}
