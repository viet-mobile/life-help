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
 * Get the daily insight for a specific domain ("math" | "english" | "korean" | "life" | "physics" | "chemistry")
 * with optional locale translation.
 * Accepts either a Date (for deterministic calendar lookup) or a numeric index (for random/custom selection).
 */
export function getDailyInsight(
  domain: DomainType | string,
  dateOrIndex: Date | number | string = new Date(),
  locale?: string,
  country?: string
): DailyInsight {
  const items = INSIGHT_MAP[domain] || INSIGHT_MAP.life;
  let selectedIndex = 0;

  if (domain === "life" && country && country !== "default") {
    const low = country.toLowerCase();
    const cIdx = items.findIndex(
      (it: any) =>
        it.country?.toLowerCase() === low ||
        it.id === `country-${low}` ||
        it.iso2?.toLowerCase() === low
    );
    if (cIdx >= 0) {
      selectedIndex = cIdx;
    } else if (typeof dateOrIndex === "string") {
      const idx = items.findIndex((it) => it.id === dateOrIndex);
      selectedIndex = idx >= 0 ? idx : 0;
    } else if (typeof dateOrIndex === "number") {
      selectedIndex = Math.abs(Math.floor(dateOrIndex)) % items.length;
    } else {
      selectedIndex = getDailyIndex(dateOrIndex) % items.length;
    }
  } else if (typeof dateOrIndex === "string") {
    const idx = items.findIndex((it) => it.id === dateOrIndex);
    selectedIndex = idx >= 0 ? idx : 0;
  } else if (typeof dateOrIndex === "number") {
    selectedIndex = Math.abs(Math.floor(dateOrIndex)) % items.length;
  } else {
    selectedIndex = getDailyIndex(dateOrIndex) % items.length;
  }
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

    // 1-0. Resolve country-specific living guide across all 88 languages
    if (item.id.startsWith("country-") || (item as any).country) {
      const cItem = item as any;
      const cName = cItem.country ? (cItem.country.charAt(0).toUpperCase() + cItem.country.slice(1)) : (cItem.iso2 || "Country");
      const iso = cItem.iso2 || "";
      const portal = cItem.example?.replace("공식 포털:", "").trim() || "";

      if (locale === "ne") {
        item.title = `[${iso}] ${cName} विदेशी नागरिक बसोबास दर्ता तथा अत्यावश्यक जीवन प्रशासनिक निर्देशिका`;
        item.summary = `${cName} प्रवेश गरेपछि बसोबास दर्ता, सार्वजनिक स्वास्थ्य बीमा, कर नम्बर जारी र आधिकारिक अध्यागमन पोर्टल दर्ता सम्बन्धी जानकारी।`;
        item.principle = "राष्ट्रिय आधिकारिक अध्यागमन पोर्टल मार्फत नवीनतम बसोबास अनुमति नियम र आवश्यक कागजातहरू प्रमाणीकरण गर्नुहोस्।";
        item.example = portal ? `आधिकारिक पोर्टल: ${portal}` : item.example;
        item.actionItem = `प्रवेश गरेलगत्तै ${cName} सम्बन्धित स्थानीय निकायमा आफ्नो बसोबास दर्ता गराउनुहोस् र आधिकारिक प्रमाणपत्र लिनुहोस्।`;
      } else if (locale === "vi") {
        item.title = `[${iso}] Hướng dẫn đăng ký cư trú và thủ tục hành chính thiết yếu tại ${cName}`;
        item.summary = `Hướng dẫn đăng ký cư trú, bảo hiểm y tế công cộng, cấp mã số thuế và cổng thông tin nhập cư chính thức sau khi đến ${cName}.`;
        item.principle = "Kiểm tra quy định cấp phép cư trú mới nhất và các giấy tờ cần thiết qua cổng thông tin xuất nhập cảnh chính thức.";
        item.example = portal ? `Cổng thông tin chính thức: ${portal}` : item.example;
        item.actionItem = `Đăng ký nơi cư trú tại cơ quan có thẩm quyền tại ${cName} ngay sau khi nhập cảnh và nhận giấy chứng nhận chính thức.`;
      } else if (locale === "zh-Hans" || locale === "zs") {
        item.title = `[${iso}] ${cName} 外籍人士居留登记及必备生活行政指南`;
        item.summary = `入境 ${cName} 后的居住登记、公共医疗保险、税号申请及官方移民门户注册指南。`;
        item.principle = "通过国家官方移民局门户网站查询最新居留许可规定及必备申请材料。";
        item.example = portal ? `官方门户: ${portal}` : item.example;
        item.actionItem = `入境后请立即前往 ${cName} 辖区主管机关申报居住地并领取官方居留凭证。`;
      } else if (locale === "zh-Hant" || locale === "zt") {
        item.title = `[${iso}] ${cName} 外籍人士居留登記及必備生活行政指南`;
        item.summary = `入境 ${cName} 後的居住登記、公共醫療保險、稅號申請及官方移民門戶註冊指南。`;
        item.principle = "透過國家官方移民局門戶網站查詢最新居留許可規定及必備申請資料。";
        item.example = portal ? `官方門戶: ${portal}` : item.example;
        item.actionItem = `入境後請立即前往 ${cName} 轄區主管機關申報居住地並領取官方居留憑證。`;
      } else if (locale === "ja") {
        item.title = `[${iso}] ${cName} 外国人滞在登録および必須生活行政ガイド`;
        item.summary = `${cName} 入国後の居住登録、公的医療保険、納税番号の発行および公式移民ポータルの利用案内。`;
        item.principle = "国の公式移民局ポータルを通じて最新の滞在許可規則および必要書類をご確認ください。";
        item.example = portal ? `公式ポータル: ${portal}` : item.example;
        item.actionItem = `入国後速やかに ${cName} 管轄自治体に居住地を届け出、公式証明書を取得してください。`;
      } else if (locale === "es") {
        item.title = `[${iso}] ${cName} Guía de registro de residencia y trámites administrativos esenciales`;
        item.summary = `Guía sobre registro de residencia, seguro médico público, obtención de número de identificación fiscal y portal oficial de inmigración tras ingresar a ${cName}.`;
        item.principle = "Verifique las normativas de residencia más recientes y los documentos obligatorios a través del portal oficial de inmigración nacional.";
        item.example = portal ? `Portal oficial: ${portal}` : item.example;
        item.actionItem = `Regístrese inmediatamente en la oficina municipal correspondiente en ${cName} tras su llegada y obtenga su certificado oficial.`;
      } else if (locale === "fr") {
        item.title = `[${iso}] ${cName} Guide d'enregistrement de séjour et démarches administratives essentielles`;
        item.summary = `Informations sur l'enregistrement de résidence, la sécurité sociale, le numéro fiscal et le portail officiel de l'immigration après votre arrivée en ${cName}.`;
        item.principle = "Vérifiez les réglementations de séjour et les documents requis via le portail officiel de l'immigration nationale.";
        item.example = portal ? `Portail officiel : ${portal}` : item.example;
        item.actionItem = `Déclarez sans délai votre domicile auprès de l'autorité compétente en ${cName} à votre arrivée et obtenez votre attestation officielle.`;
      } else if (locale === "de") {
        item.title = `[${iso}] ${cName} Wohnsitzanmeldung und wichtiger Leitfaden für Behördengänge`;
        item.summary = `Informationen zu Wohnsitzanmeldung, Krankenversicherung, Steuernummer und amtlichem Einwanderungsportal nach der Ankunft in ${cName}.`;
        item.principle = "Prüfen Sie aktuelle Aufenthaltsbestimmungen und erforderliche Unterlagen über das offizielle Einwanderungsportal.";
        item.example = portal ? `Offizielles Portal: ${portal}` : item.example;
        item.actionItem = `Melden Sie Ihren Wohnsitz nach der Einreise umgehend bei der zuständigen Behörde in ${cName} an und beantragen Sie die amtliche Bestätigung.`;
      } else if (locale === "ru") {
        item.title = `[${iso}] ${cName} Регистрация проживания и справочник по административным процедурам`;
        item.summary = `Справочник по регистрации по месту жительства, медицинскому страхованию, получению ИНН и официальному миграционному порталу после въезда в ${cName}.`;
        item.principle = "Уточняйте актуальные правила пребывания и список необходимых документов на официальном портале миграционной службы.";
        item.example = portal ? `Официальный портал: ${portal}` : item.example;
        item.actionItem = `Сразу после въезда зарегистрируйтесь по месту жительства в уполномоченном органе ${cName} и получите официальное свидетельство.`;
      } else if (locale === "ar") {
        item.title = `[${iso}] دليل تسجيل الإقامة والمعاملات الإدارية الأساسية في ${cName}`;
        item.summary = `إرشادات حول تسجيل الإقامة، والتأمين الصحي العام، والرقم الضريبي، والبوابة الرسمية للهجرة عند الوصول إلى ${cName}.`;
        item.principle = "تحقق من أحدث لوائح الإقامة والمستندات المطلوبة عبر البوابة الرسمية للهجرة في الدولة.";
        item.example = portal ? `البوابة الرسمية: ${portal}` : item.example;
        item.actionItem = `سارع بتسجيل محل إقامتك لدى الجهة المختصة في ${cName} فور دخولك واحصل على الشهادة الرسمية.`;
      } else if (locale === "hi") {
        item.title = `[${iso}] ${cName} विदेशी नागरिक निवास पंजीकरण और आवश्यक प्रशासनिक मार्गदर्शिका`;
        item.summary = `${cName} में आगमन के बाद निवास पंजीकरण, सार्वजनिक स्वास्थ्य बीमा, टैक्स नंबर और आधिकारिक आव्रजन पोर्टल से संबंधित आवश्यक जानकारी।`;
        item.principle = "राष्ट्रीय आधिकारिक आव्रजन पोर्टल के माध्यम से नवीनतम निवास नियमों और आवश्यक दस्तावेजों की पुष्टि करें।";
        item.example = portal ? `आधिकारिक पोर्टल: ${portal}` : item.example;
        item.actionItem = `प्रवेश के तुरंत बाद ${cName} में संबंधित स्थानीय कार्यालय में अपना निवास पंजीकृत करें और आधिकारिक प्रमाण पत्र प्राप्त करें।`;
      } else {
        item.title = `[${iso}] ${cName} Foreign Resident Registration & Essential Living Guide`;
        item.summary = `Essential guidance on residence registration, public healthcare, tax ID issuance, and official immigration procedures upon arriving in ${cName}.`;
        item.principle = "Always verify the latest stay permit regulations and mandatory documentation via the official national immigration portal.";
        item.example = portal ? `Official Portal: ${portal}` : item.example;
        item.actionItem = `Promptly register your residence at the local municipal office in ${cName} upon entry and obtain your official certificate.`;
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

  // Remove redundant season and guide suffixes (e.g. (시즌 10 심화 가이드), (Season 10 Advanced Guide), (Practical Math Guide), etc.)
  item.title = item.title
    .replace(/\s*\([시즌SeasonPhần第]+[\s\d\w가-힣（）·-]*가이드[\s\)]*/gi, "")
    .replace(/\s*\(시즌\s*\d+\s*심화\s*가이드\)/gi, "")
    .replace(/\s*\([A-Za-z\s]+Guide\)/gi, "")
    .replace(/\s*\(Season\s*\d+[^)]*\)/gi, "")
    .trim();
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
