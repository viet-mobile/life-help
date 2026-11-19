import { DailyInsight, DomainType } from "./types";
import { INSIGHT_MAP } from "./data";
import { DAILY_INSIGHT_LOCALES, getInsightLocaleData } from "./localesData";
import { resolveLifeTopicI18n } from "./lifeTopicsI18n";
import { resolveKoreanTopicI18n } from "./koreanTopicsI18n";

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
    if (domain === "life") {
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
    if (domain === "korean") {
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
  };
}
