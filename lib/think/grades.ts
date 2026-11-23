import type { ThinkLang } from "./lang";

/** Display name of a grade code in the thinking hub: E1-E6 = elementary 1-6, M1-M3 = middle 1-3, H1-H3 = high 1-3. Codes stay as they are in data and URLs. */
const GRADE_NUM: Record<string, number> = {
  E1: 1, E2: 2, E3: 3, E4: 4, E5: 5, E6: 6,
  M1: 7, M2: 8, M3: 9,
  H1: 10, H2: 11, H3: 12,
};

export function gradeLabel(code: string, lang: ThinkLang): string {
  const num = GRADE_NUM[code] ?? (/^\d+$/.test(code) ? Number(code) : null);
  if (num !== null && num >= 1 && num <= 12) {
    if (lang === "ko") return `${num}학년`;
    if (lang === "vi") return `Lớp ${num}`;
    if (lang === "ja") return `${num}年生`;
    if (lang === "zh-Hans") return `${num}年级`;
    if (lang === "zh-Hant") return `${num}年級`;
    return `Grade ${num}`;
  }
  return code;
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

const MINUTES_MAP: Record<string, string> = {
  ko: "분",
  ja: "分",
  "zh-Hans": "分钟",
  "zh-Hant": "分鐘",
  zh: "分钟",
  vi: "phút",
  en: "min",
};

/**
 * Formats duration with unit according to language conventions:
 * - Korean (ko), Chinese (zh, zh-Hans, zh-Hant), Japanese (ja) attach directly without space (e.g. 10분, 10分鐘, 10分).
 * - Vietnamese (vi), English (en) and others include a space (e.g. 10 phút, 10 min).
 * - When approx is true, prepends ≈ (e.g. ≈10분 vs ≈ 10 phút).
 */
export function formatMinutes(minutes: number, lang: string, approx = false): string {
  const isNoSpace = /^(ko|ja|zh|zh-Hans|zh-Hant)$/.test(lang);
  const unit = MINUTES_MAP[lang] ?? MINUTES_MAP[lang.split("-")[0]] ?? "min";
  const numStr = isNoSpace ? `${minutes}${unit}` : `${minutes} ${unit}`;
  return approx ? (isNoSpace ? `≈${numStr}` : `≈ ${numStr}`) : numStr;
}
