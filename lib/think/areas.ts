import areas from "./math-areas.json";
import type { ThinkLang } from "./lang";

/** The four areas of the math hub's field filter (2022 curriculum style). Assignment: scripts/think/classify-math-areas.py -> math-areas.json. */
export type MathArea = "number" | "relations" | "geometry" | "data";
export const MATH_AREAS: MathArea[] = ["number", "relations", "geometry", "data"];
export const AREA_LABELS: Record<MathArea, Record<ThinkLang, string>> = {
  number: { ko: "수와 연산", en: "Numbers and operations", "zh-Hans": "数与运算", "zh-Hant": "數與運算", ja: "数と計算", vi: "Số và phép tính" },
  relations: { ko: "변화와 관계", en: "Change and relationships", "zh-Hans": "变化与关系", "zh-Hant": "變化與關係", ja: "変化と関係", vi: "Biến đổi và quan hệ" },
  geometry: { ko: "도형과 측정", en: "Shapes and measurement", "zh-Hans": "图形与测量", "zh-Hant": "圖形與測量", ja: "図形と測定", vi: "Hình học và đo lường" },
  data: { ko: "자료와 가능성", en: "Data and chance", "zh-Hans": "数据与可能性", "zh-Hant": "資料與可能性", ja: "データと可能性", vi: "Dữ liệu và khả năng" },
};
/** null = a task that fits none of the four areas: it is listed under "all fields" only. */
export const mathAreaOf = (taskId: string): MathArea | null => (areas as Record<string, MathArea | null>)[taskId] ?? null;
