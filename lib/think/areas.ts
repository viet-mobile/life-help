import { extendThinkLabels, type CoreThinkLang } from "./expandedUiExtra";
import areas from "./math-areas.json";
import langFields from "./lang-fields.json";
import type { ThinkLang } from "./lang";

/** The four areas of the math hub's field filter (2022 curriculum style). Assignment: scripts/think/classify-math-areas.py -> math-areas.json. */
export type MathArea = "number" | "relations" | "geometry" | "data";
export const MATH_AREAS: MathArea[] = ["number", "relations", "geometry", "data"];
const CORE_AREA_LABELS: Record<MathArea, Record<CoreThinkLang, string>> = {
  number: { ko: "수와 연산", en: "Numbers and operations", "zh-Hans": "数与运算", "zh-Hant": "數與運算", ja: "数と計算", vi: "Số và phép tính" },
  relations: { ko: "변화와 관계", en: "Change and relationships", "zh-Hans": "变化与关系", "zh-Hant": "變化與關係", ja: "変化と関係", vi: "Biến đổi và quan hệ" },
  geometry: { ko: "도형과 측정", en: "Shapes and measurement", "zh-Hans": "图形与测量", "zh-Hant": "圖形與測量", ja: "図形と測定", vi: "Hình học và đo lường" },
  data: { ko: "자료와 가능성", en: "Data and chance", "zh-Hans": "数据与可能性", "zh-Hant": "資料與可能性", ja: "データと可能性", vi: "Dữ liệu và khả năng" },
};
/** null = a task that fits none of the four areas: it is listed under "all fields" only. */
export const mathAreaOf = (taskId: string): MathArea | null => (areas as Record<string, MathArea | null>)[taskId] ?? null;

/** English- and Korean-subject tasks: six fields (English curriculum content areas). Assignment: scripts/think/classify-lang-fields.py -> lang-fields.json. */
export type LangField = "topic" | "function" | "context" | "strategy" | "language" | "text";
export const LANG_FIELDS: LangField[] = ["topic", "function", "context", "strategy", "language", "text"];
const CORE_FIELD_LABELS: Record<LangField, Record<CoreThinkLang, { short: string; full: string }>> = {
  topic: { ko: { short: "주제", full: "주제" }, en: { short: "Topic", full: "Topic" }, "zh-Hans": { short: "主题", full: "主题" }, "zh-Hant": { short: "主題", full: "主題" }, ja: { short: "テーマ", full: "テーマ" }, vi: { short: "Chủ đề", full: "Chủ đề" } },
  function: { ko: { short: "기능", full: "기능" }, en: { short: "Function", full: "Function" }, "zh-Hans": { short: "功能", full: "功能" }, "zh-Hant": { short: "功能", full: "功能" }, ja: { short: "機能", full: "機能" }, vi: { short: "Chức năng", full: "Chức năng" } },
  context: { ko: { short: "맥락", full: "맥락" }, en: { short: "Context", full: "Context" }, "zh-Hans": { short: "语境", full: "语境" }, "zh-Hant": { short: "語境", full: "語境" }, ja: { short: "文脈", full: "文脈" }, vi: { short: "Ngữ cảnh", full: "Ngữ cảnh" } },
  strategy: { ko: { short: "기술 및 전략", full: "기술 및 전략" }, en: { short: "Skills & strategies", full: "Skills & strategies" }, "zh-Hans": { short: "技能与策略", full: "技能与策略" }, "zh-Hant": { short: "技能與策略", full: "技能與策略" }, ja: { short: "技能と方略", full: "技能と方略" }, vi: { short: "Kỹ năng & chiến lược", full: "Kỹ năng & chiến lược" } },
  language: { ko: { short: "언어지식", full: "언어지식 (발음, 어휘, 문법 등)" }, en: { short: "Language knowledge", full: "Language knowledge (pronunciation, vocabulary, grammar…)" }, "zh-Hans": { short: "语言知识", full: "语言知识（语音、词汇、语法等）" }, "zh-Hant": { short: "語言知識", full: "語言知識（語音、詞彙、語法等）" }, ja: { short: "言語知識", full: "言語知識（発音・語彙・文法など）" }, vi: { short: "Kiến thức ngôn ngữ", full: "Kiến thức ngôn ngữ (phát âm, từ vựng, ngữ pháp…)" } },
  text: { ko: { short: "텍스트", full: "텍스트" }, en: { short: "Text", full: "Text" }, "zh-Hans": { short: "语篇", full: "语篇" }, "zh-Hant": { short: "語篇", full: "語篇" }, ja: { short: "テキスト", full: "テキスト" }, vi: { short: "Văn bản", full: "Văn bản" } },
};
export const langFieldOf = (taskId: string): LangField | null => (langFields as Record<string, LangField | null>)[taskId] ?? null;

/** One field system for the hub: math = four areas, English / Korean = six fields. key = the filter value, short = card prefix, full = filter option. */
export type FieldInfo = { key: string; short: string; full: string };
export function fieldList(site: string): string[] { return site === "math" ? MATH_AREAS : site === "english" || site === "korean" ? LANG_FIELDS : []; }
export function fieldKeyOf(site: string, taskId: string): string | null { return site === "math" ? mathAreaOf(taskId) : site === "english" || site === "korean" ? langFieldOf(taskId) : null; }
export function fieldInfo(site: string, key: string, lang: ThinkLang): FieldInfo {
  if (site === "math") { const t = AREA_LABELS[key as MathArea][lang]; return { key, short: t, full: t }; }
  const l = FIELD_LABELS[key as LangField][lang]; return { key, short: l.short, full: l.full };
}

export const AREA_LABELS = Object.fromEntries(Object.entries(CORE_AREA_LABELS).map(([key,row])=>[key,extendThinkLabels(row,p=>p.areas[key as MathArea])])) as Record<MathArea,Record<ThinkLang,string>>;
export const FIELD_LABELS = Object.fromEntries(Object.entries(CORE_FIELD_LABELS).map(([key,row])=>[key,extendThinkLabels(row,p=>p.fields[key as LangField])])) as Record<LangField,Record<ThinkLang,{short:string;full:string}>>;
