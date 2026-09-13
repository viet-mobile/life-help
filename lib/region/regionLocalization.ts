/**
 * Multilingual Korean Region Localization Engine (Clean & Streamlined)
 * 
 * Rules:
 * 1. Korean (`ko`): Only Korean name displayed (`전북특별자치도`, `익산시`, `신동`), sorted in Korean dictionary order (가나다순).
 * 2. Latin-script languages (Vietnamese `vi`, French `fr`, German `de`, Spanish `es`, Italian `it`, Dutch `nl`, Polish `pl`,
 *    Swedish `sv`, Danish `da`, Norwegian `no`, Turkish `tr`, Tetun `tet`, Uzbek `uz`, Indonesian `id`):
 *    - Already use Latin alphabet, so English is OMITTED to avoid redundancy!
 *    - Format: `[Native] · [Korean]` (e.g. `Jeonbuk · 전북특별자치도`, `Iksan · 익산시`, `Sin-dong · 신동`).
 * 3. English (`en`):
 *    - English is the native language: `[English] · [Korean]`.
 * 4. Non-Latin script languages (Chinese, Japanese, Russian, Ukrainian, Kazakh, Mongolian, Thai, Burmese, Khmer, Hindi, Nepali, Bengali, Tamil, Sinhala, Arabic, Persian, Hebrew, Amharic):
 *    - Keep `[Native] · [English] · [Korean]` for global clarity.
 * 5. Repetitive words like "Province", "Tỉnh", "State", "Thành phố", "Quận" are stripped from individual buttons
 *    and defined cleanly in the column category headers on top!
 */

import { type RegionItem, koreanRegions, findSido, findGungu, getCountryRegions } from "./regions";
import { type CountryCode, getCountryInfo } from "./countries";
import { COMPLETE_DONG_HANJA } from "./dongHanjaData";
import {
  type RegionUITexts,
  type RegionCategoryHeaders,
  REGION_UI_TRANSLATIONS,
  getRegionUIText,
  getRegionCategoryHeaders,
} from "./regionUITexts";

export {
  type RegionUITexts,
  type RegionCategoryHeaders,
  REGION_UI_TRANSLATIONS,
  getRegionUIText,
  getRegionCategoryHeaders,
};

export interface LocalizedRegionOption {
  key: string;
  ko: string;
  en: string;
  native: string;
  display: string;
  sortKey: string;
}

export const LATIN_SCRIPT_LOCALES = new Set([
  "en",
  "vi",
  "fr",
  "de",
  "es",
  "it",
  "nl",
  "pl",
  "sv",
  "da",
  "no",
  "tr",
  "tet",
  "uz",
  "id",
  "pt",
]);

// 1. Clean, Consistent Root Localization Data for all 17 Administrative Divisions (시·도)
// No repetitive "Province", "Tỉnh", "State" in individual names.
export const SIDO_DATA: Record<
  string,
  {
    en: string;
    locales: Record<string, string>;
  }
> = {
  "전북특별자치도": {
    en: "Jeonbuk",
    locales: {
      ko: "전북특별자치도",
      en: "Jeonbuk",
      vi: "Jeonbuk",
      "zh-Hans": "全北",
      "zh-Hant": "全北",
      ja: "全北",
      ru: "Чонбук",
      uk: "Чонбук",
      kk: "Чонбук",
      mn: "Чонбүг",
      uz: "Chonbuk",
      th: "ช็อนบุก",
      my: "ဂျွန်းဘွတ်",
      km: "ជន់ប៊ុក",
      hi: "जेओनबुक",
      ne: "जेओनबुक",
      bn: "জেওনবুক",
      ta: "ஜியோன்புக்",
      si: "ජොන්බුක්",
      ar: "جونبوك",
      arz: "جونبوك",
      fa: "جئونبوک",
      he: "ג'ונבוק",
      am: "ጆንቡክ",
      fr: "Jeonbuk",
      de: "Jeonbuk",
      es: "Jeonbuk",
      it: "Jeonbuk",
      nl: "Jeonbuk",
      pl: "Jeonbuk",
      sv: "Jeonbuk",
      da: "Jeonbuk",
      no: "Jeonbuk",
      tr: "Jeonbuk",
      tet: "Jeonbuk",
      id: "Jeonbuk",
    },
  },
  "서울특별시": {
    en: "Seoul",
    locales: {
      ko: "서울특별시",
      en: "Seoul",
      vi: "Seoul",
      "zh-Hans": "首尔",
      "zh-Hant": "首爾",
      ja: "ソウル",
      ru: "Сеул",
      uk: "Сеул",
      kk: "Сеул",
      mn: "Сөүл",
      uz: "Seul",
      th: "โซล",
      my: "ဆိုးလ်",
      km: "សេអ៊ូល",
      hi: "सियोल",
      ne: "सियोल",
      bn: "সিউল",
      ta: "சியோல்",
      si: "සෝල්",
      ar: "سيول",
      arz: "سيول",
      fa: "سئول",
      he: "סיאול",
      am: "ሴኡል",
      fr: "Séoul",
      de: "Seoul",
      es: "Seúl",
      it: "Seul",
      nl: "Seoel",
      pl: "Seul",
      sv: "Seoul",
      da: "Seoul",
      no: "Seoul",
      tr: "Seul",
      tet: "Seul",
      id: "Seoul",
    },
  },
  "경기도": {
    en: "Gyeonggi",
    locales: {
      ko: "경기도",
      en: "Gyeonggi",
      vi: "Gyeonggi",
      "zh-Hans": "京畿",
      "zh-Hant": "京畿",
      ja: "京畿",
      ru: "Кёнги",
      uk: "Кьонгі",
      kk: "Кёнги",
      mn: "Кёнги",
      uz: "Kyongi",
      th: "คย็องกี",
      my: "ဂယောင်းဂီ",
      km: "គ្យ៉ង់ហ្គី",
      hi: "ग्योन्गी",
      ne: "ग्योन्गी",
      bn: "গিওঙ্গি",
      ta: "கியோங்கி",
      si: "ග්යොංගි",
      ar: "غيونغي",
      arz: "غيونغى",
      fa: "گیونگی",
      he: "קיונגי",
      am: "ጊዮንጊ",
      fr: "Gyeonggi",
      de: "Gyeonggi",
      es: "Gyeonggi",
      it: "Gyeonggi",
      nl: "Gyeonggi",
      pl: "Gyeonggi",
      sv: "Gyeonggi",
      da: "Gyeonggi",
      no: "Gyeonggi",
      tr: "Gyeonggi",
      tet: "Gyeonggi",
      id: "Gyeonggi",
    },
  },
  "인천광역시": {
    en: "Incheon",
    locales: {
      ko: "인천광역시",
      en: "Incheon",
      vi: "Incheon",
      "zh-Hans": "仁川",
      "zh-Hant": "仁川",
      ja: "仁川",
      ru: "Инчхон",
      uk: "Інчхон",
      kk: "Инчхон",
      mn: "Инчон",
      uz: "Inchxon",
      th: "อินชอน",
      my: "အင်ချွန်း",
      km: "អ៊ីនឆុន",
      hi: "इंचियोन",
      ne: "इन्चोन",
      bn: "ইনছন",
      ta: "இஞ்சியோன்",
      si: "ඉන්චොන්",
      ar: "إنتشون",
      arz: "إنتشون",
      fa: "اینچئون",
      he: "אינצ'ון",
      am: "ኢንቼዎን",
      fr: "Incheon",
      de: "Incheon",
      es: "Incheon",
      it: "Incheon",
      nl: "Incheon",
      pl: "Inczon",
      sv: "Incheon",
      da: "Incheon",
      no: "Incheon",
      tr: "İncheon",
      tet: "Incheon",
      id: "Incheon",
    },
  },
  "부산광역시": {
    en: "Busan",
    locales: {
      ko: "부산광역시",
      en: "Busan",
      vi: "Busan",
      "zh-Hans": "釜山",
      "zh-Hant": "釜山",
      ja: "釜山",
      ru: "Пусан",
      uk: "Пусан",
      kk: "Пусан",
      mn: "Пусан",
      uz: "Pusan",
      th: "ปูซาน",
      my: "ဘူဆန်",
      km: "ពូសាន",
      hi: "बुसान",
      ne: "बुसान",
      bn: "বুসান",
      ta: "புசான்",
      si: "බුසාන්",
      ar: "بوسان",
      arz: "بوسان",
      fa: "بوسان",
      he: "פוסאן",
      am: "ቡሳን",
      fr: "Busan",
      de: "Busan",
      es: "Busan",
      it: "Busan",
      nl: "Busan",
      pl: "Pusan",
      sv: "Busan",
      da: "Busan",
      no: "Busan",
      tr: "Busan",
      tet: "Busan",
      id: "Busan",
    },
  },
  "대구광역시": {
    en: "Daegu",
    locales: {
      ko: "대구광역시",
      en: "Daegu",
      vi: "Daegu",
      "zh-Hans": "大邱",
      "zh-Hant": "大邱",
      ja: "大邱",
      ru: "Тэгу",
      uk: "Тегу",
      kk: "Тэгу",
      mn: "Тэгү",
      uz: "Tegu",
      th: "แทกู",
      my: "ဒေဂူး",
      km: "ដេហ្គូ",
      hi: "डेगू",
      ne: "डेगु",
      bn: "দেগু",
      ta: "டேகு",
      si: "ඩේගු",
      ar: "دايغو",
      arz: "دايجو",
      fa: "دئگو",
      he: "דאיגו",
      am: "ዴጉ",
      fr: "Daegu",
      de: "Daegu",
      es: "Daegu",
      it: "Daegu",
      nl: "Daegu",
      pl: "Daegu",
      sv: "Daegu",
      da: "Daegu",
      no: "Daegu",
      tr: "Daegu",
      tet: "Daegu",
      id: "Daegu",
    },
  },
  "광주광역시": {
    en: "Gwangju",
    locales: {
      ko: "광주광역시",
      en: "Gwangju",
      vi: "Gwangju",
      "zh-Hans": "光州",
      "zh-Hant": "光州",
      ja: "光州",
      ru: "Кванджу",
      uk: "Кванджу",
      kk: "Кванджу",
      mn: "Кванжү",
      uz: "Kvanju",
      th: "ควังจู",
      my: "ဂွမ်ဂျူး",
      km: "ក្វាងជូ",
      hi: "ग्वांगजू",
      ne: "ग्वाङ्जु",
      bn: "গোয়াংজু",
      ta: "குவாங்ஜு",
      si: "ග්වංජු",
      ar: "غوانغجو",
      arz: "غوانغجو",
      fa: "گوانگجو",
      he: "גוואנגג'ו",
      am: "ጓንግጁ",
      fr: "Gwangju",
      de: "Gwangju",
      es: "Gwangju",
      it: "Gwangju",
      nl: "Gwangju",
      pl: "Gwangju",
      sv: "Gwangju",
      da: "Gwangju",
      no: "Gwangju",
      tr: "Gwangju",
      tet: "Gwangju",
      id: "Gwangju",
    },
  },
  "대전광역시": {
    en: "Daejeon",
    locales: {
      ko: "대전광역시",
      en: "Daejeon",
      vi: "Daejeon",
      "zh-Hans": "大田",
      "zh-Hant": "大田",
      ja: "大田",
      ru: "Тэджон",
      uk: "Теджон",
      kk: "Тэджон",
      mn: "Тэжон",
      uz: "Tedjon",
      th: "แทจอน",
      my: "ဒေဂျွန်း",
      km: "ដែជុន",
      hi: "डेजॉन",
      ne: "डेजोन",
      bn: "দেজন",
      ta: "டேஜியான்",
      si: "ඩේජොන්",
      ar: "دايجون",
      arz: "دايجون",
      fa: "دائجون",
      he: "דאג'ון",
      am: "ዴጆን",
      fr: "Daejeon",
      de: "Daejeon",
      es: "Daejeon",
      it: "Daejeon",
      nl: "Daejeon",
      pl: "Daejeon",
      sv: "Daejeon",
      da: "Daejeon",
      no: "Daejeon",
      tr: "Daejeon",
      tet: "Daejeon",
      id: "Daejeon",
    },
  },
  "울산광역시": {
    en: "Ulsan",
    locales: {
      ko: "울산광역시",
      en: "Ulsan",
      vi: "Ulsan",
      "zh-Hans": "蔚山",
      "zh-Hant": "蔚山",
      ja: "蔚山",
      ru: "Ульсан",
      uk: "Ульсан",
      kk: "Ульсан",
      mn: "Ульсан",
      uz: "Ulsan",
      th: "อุลซัน",
      my: "အူလ်ဆန်",
      km: "អ៊ុលសាន",
      hi: "उल्सान",
      ne: "उल्सान",
      bn: "উলসান",
      ta: "உல்சான்",
      si: "උල්සාන්",
      ar: "أولسان",
      arz: "أولسان",
      fa: "اولسان",
      he: "אולסן",
      am: "ኡልሳን",
      fr: "Ulsan",
      de: "Ulsan",
      es: "Ulsan",
      it: "Ulsan",
      nl: "Ulsan",
      pl: "Ulsan",
      sv: "Ulsan",
      da: "Ulsan",
      no: "Ulsan",
      tr: "Ulsan",
      tet: "Ulsan",
      id: "Ulsan",
    },
  },
  "세종특별자치시": {
    en: "Sejong",
    locales: {
      ko: "세종특별자치시",
      en: "Sejong",
      vi: "Sejong",
      "zh-Hans": "世宗",
      "zh-Hant": "世宗",
      ja: "世宗",
      ru: "Седжон",
      uk: "Седжон",
      kk: "Седжон",
      mn: "Сэжон",
      uz: "Sejon",
      th: "เซจง",
      my: "ဆဲဂျုံး",
      km: "សេជុង",
      hi: "सेजोंग",
      ne: "सेजोङ",
      bn: "সেজং",
      ta: "செஜோங்",
      si: "සේජොන්ග්",
      ar: "سيجونغ",
      arz: "سيجونغ",
      fa: "سجونگ",
      he: "סג'ונג",
      am: "ሴጆንግ",
      fr: "Sejong",
      de: "Sejong",
      es: "Sejong",
      it: "Sejong",
      nl: "Sejong",
      pl: "Sejong",
      sv: "Sejong",
      da: "Sejong",
      no: "Sejong",
      tr: "Sejong",
      tet: "Sejong",
      id: "Sejong",
    },
  },
  "충청남도": {
    en: "Chungnam",
    locales: {
      ko: "충청남도",
      en: "Chungnam",
      vi: "Chungnam",
      "zh-Hans": "忠南",
      "zh-Hant": "忠南",
      ja: "忠南",
      ru: "Чхуннам",
      uk: "Чхуннам",
      kk: "Чхуннам",
      mn: "Өмнөд Чүнчон",
      uz: "Janubiy Chungchong",
      th: "ชุงนัม",
      my: "ချောင်ချောင်းနမ်",
      km: "ឈូងឆុងខាងត្បូង",
      hi: "दक्षिण चुंगचिओंग",
      ne: "दक्षिण चुङचोङ",
      bn: "দক্ষিণ চুংচং",
      ta: "தெற்கு சுங்சியோங்",
      si: "දකුණු චුන්චොන්ග්",
      ar: "تشنغتشونغ الجنوبية",
      arz: "تشنغتشونغ الجنوبية",
      fa: "چونگچئونگ جنوبی",
      he: "צ'ונגצ'ונג הדרומית",
      am: "ደቡብ ቹንቼኦንግ",
      fr: "Chungnam",
      de: "Chungnam",
      es: "Chungnam",
      it: "Chungnam",
      nl: "Chungnam",
      pl: "Chungnam",
      sv: "Chungnam",
      da: "Chungnam",
      no: "Chungnam",
      tr: "Chungnam",
      tet: "Chungnam",
      id: "Chungnam",
    },
  },
  "충청북도": {
    en: "Chungbuk",
    locales: {
      ko: "충청북도",
      en: "Chungbuk",
      vi: "Chungbuk",
      "zh-Hans": "忠北",
      "zh-Hant": "忠北",
      ja: "忠北",
      ru: "Чхунбук",
      uk: "Чхунбук",
      kk: "Чхунбук",
      mn: "Умард Чүнчон",
      uz: "Shimoliy Chungchong",
      th: "ชุงบุก",
      my: "ချောင်ချောင်းဘွတ်",
      km: "ឈូងឆុងខាងជើង",
      hi: "उत्तर चुंगचिओंग",
      ne: "उत्तर चुङचोङ",
      bn: "উত্তর চুংচং",
      ta: "வடக்கு சுங்சியோங்",
      si: "උතුරු චුන්චොන්ග්",
      ar: "تشنغتشونغ الشمالية",
      arz: "تشنغتشونغ الشمالية",
      fa: "چونگچئونگ شمالی",
      he: "צ'ונגצ'ונג הצפונית",
      am: "ሰሜን ቹንቼኦንግ",
      fr: "Chungbuk",
      de: "Chungbuk",
      es: "Chungbuk",
      it: "Chungbuk",
      nl: "Chungbuk",
      pl: "Chungbuk",
      sv: "Chungbuk",
      da: "Chungbuk",
      no: "Chungbuk",
      tr: "Chungbuk",
      tet: "Chungbuk",
      id: "Chungbuk",
    },
  },
  "전라남도": {
    en: "Jeonnam",
    locales: {
      ko: "전라남도",
      en: "Jeonnam",
      vi: "Jeonnam",
      "zh-Hans": "全南",
      "zh-Hant": "全南",
      ja: "全南",
      ru: "Чоннам",
      uk: "Чоннам",
      kk: "Чоннам",
      mn: "Өмнөд Чолла",
      uz: "Janubiy Cholla",
      th: "ช็อลนัม",
      my: "ဂျွန်းနမ်",
      km: "ចូឡាខាងត្បូង",
      hi: "दक्षिण जेओला",
      ne: "दक्षिण जेओला",
      bn: "দক্ষিণ জোল্লা",
      ta: "தெற்கு ஜியோல்லா",
      si: "දකුණු ජොල්ලා",
      ar: "جولا الجنوبية",
      arz: "جولا الجنوبية",
      fa: "جئولا جنوبی",
      he: "ג'ולה הדרומית",
      am: "ደቡብ ጆላ",
      fr: "Jeonnam",
      de: "Jeonnam",
      es: "Jeonnam",
      it: "Jeonnam",
      nl: "Jeonnam",
      pl: "Jeonnam",
      sv: "Jeonnam",
      da: "Jeonnam",
      no: "Jeonnam",
      tr: "Jeonnam",
      tet: "Jeonnam",
      id: "Jeonnam",
    },
  },
  "경상북도": {
    en: "Gyeongbuk",
    locales: {
      ko: "경상북도",
      en: "Gyeongbuk",
      vi: "Gyeongbuk",
      "zh-Hans": "庆北",
      "zh-Hant": "慶北",
      ja: "慶北",
      ru: "Кёнбук",
      uk: "Кьонбук",
      kk: "Кёнбук",
      mn: "Умард Кёнсан",
      uz: "Shimoliy Kyonsang",
      th: "คย็องบุก",
      my: "ဂယောင်းဆန်ဘွတ်",
      km: "ឃ្យុងសាងខាងជើង",
      hi: "उत्तर ग्योन्गसांग",
      ne: "उत्तर ग्योङसाङ",
      bn: "উত্তর গিয়ংসাং",
      ta: "வடக்கு கியோங்சாங்",
      si: "උතුරු ග්යොංසැන්ග්",
      ar: "غيونغسانغ الشمالية",
      arz: "غيونغسانغ الشمالية",
      fa: "گیونگسانگ شمالی",
      he: "קיונגסאנג הצפונית",
      am: "ሰሜን ጊዮንግሳንግ",
      fr: "Gyeongbuk",
      de: "Gyeongbuk",
      es: "Gyeongbuk",
      it: "Gyeongbuk",
      nl: "Gyeongbuk",
      pl: "Gyeongbuk",
      sv: "Gyeongbuk",
      da: "Gyeongbuk",
      no: "Gyeongbuk",
      tr: "Gyeongbuk",
      tet: "Gyeongbuk",
      id: "Gyeongbuk",
    },
  },
  "경상남도": {
    en: "Gyeongnam",
    locales: {
      ko: "경상남도",
      en: "Gyeongnam",
      vi: "Gyeongnam",
      "zh-Hans": "庆南",
      "zh-Hant": "慶南",
      ja: "慶南",
      ru: "Кённам",
      uk: "Кьоннам",
      kk: "Кённам",
      mn: "Өмнөд Кёнсан",
      uz: "Janubiy Kyonsang",
      th: "คย็องนัม",
      my: "ဂယောင်းဆန်နမ်",
      km: "ឃ្យុងសាងខាងត្បូង",
      hi: "दक्षिण ग्योन्गसांग",
      ne: "दक्षिण ग्योङसाङ",
      bn: "দক্ষিণ গিয়ংসাং",
      ta: "தெற்கு கியோங்சாங்",
      si: "දකුණු ග්යොංසැන්ග්",
      ar: "غيونغسانغ الجنوبية",
      arz: "غيونغسانغ الجنوبية",
      fa: "گیونگسانگ جنوبی",
      he: "קיונגסאנג הדרומית",
      am: "ደቡብ ጊዮንግሳንግ",
      fr: "Gyeongnam",
      de: "Gyeongnam",
      es: "Gyeongnam",
      it: "Gyeongnam",
      nl: "Gyeongnam",
      pl: "Gyeongnam",
      sv: "Gyeongnam",
      da: "Gyeongnam",
      no: "Gyeongnam",
      tr: "Gyeongnam",
      tet: "Gyeongnam",
      id: "Gyeongnam",
    },
  },
  "강원특별자치도": {
    en: "Gangwon",
    locales: {
      ko: "강원특별자치도",
      en: "Gangwon",
      vi: "Gangwon",
      "zh-Hans": "江原",
      "zh-Hant": "江原",
      ja: "江原",
      ru: "Канвон",
      uk: "Канвон",
      kk: "Канвон",
      mn: "Канвон",
      uz: "Kanvon",
      th: "คังว็อน",
      my: "ဂန်းဝန်း",
      km: "កាំងវ៉ុន",
      hi: "गैंगवोन",
      ne: "ग्याङवोन",
      bn: "গাংওন",
      ta: "கங்வோன்",
      si: "ගංවොන්",
      ar: "غانغوون",
      arz: "غانغوون",
      fa: "گانگوون",
      he: "גאנגוון",
      am: "ጋንግዎን",
      fr: "Gangwon",
      de: "Gangwon",
      es: "Gangwon",
      it: "Gangwon",
      nl: "Gangwon",
      pl: "Gangwon",
      sv: "Gangwon",
      da: "Gangwon",
      no: "Gangwon",
      tr: "Gangwon",
      tet: "Gangwon",
      id: "Gangwon",
    },
  },
  "제주특별자치도": {
    en: "Jeju",
    locales: {
      ko: "제주특별자치도",
      en: "Jeju",
      vi: "Jeju",
      "zh-Hans": "济州",
      "zh-Hant": "濟州",
      ja: "済州",
      ru: "Чеджу",
      uk: "Чеджу",
      kk: "Чеджу",
      mn: "Жэжү",
      uz: "Cheju",
      th: "เชจู",
      my: "ဂျေဂျူ",
      km: "ជេជូ",
      hi: "जेजू",
      ne: "जेजु",
      bn: "জেজু",
      ta: "ஜெஜு",
      si: "ජේජු",
      ar: "جيجو",
      arz: "جيجو",
      fa: "ججو",
      he: "ג'ג'ו",
      am: "ጄጁ",
      fr: "Jeju",
      de: "Jeju",
      es: "Jeju",
      it: "Jeju",
      nl: "Jeju",
      pl: "Czedżu",
      sv: "Jeju",
      da: "Jeju",
      no: "Jeju",
      tr: "Jeju",
      tet: "Jeju",
      id: "Jeju",
    },
  },
};

// 2. Transliteration & Romanization Engine for Korean Geographic Names
const INITIALS = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const MEDIALS = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const FINALS = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "p", "l", "t", "p", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t"];

// Cyrillic (Kontsevich system)
const CYRILLIC_INITIALS = ["к", "кк", "н", "т", "тт", "р", "м", "п", "пп", "с", "сс", "", "ч", "чч", "чх", "кх", "тх", "пх", "х"];
const CYRILLIC_MEDIALS = ["а", "э", "я", "е", "о", "е", "ё", "е", "о", "ва", "вэ", "ве", "ё", "у", "во", "ве", "ви", "ю", "ы", "ый", "и"];
const CYRILLIC_FINALS = ["", "к", "к", "к", "н", "н", "н", "т", "ль", "к", "м", "п", "ль", "т", "п", "ль", "м", "п", "п", "т", "т", "н", "т", "т", "к", "т", "п", "т"];

// Thai Phonetic Mapping
const THAI_INITIALS = ["ก", "ก", "น", "ด", "ต", "ร", "ม", "บ", "ป", "ซ", "ซ", "อ", "จ", "จ", "ช", "ค", "ท", "พ", "ฮ"];
const THAI_MEDIALS = ["า", "แอ", "ยา", "แย", "ออ", "เอ", "ยอ", "เย", "โอ", "วา", "แว", "เว", "โย", "อู", "วอ", "เว", "วี", "ยู", "อือ", "อึย", "อี"];

// Arabic Phonetic Mapping
const ARABIC_INITIALS = ["ك", "ك", "ن", "د", "ت", "ر", "م", "ب", "ب", "س", "س", "ا", "ج", "ج", "تش", "ك", "ت", "ف", "ه"];
const ARABIC_MEDIALS = ["ا", "اي", "يا", "يي", "و", "ي", "يو", "يي", "و", "وا", "واي", "وي", "يو", "و", "وو", "وي", "وي", "يو", "و", "وي", "ي"];

// Hindi Devanagari Mapping
const DEVANAGARI_INITIALS = ["ग", "क", "न", "द", "त", "र", "म", "ब", "प", "स", "स", "", "ज", "ज", "छ", "ख", "थ", "फ", "ह"];
const DEVANAGARI_MEDIALS = ["ा", "ै", "्या", "्यै", "ॉ", "े", "्यो", "्ये", "ो", "्वा", "्वै", "्वे", "्यो", "ू", "्वॉ", "्वे", "्वी", "्यू", "ृ", "ुई", "ी"];

export function romanizeHangulChar(char: string): string {
  const code = char.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return char;
  const idx = code - 0xAC00;
  const i = Math.floor(idx / 588);
  const m = Math.floor((idx % 588) / 28);
  const f = idx % 28;
  return INITIALS[i] + MEDIALS[m] + FINALS[f];
}

export function romanizeHangulWord(word: string): string {
  let res = "";
  for (const ch of word) {
    res += romanizeHangulChar(ch);
  }
  if (!res) return word;
  return res.charAt(0).toUpperCase() + res.slice(1);
}

export function romanizeKoreanRegion(name: string): string {
  let cleanName = name;
  let suffixNote = "";
  if (name.includes("(") && name.includes(")")) {
    const match = name.match(/^(.*?)\((.*?)\)$/);
    if (match) {
      cleanName = match[1];
      suffixNote = match[2] === "혁신도시" ? " (Innovation City)" : ` (${match[2]})`;
    }
  }

  // Common administrative suffixes - clean root representations
  const suffixes = [
    { ko: "특별시", en: "" },
    { ko: "광역시", en: "" },
    { ko: "특별자치시", en: "" },
    { ko: "특별자치도", en: "" },
    { ko: "시", en: "" },
    { ko: "군", en: "" },
    { ko: "구", en: "-gu" },
    { ko: "읍", en: "-eup" },
    { ko: "면", en: "-myeon" },
    { ko: "동", en: "-dong" },
    { ko: "리", en: "-ri" },
    { ko: "로", en: "-ro" },
    { ko: "길", en: "-gil" },
  ];

  for (const s of suffixes) {
    if (cleanName.endsWith(s.ko) && cleanName.length > s.ko.length) {
      const base = cleanName.slice(0, -s.ko.length);
      const rom = romanizeHangulWord(base);
      return `${rom}${s.en}${suffixNote}`.trim();
    }
  }

  return romanizeHangulWord(cleanName) + suffixNote;
}

// 3. Known Gungu Special Dictionary for Hanzi, Kanji, and Transliterations (Clean roots)
export const GUNGU_DATA: Record<
  string,
  {
    en: string;
    hanzi?: string;
    zht?: string;
    ja?: string;
  }
> = {
  "익산시": { en: "Iksan", hanzi: "益山", zht: "益山", ja: "益山" },
  "전주시 덕진구": { en: "Deokjin (Jeonju)", hanzi: "德津 (全州)", zht: "德津 (全州)", ja: "徳津 (全州)" },
  "전주시 완산구": { en: "Wansan (Jeonju)", hanzi: "完山 (全州)", zht: "完山 (全州)", ja: "完山 (全州)" },
  "군산시": { en: "Gunsan", hanzi: "群山", zht: "群山", ja: "群山" },
  "완주군": { en: "Wanju", hanzi: "完州", zht: "完州", ja: "完州" },
  "정읍시": { en: "Jeongeup", hanzi: "井邑", zht: "井邑", ja: "井邑" },
  "남원시": { en: "Namwon", hanzi: "南原", zht: "南原", ja: "南原" },
  "김제시": { en: "Gimje", hanzi: "金堤", zht: "金堤", ja: "金堤" },
  "강남구": { en: "Gangnam-gu", hanzi: "江南区", zht: "江南區", ja: "江南区" },
  "구로구": { en: "Guro-gu", hanzi: "九老区", zht: "九老區", ja: "九老区" },
  "영등포구": { en: "Yeongdeungpo-gu", hanzi: "永登浦区", zht: "永登浦區", ja: "永登浦区" },
  "관악구": { en: "Gwanak-gu", hanzi: "冠岳区", zht: "冠岳區", ja: "冠岳区" },
  "마포구": { en: "Mapo-gu", hanzi: "麻浦区", zht: "麻浦區", ja: "麻浦区" },
  "광진구": { en: "Gwangjin-gu", hanzi: "广津区", zht: "廣津區", ja: "広津区" },
  "동대문구": { en: "Dongdaemun-gu", hanzi: "东大门区", zht: "東大門區", ja: "東大門区" },
  "용산구": { en: "Yongsan-gu", hanzi: "龙山区", zht: "龍山區", ja: "龍山区" },
  "서대문구": { en: "Seodaemun-gu", hanzi: "西大门区", zht: "西大門區", ja: "西大門区" },
  "송파구": { en: "Songpa-gu", hanzi: "松坡区", zht: "松坡區", ja: "松坡区" },
  "강서구": { en: "Gangseo-gu", hanzi: "江西区", zht: "江西區", ja: "江西区" },
  "수원시": { en: "Suwon", hanzi: "水原", zht: "水原", ja: "水原" },
  "안산시": { en: "Ansan", hanzi: "安山", zht: "安山", ja: "安山" },
  "성남시": { en: "Seongnam", hanzi: "城南", zht: "城南", ja: "城南" },
  "화성시": { en: "Hwaseong", hanzi: "华城", zht: "華城", ja: "華城" },
  "평택시": { en: "Pyeongtaek", hanzi: "平泽", zht: "平澤", ja: "平沢" },
  "시흥시": { en: "Siheung", hanzi: "始兴", zht: "始興", ja: "始興" },
  "부천시": { en: "Bucheon", hanzi: "富川", zht: "富川", ja: "富川" },
  "김포시": { en: "Gimpo", hanzi: "金浦", zht: "金浦", ja: "金浦" },
  "고양시": { en: "Goyang", hanzi: "高阳", zht: "高陽", ja: "高陽" },
  "용인시": { en: "Yongin", hanzi: "龙仁", zht: "龍仁", ja: "龍仁" },
  "부평구": { en: "Bupyeong-gu", hanzi: "富平区", zht: "富平區", ja: "富平区" },
  "남동구": { en: "Namdong-gu", hanzi: "南洞区", zht: "南洞區", ja: "南洞区" },
  "미추홀구": { en: "Michuhol-gu", hanzi: "弥邹忽区", zht: "彌鄒忽區", ja: "弥鄒忽区" },
  "서구": { en: "Seo-gu", hanzi: "西区", zht: "西區", ja: "西区" },
  "연수구": { en: "Yeonsu-gu", hanzi: "延寿区", zht: "延壽區", ja: "延寿区" },
  "부산진구": { en: "Busanjin-gu", hanzi: "釜山镇区", zht: "釜山鎮區", ja: "釜山鎮区" },
  "해운대구": { en: "Haeundae-gu", hanzi: "海云台区", zht: "海雲台區", ja: "海雲台区" },
  "사하구": { en: "Saha-gu", hanzi: "沙下区", zht: "沙下區", ja: "沙下区" },
  "동래구": { en: "Dongnae-gu", hanzi: "东莱区", zht: "東萊區", ja: "東莱区" },
  "달서구": { en: "Dalseo-gu", hanzi: "达西区", zht: "達西區", ja: "達西区" },
  "북구": { en: "Buk-gu", hanzi: "北区", zht: "北區", ja: "北区" },
  "수성구": { en: "Suseong-gu", hanzi: "寿城区", zht: "壽城區", ja: "寿城区" },
  "광산구": { en: "Gwangsan-gu", hanzi: "光山区", zht: "光山區", ja: "光山区" },
  "유성구": { en: "Yuseong-gu", hanzi: "儒城区", zht: "儒城區", ja: "儒城区" },
  "남구": { en: "Nam-gu", hanzi: "南区", zht: "南區", ja: "南区" },
  "중구": { en: "Jung-gu", hanzi: "中区", zht: "中區", ja: "中区" },
  "세종시": { en: "Sejong", hanzi: "世宗", zht: "世宗", ja: "世宗" },
  "천안시": { en: "Cheonan", hanzi: "天安", zht: "天安", ja: "天安" },
  "아산시": { en: "Asan", hanzi: "牙山", zht: "牙山", ja: "牙山" },
  "당진시": { en: "Dangjin", hanzi: "唐津", zht: "唐津", ja: "唐津" },
  "서산시": { en: "Seosan", hanzi: "瑞山", zht: "瑞山", ja: "瑞山" },
  "청주시": { en: "Cheongju", hanzi: "清州", zht: "清州", ja: "清州" },
  "충주시": { en: "Chungju", hanzi: "忠州", zht: "忠州", ja: "忠州" },
  "진천군": { en: "Jincheon", hanzi: "镇川", zht: "鎮川", ja: "鎮川" },
  "음성군": { en: "Eumseong", hanzi: "阴城", zht: "陰城", ja: "陰城" },
  "여수시": { en: "Yeosu", hanzi: "丽水", zht: "麗水", ja: "麗水" },
  "순천시": { en: "Suncheon", hanzi: "顺天", zht: "順天", ja: "順天" },
  "목포시": { en: "Mokpo", hanzi: "木浦", zht: "木浦", ja: "木浦" },
  "나주시": { en: "Naju", hanzi: "罗州", zht: "羅州", ja: "羅州" },
  "영암군": { en: "Yeongam", hanzi: "灵岩", zht: "靈岩", ja: "霊岩" },
  "포항시": { en: "Pohang", hanzi: "浦项", zht: "浦項", ja: "浦項" },
  "구미시": { en: "Gumi", hanzi: "龟尾", zht: "龜尾", ja: "亀尾" },
  "경주시": { en: "Gyeongju", hanzi: "庆州", zht: "慶州", ja: "慶州" },
  "경산시": { en: "Gyeongsan", hanzi: "庆山", zht: "慶山", ja: "慶山" },
  "창원시": { en: "Changwon", hanzi: "昌原", zht: "昌原", ja: "昌原" },
  "김해시": { en: "Gimhae", hanzi: "金海", zht: "金海", ja: "金海" },
  "양산시": { en: "Yangsan", hanzi: "梁山", zht: "梁山", ja: "梁山" },
  "거제시": { en: "Geoje", hanzi: "巨济", zht: "巨濟", ja: "巨済" },
  "원주시": { en: "Wonju", hanzi: "原州", zht: "原州", ja: "原州" },
  "춘천시": { en: "Chuncheon", hanzi: "春川", zht: "春川", ja: "春川" },
  "강릉시": { en: "Gangneung", hanzi: "江陵", zht: "江陵", ja: "江陵" },
  "제주시": { en: "Jeju", hanzi: "济州", zht: "濟州", ja: "済州" },
  "서귀포시": { en: "Seogwipo", hanzi: "西归浦", zht: "西歸浦", ja: "西帰浦" },
};

// 4. Complete Dong Hanja Mapping (Exported from dongHanjaData)
export { COMPLETE_DONG_HANJA };
export const COMMON_DONG_HANJA: Record<string, string> = Object.fromEntries(
  Object.entries(COMPLETE_DONG_HANJA).map(([k, v]) => [k, v.zh])
);

export function transliterateHangulToCyrillic(name: string): string {
  let res = "";
  for (const ch of name) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const idx = code - 0xAC00;
      const i = Math.floor(idx / 588);
      const m = Math.floor((idx % 588) / 28);
      const f = idx % 28;
      res += CYRILLIC_INITIALS[i] + CYRILLIC_MEDIALS[m] + CYRILLIC_FINALS[f];
    } else {
      res += ch;
    }
  }
  return res.charAt(0).toUpperCase() + res.slice(1);
}

export function transliterateHangulToThai(name: string): string {
  let res = "";
  for (const ch of name) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const idx = code - 0xAC00;
      const i = Math.floor(idx / 588);
      const m = Math.floor((idx % 588) / 28);
      res += THAI_INITIALS[i] + THAI_MEDIALS[m];
    } else {
      res += ch;
    }
  }
  return res;
}

export function transliterateHangulToArabic(name: string): string {
  let res = "";
  for (const ch of name) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const idx = code - 0xAC00;
      const i = Math.floor(idx / 588);
      const m = Math.floor((idx % 588) / 28);
      res += ARABIC_INITIALS[i] + ARABIC_MEDIALS[m];
    } else {
      res += ch;
    }
  }
  return res;
}

export function transliterateHangulToDevanagari(name: string): string {
  let res = "";
  for (const ch of name) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const idx = code - 0xAC00;
      const i = Math.floor(idx / 588);
      const m = Math.floor((idx % 588) / 28);
      res += DEVANAGARI_INITIALS[i] + DEVANAGARI_MEDIALS[m];
    } else {
      res += ch;
    }
  }
  return res;
}

/**
 * Derives the native representation of any Korean region string for a given locale.
 */
export function getNativeRegionName(
  koreanName: string,
  englishName: string,
  locale: string,
  level: "sido" | "gungu" | "dong"
): string {
  if (locale === "ko") return koreanName;
  if (locale === "en") return englishName;

  // 1. Check Sido exact match
  if (level === "sido" && SIDO_DATA[koreanName]) {
    const loc = SIDO_DATA[koreanName].locales[locale];
    if (loc) return loc;
  }

  // 2. Check Gungu exact match
  if (level === "gungu" && GUNGU_DATA[koreanName]) {
    const g = GUNGU_DATA[koreanName];
    if (locale === "zh-Hans" && g.hanzi) return g.hanzi;
    if (locale === "zh-Hant" && (g.zht || g.hanzi)) return (g.zht || g.hanzi)!;
    if (locale === "ja" && g.ja) return g.ja;
  }

  // 3. Check Dong Hanja match for Chinese/Japanese
  if (level === "dong" && COMPLETE_DONG_HANJA[koreanName]) {
    const d = COMPLETE_DONG_HANJA[koreanName];
    if (locale === "zh-Hans") return d.zh;
    if (locale === "zh-Hant") return d.zht;
    if (locale === "ja") return d.ja;
  }

  // 4. Cyrillic scripts (Russian, Ukrainian, Kazakh, Mongolian)
  if (locale === "ru" || locale === "uk" || locale === "kk" || locale === "mn") {
    return transliterateHangulToCyrillic(koreanName);
  }

  // 5. Thai script
  if (locale === "th") {
    return transliterateHangulToThai(koreanName) || englishName;
  }

  // 6. Arabic script (Arabic, Egyptian Arabic, Persian)
  if (locale === "ar" || locale === "arz" || locale === "fa") {
    return transliterateHangulToArabic(koreanName) || englishName;
  }

  // 7. Devanagari script (Hindi, Nepali)
  if (locale === "hi" || locale === "ne") {
    return transliterateHangulToDevanagari(koreanName) || englishName;
  }

  // Latin alphabet languages: use clean Romanized name directly (e.g. Vietnamese, French, German...)
  return englishName;
}

/**
 * Format region name according to user rules:
 * - Korean (`ko`): Only Korean!
 * - Vietnamese & other Latin-script languages (except English):
 *   English is OMITTED! `[Native] · [Korean]` (e.g. `Jeonbuk · 전북특별자치도`)
 * - English (`en`): `[English] · [Korean]`
 * - Non-Latin languages: `[Native] · [English] · [Korean]`
 */
export function formatRegionDisplay(
  nativeName: string,
  englishName: string,
  koreanName: string,
  locale: string,
  isBilingual: boolean = false
): string {
  if (locale === "ko") {
    return koreanName;
  }

  const trimmedNative = nativeName.trim();
  const trimmedEn = englishName.trim();

  // Primary name for current locale (Latin scripts use native/English directly)
  const primaryName = LATIN_SCRIPT_LOCALES.has(locale)
    ? (locale === "en" ? trimmedEn : trimmedNative)
    : (trimmedNative === trimmedEn ? trimmedEn : trimmedNative);

  // In monolingual mode (단일 언어), foreign language must NOT output accompanied Korean text
  if (!isBilingual) {
    return primaryName;
  }

  // Bilingual mode (한국어 병기)
  if (LATIN_SCRIPT_LOCALES.has(locale)) {
    return `${primaryName} · ${koreanName}`;
  }

  // Non-Latin script languages in bilingual mode
  if (trimmedNative === trimmedEn) {
    return `${trimmedEn} · ${koreanName}`;
  }

  return `${trimmedNative} · ${trimmedEn} · ${koreanName}`;
}

/**
 * Sort array of items using Intl.Collator based on language dictionary rules.
 * - For Korean: sorts in Korean dictionary order (가나다순).
 * - For other languages: sorts in that language's dictionary order using the leftmost native text.
 */
export function sortRegionsByLocale<T>(
  items: T[],
  locale: string,
  getSortKey: (item: T) => string
): T[] {
  const collator = new Intl.Collator(locale, {
    sensitivity: "base",
    numeric: true,
  });

  return [...items].sort((a, b) => collator.compare(getSortKey(a), getSortKey(b)));
}

/**
 * Get sorted and localized list of Level 1 (Sido / Province) for the current locale and country.
 */
export function getLocalizedSidoList(
  locale: string,
  isBilingual: boolean = false,
  country: CountryCode = "KR"
): LocalizedRegionOption[] {
  if (country === "KR") {
    const options: LocalizedRegionOption[] = koreanRegions.map((s) => {
      const ko = s.name;
      const en = SIDO_DATA[ko]?.en || romanizeKoreanRegion(ko);
      const native = getNativeRegionName(ko, en, locale, "sido");
      const display = formatRegionDisplay(native, en, ko, locale, isBilingual);
      const sortKey = locale === "ko" ? ko : native;

      return {
        key: ko,
        ko,
        en,
        native,
        display,
        sortKey,
      };
    });

    return sortRegionsByLocale(options, locale, (o) => o.sortKey);
  }

  // Non-KR countries:
  const regions = getCountryRegions(country);
  return regions.map((s) => ({
    key: s.name,
    ko: s.name,
    en: s.shortName || s.name,
    native: s.name,
    display: s.name,
    sortKey: s.name,
  }));
}

/**
 * Get sorted and localized list of Level 2 (Gungu / District / City) for the current locale and country.
 */
export function getLocalizedGunguList(
  sidoName: string,
  locale: string,
  isBilingual: boolean = false,
  country: CountryCode = "KR"
): LocalizedRegionOption[] {
  const sData = findSido(sidoName, country);
  if (!sData) return [];

  if (country === "KR") {
    const options: LocalizedRegionOption[] = sData.gunguList.map((g) => {
      const ko = g.name;
      const en = GUNGU_DATA[ko]?.en || romanizeKoreanRegion(ko);
      const native = getNativeRegionName(ko, en, locale, "gungu");
      const display = formatRegionDisplay(native, en, ko, locale, isBilingual);
      const sortKey = locale === "ko" ? ko : native;

      return {
        key: ko,
        ko,
        en,
        native,
        display,
        sortKey,
      };
    });

    return sortRegionsByLocale(options, locale, (o) => o.sortKey);
  }

  // Non-KR countries:
  return sData.gunguList.map((g) => ({
    key: g.name,
    ko: g.name,
    en: g.name,
    native: g.name,
    display: g.name,
    sortKey: g.name,
  }));
}

/**
 * Get sorted and localized list of Level 3 (Dong / Ward / Barangay / Village) for the current locale and country.
 */
export function getLocalizedDongList(
  sidoName: string,
  gunguName: string,
  locale: string,
  isBilingual: boolean = false,
  country: CountryCode = "KR"
): LocalizedRegionOption[] {
  const gData = findGungu(sidoName, gunguName, country);
  if (!gData) return [];

  if (country === "KR") {
    const options: LocalizedRegionOption[] = gData.dongs.map((d) => {
      const ko = d;
      const en = romanizeKoreanRegion(ko);
      const native = getNativeRegionName(ko, en, locale, "dong");
      const display = formatRegionDisplay(native, en, ko, locale, isBilingual);
      const sortKey = locale === "ko" ? ko : native;

      return {
        key: ko,
        ko,
        en,
        native,
        display,
        sortKey,
      };
    });

    return sortRegionsByLocale(options, locale, (o) => o.sortKey);
  }

  // Non-KR countries:
  return gData.dongs.map((d) => ({
    key: d,
    ko: d,
    en: d,
    native: d,
    display: d,
    sortKey: d,
  }));
}

/**
 * Format a full localized address string for a given RegionItem.
 */
export function getLocalizedAddress(
  region: RegionItem,
  locale: string,
  isBilingual: boolean = false
): string {
  const country = region.country || "KR";
  const { sido, gungu, dong } = region;

  if (country !== "KR") {
    const countryInfo = getCountryInfo(country);
    let fullAddr = "";
    if (country === "VN" || country === "PH" || country === "ID") {
      fullAddr = [dong, gungu, sido].filter(Boolean).join(", ");
    } else {
      fullAddr = [sido, gungu, dong].filter(Boolean).join(" ");
    }

    if (locale === "ko" || isBilingual) {
      return `${countryInfo.flag} [${countryInfo.nameKo}] ${fullAddr}`.trim();
    }
    return `${countryInfo.flag} ${fullAddr}`.trim();
  }

  if (locale === "ko") {
    return `${sido} ${gungu} ${dong}`.trim();
  }

  const sidoEn = SIDO_DATA[sido]?.en || romanizeKoreanRegion(sido);
  const sidoNative = getNativeRegionName(sido, sidoEn, locale, "sido");

  const gunguEn = GUNGU_DATA[gungu]?.en || romanizeKoreanRegion(gungu);
  const gunguNative = getNativeRegionName(gungu, gunguEn, locale, "gungu");

  const dongEn = romanizeKoreanRegion(dong);
  const dongNative = getNativeRegionName(dong, dongEn, locale, "dong");

  const nativeCombined = `${sidoNative} ${gunguNative} ${dongNative}`.trim();
  const enCombined = `${sidoEn} ${gunguEn} ${dongEn}`.trim();
  const koCombined = `${sido} ${gungu} ${dong}`.trim();

  return formatRegionDisplay(nativeCombined, enCombined, koCombined, locale, isBilingual);
}

/**
 * Format a short localized address string (Gungu + Dong) for a given RegionItem.
 */
export function getLocalizedShortAddress(
  region: RegionItem,
  locale: string,
  isBilingual: boolean = false
): string {
  const country = region.country || "KR";
  const { gungu, dong } = region;

  if (country !== "KR") {
    const countryInfo = getCountryInfo(country);
    let shortAddr = "";
    if (country === "VN" || country === "PH" || country === "ID") {
      shortAddr = [dong, gungu].filter(Boolean).join(", ");
    } else {
      shortAddr = [gungu, dong].filter(Boolean).join(" ");
    }

    if (locale === "ko" || isBilingual) {
      return `${countryInfo.flag} [${countryInfo.nameKo}] ${shortAddr}`.trim();
    }
    return `${countryInfo.flag} ${shortAddr}`.trim();
  }

  if (locale === "ko") {
    return `${gungu} ${dong}`.trim();
  }

  const gunguEn = GUNGU_DATA[gungu]?.en || romanizeKoreanRegion(gungu);
  const gunguNative = getNativeRegionName(gungu, gunguEn, locale, "gungu");

  const dongEn = romanizeKoreanRegion(dong);
  const dongNative = getNativeRegionName(dong, dongEn, locale, "dong");

  const nativeCombined = `${gunguNative} ${dongNative}`.trim();
  const enCombined = `${gunguEn} ${dongEn}`.trim();
  const koCombined = `${gungu} ${dong}`.trim();

  return formatRegionDisplay(nativeCombined, enCombined, koCombined, locale, isBilingual);
}


