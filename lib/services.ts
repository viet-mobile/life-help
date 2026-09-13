import { type Locale, languages, translate } from "@/messages";

export interface ServiceItem {
  slug: string;
  key: string;
  icon: string;
  ko: string;
  vi: string;
}

export const services: readonly ServiceItem[] = [
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
  {
    slug: "boiler",
    key: "boiler",
    icon: "🔥",
    ko: "보일러",
    vi: "Nồi hơi",
  },
  {
    slug: "cleaning",
    key: "cleaning",
    icon: "🧹",
    ko: "청소",
    vi: "Dọn dẹp",
  },
  {
    slug: "housing",
    key: "housing",
    icon: "🏠",
    ko: "방 구하기",
    vi: "Thuê chỗ ở",
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
