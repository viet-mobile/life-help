import { type Locale, languages, translate } from "@/messages";

export interface ServiceItem {
  slug: string;
  key: string;
  icon: string;
  ko: string;
  vi: string;
}

export const services: readonly ServiceItem[] = [
  // 1. Consolidated Clog Clearing Service (Toilet, Sink, Drain)
  {
    slug: "clog-clearing",
    key: "clog",
    icon: "🚽 🚰 🕳️",
    ko: "변기, 싱크대, 하수구 등 각종 막힘 해결",
    vi: "Thông tắc bồn cầu, bồn rửa, cống rãnh các loại",
  },
  // 2. Consolidated Leak & Plumbing Service (Leak, Detection, Water, Plumbing)
  {
    slug: "leak-plumbing",
    key: "leakPlumbing",
    icon: "💧 🔎 🚿 🔧",
    ko: "누수 방지, 누수 탐지, 수도 배관 공사 등",
    vi: "Chống rò rỉ, dò tìm rò rỉ, thi công đường ống nước",
  },
  // 3. Boiler (Heating)
  {
    slug: "boiler",
    key: "boiler",
    icon: "♨️",
    ko: "보일러 설치, 시공, 수리",
    vi: "Lắp đặt, thi công, sửa chữa bình nóng lạnh / nồi hơi",
  },
  // 4. Cleaning
  {
    slug: "cleaning",
    key: "cleaning",
    icon: "🧹",
    ko: "청소",
    vi: "Dọn dẹp",
  },
  // 5. Housing & Rooms
  {
    slug: "housing",
    key: "housing",
    icon: "🏠",
    ko: "방 구하기",
    vi: "Thuê chỗ ở",
  },

  // 6 ~ 10: 5 New Life Assistance Support Services (050 Safe Virtual Number Matching)
  {
    slug: "bank-help",
    key: "bankHelp",
    icon: "🏦",
    ko: "은행 계좌 개설 도움",
    vi: "Hỗ trợ mở tài khoản ngân hàng",
  },
  {
    slug: "insurance-help",
    key: "insuranceHelp",
    icon: "📑",
    ko: "보험 가입 도움",
    vi: "Hỗ trợ đăng ký bảo hiểm",
  },
  {
    slug: "job-help",
    key: "jobHelp",
    icon: "💼",
    ko: "구인/구직 도움",
    vi: "Hỗ trợ tìm việc làm & tuyển dụng",
  },
  {
    slug: "hospital-help",
    key: "hospitalHelp",
    icon: "🏥",
    ko: "병원 동행, 통역 도움",
    vi: "Đồng hành bệnh viện & thông dịch y tế",
  },
  {
    slug: "mobile-help",
    key: "mobileHelp",
    icon: "📱",
    ko: "이동전화 개통 도움",
    vi: "Hỗ trợ đăng ký mạng di động",
  },

  // Legacy individual items for backward compatibility
  {
    slug: "toilet-clog",
    key: "toilet",
    icon: "🚽",
    ko: "변기 막힘",
    vi: "Tắc bồn cầu",
  },
  {
    slug: "sink-clog",
    key: "sink",
    icon: "🧽",
    ko: "싱크대 막힘",
    vi: "Tắc bồn rửa",
  },
  {
    slug: "drain-clog",
    key: "drain",
    icon: "🕳️",
    ko: "하수구 막힘",
    vi: "Tắc cống",
  },
  {
    slug: "water-leak",
    key: "leak",
    icon: "💧",
    ko: "누수",
    vi: "Rò rỉ nước",
  },
  {
    slug: "leak-detection",
    key: "detection",
    icon: "🔎",
    ko: "누수 탐지",
    vi: "Kiểm tra rò rỉ nước",
  },
  {
    slug: "water",
    key: "water",
    icon: "🚿",
    ko: "수도",
    vi: "Nước sinh hoạt",
  },
  {
    slug: "plumbing",
    key: "plumbing",
    icon: "🚰",
    ko: "배관",
    vi: "Đường ống",
  },
] as const;

export function getService(slug: string): ServiceItem | undefined {
  return services.find((service) => service.slug === slug);
}

export function getServiceName(service: ServiceItem, locale: Locale): string {
  return translate(locale, `service.${service.key}`);
}

export function getLocalizedServiceName(
  slugOrName: string | undefined | null,
  locale: Locale,
): string {
  if (!slugOrName) return "";
  const clean = slugOrName.trim();
  const found = services.find(
    (s) =>
      s.slug.toLowerCase() === clean.toLowerCase() ||
      s.key.toLowerCase() === clean.toLowerCase() ||
      s.ko.toLowerCase() === clean.toLowerCase() ||
      s.vi.toLowerCase() === clean.toLowerCase(),
  );
  if (found) {
    return translate(locale, `service.${found.key}`) || found.ko;
  }
  return clean;
}

export function getLocalizedLanguageName(
  langCode: string | undefined | null,
  locale: string,
): string {
  if (!langCode) return "";
  const cleanCode = langCode.trim().toLowerCase();

  // Try Intl.DisplayNames first for native localized names in the requested locale
  try {
    const dn = new Intl.DisplayNames([locale], { type: "language" });
    const localized = dn.of(cleanCode);
    if (localized && localized !== cleanCode) {
      return localized.charAt(0).toUpperCase() + localized.slice(1);
    }
  } catch {
    // ignore
  }

  // Fallback to languages metadata list
  const found = languages.find((l) => l.code.toLowerCase() === cleanCode);
  if (found) {
    return found.name;
  }

  return langCode.toUpperCase();
}
