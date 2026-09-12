export const services = [
  {
    slug: "toilet-clog",
    icon: "🚽",
    ko: "변기 막힘",
    vi: "Tắc bồn cầu",
  },
  {
    slug: "sink-clog",
    icon: "🧽",
    ko: "싱크대 막힘",
    vi: "Tắc bồn rửa",
  },
  {
    slug: "drain-clog",
    icon: "🕳️",
    ko: "하수구 막힘",
    vi: "Tắc cống",
  },
  {
    slug: "water-leak",
    icon: "💧",
    ko: "누수",
    vi: "Rò rỉ nước",
  },
  {
    slug: "leak-detection",
    icon: "🔎",
    ko: "누수 탐지",
    vi: "Kiểm tra rò rỉ nước",
  },
  {
    slug: "water",
    icon: "🚿",
    ko: "수도",
    vi: "Nước sinh hoạt",
  },
  {
    slug: "plumbing",
    icon: "🚰",
    ko: "배관",
    vi: "Đường ống",
  },
  {
    slug: "boiler",
    icon: "🔥",
    ko: "보일러",
    vi: "Nồi hơi",
  },
  {
    slug: "cleaning",
    icon: "🧹",
    ko: "청소",
    vi: "Dọn dẹp",
  },
  {
    slug: "housing",
    icon: "🏠",
    ko: "방 구하기",
    vi: "Thuê chỗ ở",
  },
] as const;

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}
