export type CountryCode = "KR" | "VN" | "CN" | "TW" | "JP" | "PH" | "ID";

export interface CountryInfo {
  code: CountryCode;
  flag: string;
  nameKo: string;
  nameEn: string;
  nameNative: string;
  level1Category: string;
  level2Category: string;
  level3Category: string;
}

export const COUNTRIES: readonly CountryInfo[] = [
  {
    code: "KR",
    flag: "🇰🇷",
    nameKo: "대한민국",
    nameEn: "South Korea",
    nameNative: "대한민국",
    level1Category: "시·도",
    level2Category: "구·군·시",
    level3Category: "동·읍·면",
  },
  {
    code: "VN",
    flag: "🇻🇳",
    nameKo: "베트남",
    nameEn: "Vietnam",
    nameNative: "Việt Nam",
    level1Category: "Tỉnh / Thành phố",
    level2Category: "Quận / Huyện / Thị xã",
    level3Category: "Phường / Xã / Thị trấn",
  },
  {
    code: "CN",
    flag: "🇨🇳",
    nameKo: "중국",
    nameEn: "China",
    nameNative: "中国",
    level1Category: "省 / 直辖市",
    level2Category: "市 / 区 / 县",
    level3Category: "街道 / 镇 / 乡",
  },
  {
    code: "TW",
    flag: "🇹🇼",
    nameKo: "대만",
    nameEn: "Taiwan",
    nameNative: "台灣",
    level1Category: "直轄市 / 縣 / 市",
    level2Category: "區 / 鄉 / 鎮 / 市",
    level3Category: "里 / 村",
  },
  {
    code: "JP",
    flag: "🇯🇵",
    nameKo: "일본",
    nameEn: "Japan",
    nameNative: "日本",
    level1Category: "都道府県",
    level2Category: "市区町村",
    level3Category: "町名・丁目",
  },
  {
    code: "PH",
    flag: "🇵🇭",
    nameKo: "필리핀",
    nameEn: "Philippines",
    nameNative: "Pilipinas",
    level1Category: "Region / Province",
    level2Category: "City / Municipality",
    level3Category: "Barangay",
  },
  {
    code: "ID",
    flag: "🇮🇩",
    nameKo: "인도네시아",
    nameEn: "Indonesia",
    nameNative: "Indonesia",
    level1Category: "Provinsi",
    level2Category: "Kota / Kabupaten",
    level3Category: "Kecamatan / Kelurahan",
  },
] as const;

export function getCountryInfo(code: CountryCode | undefined | null): CountryInfo {
  if (!code) return COUNTRIES[0];
  const found = COUNTRIES.find((c) => c.code === code);
  return found || COUNTRIES[0];
}

export function getCountryDisplayName(country: CountryInfo, locale: string): string {
  if (locale === "ko") return `${country.flag} ${country.nameKo}`;
  if (locale === "en") return `${country.flag} ${country.nameEn}`;
  if (locale === "vi" && country.code === "VN") return `${country.flag} ${country.nameNative}`;
  if ((locale === "zh-Hans" || locale === "zh-Hant") && (country.code === "CN" || country.code === "TW")) {
    return `${country.flag} ${country.nameNative}`;
  }
  if (locale === "ja" && country.code === "JP") return `${country.flag} ${country.nameNative}`;
  if (locale === "id" && country.code === "ID") return `${country.flag} ${country.nameNative}`;
  return `${country.flag} ${country.nameNative || country.nameEn}`;
}

