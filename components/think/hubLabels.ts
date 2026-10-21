import type { ThinkLang } from "@/lib/think/lang";
import type { MessageKey, Translator } from "@/lib/learn/i18n";

/** Strings of the learning-site hub (the player itself uses labels.ts). */
export interface HubLabels { title: string; intro: string; grade: string; electives: string; empty: string; done: string; open: string; of: string; notTranslated: string; allFields: string; field: string; tryOne: string; quick: string; allSemesters: string; enter: string }
const HUB_KEYS = ["title", "intro", "grade", "electives", "empty", "done", "open", "of", "notTranslated", "allFields", "field", "tryOne", "quick", "allSemesters", "enter"] as const;
/** Hub strings come from the learning i18n catalog (think.hub.*): locale -> English -> Korean, so a locale without its own text shows English, never a raw key. */
export function hubLabels(t: Translator): HubLabels {
  const out = {} as Record<(typeof HUB_KEYS)[number], string>;
  for (const k of HUB_KEYS) out[k] = t(`think.hub.${k}` as MessageKey);
  return out as HubLabels;
}
export const ELECTIVE_NAMES: Record<string, Record<ThinkLang, string>> = {
  "EL-econ": { ko: "경제 수학", en: "Economic Mathematics", "zh-Hans": "经济数学", "zh-Hant": "經濟數學", ja: "経済数学", vi: "Toán kinh tế" },
  "EL-ai": { ko: "인공지능 수학", en: "AI Mathematics", "zh-Hans": "人工智能数学", "zh-Hant": "人工智慧數學", ja: "人工知能数学", vi: "Toán trí tuệ nhân tạo" },
  "EL-job": { ko: "직무 수학", en: "Workplace Mathematics", "zh-Hans": "职业数学", "zh-Hant": "職務數學", ja: "職務数学", vi: "Toán nghề nghiệp" },
  "EL-cul": { ko: "수학과 문화", en: "Mathematics and Culture", "zh-Hans": "数学与文化", "zh-Hant": "數學與文化", ja: "数学と文化", vi: "Toán học và văn hóa" },
  "EL-sta": { ko: "실용 통계", en: "Practical Statistics", "zh-Hans": "实用统计", "zh-Hant": "實用統計", ja: "実用統計", vi: "Thống kê thực hành" },
  "EL-res": { ko: "수학과제 탐구", en: "Mathematical Inquiry Project", "zh-Hans": "数学课题探究", "zh-Hant": "數學課題探究", ja: "数学課題探究", vi: "Nghiên cứu đề tài toán học" },
};
