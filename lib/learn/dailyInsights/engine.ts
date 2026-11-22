import { cleanFormulaText } from "./cleanFormula";
import { DailyInsight, DomainType } from "./types";
import { INSIGHT_MAP } from "./data";
import { DAILY_INSIGHT_LOCALES, getInsightLocaleData } from "./localesData";
import { resolveLifeTopicI18n } from "./lifeTopicsI18n";
import { resolveKoreanTopicI18n } from "./koreanTopicsI18n";
import { resolveStudyTopicI18n } from "./studyTopicsI18n";

const CATEGORY_KO: Record<string, string> = {
  wealth: "재산 증식",
  saving: "비용 절약",
  career: "경력 및 구직",
  health: "건강 및 웰니스",
  travel: "여행 및 이동",
  problem: "생활 문제 해결",
  shopping: "쇼핑·소비",
  energy: "에너지 절약",
};

const CATEGORY_ICON: Record<string, string> = {
  wealth: "📈",
  saving: "💸",
  career: "💼",
  health: "🌱",
  travel: "✈️",
  problem: "🛠️",
  shopping: "🛒",
  energy: "⚡",
};

/**
 * Returns the deterministic day index (0 ~ 365) based on month and day,
 * calibrated for a full 366-day leap-year calendar.
 * - Jan 1 = index 0 (Day 1)
 * - Feb 28 = index 58 (Day 59)
 * - Feb 29 (Leap Day) = index 59 (Day 60)
 * - Mar 1 = index 60 (Day 61)
 * - Dec 31 = index 365 (Day 366)
 */
export function getDailyIndex(date: Date = new Date()): number {
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let month = date.getMonth();
  let day = date.getDate();

  // Calibrate to KST (Asia/Seoul) to guarantee identical day indexing across server SSR & client hydration
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      month: "numeric",
      day: "numeric",
    }).formatToParts(date);
    const m = parts.find((p) => p.type === "month");
    const d = parts.find((p) => p.type === "day");
    if (m && d) {
      month = parseInt(m.value, 10) - 1;
      day = parseInt(d.value, 10);
    }
  } catch {
    // fallback to runtime date
  }

  const cappedDay = Math.min(day, daysInMonth[month] || 31);
  let sum = 0;
  for (let i = 0; i < month; i++) {
    sum += daysInMonth[i];
  }
  return sum + (cappedDay - 1);
}

/**
 * Get the daily insight for a specific domain ("math" | "english" | "korean" | "life")
 * with optional locale translation.
 */
export function getDailyInsight(domain: DomainType | string, date: Date = new Date(), locale?: string): DailyInsight {
  const items = INSIGHT_MAP[domain] || INSIGHT_MAP.life;
  const dayIndex = getDailyIndex(date);
  const selectedIndex = dayIndex % items.length;
  const item = { ...items[selectedIndex] };

  if (locale && locale !== "ko") {
    // 1. Resolve domain="life" topics across all 366 days
    if (domain === "life" || item.id.startsWith("insight-") || !INSIGHT_MAP[domain]) {
      const topicTrans = resolveLifeTopicI18n(item.title, locale);
      if (topicTrans) {
        if (topicTrans.title) item.title = topicTrans.title;
        if (topicTrans.summary) item.summary = topicTrans.summary;
        if (topicTrans.principle) item.principle = topicTrans.principle;
        if (topicTrans.example) item.example = topicTrans.example;
        if (topicTrans.actionItem) item.actionItem = topicTrans.actionItem;
      }
    }

    // 1-1. Resolve domain="korean" topics across all 366 days
    if (domain === "korean" || item.id.startsWith("k-")) {
      const topicTrans = resolveKoreanTopicI18n(item, locale);
      if (topicTrans) {
        if (topicTrans.title) item.title = topicTrans.title;
        if (topicTrans.summary) item.summary = topicTrans.summary;
        if (topicTrans.principle) item.principle = topicTrans.principle;
        if (topicTrans.example) item.example = topicTrans.example;
        if (topicTrans.actionItem) item.actionItem = topicTrans.actionItem;
        if (topicTrans.categoryLabel) item.categoryLabel = topicTrans.categoryLabel;
      }
    }

    // 1-2. Resolve math, english, physics, and chemistry topics across all 366 days
    if (["math", "english", "physics", "chemistry"].includes(domain) || ["m", "e", "p", "c"].includes(item.id.split("-")[0])) {
      const topicTrans = resolveStudyTopicI18n(item, locale);
      if (topicTrans) {
        if (topicTrans.title) item.title = topicTrans.title;
        if (topicTrans.summary) item.summary = topicTrans.summary;
        if (topicTrans.principle) item.principle = topicTrans.principle;
        if (topicTrans.example) item.example = topicTrans.example;
        if (topicTrans.actionItem) item.actionItem = topicTrans.actionItem;
        if (topicTrans.categoryLabel) item.categoryLabel = topicTrans.categoryLabel;
      }
    }

    // 2. Check 89-locale JSON datasets
    const locData = getInsightLocaleData(locale);
    if (locData) {
      let trans: any = null;
      if (Array.isArray(locData.insights)) {
        trans = locData.insights.find((x: any) => x && x.id === item.id);
      } else if (locData.insights) {
        trans = (locData.insights as Record<string, any>)[item.id];
      }

      if (trans) {
        item.title = trans.title || item.title;
        item.summary = trans.summary || item.summary;
        item.principle = trans.principle || item.principle;
        item.example = trans.example || item.example;
        item.actionItem = trans.actionItem || item.actionItem;
        if (trans.relatedServiceOrWorld) {
          item.relatedServiceOrWorld = trans.relatedServiceOrWorld;
        }
        if (trans.categoryLabel) {
          item.categoryLabel = trans.categoryLabel;
        }
      }
      const catLabel = locData.ui_labels?.categories?.[item.category as keyof typeof locData.ui_labels.categories];
      if (catLabel) {
        item.categoryLabel = catLabel;
      }
    }
  }

  if (!item.categoryLabelKo) {
    item.categoryLabelKo = CATEGORY_KO[item.category] || item.category;
  }
  if (!item.categoryIcon) {
    item.categoryIcon = CATEGORY_ICON[item.category] || "💡";
  }
  if (!item.categoryLabel) {
    item.categoryLabel = item.categoryLabelKo || item.category;
  }

  item.title = cleanFormulaText(item.title);
  item.summary = cleanFormulaText(item.summary);
  item.principle = cleanFormulaText(item.principle);
  item.example = cleanFormulaText(item.example);
  item.actionItem = cleanFormulaText(item.actionItem);

  return item;
}

/**
 * Get today's insights across all 4 domains for the master portal
 */
export function getAllDailyInsights(date: Date = new Date(), locale?: string): Record<DomainType, DailyInsight> {
  return {
    math: getDailyInsight("math", date, locale),
    english: getDailyInsight("english", date, locale),
    korean: getDailyInsight("korean", date, locale),
    life: getDailyInsight("life", date, locale),
    physics: getDailyInsight("physics", date, locale),
    chemistry: getDailyInsight("chemistry", date, locale),
  };
}
