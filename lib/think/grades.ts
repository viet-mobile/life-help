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

export const LEVEL_LABEL_MAP: Record<string, Record<string, string>> = {
  "초등": { ko: "초등", en: "Elementary", vi: "Tiểu học", "zh-Hans": "小学", "zh-Hant": "國小", ja: "小学校", ar: "ابتدائي", hi: "प्राथमिक", fr: "Primaire", de: "Grundschule", es: "Primaria", ru: "Начальная" },
  "중등": { ko: "중등", en: "Middle School", vi: "THCS", "zh-Hans": "初中", "zh-Hant": "國中", ja: "中学校", ar: "إعدادي", hi: "माध्यमिक", fr: "Collège", de: "Mittelstufe", es: "Secundaria", ru: "Средняя" },
  "고등": { ko: "고등", en: "High School", vi: "THPT", "zh-Hans": "高中", "zh-Hant": "高中", ja: "高校", ar: "ثانوي", hi: "उच्च माध्यमिक", fr: "Lycée", de: "Oberstufe", es: "Bachillerato", ru: "Старшая" },
  "Beginner": { ko: "초급", en: "Beginner", vi: "Sơ cấp", "zh-Hans": "初级", "zh-Hant": "初級", ja: "初級", ar: "مبتدئ", hi: "शुरुआती", fr: "Débutant", de: "Anfänger", es: "Principiante", ru: "Начальный" },
  "Intermediate": { ko: "중급", en: "Intermediate", vi: "Trung cấp", "zh-Hans": "中级", "zh-Hant": "中級", ja: "中級", ar: "متوسط", hi: "मध्यवर्ती", fr: "Intermédiaire", de: "Mittelstufe", es: "Intermedio", ru: "Средний" },
  "Advanced": { ko: "고급", en: "Advanced", vi: "Cao cấp", "zh-Hans": "高级", "zh-Hant": "高級", ja: "上級", ar: "متقدم", hi: "उन्नत", fr: "Avancé", de: "Fortgeschritten", es: "Avanzado", ru: "Продвинутый" },
};

export function formatLevelLabel(label: string, lang: string): string {
  if (!label) return "";
  const entry = LEVEL_LABEL_MAP[label];
  if (!entry) return label;
  return entry[lang] ?? entry[lang.split("-")[0]] ?? entry.en ?? label;
}
