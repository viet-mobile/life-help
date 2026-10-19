import type { ThinkLang } from "./lang";

/** Display name of a grade code in the thinking hub: E1-E6 = elementary 1-6, M1-M3 = middle 1-3, H1-H3 = high 1-3. Codes stay as they are in data and URLs. */
const PREFIX: Record<"E" | "M" | "H", Record<ThinkLang, string>> = {
  E: { ko: "초", en: "Elementary ", "zh-Hans": "小学", "zh-Hant": "國小", ja: "小", vi: "Tiểu học " },
  M: { ko: "중", en: "Middle ", "zh-Hans": "初中", "zh-Hant": "國中", ja: "中", vi: "THCS " },
  H: { ko: "고", en: "High ", "zh-Hans": "高中", "zh-Hant": "高中", ja: "高", vi: "THPT " },
};
export function gradeLabel(code: string, lang: ThinkLang): string {
  const m = /^([EMH])([1-6])$/.exec(code);
  return m ? `${PREFIX[m[1] as "E" | "M" | "H"][lang]}${m[2]}` : code;
}
