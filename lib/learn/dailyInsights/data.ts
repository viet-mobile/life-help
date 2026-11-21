import { DailyInsight } from "./types";
import mathData from "./data/math.json";
import englishData from "./data/english.json";
import koreanData from "./data/korean.json";
import lifeData from "./data/life.json";
import physicsData from "./data/physics.json";
import chemistryData from "./data/chemistry.json";

export const MATH_INSIGHTS: DailyInsight[] = mathData as DailyInsight[];
export const ENGLISH_INSIGHTS: DailyInsight[] = englishData as DailyInsight[];
export const KOREAN_INSIGHTS: DailyInsight[] = koreanData as DailyInsight[];
export const LIFE_INSIGHTS: DailyInsight[] = lifeData as DailyInsight[];
export const PHYSICS_INSIGHTS: DailyInsight[] = physicsData as DailyInsight[];
export const CHEMISTRY_INSIGHTS: DailyInsight[] = chemistryData as DailyInsight[];

export const INSIGHT_MAP: Record<string, DailyInsight[]> = {
  math: MATH_INSIGHTS,
  english: ENGLISH_INSIGHTS,
  korean: KOREAN_INSIGHTS,
  life: LIFE_INSIGHTS,
  physics: PHYSICS_INSIGHTS,
  chemistry: CHEMISTRY_INSIGHTS,
};
