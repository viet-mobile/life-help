export type CountryCode =
  | "KR" | "VN" | "CN" | "TW" | "JP" | "PH" | "ID"
  | "RU" | "UZ" | "NP" | "IN" | "KH" | "TH" | "MM"
  | "LK" | "KZ" | "FR" | "DE" | "TR" | "UA" | "TL"
  | "AE" | "IT" | "EG" | "ES" | "IR" | "NL" | "PL"
  | "ET" | "SE" | "IL" | "DK" | "NO" | "MN" | "MX"
  | "BR" | "GR" | "PT" | "ZA" | "CH" | "PK" | "SA"
  | "YE" | "IQ" | "BD" | "US" | "GB" | "CA" | "AU"
  | "NZ" | "SG" | "MY" | "NG"
  | string;

export interface CountryInfo {
  code: CountryCode;
  slug: string;
  flag: string;
  nameKo: string;
  nameEn: string;
  nameNative: string;
  level1Category: string;
  level2Category: string;
  level3Category: string;
}

export const COUNTRIES: readonly CountryInfo[] = [
  { code: "KR", slug: "korea", flag: "🇰🇷", nameKo: "대한민국", nameEn: "South Korea", nameNative: "대한민국", level1Category: "시·도", level2Category: "구·군·시", level3Category: "동·읍·면" },
  { code: "VN", slug: "vietnam", flag: "🇻🇳", nameKo: "베트남", nameEn: "Vietnam", nameNative: "Việt Nam", level1Category: "Tỉnh / Thành phố", level2Category: "Quận / Huyện / Thị xã", level3Category: "Phường / Xã / Thị trấn" },
  { code: "CN", slug: "china", flag: "🇨🇳", nameKo: "중국", nameEn: "China", nameNative: "中国", level1Category: "省 / 直辖市", level2Category: "市 / 区 / 县", level3Category: "街道 / 镇 / 乡" },
  { code: "TW", slug: "taiwan", flag: "🇹🇼", nameKo: "대만", nameEn: "Taiwan", nameNative: "台灣", level1Category: "直轄市 / 縣 / 市", level2Category: "區 / 鄉 / 鎮 / 市", level3Category: "里 / 村" },
  { code: "JP", slug: "japan", flag: "🇯🇵", nameKo: "일본", nameEn: "Japan", nameNative: "日本", level1Category: "都道府県", level2Category: "市区町村", level3Category: "町名・丁目" },
  { code: "PH", slug: "philippines", flag: "🇵🇭", nameKo: "필리핀", nameEn: "Philippines", nameNative: "Pilipinas", level1Category: "Region / Province", level2Category: "City / Municipality", level3Category: "Barangay" },
  { code: "ID", slug: "indonesia", flag: "🇮🇩", nameKo: "인도네시아", nameEn: "Indonesia", nameNative: "Indonesia", level1Category: "Provinsi", level2Category: "Kota / Kabupaten", level3Category: "Kecamatan / Kelurahan" },
  { code: "RU", slug: "russia", flag: "🇷🇺", nameKo: "러시아", nameEn: "Russia", nameNative: "Россия", level1Category: "Субъект", level2Category: "Город / Район", level3Category: "Муниципалитет" },
  { code: "UZ", slug: "uzbek", flag: "🇺🇿", nameKo: "우즈베키스탄", nameEn: "Uzbekistan", nameNative: "O'zbekiston", level1Category: "Viloyat", level2Category: "Tuman / Shahar", level3Category: "Mahalla" },
  { code: "NP", slug: "nepal", flag: "🇳🇵", nameKo: "네팔", nameEn: "Nepal", nameNative: "नेपाल", level1Category: "Province", level2Category: "District", level3Category: "Municipality" },
  { code: "IN", slug: "india", flag: "🇮🇳", nameKo: "인도", nameEn: "India", nameNative: "भारत", level1Category: "State", level2Category: "District", level3Category: "Sub-district" },
  { code: "KH", slug: "cambodia", flag: "🇰🇭", nameKo: "캄보디아", nameEn: "Cambodia", nameNative: "កម្ពុជា", level1Category: "Khaet / Krong", level2Category: "Srok / Khan", level3Category: "Khum / Sangkat" },
  { code: "TH", slug: "thailand", flag: "🇹🇭", nameKo: "태국", nameEn: "Thailand", nameNative: "ประเทศไทย", level1Category: "จังหวัด", level2Category: "อำเภอ / เขต", level3Category: "ตำบล / แขวง" },
  { code: "MM", slug: "myanmar", flag: "🇲🇲", nameKo: "미얀마", nameEn: "Myanmar", nameNative: "မြန်မာ", level1Category: "Region / State", level2Category: "District", level3Category: "Township" },
  { code: "LK", slug: "srilanka", flag: "🇱🇰", nameKo: "스리랑카", nameEn: "Sri Lanka", nameNative: "ශ්‍රී ලංකා", level1Category: "Province", level2Category: "District", level3Category: "Divisional Secretariat" },
  { code: "KZ", slug: "kazakh", flag: "🇰🇿", nameKo: "카자흐스탄", nameEn: "Kazakhstan", nameNative: "Қазақстан", level1Category: "Облыс", level2Category: "Аудан / Қала", level3Category: "Ауыл / Кент" },
  { code: "FR", slug: "france", flag: "🇫🇷", nameKo: "프랑스", nameEn: "France", nameNative: "France", level1Category: "Région", level2Category: "Département", level3Category: "Commune" },
  { code: "DE", slug: "deutsch", flag: "🇩🇪", nameKo: "독일", nameEn: "Germany", nameNative: "Deutschland", level1Category: "Bundesland", level2Category: "Landkreis / Stadt", level3Category: "Gemeinde" },
  { code: "TR", slug: "turkiye", flag: "🇹🇷", nameKo: "튀르키예", nameEn: "Turkey", nameNative: "Türkiye", level1Category: "İl", level2Category: "İlçe", level3Category: "Mahalle" },
  { code: "UA", slug: "ukraina", flag: "🇺🇦", nameKo: "우크라이나", nameEn: "Ukraine", nameNative: "Україна", level1Category: "Область", level2Category: "Район", level3Category: "Громада" },
  { code: "TL", slug: "timorleste", flag: "🇹🇱", nameKo: "동티모르", nameEn: "Timor-Leste", nameNative: "Timor-Leste", level1Category: "Municipiu", level2Category: "Postu Administrativu", level3Category: "Suku" },
  { code: "AE", slug: "uae", flag: "🇦🇪", nameKo: "아랍에미리트", nameEn: "UAE", nameNative: "الإمارات", level1Category: "Emirate", level2Category: "City", level3Category: "District" },
  { code: "IT", slug: "italia", flag: "🇮🇹", nameKo: "이탈리아", nameEn: "Italy", nameNative: "Italia", level1Category: "Regione", level2Category: "Provincia", level3Category: "Comune" },
  { code: "EG", slug: "egypt", flag: "🇪🇬", nameKo: "이집트", nameEn: "Egypt", nameNative: "مصر", level1Category: "Governorate", level2Category: "Markaz / Kism", level3Category: "District" },
  { code: "ES", slug: "espania", flag: "🇪🇸", nameKo: "스페인", nameEn: "Spain", nameNative: "España", level1Category: "Comunidad", level2Category: "Provincia", level3Category: "Municipio" },
  { code: "IR", slug: "iran", flag: "🇮🇷", nameKo: "이란", nameEn: "Iran", nameNative: "ایران", level1Category: "Ostan", level2Category: "Shahrestan", level3Category: "Bakhsh" },
  { code: "NL", slug: "netherland", flag: "🇳🇱", nameKo: "네덜란드", nameEn: "Netherlands", nameNative: "Nederland", level1Category: "Provincie", level2Category: "Gemeente", level3Category: "Wijk" },
  { code: "PL", slug: "poland", flag: "🇵🇱", nameKo: "폴란드", nameEn: "Poland", nameNative: "Polska", level1Category: "Województwo", level2Category: "Powiat", level3Category: "Gmina" },
  { code: "ET", slug: "ethiopia", flag: "🇪🇹", nameKo: "에티오피아", nameEn: "Ethiopia", nameNative: "ኢትዮጵያ", level1Category: "Region", level2Category: "Zone", level3Category: "Woreda" },
  { code: "SE", slug: "sweden", flag: "🇸🇪", nameKo: "스웨덴", nameEn: "Sweden", nameNative: "Sverige", level1Category: "Län", level2Category: "Kommun", level3Category: "Distrikt" },
  { code: "IL", slug: "israel", flag: "🇮🇱", nameKo: "이스라엘", nameEn: "Israel", nameNative: "ישראל", level1Category: "District", level2Category: "City / Sub-district", level3Category: "Neighborhood" },
  { code: "DK", slug: "denmark", flag: "🇩🇰", nameKo: "덴마크", nameEn: "Denmark", nameNative: "Danmark", level1Category: "Region", level2Category: "Kommune", level3Category: "Sogn" },
  { code: "NO", slug: "norway", flag: "🇳🇴", nameKo: "노르웨이", nameEn: "Norway", nameNative: "Norge", level1Category: "Fylke", level2Category: "Kommune", level3Category: "Bydel" },
  { code: "MN", slug: "mongol", flag: "🇲🇳", nameKo: "몽골", nameEn: "Mongolia", nameNative: "Монгол", level1Category: "Аймаг / Хот", level2Category: "Сум / Дүүрэг", level3Category: "Баг / Хороо" },
  { code: "MX", slug: "mexico", flag: "🇲🇽", nameKo: "멕시코", nameEn: "Mexico", nameNative: "México", level1Category: "Estado", level2Category: "Municipio", level3Category: "Colonia" },
  { code: "BR", slug: "brazil", flag: "🇧🇷", nameKo: "브라질", nameEn: "Brazil", nameNative: "Brasil", level1Category: "Estado", level2Category: "Município", level3Category: "Bairro" },
  { code: "GR", slug: "greece", flag: "🇬🇷", nameKo: "그리스", nameEn: "Greece", nameNative: "Ελλάδα", level1Category: "Περιφέρεια", level2Category: "Περιφερειακή Ενότητα", level3Category: "Δήμος" },
  { code: "PT", slug: "portugal", flag: "🇵🇹", nameKo: "포르투갈", nameEn: "Portugal", nameNative: "Portugal", level1Category: "Distrito", level2Category: "Município", level3Category: "Freguesia" },
  { code: "ZA", slug: "southafrica", flag: "🇿🇦", nameKo: "남아프리카 공화국", nameEn: "South Africa", nameNative: "South Africa", level1Category: "Province", level2Category: "Municipality", level3Category: "Ward" },
  { code: "CH", slug: "swiss", flag: "🇨🇭", nameKo: "스위스", nameEn: "Switzerland", nameNative: "Schweiz", level1Category: "Kanton", level2Category: "Bezirk", level3Category: "Gemeinde" },
  { code: "PK", slug: "pakistan", flag: "🇵🇰", nameKo: "파키스탄", nameEn: "Pakistan", nameNative: "پاکستان", level1Category: "Province", level2Category: "Division", level3Category: "District" },
  { code: "SA", slug: "saudiarabia", flag: "🇸🇦", nameKo: "사우디아라비아", nameEn: "Saudi Arabia", nameNative: "السعودية", level1Category: "Region", level2Category: "Governorate", level3Category: "District" },
  { code: "YE", slug: "yemen", flag: "🇾🇪", nameKo: "예멘", nameEn: "Yemen", nameNative: "اليمن", level1Category: "Governorate", level2Category: "District", level3Category: "Sub-district" },
  { code: "IQ", slug: "iraq", flag: "🇮🇶", nameKo: "이라크", nameEn: "Iraq", nameNative: "العراق", level1Category: "Governorate", level2Category: "District", level3Category: "Sub-district" },
  { code: "BD", slug: "bangladesh", flag: "🇧🇩", nameKo: "방글라데시", nameEn: "Bangladesh", nameNative: "বাংলাদেশ", level1Category: "Division", level2Category: "District", level3Category: "Upazila" },
  { code: "US", slug: "us", flag: "🇺🇸", nameKo: "미국", nameEn: "USA", nameNative: "United States", level1Category: "State", level2Category: "County / City", level3Category: "ZIP / Neighborhood" },
  { code: "GB", slug: "uk", flag: "🇬🇧", nameKo: "영국", nameEn: "UK", nameNative: "United Kingdom", level1Category: "Country / Region", level2Category: "County / Borough", level3Category: "District" },
  { code: "CA", slug: "canada", flag: "🇨🇦", nameKo: "캐나다", nameEn: "Canada", nameNative: "Canada", level1Category: "Province / Territory", level2Category: "County / City", level3Category: "Neighborhood" },
  { code: "AU", slug: "australia", flag: "🇦🇺", nameKo: "호주", nameEn: "Australia", nameNative: "Australia", level1Category: "State / Territory", level2Category: "LGA / City", level3Category: "Suburb" },
  { code: "NZ", slug: "newzealand", flag: "🇳🇿", nameKo: "뉴질랜드", nameEn: "New Zealand", nameNative: "New Zealand", level1Category: "Region", level2Category: "Territorial Authority", level3Category: "Suburb" },
  { code: "SG", slug: "singapore", flag: "🇸🇬", nameKo: "싱가포르", nameEn: "Singapore", nameNative: "Singapore", level1Category: "Region", level2Category: "Planning Area", level3Category: "Subzone" },
  { code: "MY", slug: "malaysia", flag: "🇲🇾", nameKo: "말레이시아", nameEn: "Malaysia", nameNative: "Malaysia", level1Category: "Negeri", level2Category: "Daerah", level3Category: "Mukim" },
  { code: "NG", slug: "nigeria", flag: "🇳🇬", nameKo: "나이지리아", nameEn: "Nigeria", nameNative: "Nigeria", level1Category: "State", level2Category: "LGA", level3Category: "Ward" },
] as const;

export function getCountryInfo(code: CountryCode | undefined | null): CountryInfo {
  if (!code) return COUNTRIES[0];
  const upper = code.toUpperCase();
  const found = COUNTRIES.find((c) => c.code === upper || c.slug === code.toLowerCase());
  return found || COUNTRIES[0];
}

/**
 * Returns ONLY the localized country name (WITHOUT flag prepended),
 * resolving the duplicate second flag issue in UI.
/**
 * Get country display name localized to current locale.
 * Uses Intl.DisplayNames for accurate dictionary names across any locale (ko, en, vi, ja, zh, ru, id, etc.),
 * with fallbacks to nameKo / nameEn / nameNative.
 */
export function getCountryDisplayName(country: CountryInfo, locale: string): string {
  try {
    const intl = new Intl.DisplayNames([locale], { type: "region" });
    const name = intl.of(country.code);
    if (name) return name;
  } catch {
    // fallback if Intl.DisplayNames is not supported
  }

  if (locale === "ko") return country.nameKo;
  if (locale === "en") return country.nameEn;
  if (locale === "vi" && country.code === "VN") return country.nameNative;
  if ((locale === "zh-Hans" || locale === "zh-Hant") && (country.code === "CN" || country.code === "TW")) {
    return country.nameNative;
  }
  if (locale === "ja" && country.code === "JP") return country.nameNative;
  if (locale === "id" && country.code === "ID") return country.nameNative;
  if (locale === "ru" && country.code === "RU") return country.nameNative;
  return country.nameNative || country.nameEn;
}
