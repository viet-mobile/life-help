// lib/i18n/siteMetadata.ts
import type { Metadata } from "next";

export interface SiteMetaTranslation {
  tagline: string;
  description: string;
}

export const COUNTRY_TO_LANGUAGE_MAP: Record<string, string> = {
  korea: "ko",
  vietnam: "vi",
  japan: "ja",
  china: "zh-Hans",
  taiwan: "zh-Hant",
  philippines: "en",
  indonesia: "id",
  russia: "ru",
  uzbek: "uz",
  nepal: "ne",
  india: "hi",
  cambodia: "km",
  thailand: "th",
  myanmar: "my",
  srilanka: "si",
  kazakh: "kk",
  france: "fr",
  deutsch: "de",
  turkiye: "tr",
  ukraina: "uk",
  timorleste: "tet",
  uae: "ar",
  italia: "it",
  egypt: "arz",
  espania: "es",
  iran: "fa",
  netherland: "nl",
  poland: "pl",
  ethiopia: "am",
  sweden: "sv",
  israel: "he",
  denmark: "da",
  norway: "no",
  mongol: "mn",
  mexico: "es",
  brazil: "pt",
  greece: "el",
  portugal: "pt",
  southafrica: "en",
  swiss: "de",
  pakistan: "ur",
  saudiarabia: "ar",
  yemen: "ar",
  iraq: "ar",
  bangladesh: "bn",
  us: "en",
  uk: "en",
  canada: "en",
  australia: "en",
  newzealand: "en",
};

export const SITE_METADATA: Record<string, SiteMetaTranslation> = {
  ko: {
    tagline: "다국어 생활서비스 플랫폼",
    description:
      "한국 거주 외국인을 위한 생활서비스 플랫폼. 모국어로 상담하고 신뢰할 수 있는 지역 전문 헬퍼와 연결됩니다.",
  },
  vi: {
    tagline: "Nền tảng dịch vụ đời sống đa ngôn ngữ",
    description:
      "Nền tảng dịch vụ đời sống dành cho người nước ngoài tại Hàn Quốc. Tư vấn bằng tiếng mẹ đẻ và kết nối với thợ chuyên nghiệp uy tín.",
  },
  en: {
    tagline: "Multilingual Living Services Platform",
    description:
      "Living services platform for foreign residents in Korea. Consult in your native language and connect with verified local specialists.",
  },
  "zh-Hans": {
    tagline: "多语言生活服务平台",
    description:
      "面向在韩外国人的生活服务平台。使用母语即时咨询，直接连接值得信赖的本地专业师傅。",
  },
  "zh-Hant": {
    tagline: "多語言生活服務平台",
    description:
      "專為在韓外籍居民打造的生活服務平台。使用母語即時諮詢，快速媒合在地值得信賴的專業師傅。",
  },
  ja: {
    tagline: "多言語生活サービスプラットフォーム",
    description:
      "在韓外国人向け生活支援プラットフォーム。母国語で相談でき、信頼できる地域専門スタッフとマッチングします。",
  },
  pl: {
    tagline: "Wielojęzyczna platforma usług codziennych",
    description:
      "Platforma usług codziennych dla obcokrajowców w Korei. Konsultacje w języku ojczystym i kontakt ze sprawdzonymi lokalnymi fachowcami.",
  },
  de: {
    tagline: "Mehrsprachige Plattform für Alltagsdienste",
    description:
      "Plattform für Alltagsdienste für ausländische Bewohner in Korea. Beratung in der Muttersprache und Vermittlung geprüfter Handwerker.",
  },
  fr: {
    tagline: "Plateforme multilingue de services du quotidien",
    description:
      "Plateforme de services du quotidien pour les résidents étrangers en Corée. Conseils dans votre langue maternelle et mise en relation avec des artisans de confiance.",
  },
  es: {
    tagline: "Plataforma multilingüe de servicios para el hogar",
    description:
      "Plataforma de servicios del hogar para extranjeros en Corea. Asesoramiento en su idioma materno y conexión con técnicos locales de confianza.",
  },
  pt: {
    tagline: "Plataforma multilíngue de serviços cotidianos",
    description:
      "Plataforma de serviços cotidianos para estrangeiros na Coreia. Atendimento no seu idioma nativo e conexão com especialistas confiáveis.",
  },
  it: {
    tagline: "Piattaforma multilingue di servizi per la vita quotidiana",
    description:
      "Piattaforma multilingue di servizi per la vita quotidiana per residenti stranieri in Corea. Consulenza nella tua lingua madre e contatto con tecnici locali affidabili.",
  },
  ru: {
    tagline: "Многоязычная платформа бытовых услуг",
    description:
      "Платформа бытовых услуг для иностранцев в Корее. Консультации на родном языке и связь с проверенными местными мастерами.",
  },
  uk: {
    tagline: "Багатомовна платформа побутових послуг",
    description:
      "Платформа побутових послуг для іноземців у Кореї. Консультації рідною мовою та прямий зв'язок із перевіреними місцевими майстрами.",
  },
  tr: {
    tagline: "Çok Dilli Yaşam Hizmetleri Platformu",
    description:
      "Kore'de yaşayan yabancılar için yaşam hizmetleri platformu. Kendi ana dilinizde danışın ve güvenilir yerel uzman ustalarla bağlantı kurun.",
  },
  id: {
    tagline: "Platform Layanan Kehidupan Multibahasa",
    description:
      "Platform layanan kehidupan untuk warga asing di Korea. Konsultasi dalam bahasa ibu dan terhubung langsung dengan teknisi ahli lokal tepercaya.",
  },
  th: {
    tagline: "แพลตฟอร์มบริการการใช้ชีวิตหลายภาษา",
    description:
      "แพลตฟอร์มบริการการใช้ชีวิตสำหรับชาวต่างชาติในเกาหลี ปรึกษาด้วยภาษาแม่ของคุณและเชื่อมต่อกับช่างผู้เชี่ยวชาญในท้องถิ่นที่เชื่อถือได้",
  },
  nl: {
    tagline: "Meertalig platform voor levensdiensten",
    description:
      "Platform voor levensdiensten voor buitenlandse inwoners in Korea. Advies in uw moedertaal en direct contact met betrouwbare lokale vakmensen.",
  },
  sv: {
    tagline: "Flerspråkig plattform för vardagstjänster",
    description:
      "Plattform för vardagstjänster för utländska invånare i Korea. Rådgivning på modersmålet och koppling till pålitliga lokala hantverkare.",
  },
  da: {
    tagline: "Flersproget platform for hverdagstjenester",
    description:
      "Platform for hverdagstjenester for udenlandske beboere i Korea. Rådgivning på dit modersmål og forbindelse til pålidelige lokale håndværkere.",
  },
  no: {
    tagline: "Flerspråklig plattform for hverdagstjenester",
    description:
      "Plattform for hverdagstjenester for utenlandske innbyggere i Korea. Rådgivning på morsmålet og kontakt med pålitelige lokale fagfolk.",
  },
  el: {
    tagline: "Πολυγλωσσική πλατφόρμα υπηρεσιών καθημερινής ζωής",
    description:
      "Πλατφόρμα υπηρεσιών καθημερινής ζωής για αλλοδαπούς κατοίκους στην Κορέα. Συμβουλευτείτε στη μητρική σας γλώσσα και συνδεθείτε με αξιόπιστους τοπικούς ειδικούς τεχνικούς.",
  },
  ar: {
    tagline: "منصة الخدمات المعيشية متعددة اللغات",
    description:
      "منصة الخدمات المعيشية للمقيمين الأجانب في كوريا. استشارات بلغتك الأم وتواصل مباشر مع فنيين وخبراء محليين موثوقين.",
  },
  arz: {
    tagline: "منصة الخدمات المعيشية متعددة اللغات",
    description:
      "منصة الخدمات المعيشية للمقيمين الأجانب في كوريا. استشارات بلغتك الأم وتواصل مباشر مع فنيين وخبراء محليين موثوقين.",
  },
  fa: {
    tagline: "پلتفرم خدمات زندگی چندزبانه",
    description:
      "پلتفرم خدمات زندگی برای ساکنان خارجی در کره. مشاوره به زبان مادری و ارتباط با متخصصان معتمد محلی.",
  },
  he: {
    tagline: "פלטפורמת שירותי חיים רב-לשונית",
    description:
      "פלטפורמת שירותי חיים לתושבים זרים בקוריאה. ייעוץ בשפת האם וחיבור לבעלי מקצוע מקומיים מוסמכים.",
  },
  hi: {
    tagline: "बहुभाषी जीवन सेवा मंच",
    description:
      "कोरिया में विदेशी निवासियों के लिए जीवन सेवा मंच। अपनी मातृभाषा में परामर्श करें और विश्वसनीय स्थानीय तकनीशियनों से जुड़ें।",
  },
  bn: {
    tagline: "বহুভাষিক জীবন পরিষেবা প্ল্যাটফর্ম",
    description:
      "কোরিয়ায় বসবাসকারী বিদেশী নাগরিকদের জন্য জীবন পরিষেবা প্ল্যাটফর্ম। নিজের মাতৃভাষায় পরামর্শ নিন এবং বিশ্বস্ত স্থানীয় টেকনিশিয়ানদের সাথে যুক্ত হন।",
  },
  ta: {
    tagline: "பல்மொழி வாழ்க்கை சேவை தளம்",
    description:
      "கொரியாவில் வாழும் வெளிநாட்டினருக்கான வாழ்க்கை சேவை தளம். உங்கள் தாய்மொழியில் ஆலோசனை பெற்று நம்பகமான உள்ளூர் வல்லுநர்களுடன் இணையுங்கள்.",
  },
  si: {
    tagline: "බහුභාෂා ජීවන සේවා වේදිකාව",
    description:
      "කොරියාවේ වෙසෙන විදේශිකයන් සඳහා වන ජීවන සේවා වේදිකාව. ඔබේ මව්බසින් උපදෙස් ලබාගෙන විශ්වාසදායක ප්‍රදේශයේ කාර්මික ශිල්පීන් සමඟ සම්බන්ධ වන්න.",
  },
  ne: {
    tagline: "बहुभाषी जीवन सेवा प्लेटफर्म",
    description:
      "कोरियामा बस्ने विदेशी बासिन्दाहरूका लागि जीवन सेवा प्लेटफर्म। आफ्नै मातृभाषामा परामर्श लिनुहोस् र भरपર્दो स्थानीय प्राविधिकहरूसँग जोडिनुहोस्।",
  },
  my: {
    tagline: "ဘာသာစကားမျိုးစုံ လူနေမှုဘဝဝန်ဆောင်မှု ပလက်ဖောင်း",
    description:
      "ကိုရီးယားရှိ နိုင်ငံခြားသားများအတွက် လူနေမှုဘဝဝန်ဆောင်မှု ပလက်ဖောင်း။ မိခင်ဘာသာစကားဖြင့် ဆွေးနွေးတိုင်ပင်ပြီး စိတ်ချရသော ဒေသတွင်း ကျွမ်းကျင်ပညာရှင်များနှင့် တိုက်ရိုက်ချိတ်ဆက်ပါ။",
  },
  km: {
    tagline: "វេទិកាសេវាកម្មជីវិតពហុភាសា",
    description:
      "វេទិកាសេវាកម្មជីវិតសម្រាប់ជនបរទេសដែលរស់នៅក្នុងប្រទេសកូរ៉េ។ ពិគ្រោះជាភាសាកំណើតរបស់អ្នក និងភ្ជាប់ទំនាក់ទំនងជាមួយជាងជំនាញក្នុងតំបន់ដែលគួរឱ្យទុកចិត្ត។",
  },
  mn: {
    tagline: "Олон хэлний ахуйн үйлчилгээний платформ",
    description:
      "Солонгос улсад оршин суугаа гадаадын иргэдэд зориулсан ахуйн үйлчилгээний платформ. Эх хэлээрээ зөвлөгөө авч, найдвартай мэргэжилтнүүдтэй шууд холбогдоорой.",
  },
  kk: {
    tagline: "Көптілді тұрмыстық қызметтер платформасы",
    description:
      "Кореядағы шетелдік азаматтарға арналған тұрмыстық қызметтер платформасы. Өз ана тіліңізде кеңес алып, сенімді жергілікті шеберлермен байланысыңыз.",
  },
  uz: {
    tagline: "Ko'p tilli turmush xizmatlari platformasi",
    description:
      "Koreyada yashovchi chet elliklar uchun turmush xizmatlari platformasi. O'z ona tilingizda maslahat oling va ishonchli mahalliy ustalar bilan bog'laning.",
  },
  tet: {
    tagline: "Plataforma servisu moris nian iha lian barak",
    description:
      "Plataforma servisu moris nian ba ema estranjeiru sira ne'ebé hela iha Koreia. Konsulta ho ita-boot nia lian inan no liga ba tékniku profisionál lokál ne'ebé fiar-laek.",
  },
  am: {
    tagline: "የብዙ ቋንቋ የዕለት ተዕለት ኑሮ አገልግሎት መድረክ",
    description:
      "በኮሪያ ለሚኖሩ የውጭ ሀገር ዜጎች የተዘጋጀ የዕለት ተዕለት ኑሮ አገልግሎት መድረክ። በአፍ መፍቻ ቋንቋዎ ይማከሩ እና ከታመኑ የአካባቢው ባለሙያዎች ጋር ይገናኙ።",
  },
};

/**
 * Resolves the language code from request headers or host.
 */
export function resolveLanguageFromHeaders(headersList: Headers): string {
  // 1. Explicit x-life-language header (e.g. from /vi or proxy rewrite)
  const langHeader = headersList.get("x-life-language")?.toLowerCase();
  if (langHeader) {
    if (langHeader === "zt") return "zh-Hant";
    if (langHeader === "zs" || langHeader === "zh") return "zh-Hans";
    if (SITE_METADATA[langHeader]) return langHeader;
  }

  // 2. Explicit x-life-country header (e.g. from vietnam.life.help)
  const countryHeader = headersList.get("x-life-country")?.toLowerCase();
  if (countryHeader && COUNTRY_TO_LANGUAGE_MAP[countryHeader]) {
    return COUNTRY_TO_LANGUAGE_MAP[countryHeader];
  }

  // 3. Detect country from Host header (e.g. vietnam.life.help or tech.vietnam.life.help)
  const host = (headersList.get("host") ?? "").split(":")[0].toLowerCase();
  const parts = host.split(".");
  if (parts.length >= 3 && parts[parts.length - 1] === "help") {
    const candidateCountry =
      parts[0] === "tech" || parts[0] === "chat" || parts[0] === "sys"
        ? parts[1]
        : parts[0];
    if (candidateCountry && COUNTRY_TO_LANGUAGE_MAP[candidateCountry]) {
      return COUNTRY_TO_LANGUAGE_MAP[candidateCountry];
    }
  }

  // 4. Default to Korean
  return "ko";
}

/**
 * Returns dynamic Metadata with localized title and description for social link previews and browser titles.
 */
export function getSiteMetadata(lang: string): Metadata {
  const meta = SITE_METADATA[lang] || SITE_METADATA["ko"];
  const title = `LIFE.HELP | ${meta.tagline}`;
  const description = meta.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "LIFE.HELP",
      type: "website",
      locale: lang === "ko" ? "ko_KR" : lang,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

