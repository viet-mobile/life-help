import rawStudyTopics from "./studyTopics89.json";
import type { DailyInsight } from "./types";

export interface StudyTopicEntry {
  id: string;
  title: Record<string, string>;
  summary: Record<string, string>;
  principle: Record<string, string>;
  example: Record<string, string>;
  actionItem: Record<string, string>;
}

const STUDY_TOPIC_DATA: Record<string, StudyTopicEntry> = (rawStudyTopics as unknown as Record<string, StudyTopicEntry>);

const CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  wealth: {
    en: "Wealth Building",
    vi: "Gia tăng tài sản",
    "zh-Hans": "财富积累",
    "zh-Hant": "財富積累",
    ja: "資産形成",
    es: "Creación de riqueza",
    fr: "Création de richesse",
  },
  saving: {
    en: "Smart Saving",
    vi: "Tiết kiệm thông minh",
    "zh-Hans": "精明节支",
    "zh-Hant": "精明節約",
    ja: "節約・節税",
    es: "Ahorro inteligente",
    fr: "Épargne intelligente",
  },
  career: {
    en: "Career & Jobs",
    vi: "Phát triển nghề nghiệp",
    "zh-Hans": "职场求职",
    "zh-Hant": "職場求職",
    ja: "就職・キャリア",
    es: "Carrera y empleo",
    fr: "Carrière et emploi",
  },
  health: {
    en: "Health & Wellness",
    vi: "Sức khỏe và an sinh",
    "zh-Hans": "健康生活",
    "zh-Hant": "健康生活",
    ja: "健康・医療",
    es: "Salud y bienestar",
    fr: "Santé et bien-être",
  },
  travel: {
    en: "Transit & Travel",
    vi: "Giao thông & Đi lại",
    "zh-Hans": "交通出行",
    "zh-Hant": "交通出行",
    ja: "交通・暮らし",
    es: "Tránsito y viajes",
    fr: "Transport et voyage",
  },
  problem: {
    en: "Everyday Solutions",
    vi: "Giải quyết sự vụ",
    "zh-Hans": "生活维权",
    "zh-Hant": "生活維權",
    ja: "生活トラブル",
    es: "Soluciones cotidianas",
    fr: "Solutions du quotidien",
  },
  shopping: {
    en: "Smart Shopping",
    vi: "Mua sắm thông minh",
    "zh-Hans": "精明消费",
    "zh-Hant": "精明消費",
    ja: "賢い買い物",
    es: "Compras inteligentes",
    fr: "Achats malins",
  },
  energy: {
    en: "Energy Saving",
    vi: "Tiết kiệm năng lượng",
    "zh-Hans": "节能环保",
    "zh-Hant": "節能環保",
    ja: "省エネ・節電",
    es: "Ahorro de energía",
    fr: "Économie d'énergie",
  },
};

/**
 * Resolves localized daily insight content for math, english, physics, and chemistry.
 */
export function resolveStudyTopicI18n(
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

  // Extract prefix (m, e, p, c) and number
  const parts = item.id.split("-");
  if (parts.length !== 2) return null;
  const prefix = parts[0];
  const num = parseInt(parts[1], 10);
  if (isNaN(num)) return null;

  const exactKey = item.id;
  const baseIndex = ((num - 1) % 36) + 1;
  const baseKey = `${prefix}-${String(baseIndex).padStart(3, "0")}`;
  const hasExact = !!STUDY_TOPIC_DATA[exactKey];
  const entry = STUDY_TOPIC_DATA[exactKey] || STUDY_TOPIC_DATA[baseKey];
  if (!entry) return null;

  const season = hasExact ? 1 : Math.floor((num - 1) / 36) + 1;

  // Normalize language key
  const isHant = locale === "zh-Hant" || locale === "zt" || locale === "zh-HK" || locale === "zh-TW";
  const lang =
    locale === "vi"
      ? "vi"
      : locale === "ja"
      ? "ja"
      : locale === "zh-Hans" || locale === "zh-CN" || locale === "zh"
      ? "zh-Hans"
      : isHant
      ? "zh-Hans"
      : locale === "es"
      ? "es"
      : locale === "fr"
      ? "fr"
      : "en";

  let title = entry.title?.[lang] || entry.title?.en || item.title;
  let summary = entry.summary?.[lang] || entry.summary?.en || item.summary;
  const principle = entry.principle?.[lang] || entry.principle?.en || item.principle;
  const example = entry.example?.[lang] || entry.example?.en || item.example;
  const actionItem = entry.actionItem?.[lang] || entry.actionItem?.en || item.actionItem;

  // Localized season suffix if beyond Season 1
  if (season > 1) {
    if (lang === "vi") {
      title = `${title} (Phần ${season} Hướng dẫn nâng cao)`;
    } else if (lang === "zh-Hans") {
      title = `${title}（第${season}季进阶指南）`;
    } else if (lang === "ja") {
      title = `${title}（シーズン${season} 応用ガイド）`;
    } else {
      title = `${title} (Season ${season} Advanced Guide)`;
    }
  }

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
