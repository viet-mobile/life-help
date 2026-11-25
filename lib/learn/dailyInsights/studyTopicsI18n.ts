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
    ko: "재산 증식",
    en: "Wealth Building",
    vi: "Gia tăng tài sản",
    th: "สร้างความมั่งคั่ง",
    my: "ဓနဥစ္စာ တိုးပွားစေခြင်း",
    km: "ការកសាងទ្រព្យសម្បត្តិ",
    ar: "بناء الثروة",
    "zh-Hans": "财富积累",
    "zh-Hant": "財富積累",
    ja: "資産形成",
    es: "Creación de riqueza",
    fr: "Création de richesse",
    de: "Vermögensaufbau",
    ru: "Создание богатства",
  },
  saving: {
    ko: "비용 절약",
    en: "Smart Saving",
    vi: "Tiết kiệm thông minh",
    th: "ประหยัดอย่างชาญฉลาด",
    my: "စမတ်ကျကျ ငွေစုခြင်း",
    km: "ការសន្សំយ៉ាងឆ្លាតវៃ",
    ar: "التوفير الذكي",
    "zh-Hans": "精明节支",
    "zh-Hant": "精明節約",
    ja: "節約・節税",
    es: "Ahorro inteligente",
    fr: "Épargne intelligente",
    de: "Smartes Sparen",
    ru: "Разумная экономия",
  },
  career: {
    ko: "경력 및 구직",
    en: "Career & Jobs",
    vi: "Phát triển nghề nghiệp",
    th: "การทำงานและอาชีพ",
    my: "အလုပ်အကိုင်နှင့် အသက်မွေးဝမ်းကျောင်း",
    km: "ការងារ និងអាជីព",
    ar: "المسار الوظيفي والعمل",
    "zh-Hans": "职场求职",
    "zh-Hant": "職場求職",
    ja: "就職・キャリア",
    es: "Carrera y empleo",
    fr: "Carrière et emploi",
    de: "Karriere & Beruf",
    ru: "Карьера и работа",
  },
  health: {
    ko: "건강 및 웰니스",
    en: "Health & Wellness",
    vi: "Sức khỏe và an sinh",
    th: "สุขภาพและความเป็นอยู่ที่ดี",
    my: "ကျန်းမာရေးနှင့် ညီညွတ်မှု",
    km: "សុខភាព និងសុខុមាលភាព",
    ar: "الصحة والعافية",
    "zh-Hans": "健康生活",
    "zh-Hant": "健康生活",
    ja: "健康・医療",
    es: "Salud y bienestar",
    fr: "Santé et bien-être",
    de: "Gesundheit & Wellness",
    ru: "Здоровье и благополучие",
  },
  travel: {
    ko: "여행 및 이동",
    en: "Transit & Travel",
    vi: "Giao thông & Đi lại",
    th: "การเดินทางและการท่องเที่ยว",
    my: "ခရီးသွားလာရေးနှင့် သယ်ယူပို့ဆောင်ရေး",
    km: "ការធ្វើដំណើរ និងការដឹកជញ្ជូន",
    ar: "السفر والتنقل",
    "zh-Hans": "交通出行",
    "zh-Hant": "交通出行",
    ja: "交通・暮らし",
    es: "Tránsito y viajes",
    fr: "Transport et voyage",
    de: "Reisen & Mobilität",
    ru: "Транспорт и путешествия",
  },
  problem: {
    ko: "생활 문제 해결",
    en: "Everyday Solutions",
    vi: "Giải quyết sự vụ",
    th: "การแก้ปัญหาในชีวิตประจำวัน",
    my: "နေ့စဉ်ပြဿနာ ဖြေရှင်းနည်းများ",
    km: "ដំណោះស្រាយប្រចាំថ្ងៃ",
    ar: "حلول المشكلات اليومية",
    "zh-Hans": "生活维权",
    "zh-Hant": "生活維權",
    ja: "生活トラブル",
    es: "Soluciones cotidianas",
    fr: "Solutions du quotidien",
    de: "Alltagslösungen",
    ru: "Решение бытовых проблем",
  },
  shopping: {
    ko: "쇼핑·소비",
    en: "Smart Shopping",
    vi: "Mua sắm thông minh",
    th: "การช้อปปิ้งอย่างชาญฉลาด",
    my: "စမတ်ကျကျ ဈေးဝယ်ခြင်း",
    km: "ការទិញទំនិញយ៉ាងឆ្លាតវៃ",
    ar: "التسوق الذكي",
    "zh-Hans": "精明消费",
    "zh-Hant": "精明消費",
    ja: "賢い買い物",
    es: "Compras inteligentes",
    fr: "Achats malins",
    de: "Smartes Einkaufen",
    ru: "Умные покупки",
  },
  energy: {
    ko: "에너지 절약",
    en: "Energy Saving",
    vi: "Tiết kiệm năng lượng",
    th: "การประหยัดพลังงาน",
    my: "စွမ်းအင် ချွေတာရေး",
    km: "ការសន្សំសំចៃថាមពល",
    ar: "توفير الطاقة",
    "zh-Hans": "节能环保",
    "zh-Hant": "節能環保",
    ja: "省エネ・節電",
    es: "Ahorro de energía",
    fr: "Économie d'énergie",
    de: "Energiesparen",
    ru: "Энергосбережение",
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
  let prefix = "";
  let num = 0;
  const dm = item.id.match(/^\d{8}-([a-z]+)-g(\d+)-(\d+)$/);
  if (dm) {
    prefix = dm[1].charAt(0);
    num = parseInt(dm[2], 10);
  } else {
    const parts = item.id.split("-");
    if (parts.length !== 2) return null;
    prefix = parts[0];
    num = parseInt(parts[1], 10);
    if (isNaN(num)) return null;
  }

  const exactKey = item.id;
  // Normalize language key with full 89-language support
  const isHant = locale === "zh-Hant" || locale === "zt" || locale === "zh-HK" || locale === "zh-TW";
  const normLocale = locale === "zs" || locale === "zh" || locale === "zh-CN" ? "zh-Hans" : (isHant ? "zh-Hant" : locale);

  const exactEntry = STUDY_TOPIC_DATA[exactKey];
  let entry: StudyTopicEntry | undefined = exactEntry;

  if (!entry) {
    const baseIndex = ((num - 1) % 36) + 1;
    const baseKey = `${prefix}-${String(baseIndex).padStart(3, "0")}`;
    entry = STUDY_TOPIC_DATA[baseKey];
  }

  if (!entry) return null;

  const lang = entry.title?.[normLocale] ? normLocale : (isHant && entry.title?.["zh-Hans"] ? "zh-Hans" : (entry.title?.en ? "en" : "ko"));

  const pickField = (
    fieldMap: Record<string, string> | undefined,
    itemDefault: string | undefined
  ): string => {
    const koVal = fieldMap?.ko || itemDefault || "";
    const targetVal = fieldMap?.[lang];
    if (targetVal && (lang === "ko" || targetVal !== koVal)) {
      return targetVal;
    }
    const enVal = fieldMap?.en;
    if (enVal && enVal !== koVal) {
      return enVal;
    }
    return targetVal || enVal || itemDefault || "";
  };

  const title = pickField(entry.title, item.title);
  const summary = pickField(entry.summary, item.summary);
  const principle = pickField(entry.principle, item.principle);
  const example = pickField(entry.example, item.example);
  const actionItem = pickField(entry.actionItem, item.actionItem);

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
