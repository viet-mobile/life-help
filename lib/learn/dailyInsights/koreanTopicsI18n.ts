import rawKoreanTopics from "./koreanTopics89.json";
import type { DailyInsight } from "./types";

export interface KoreanTopicEntry {
  id: string;
  title: Record<string, string>;
  summary: Record<string, string>;
  principle: Record<string, string>;
  example: Record<string, string>;
  actionItem: Record<string, string>;
}

const KOREAN_TOPIC_DATA: Record<string, KoreanTopicEntry> = (rawKoreanTopics as unknown as Record<string, KoreanTopicEntry>);

const CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  wealth: {
    en: "Wealth Building",
    vi: "Gia tăng tài sản",
    "zh-Hans": "财富积累",
    "zh-Hant": "財富積累",
    ja: "資産形成",
  },
  saving: {
    en: "Smart Saving",
    vi: "Tiết kiệm chi phí",
    "zh-Hans": "精明节支",
    "zh-Hant": "精明節約",
    ja: "節約・節税",
  },
  career: {
    en: "Career & Jobs",
    vi: "Phát triển nghề nghiệp",
    "zh-Hans": "职场求职",
    "zh-Hant": "職場求職",
    ja: "就職・キャリア",
  },
  health: {
    en: "Health & Care",
    vi: "Chăm sóc sức khỏe",
    "zh-Hans": "健康医疗",
    "zh-Hant": "健康醫療",
    ja: "健康・医療",
  },
  travel: {
    en: "Transit & Travel",
    vi: "Giao thông & Đi lại",
    "zh-Hans": "交通出行",
    "zh-Hant": "交通出行",
    ja: "交通・暮らし",
  },
  problem: {
    en: "Everyday Solutions",
    vi: "Giải quyết sự vụ",
    "zh-Hans": "生活维权",
    "zh-Hant": "生活維權",
    ja: "生活トラブル",
  },
};

/**
 * Resolves comprehensive multilingual translation for a Korean daily insight item.
 * Supports en, vi, zh-Hans, zh-Hant, ja, with fallback to high-quality English for all 89 languages.
 */
export function resolveKoreanTopicI18n(
  item: DailyInsight,
  locale: string
): {
  title?: string;
  summary?: string;
  principle?: string;
  example?: string;
  actionItem?: string;
  categoryLabel?: string;
} | null {
  if (!locale || locale === "ko") return null;

  // Extract base key (k-001 ~ k-036) and season
  const num = parseInt(item.id.replace("k-", ""), 10);
  if (isNaN(num)) return null;

  const baseIndex = ((num - 1) % 36) + 1;
  const baseKey = `k-${String(baseIndex).padStart(3, "0")}`;
  const entry = KOREAN_TOPIC_DATA[baseKey];
  if (!entry) return null;

  const season = Math.floor((num - 1) / 36) + 1;

  // Target language resolution with full 89-language support
  const isHant = locale === "zh-Hant" || locale === "zt" || locale === "zh-HK" || locale === "zh-TW";
  const normLocale = locale === "zs" || locale === "zh" || locale === "zh-CN" ? "zh-Hans" : (isHant ? "zh-Hant" : locale);
  const lang = entry.title?.[normLocale] ? normLocale : (isHant && entry.title?.["zh-Hans"] ? "zh-Hans" : (entry.title?.en ? "en" : "ko"));

  let title = entry.title[lang] || entry.title.en || item.title;
  let summary = entry.summary[lang] || entry.summary.en || item.summary;
  const principle = entry.principle[lang] || entry.principle.en || item.principle;
  const example = entry.example[lang] || entry.example.en || item.example;
  const actionItem = entry.actionItem[lang] || entry.actionItem.en || item.actionItem;

  // Season suffix completely removed per user instruction

  // Localized category label
  const catMap = CATEGORY_TRANSLATIONS[item.category];
  const categoryLabel = catMap ? catMap[lang] || catMap.en : undefined;

  return {
    title,
    summary,
    principle,
    example,
    actionItem,
    categoryLabel,
  };
}
