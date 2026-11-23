// lib/i18n/siteMetadata.ts
import type { Metadata } from "next";
import { COUNTRIES_WITH_GENERIC_BRANDING } from "@/lib/region/countryBranding";
import { brandName, ogLocaleFor, countryBrandName } from "@/lib/i18n/seo";
import { locales } from "@/messages/registry";

export interface PortalMeta {
  title: string;
  description: string;
}

export interface SiteMetaTranslation {
  tagline: string;
  description: string;
  chat: PortalMeta;
  tech: PortalMeta;
  sys: PortalMeta;
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
  singapore: "en",
  malaysia: "en",
  nigeria: "en",
  elsalvador: "es",
  centralafrican: "fr",
  centralafrica: "fr",
  venezuela: "es",
  kenya: "sw",
  argentina: "es",
  czech: "en",
  romania: "en",
  finland: "en",
  czechia: "en",
  hungary: "en",
  zambia: "en",
  uganda: "en",
  congo: "fr",
  ghana: "en",
  mozambique: "pt",
};


export const COUNTRY_KOREAN_NAMES: Record<string, string> = {
  korea: "한국",
  japan: "일본",
  china: "중국",
  taiwan: "대만",
  vietnam: "베트남",
  philippines: "필리핀",
  indonesia: "인도네시아",
  russia: "러시아",
  uzbek: "우즈베키스탄",
  nepal: "네팔",
  india: "인도",
  cambodia: "캄보디아",
  thailand: "태국",
  myanmar: "미얀마",
  srilanka: "스리랑카",
  kazakh: "카자흐스탄",
  france: "프랑스",
  deutsch: "독일",
  turkiye: "튀르키예",
  ukraina: "우크라이나",
  timorleste: "동티모르",
  uae: "아랍에미리트",
  italia: "이탈리아",
  egypt: "이집트",
  espania: "스페인",
  iran: "이란",
  netherland: "네덜란드",
  poland: "폴란드",
  ethiopia: "에티오피아",
  sweden: "스웨덴",
  israel: "이스라엘",
  denmark: "덴마크",
  norway: "노르웨이",
  mongol: "몽골",
  mexico: "멕시코",
  brazil: "브라질",
  greece: "그리스",
  portugal: "포르투갈",
  southafrica: "남아프리카공화국",
  swiss: "스위스",
  pakistan: "파키스탄",
  saudiarabia: "사우디아라비아",
  yemen: "예멘",
  iraq: "이라크",
  bangladesh: "방글라데시",
  us: "미국",
  uk: "영국",
  canada: "캐나다",
  australia: "호주",
  newzealand: "뉴질랜드",
  singapore: "싱가포르",
  malaysia: "말레이시아",
  nigeria: "나이지리아",
  elsalvador: "엘살바도르",
  centralafrica: "중앙아프리카공화국",
  venezuela: "베네수엘라",
  kenya: "케냐",
  argentina: "아르헨티나",
  romania: "루마니아",
  finland: "핀란드",
  czechia: "체코",
  hungary: "헝가리",
  zambia: "잠비아",
  uganda: "우간다",
  congo: "콩고공화국",
  ghana: "가나",
  mozambique: "모잠비크",
};

export const COUNTRY_SLUG_TO_ISO2: Record<string, string> = {
  korea: "KR",
  vietnam: "VN",
  japan: "JP",
  china: "CN",
  taiwan: "TW",
  philippines: "PH",
  indonesia: "ID",
  russia: "RU",
  uzbek: "UZ",
  nepal: "NP",
  india: "IN",
  cambodia: "KH",
  thailand: "TH",
  myanmar: "MM",
  srilanka: "LK",
  kazakh: "KZ",
  france: "FR",
  deutsch: "DE",
  turkiye: "TR",
  ukraina: "UA",
  timorleste: "TL",
  uae: "AE",
  italia: "IT",
  egypt: "EG",
  espania: "ES",
  iran: "IR",
  netherland: "NL",
  poland: "PL",
  ethiopia: "ET",
  sweden: "SE",
  israel: "IL",
  denmark: "DK",
  norway: "NO",
  mongol: "MN",
  mexico: "MX",
  brazil: "BR",
  greece: "GR",
  portugal: "PT",
  southafrica: "ZA",
  swiss: "CH",
  pakistan: "PK",
  saudiarabia: "SA",
  yemen: "YE",
  iraq: "IQ",
  bangladesh: "BD",
  us: "US",
  uk: "GB",
  canada: "CA",
  australia: "AU",
  newzealand: "NZ",
  singapore: "SG",
  malaysia: "MY",
  nigeria: "NG",
  elsalvador: "SV",
  centralafrica: "CF",
  centralafrican: "CF",
  venezuela: "VE",
  kenya: "KE",
  argentina: "AR",
  romania: "RO",
  finland: "FI",
  czechia: "CZ",
  czech: "CZ",
  hungary: "HU",
  zambia: "ZM",
  uganda: "UG",
  congo: "CG",
  ghana: "GH",
  mozambique: "MZ",
};

export const DEFAULT_KOREA_NAMES: Record<string, string> = {
  ko: "한국",
  vi: "Hàn Quốc",
  en: "Korea",
  "zh-Hans": "韩国",
  "zh-Hant": "韓國",
  ja: "韓国",
  pl: "Korei",
  de: "Korea",
  fr: "Corée",
  es: "Corea",
  pt: "Coreia",
  it: "Corea",
  ru: "Корее",
  uk: "Кореї",
  tr: "Kore",
  id: "Korea",
  th: "เกาหลี",
  nl: "Korea",
  sv: "Korea",
  da: "Korea",
  no: "Korea",
  el: "Κορέα",
  ar: "كوريا",
  arz: "كوريا",
  ur: "کوریا",
  sw: "Korea",
  mr: "कोरिया",
  gu: "કોરિયા",
  pa: "ਕੋਰੀਆ",
  te: "కొరియా",
  kn: "ಕೊರಿಯಾ",
  ml: "കൊറിയ",
  fa: "کره",
  he: "קוריאה",
  hi: "कोरिया",
  bn: "কোরিয়া",
  ta: "கொரியா",
  si: "කොරියාව",
  ne: "कोरिया",
  my: "ကိုရီးယား",
  km: "កូរ៉េ",
  mn: "Солонгос",
  kk: "Корея",
  uz: "Koreya",
  tet: "Koreia",
  am: "ኮሪያ",
  tl: "Korea",
  ms: "Korea",
  pcm: "Korea",
  ro: "Coreea",
  cs: "Koreji",
  af: "Korea",
  hu: "Koreában",
  fi: "Koreassa",
  ka: "კორეაში",
  yue: "韓國",
  ca: "Corea",
  bg: "Корея",
  tg: "Корея",
  as: "কোৰিয়া",
  az: "Koreya",
  ceb: "Korea",
  et: "Koreas",
  eu: "Korean",
  gl: "Corea",
  ha: "Koriya",
  hr: "Koreji",
  ig: "Korea",
  is: "Kóreu",
  jv: "Korea",
  ku: "Koreya",
  lt: "Korėjoje",
  lv: "Korejā",
  mg: "Korea",
  mk: "Кореја",
  om: "Kooriyaa",
  ps: "کوریا",
  sd: "ڪوريا",
  sg: "Korëe",
  sk: "Kórei",
  sl: "Koreji",
  sn: "Korea",
  so: "Kuuriyada Koonfureed",
  sq: "Kore",
  sr: "Кореји",
  su: "Koréa",
  xh: "eKorea",
  yo: "Koria",
  zu: "eKorea",
};

export const SITE_DESCRIPTION_TEMPLATES: Record<string, string> = {
  ko: "{country}에 사는 모든 사람을 위한 생활서비스 플랫폼. 모국어로 상담하고 신뢰할 수 있는 지역 전문 헬퍼와 연결됩니다.",
  vi: "Nền tảng dịch vụ sinh hoạt cho tất cả mọi người sinh sống tại {country}. Tư vấn bằng tiếng mẹ đẻ và kết nối với thợ chuyên nghiệp địa phương đáng tin cậy.",
  en: "Living services platform for all people living in {country}. Consult in your native language and connect with verified local specialists.",
  "zh-Hans": "面向所有在{country}居民的生活服务平台。使用母语即时咨询，直接连接值得信赖的本地专业师傅。",
  "zh-Hant": "專為在{country}所有居民打造的生活服務平臺。使用母語即時諮詢，快速媒合在地值得信賴的專業師傅。",
  ja: "{country}に住むすべての人のための生活支援プラットフォーム。母国語で相談でき、信頼できる地域専門スタッフとマッチングします。",
  pl: "Platforma usług codziennych dla wszystkich mieszkańców w {country}. Konsultacje w języku ojczystym i kontakt ze sprawdzonymi lokalnymi fachowcami.",
  de: "Plattform für Alltagsdienste für alle Menschen in {country}. Beratung in der Muttersprache und Vermittlung geprüfter Handwerker.",
  fr: "Plateforme de services du quotidien pour tous les résidents en {country}. Conseils dans votre langue maternelle et mise en relation avec des artisans de confiance.",
  es: "Plataforma de servicios del hogar para todas las personas que viven en {country}. Asesoramiento en su idioma materno y conexión con técnicos locales de confianza.",
  pt: "Plataforma de serviços cotidianos para todas as pessoas que vivem em {country}. Atendimento no seu idioma nativo e conexão com especialistas confiáveis.",
  it: "Piattaforma di servizi per la vita quotidiana per tutte le persone che vivono in {country}. Consulenza nella tua lingua madre e contatto con tecnici locali affidabili.",
  ru: "Платформа бытовых услуг для всех жителей в {country}. Консультации на родном языке и связь с проверенными местными мастерами.",
  uk: "Платформа побутових послуг для всіх жителів у {country}. Консультації рідною мовою та прямий зв'язок із перевіреними місцевими майстрами.",
  tr: "{country}'de yaşayan herkes için yaşam hizmetleri platformu. Kendi ana dilinizde danışın ve güvenilir yerel uzman ustalarla bağlantı kurun.",
  id: "Platform layanan kehidupan untuk semua orang yang tinggal di {country}. Konsultasi dalam bahasa ibu dan terhubung langsung dengan teknisi ahli lokal tepercaya.",
  th: "แพลตฟอร์มบริการการใช้ชีวิตสำหรับทุกคนที่อาศัยอยู่ใน{country} ปรึกษาด้วยภาษาแม่ของคุณและเชื่อมต่อกับช่างผู้เชี่ยวชาญในท้องถิ่นที่เชื่อถือได้",
  nl: "Platform voor levensdiensten voor alle inwoners in {country}. Advies in uw moedertaal en direct contact met betrouwbare lokale vakmensen.",
  sv: "Plattform för vardagstjänster för alla som bor i {country}. Rådgivning på modersmålet och koppling till pålitliga lokala hantverkare.",
  da: "Platform for hverdagstjenester for alle, der bor i {country}. Rådgivning på dit modersmål og forbindelse til pålidelige lokale håndværkere.",
  no: "Plattform for hverdagstjenester for alle som bor i {country}. Rådgivning på morsmålet og kontakt med pålitelige lokale fagfolk.",
  el: "Πλατφόρμα υπηρεσιών καθημερινής ζωής για όλους τους κατοίκους σε {country}. Συμβουλευτείτε στη μητρική σας γλώσσα και συνδεθείτε με αξιόπιστους τοπικούς ειδικούς τεχνικούς.",
  ar: "منصة الخدمات المعيشية لجميع المقيمين في {country}. استشارات بلغتك الأم وتواصل مباشر مع فنيين وخبراء محليين موثوقين.",
  arz: "منصة الخدمات المعيشية لجميع المقيمين في {country}. استشارات بلغتك الأم وتواصل مباشر مع فنيين وخبراء محليين موثوقين.",
  ur: "{country} میں مقیم تمام افراد کے لیے روزمرہ خدمات کا پلیٹ فارم۔ اپنی مادری زبان میں مشورہ اور قابلِ اعتماد مقامی ماہرین سے رابطہ۔",
  sw: "Jukwaa la huduma za maisha kwa watu wote wanaoishi {country}. Pata ushauri kwa lugha yako na uunganishwe na mafundi waliothibitishwa.",
  mr: "{country}मधील सर्व नागरिकांसाठी जीवनावश्यक सेवा प्लॅटफॉर्म. तुमच्या मातृभाषेत सल्ला घ्या आणि सत्यापित स्थानिक तज्ज्ञांशी संपर्क साधा.",
  gu: "{country}માં રહેતા તમામ લોકો માટે જીવનજરૂરી સેવા પ્લેટફોર્મ. તમારી માતૃભાષામાં સલાહ લો અને ચકાસાયેલ સ્થાનિક નિષ્ણાતો સાથે જોડાઓ.",
  pa: "{country} ਵਿੱਚ ਰਹਿਣ ਵਾਲੇ ਸਾਰੇ ਲੋਕਾਂ ਲਈ ਜੀਵਨ ਸੇਵਾਵਾਂ ਪਲੇਟਫਾਰਮ। ਆਪਣੀ ਮਾਂ-ਬੋਲੀ ਵਿੱਚ ਸਲਾਹ ਲਵੋ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਸਥਾਨਕ ਮਾਹਿਰਾਂ ਨਾਲ ਜੁੜੋ।",
  te: "{country}లో నివసిస్తున్న ప్రజలందరి కోసం జీవన సేవల ప్లాట్‌ఫారమ్. మీ మాతృభాషలో సంప్రదించండి మరియు ధృవీకరించబడిన స్థానిక నిపుణులతో కనెక్ట్ అవ్వండి.",
  kn: "{country}ದಲ್ಲಿ ವಾಸಿಸುವ ಪ್ರತಿಯೊಬ್ಬರಿಗಾಗಿ ಜೀವನ ಸೇವೆಗಳ ವೇದಿಕೆ. ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಸಮಾಲೋಚಿಸಿ ಮತ್ತು ಪರಿಶೀಲಿಸಿದ ಸ್ಥಳೀಯ ತಜ್ಞರೊಂದಿಗೆ ಸಂಪರ್ਕ ಸಾಧಿಸಿ.",
  ml: "{country}യിൽ താമസിക്കുന്ന എല്ലാവർക്കുമുള്ള ജീവിത സേവന പ്ലാറ്റ്‌ഫോം. നിങ്ങളുടെ മാതൃഭാഷയിൽ കൂടിയാലോചിക്കുകയും പരിശോധിച്ചുറപ്പിച്ച പ്രാദേശിക വിദഗ്ധരുമായി ബന്ധപ്പെടുകയും ചെയ്യുക.",
  fa: "پلتفرم خدمات زندگی برای همه ساکنان در {country}. مشاوره به زبان مادری و ارتباط با متخصصان معتمد محلی.",
  he: "פלטפורמת שירותי חיים לכל האנשים החיים ב{country}. ייעוץ בשפת האם וחיבור לבעלי מקצוע מקומיים מוסמכים.",
  hi: "{country} में रहने वाले सभी लोगों के लिए जीवन सेवा मंच। अपनी मातृभाषा में परामर्श करें और विश्वसनीय स्थानीय तकनीशियनों से जुड़ें।",
  bn: "{country}-এ বসবাসকারী সকল মানুষের জন্য জীবন পরিষেবা প্ল্যাটফর্ম। নিজের মাতৃভাষায় পরামর্শ নিন এবং বিশ্বস্ত স্থানীয় টেকনিশিয়ানদের সাথে যুক্ত হন।",
  ta: "{country}யில் வாழும் அனைவருக்கும் வாழ்க்கை சேவை தளம். உங்கள் தாய்மொழியில் ஆலோசனை பெற்று நம்பகமான உள்ளூர் வல்லுநர்களுடன் இணையுங்கள்.",
  si: "{country}හි වෙසෙන සියලුම ජනතාව සඳහා වන ජීවන සේවා වේදිකාව. ඔබේ මව්බසින් උපදෙස් ලබාගෙන විශ්වාසදායක ප්‍රදේශයේ කාර්මික ශිල්පීන් සමඟ සම්බන්ධ වන්න.",
  ne: "{country}मा बस्ने सबै मानिसहरूका लागि जीवन सेवा प्लेटफर्म। आफ्नै मातृभाषामा परामर्श लिनुहोस् र भरपર્दो स्थानीय प्राविधिकहरूसँग जोडिनुहोस्।",
  my: "{country}ရှိ လူတိုင်းအတွက် လူနေမှုဘဝဝန်ဆောင်မှု ပလက်ဖောင်း။ မိခင်ဘာသာစကားဖြင့် ဆွေးနွေးတိုင်ပင်ပြီး စိတ်ချရသော ဒေသတွင်း ကျွမ်းကျင်ပညာရှင်များနှင့် တိုက်ရိုက်ချိတ်ဆက်ပါ။",
  km: "វេទិកាសេវាកម្មជីវិតសម្រាប់មនុស្សគ្រប់រូបដែលរស់នៅក្នុង{country}។ ពិគ្រោះជាភាសាកំណើតរបស់អ្នក និងភ្ជាប់ទំនាក់ទំនងជាមួយជាងជំនាញក្នុងតំបន់ដែលគួរឱ្យទុកចិត្ត។",
  mn: "{country} улсад оршин суугаа бүх хүнд зориулсан ахуйн үйлчилгээний платформ. Эх хэлээрээ зөвлөгөө авч, найдвартай мэргэжилтнүүдтэй шууд холбогдоорой.",
  kk: "{country} еліндегі барлық тұрғындарға арналған тұрмыстық қызметтер платформасы. Өз ана тіліңізде кеңес алып, сенімді жергілікті шеберлермен байланысыңыз.",
  uz: "{country}da yashovchi barcha aholi uchun turmush xizmatlari platformasi. O'z ona tilingizda maslahat oling va ishonchli mahalliy ustalar bilan bog'laning.",
  tet: "Plataforma servisu moris nian ba ema hotu ne'ebé hela iha {country}. Konsulta ho ita-boot nia lian inan no liga ba tékniku profisionál lokál ne'ebé fiar-laek.",
  am: "በ{country} ለሚኖሩ ሰዎች ሁሉ የተዘጋጀ የዕለት ተዕለት ኑሮ አገልግሎት መድረክ። በአፍ መፍቻ ቋንቋዎ ይማከሩ እና ከታመኑ የአካባቢው ባለሙያዎች ጋር ይገናኙ。",
  tl: "Platform ng mga serbisyo sa pamumuhay para sa lahat ng naninirahan sa {country}. Kumonsulta sa iyong sariling wika at kumonekta sa mga pinagkakatiwalaang lokal na espesyalista.",
  ms: "Platform perkhidmatan kehidupan untuk semua orang yang tinggal di {country}. Berunding dalam bahasa ibunda anda dan berhubung dengan pakar tempatan yang dipercayai.",
  pcm: "Living service platform for all people wey dey stay for {country}. Make una chat with una mama tongue and connect with local specialists wey una fit trust.",
  ro: "Platformă de servicii cotidiene pentru toți cei care locuiesc în {country}. Consultați în limba maternă și conectați-vă cu specialiști locali de încredere.",
  cs: "Platforma životních služeb pro všechny lidi žijící v {country}. Poraďte se ve svém rodném jazyce a spojte se s ověřenými místními specialisty.",
  af: "Lewensdienste-platform vir almal wat in {country} woon. Raadpleeg in jou moedertaal en skakel met betroubare plaaslike spesialiste.",
  hu: "Életviteli szolgáltatási platform mindenkinek, aki itt él: {country}. Konzultáljon anyanyelvén, és vegye fel a kapcsolatot megbízható helyi szakemberekkel.",
  fi: "Arjen palvelualusta kaikille maassa {country} asuville. Keskustele äidinkielelläsi ja ota yhteyttä luotettaviin paikallisiin asiantuntijoihin.",
  ka: "საცხოვრებელი მომსახურების პლატფორმა მათთვის, ვინც ცხოვრობს {country}. გაიარეთ კონსულტაცია მშობლიურ ენაზე და დაუკავშირდით სანდო ადგილობრივ სპეციალისტებს.",
  yue: "專為在{country}所有居民打造嘅生活服務平臺。使用母語即時諮詢，快速媒合在地值得信賴嘅專業師傅。",
  ca: "Plataforma de serveis del dia a dia per a tothom que viu a {country}. Consulta en la teva llengua materna i connecta amb especialistes locals de confiança.",
  bg: "Платформа за битови услуги за всички живеещи в {country}. Консултирайте се на родния си език и се свържете с надеждни местни специалисти.",
  tg: "Платформаи хидматрасонии маишӣ барои ҳамаи сокинони {country}. Дар забони модарии худ маслиҳат гиред ва бо мутахассисони боэътимоди маҳаллӣ пайваст шавед.",
  as: "{country}ত বাস কৰা সকলো লোকৰ বাবে জীৱন-যাপন সেৱা মঞ্চ। আপোনাৰ মাতৃভাষাত পৰামৰ্শ লওক আৰু বিশ্বস্ত স্থানীয় বিশেষজ্ঞসকলৰ সৈতে সংযোগ কৰক।",
  az: "{country} ərazisində yaşayan hər kəs üçün məişət xidmətləri platforması. Öz ana dilinizdə məsləhətləşin və etibarlı yerli mütəxəssislərlə əlaqə saxlayın.",
  ceb: "Plataporma sa serbisyo sa panginabuhi alang sa tanan nga nagpuyo sa {country}. Pagkonsulta sa imong lumad nga pinulongan ug pakigkita sa kasaligang lokal nga mga espesyalista.",
  et: "Igapäevateenuste platvorm kõigile, kes elavad riigis {country}. Konsulteerige oma emakeeles ja võtke ühendust usaldusväärsete kohalike spetsialistidega.",
  eu: "{country} herrialdean bizi diren guztientzako bizi-zerbitzuen plataforma. Kontsultatu zure ama-hizkuntzan eta konektatu tokiko espezialista fidagarriekin.",
  gl: "Plataforma de servizos vitais para todas as persoas que viven en {country}. Consulta na túa lingua materna e conecta con especialistas locais de confianza.",
  ha: "Dandalin ayyukan yau da kullun ga duk mutanen da ke zaune a {country}. Nemi shawara da yarenku na asali kuma ku haɗu da kwararrun masana na gida abin dogaro.",
  hr: "Platforma svakodnevnih usluga za sve ljude koji žive u {country}. Savjetujte se na svom materinjem jeziku i povežite se s provjerenim lokalnim stručnjacima.",
  ig: "Usoro ọrụ ndụ maka mmadụ niile bi na {country}. Kpọtụrụ anyị n'asụsụ obodo gị ma jikọọ ndị ọkachamara obodo a pụrụ ịtụkwasị obi.",
  is: "Þjónustuvettvangur fyrir alla sem búa í {country}. Fáðu ráðgjöf á þínu móðurmáli og hafðu samband við trausta sérfræðinga á staðnum.",
  jv: "Platform layanan urip kanggo kabeh wong sing manggon ing {country}. Konsultasi nganggo basa ibu sampeyan lan sambung karo spesialis lokal sing dipercaya.",
  ku: "Platforma xizmetên jiyanê ji bo her kesê li {country} dijî. Bi zimanê dayika xwe şêwir bikin û bi pisporên herêmî yên pêbawer re têkilî daynin.",
  lt: "Gyvenimo paslaugų platforma visiems, gyvenantiems {country}. Konsultuokitės gimtąja kalba ir susisiekite su patikimais vietos specialistais.",
  lv: "Sadzīves pakalpojumu platforma ikvienam, kas dzīvo {country}. Konsultējieties dzimtajā valodā un sazinieties ar uzticamiem vietējiem speciālistiem.",
  mg: "Sehatra tolotra fiainana ho an'ny rehetra monina ao {country}. Manontania amin'ny fitenin-dreninao ary mifandraisa amin'ireo manampahaizana manokana azo itokisana.",
  mk: "Платформа за животни услуги за сите луѓе што живеат во {country}. Консултирајте се на вашиот мајчин јазик и поврзете се со доверливи локални специјалисти.",
  om: "Wirtuu tajaajila jireenyaa namoota {country} keessa jiraatan hundaaf. Afaan dhalootaa keessaniin mari'adhaa ogeeyyii naannoo amanamaa waliin walqunnamaa.",
  ps: "د هر هغه چا لپاره د ژوند د خدمتونو پلیټفارم چې په {country} کې ژوند کوي. په خپله مورنۍ ژبه مشوره وکړئ او د باوري محلي متخصصینو سره اړیکه ونیسئ.",
  sd: "{country} ۾ رهندڙ سڀني ماڻهن لاءِ زندگي جي خدمتن جو پليٽ فارم. پنهنجي مادري زبان ۾ صلاح وٺو ۽ قابل اعتماد مقامي ماهرن سان رابطو ڪريو.",
  sg: "Gbâ ti a-service ti lâ oko oko ndali ti azo kue so ayeke na {country}. Sâra tënë na yanga ti kodro ti mo na wara atongani ti ndo ni so a lingbi ti zia bê na ala.",
  sk: "Platforma každodenných služieb pre všetkých ľudí žijúcich v {country}. Poraďte sa vo svojom rodnom jazyku a spojte sa s overenými miestnymi špecialistami.",
  sl: "Platforma za vsakodnevne storitve za vse, ki živijo v {country}. Posvetujte se v maternem jeziku in se povežite z zaupanja vrednimi lokalnimi strokovnjaki.",
  sn: "Nzvimbo yebasa reupenyu kune vanhu vose vanogara mu{country}. Bvunzai nemutauro wenyu uye batana nenyanzvi dzenharaunda dzinovimbika.",
  so: "Madal adeegyada nolosha oo loogu talagalay dhammaan dadka ku nool {country}. Kula tasho afkaaga hooyo oo la xiriir khubaro maxalli ah oo la aamini karo.",
  sq: "Platforma e shërbimeve të jetesës për të gjithë njerëzit që jetojnë në {country}. Konsultohuni në gjuhën tuaj amtare dhe lidhuni me specialistë vendorë të besueshëm.",
  sr: "Платформа за свакодневне услуге за све људе који живе у {country}. Саветујте се на свом матерњем језику и повежите се са провереним локалним стручњацима.",
  su: "Platform ladenan kahirupan pikeun sakumna jalma anu cicing di {country}. Konsultasi dina basa indung anjeun sarta sambungkeun jeung ahli lokal anu tiasa dipercaya.",
  xh: "Iqonga leenkonzo zobomi kumntu wonke ohlala e{country}. Dlana indlebe ngolwimi lwakho lwenkobe kwaye uqhagamshelane neengcali zalapha ezithembekileyo.",
  yo: "Pẹpẹ iṣẹ igbe aye fun gbogbo eniyan ti n gbe ni {country}. Kan si wa ni ede abinibi rẹ ki o sopọ mọ awọn alamọja agbegbe ti o ni igbẹkẹle.",
  zu: "Inkundla yezinsizakalo zokuphila yabo bonke abantu abahlala e{country}. Xhumana ngolimi lwakho lwebele futhi uxhumane nochwepheshe bendawo abathembekile.",
};

export function getLocalizedCountryName(countrySlug: string | null | undefined, lang: string): string {
  const normSlug = countrySlug?.toLowerCase().trim() || "";

  // 1. 기본 한국인 경우
  if (!normSlug || normSlug === "korea") {
    return DEFAULT_KOREA_NAMES[lang] || DEFAULT_KOREA_NAMES["ko"] || "한국";
  }

  // 2. 한국어(ko)의 경우 일상적인 한글 국가명
  if (lang === "ko") {
    if (COUNTRY_KOREAN_NAMES[normSlug]) {
      return COUNTRY_KOREAN_NAMES[normSlug];
    }
  }

  // 3. 영어(en) 친화적 관용구 오버라이드
  if (lang === "en") {
    if (normSlug === "us") return "the United States";
    if (normSlug === "uk") return "the United Kingdom";
    if (normSlug === "uae") return "the UAE";
    if (normSlug === "netherland") return "the Netherlands";
    if (normSlug === "philippines") return "the Philippines";
  }

  // 4. zh-Hant 오버라이드
  if (lang === "zh-Hant" && normSlug === "korea") {
    return "韓國";
  }

  // 5. ISO 코드를 통한 Intl.DisplayNames 번역
  const iso2 = COUNTRY_SLUG_TO_ISO2[normSlug];
  if (iso2) {
    try {
      if (typeof Intl !== "undefined" && Intl.DisplayNames) {
        const dn = new Intl.DisplayNames([lang], { type: "region", fallback: "none" });
        const name = dn.of(iso2);
        if (name && name !== iso2) {
          return name;
        }
      }
    } catch {
      // ignore
    }
  }

  return COUNTRY_KOREAN_NAMES[normSlug] || normSlug.toUpperCase();
}

export function getLocalizedSiteDescription(lang: string, countrySlug?: string | null): string {
  const template = SITE_DESCRIPTION_TEMPLATES[lang] || SITE_DESCRIPTION_TEMPLATES["ko"];
  const countryName = getLocalizedCountryName(countrySlug, lang);
  return template.replace(/\{country\}/g, countryName);
}

export const SITE_METADATA: Record<string, SiteMetaTranslation> = {
  ko: {
    tagline: "다국어 생활서비스 플랫폼",
    description: "한국에 사는 모든 사람을 위한 생활서비스 플랫폼. 모국어로 상담하고 신뢰할 수 있는 지역 전문 헬퍼와 연결됩니다.",
    chat: {
      title: "모국어 상담 센터",
      description: "한국 생활의 도움을 모국어로 요청하세요. 헬퍼와 1:1로 대화하며 메시지는 기계 번역됩니다.",
    },
    tech: {
      title: "헬퍼 포털",
      description: "LIFE.HELP 헬퍼를 위한 업무 포털. 근무 가능 여부와 배정된 신청을 관리하세요.",
    },
    sys: {
      title: "본사 통합 관리 시스템",
      description: "LIFE.HELP 공식 본사 통합 관제 및 운영 관리 시스템.",
    },
  },
  vi: {
    tagline: "Nền tảng dịch vụ sinh hoạt đa ngôn ngữ",
    description: "Nền tảng dịch vụ sinh hoạt cho tất cả mọi người sinh sống tại Hàn Quốc. Tư vấn bằng tiếng mẹ đẻ và kết nối với thợ chuyên nghiệp địa phương đáng tin cậy.",
    chat: {
      title: "Trung tâm hỗ trợ bằng tiếng mẹ đẻ",
      description: "Nhờ giúp đỡ về cuộc sống tại Hàn Quốc bằng chính ngôn ngữ của bạn. Trò chuyện 1:1 với người hỗ trợ; tin nhắn được dịch bằng máy.",
    },
    tech: {
      title: "Cổng đối tác thợ chuyên nghiệp",
      description: "Cổng làm việc dành cho đối tác hỗ trợ của LIFE.HELP. Quản lý lịch có thể làm việc và các yêu cầu được giao cho bạn.",
    },
    sys: {
      title: "Hệ thống quản trị tổng bộ",
      description: "Hệ thống kiểm soát và điều hành quản trị tập trung chính thức của LIFE.HELP.",
    },
  },
  en: {
    tagline: "Multilingual Living Services Platform",
    description: "Living services platform for all people living in Korea. Consult in your native language and connect with verified local specialists.",
    chat: {
      title: "Native Language Help Center",
      description: "Ask for help with life in Korea in your own language. Chat 1:1 with a helper; messages are machine-translated.",
    },
    tech: {
      title: "Specialist Helper Partner Portal",
      description: "Work portal for LIFE.HELP helper partners. Manage your availability and the requests assigned to you.",
    },
    sys: {
      title: "Headquarters Integrated Control System",
      description: "Official centralized operations and control management system for LIFE.HELP.",
    },
  },
  "zh-Hans": {
    tagline: "多语言生活服务平台",
    description: "面向所有在韩国居民的生活服务平台。使用母语即时咨询，直接连接值得信赖的本地专业师傅。",
    chat: {
      title: "母语咨询中心",
      description: "用您的母语请求在韩国生活中的帮助。与帮手进行1对1聊天,消息由机器翻译。",
    },
    tech: {
      title: "专业师傅合作门户",
      description: "LIFE.HELP 帮手合作伙伴的工作门户。管理您的可工作状态和分配给您的请求。",
    },
    sys: {
      title: "总部统一运营管控系统",
      description: "LIFE.HELP 官方总部统一调度与运营指挥管控系统。",
    },
  },
  "zh-Hant": {
    tagline: "多語言生活服務平臺",
    description: "專為在韓國所有居民打造的生活服務平臺。使用母語即時諮詢，快速媒合在地值得信賴的專業師傅。",
    chat: {
      title: "母語諮詢中心",
      description: "用您的母語請求在韓國生活中的協助。與幫手進行1對1聊天,訊息由機器翻譯。",
    },
    tech: {
      title: "專業師傅工作平臺",
      description: "LIFE.HELP 幫手合作夥伴的工作入口網站。管理您的可工作狀態與分配給您的請求。",
    },
    sys: {
      title: "總部統一營運管控系統",
      description: "LIFE.HELP 官方總部統一調度與營運指揮管控系統。",
    },
  },
  ja: {
    tagline: "多言語生活サービスプラットフォーム",
    description: "韓国に住むすべての人のための生活支援プラットフォーム。母国語で相談でき、信頼できる地域専門スタッフとマッチングします。",
    chat: {
      title: "母国語相談センター",
      description: "韓国での生活の困りごとを、母国語で相談できます。ヘルパーと1対1でチャットし、メッセージは機械翻訳されます。",
    },
    tech: {
      title: "専門スタッフ(ヘルパー)ポータル",
      description: "LIFE.HELPのヘルパーパートナー向け業務ポータル。対応可否や割り当てられた依頼を管理できます。",
    },
    sys: {
      title: "本部統合管理システム",
      description: "LIFE.HELP 公式本部統合オペレーション＆管理システム。",
    },
  },
  pl: {
    tagline: "Wielojęzyczna platforma usług codziennych",
    description: "Platforma usług codziennych dla wszystkich mieszkańców w Korei. Konsultacje w języku ojczystym i kontakt ze sprawdzonymi lokalnymi fachowcami.",
    chat: {
      title: "Centrum pomocy w języku ojczystym",
      description: "Poproś o pomoc w życiu w Korei w swoim języku. Rozmawiaj 1:1 z pomocnikiem; wiadomości są tłumaczone maszynowo.",
    },
    tech: {
      title: "Portal oficjalnych partnerów i fachowców",
      description: "Portal pracy dla pomocników partnerskich LIFE.HELP. Zarządzaj swoją dostępnością i przypisanymi Ci zgłoszeniami.",
    },
    sys: {
      title: "Zintegrowany system zarządzania centrali",
      description: "Oficjalny centralny system nadzoru i zarządzania operacyjnego LIFE.HELP.",
    },
  },
  de: {
    tagline: "Mehrsprachige Plattform für Alltagsdienste",
    description: "Plattform für Alltagsdienste für alle Menschen in Korea. Beratung in der Muttersprache und Vermittlung geprüfter Handwerker.",
    chat: {
      title: "Hilfezentrum in der Muttersprache",
      description: "Bitten Sie in Ihrer eigenen Sprache um Hilfe für das Leben in Korea. Chatten Sie 1:1 mit einem Helfer; Nachrichten werden maschinell übersetzt.",
    },
    tech: {
      title: "Partnerportal für zertifizierte Helfer",
      description: "Arbeitsportal für die Helfer-Partner von LIFE.HELP. Verwalten Sie Ihre Verfügbarkeit und die Ihnen zugewiesenen Anfragen.",
    },
    sys: {
      title: "Zentrales Verwaltungssystem der Unternehmenszentrale",
      description: "Offizielles integriertes Leit- und Betriebsmanagementsystem von LIFE.HELP.",
    },
  },
  fr: {
    tagline: "Plateforme multilingue de services du quotidien",
    description: "Plateforme de services du quotidien pour tous les résidents en Corée. Conseils dans votre langue maternelle et mise en relation avec des artisans de confiance.",
    chat: {
      title: "Centre d'aide en langue maternelle",
      description: "Demandez de l'aide pour la vie en Corée dans votre propre langue. Discutez en 1:1 avec un assistant ; les messages sont traduits automatiquement.",
    },
    tech: {
      title: "Portail des artisans et partenaires agréés",
      description: "Portail de travail pour les assistants partenaires de LIFE.HELP. Gérez vos disponibilités et les demandes qui vous sont attribuées.",
    },
    sys: {
      title: "Système de gestion intégrée du siège",
      description: "Système centralisé officiel de gestion et d'opérations de LIFE.HELP.",
    },
  },
  es: {
    tagline: "Plataforma multilingüe de servicios para el hogar",
    description: "Plataforma de servicios del hogar para todas las personas que viven en Corea. Asesoramiento en su idioma materno y conexión con técnicos locales de confianza.",
    chat: {
      title: "Centro de ayuda en tu lengua materna",
      description: "Pide ayuda para la vida en Corea en tu propio idioma. Chatea 1:1 con un ayudante; los mensajes se traducen automáticamente.",
    },
    tech: {
      title: "Portal de Socios Especialistas (Helper)",
      description: "Portal de trabajo para los ayudantes asociados de LIFE.HELP. Gestiona tu disponibilidad y las solicitudes que se te asignan.",
    },
    sys: {
      title: "Sistema Integrado de Control de la Sede Central",
      description: "Sistema oficial de operaciones y control centralizado de LIFE.HELP.",
    },
  },
  pt: {
    tagline: "Plataforma multilíngue de serviços cotidianos",
    description: "Plataforma de serviços cotidianos para todas as pessoas que vivem em Coreia. Atendimento no seu idioma nativo e conexão com especialistas confiáveis.",
    chat: {
      title: "Central de ajuda no idioma nativo",
      description: "Peça ajuda para a vida na Coreia no seu próprio idioma. Converse 1:1 com um ajudante; as mensagens são traduzidas por máquina.",
    },
    tech: {
      title: "Portal de Especialistas e Parceiros Oficiais",
      description: "Portal de trabalho para os parceiros ajudantes do LIFE.HELP. Gerencie a sua disponibilidade e os pedidos atribuídos a você.",
    },
    sys: {
      title: "Sistema de Controle Integrado da Sede",
      description: "Sistema centralizado oficial de gerenciamento e operações da LIFE.HELP.",
    },
  },
  it: {
    tagline: "Piattaforma multilingue di servizi per la vita quotidiana",
    description: "Piattaforma di servizi per la vita quotidiana per tutte le persone che vivono in Corea. Consulenza nella tua lingua madre e contatto con tecnici locali affidabili.",
    chat: {
      title: "Centro di assistenza nella lingua madre",
      description: "Chiedi aiuto per la vita in Corea nella tua lingua. Chatta 1:1 con un assistente; i messaggi sono tradotti automaticamente.",
    },
    tech: {
      title: "Portale dei tecnici e partner autorizzati",
      description: "Portale di lavoro per gli assistenti partner di LIFE.HELP. Gestisci la tua disponibilità e le richieste che ti sono assegnate.",
    },
    sys: {
      title: "Sistema di gestione integrata della sede centrale",
      description: "Sistema ufficiale di controllo operativo centralizzato di LIFE.HELP.",
    },
  },
  ru: {
    tagline: "Многоязычная платформа бытовых услуг",
    description: "Платформа бытовых услуг для всех жителей в Корее. Консультации на родном языке и связь с проверенными местными мастерами.",
    chat: {
      title: "Центр помощи на родном языке",
      description: "Просите помощи в жизни в Корее на родном языке. Общайтесь с помощником в чате 1:1; сообщения переводятся машинным переводом.",
    },
    tech: {
      title: "Портал сертифицированных мастеров-партнеров",
      description: "Рабочий портал для партнёров-помощников LIFE.HELP. Управляйте своей доступностью и назначенными вам заявками.",
    },
    sys: {
      title: "Единая система управления штаб-квартиры",
      description: "Официальная централизованная система контроля и управления операциями LIFE.HELP.",
    },
  },
  uk: {
    tagline: "Багатомовна платформа побутових послуг",
    description: "Платформа побутових послуг для всіх жителів у Кореї. Консультації рідною мовою та прямий зв'язок із перевіреними місцевими майстрами.",
    chat: {
      title: "Центр допомоги рідною мовою",
      description: "Просіть допомоги з життям у Кореї рідною мовою. Спілкуйтеся з помічником у чаті 1:1; повідомлення перекладаються машинним перекладом.",
    },
    tech: {
      title: "Портал сертифікованих майстрів-партнерів",
      description: "Робочий портал для партнерів-помічників LIFE.HELP. Керуйте своєю доступністю та призначеними вам запитами.",
    },
    sys: {
      title: "Єдина система управління головного офісу",
      description: "Офіційна централізована система оперативного контролю та адміністрування LIFE.HELP.",
    },
  },
  tr: {
    tagline: "Çok Dilli Yaşam Hizmetleri Platformu",
    description: "Kore'de yaşayan herkes için yaşam hizmetleri platformu. Kendi ana dilinizde danışın ve güvenilir yerel uzman ustalarla bağlantı kurun.",
    chat: {
      title: "Ana Dilde Yardım Merkezi",
      description: "Kore'de yaşamla ilgili yardımı kendi dilinizde isteyin. Bir yardımcıyla 1:1 sohbet edin; mesajlar makine çevirisiyle çevrilir.",
    },
    tech: {
      title: "Uzman Usta Partner Portalı",
      description: "LIFE.HELP yardımcı ortakları için iş portalı. Müsaitliğinizi ve size atanan talepleri yönetin.",
    },
    sys: {
      title: "Genel Merkez Entegre Kontrol Sistemi",
      description: "LIFE.HELP resmi merkezi operasyon ve denetim yönetim sistemi.",
    },
  },
  id: {
    tagline: "Platform Layanan Kehidupan Multibahasa",
    description: "Platform layanan kehidupan untuk semua orang yang tinggal di Korea. Konsultasi dalam bahasa ibu dan terhubung langsung dengan teknisi ahli lokal tepercaya.",
    chat: {
      title: "Pusat Bantuan Bahasa Ibu",
      description: "Minta bantuan untuk kehidupan di Korea dalam bahasa Anda sendiri. Chat 1:1 dengan helper; pesan diterjemahkan oleh mesin.",
    },
    tech: {
      title: "Portal Mitra Teknisi Ahli",
      description: "Portal kerja untuk mitra helper LIFE.HELP. Kelola ketersediaan Anda dan permintaan yang ditugaskan kepada Anda.",
    },
    sys: {
      title: "Sistem Kontrol Terpadu Kantor Pusat",
      description: "Sistem operasional dan kendali terpusat resmi LIFE.HELP.",
    },
  },
  th: {
    tagline: "แพลตฟอร์มบริการการใช้ชีวิตหลายภาษา",
    description: "แพลตฟอร์มบริการการใช้ชีวิตสำหรับทุกคนที่อาศัยอยู่ในเกาหลี ปรึกษาด้วยภาษาแม่ของคุณและเชื่อมต่อกับช่างผู้เชี่ยวชาญในท้องถิ่นที่เชื่อถือได้",
    chat: {
      title: "ศูนย์ช่วยเหลือภาษาแม่",
      description: "ขอความช่วยเหลือเรื่องการใช้ชีวิตในเกาหลีด้วยภาษาของคุณเอง แชต 1:1 กับผู้ช่วย ข้อความจะถูกแปลด้วยเครื่อง",
    },
    tech: {
      title: "พอร์ทัลช่างผู้เชี่ยวชาญพาร์ทเนอร์",
      description: "พอร์ทัลทำงานสำหรับพันธมิตรผู้ช่วยของ LIFE.HELP จัดการความพร้อมในการทำงานและคำขอที่มอบหมายให้คุณ",
    },
    sys: {
      title: "ระบบควบคุมแบบบูรณาการของสำนักงานใหญ่",
      description: "ระบบควบคุมการปฏิบัติการและการจัดการส่วนกลางอย่างเป็นทางการของ LIFE.HELP",
    },
  },
  nl: {
    tagline: "Meertalig platform voor levensdiensten",
    description: "Platform voor levensdiensten voor alle inwoners in Korea. Advies in uw moedertaal en direct contact met betrouwbare lokale vakmensen.",
    chat: {
      title: "Hulpcentrum in je moedertaal",
      description: "Vraag in je eigen taal om hulp bij het leven in Korea. Chat 1:1 met een helper; berichten worden automatisch vertaald.",
    },
    tech: {
      title: "Partnerportaal voor gecertificeerde vakmensen",
      description: "Werkportaal voor de helperpartners van LIFE.HELP. Beheer je beschikbaarheid en de verzoeken die aan je zijn toegewezen.",
    },
    sys: {
      title: "Geïntegreerd controlesysteem hoofdkantoor",
      description: "Het officiële gecentraliseerde operationele beheersysteem van LIFE.HELP.",
    },
  },
  sv: {
    tagline: "Flerspråkig plattform för vardagstjänster",
    description: "Plattform för vardagstjänster för alla som bor i Korea. Rådgivning på modersmålet och koppling till pålitliga lokala hantverkare.",
    chat: {
      title: "Hjälpcenter på modersmålet",
      description: "Be om hjälp med livet i Korea på ditt eget språk. Chatta 1:1 med en hjälpare; meddelandena maskinöversätts.",
    },
    tech: {
      title: "Partnerportal för certifierade hjälpare",
      description: "Arbetsportal för LIFE.HELP:s hjälparpartner. Hantera din tillgänglighet och förfrågningarna som tilldelats dig.",
    },
    sys: {
      title: "Huvudkontorets integrerade kontrollsystem",
      description: "Officiellt centraliserat drift- och administrationssystem för LIFE.HELP.",
    },
  },
  da: {
    tagline: "Flersproget platform for hverdagstjenester",
    description: "Platform for hverdagstjenester for alle, der bor i Korea. Rådgivning på dit modersmål og forbindelse til pålidelige lokale håndværkere.",
    chat: {
      title: "Hjælpecenter på dit modersmål",
      description: "Bed om hjælp til livet i Korea på dit eget sprog. Chat 1:1 med en hjælper; beskederne maskinoversættes.",
    },
    tech: {
      title: "Partnerportal for certificerede hjælpere",
      description: "Arbejdsportal for LIFE.HELP's hjælperpartnere. Administrer din tilgængelighed og de forespørgsler, der er tildelt dig.",
    },
    sys: {
      title: "Hovedkvarterets integrerede kontrolsystem",
      description: "Det officielle centraliserede drifts- og kontrolsystem for LIFE.HELP.",
    },
  },
  no: {
    tagline: "Flerspråklig plattform for hverdagstjenester",
    description: "Plattform for hverdagstjenester for alle som bor i Korea. Rådgivning på morsmålet og kontakt med pålitelige lokale fagfolk.",
    chat: {
      title: "Hjelpesenter på morsmålet",
      description: "Be om hjelp med livet i Korea på ditt eget språk. Chat 1:1 med en hjelper; meldingene maskinoversettes.",
    },
    tech: {
      title: "Partnerportal for sertifiserte hjelpere",
      description: "Arbeidsportal for LIFE.HELP sine hjelperpartnere. Administrer tilgjengeligheten din og forespørslene som er tildelt deg.",
    },
    sys: {
      title: "Hovedkvarterets integrerte kontrollsystem",
      description: "Det offisielle sentrale drifts- og kontrollsystemet for LIFE.HELP.",
    },
  },
  el: {
    tagline: "Πολυγλωσσική πλατφόρμα υπηρεσιών καθημερινής ζωής",
    description: "Πλατφόρμα υπηρεσιών καθημερινής ζωής για όλους τους κατοίκους σε Κορέα. Συμβουλευτείτε στη μητρική σας γλώσσα और συνδεθείτε με αξιόπιστους τοπικούς ειδικούς τεχνικούς.",
    chat: {
      title: "Κέντρο βοήθειας στη μητρική γλώσσα",
      description: "Ζητήστε βοήθεια για τη ζωή στην Κορέα στη δική σας γλώσσα. Συνομιλήστε 1:1 με έναν βοηθό· τα μηνύματα μεταφράζονται αυτόματα.",
    },
    tech: {
      title: "Πύλη πιστοποιημένων συνεργατών τεχνικών",
      description: "Πύλη εργασίας για τους συνεργάτες βοηθούς του LIFE.HELP. Διαχειριστείτε τη διαθεσιμότητά σας και τα αιτήματα που σας έχουν ανατεθεί.",
    },
    sys: {
      title: "Ενιαίο σύστημα ελέγχου κεντρικών γραφείων",
      description: "Επίσημο κεντρικό σύστημα επιχειρησιακής διαχείρισης και ελέγχου του LIFE.HELP.",
    },
  },
  ar: {
    tagline: "منصة الخدمات المعيشية متعددة اللغات",
    description: "منصة الخدمات المعيشية لجميع المقيمين في كوريا. استشارات بلغتك الأم وتواصل مباشر مع فنيين وخبراء محليين موثوقين.",
    chat: {
      title: "مركز المساعدة بلغتك الأم",
      description: "اطلب المساعدة في الحياة في كوريا بلغتك. تحدث مع مساعد في دردشة 1:1؛ تُترجم الرسائل آليًا.",
    },
    tech: {
      title: "بوابة شركاء المساعدة والحرفيين المعتمدين",
      description: "بوابة العمل لشركاء المساعدين في LIFE.HELP. أدِر توفرك والطلبات المسندة إليك.",
    },
    sys: {
      title: "نظام التحكم والإدارة الموحد للمقر الرئيسي",
      description: "نظام المراقبة والعمليات المركزي الرسمي لخدمات LIFE.HELP.",
    },
  },
  arz: {
    tagline: "منصة الخدمات المعيشية متعددة اللغات",
    description: "منصة الخدمات المعيشية لجميع المقيمين في كوريا. استشارات بلغتك الأم وتواصل مباشر مع فنيين وخبراء محليين موثوقين.",
    chat: {
      title: "مركز المساعدة بلغتك الأم",
      description: "اطلب مساعدة في الحياة في كوريا بلغتك. اتكلم مع مساعد في شات 1:1؛ والرسايل بتتترجم بالترجمة الآلية.",
    },
    tech: {
      title: "بوابة شركاء المساعدة والحرفيين المعتمدين",
      description: "بوابة الشغل لشركاء المساعدين في LIFE.HELP. نظّم مواعيد توفرك والطلبات المتعينة ليك.",
    },
    sys: {
      title: "نظام التحكم والإدارة الموحد للمقر الرئيسي",
      description: "نظام المراقبة والعمليات المركزي الرسمي لخدمات LIFE.HELP.",
    },
  },
  ur: {
    tagline: "کثیر لسانی روزمرہ خدمات کا پلیٹ فارم",
    description: "کوریا میں مقیم تمام افراد کے لیے روزمرہ خدمات کا پلیٹ فارم۔ اپنی مادری زبان میں مشورہ اور قابلِ اعتماد مقامی ماہرین سے رابطہ۔",
    chat: {
      title: "مادری زبان میں مدد کا مرکز",
      description: "کوریا میں زندگی کے لیے اپنی زبان میں مدد مانگیں۔ مددگار کے ساتھ 1:1 چیٹ کریں؛ پیغامات کا ترجمہ مشین سے ہوتا ہے۔",
    },
    tech: {
      title: "مستند مددگار پارٹنرز کا پورٹل",
      description: "LIFE.HELP کے مددگار شراکت داروں کے لیے ورک پورٹل۔ اپنی دستیابی اور آپ کو سونپی گئی درخواستوں کا انتظام کریں۔",
    },
    sys: {
      title: "ہیڈکوارٹر کا مربوط کنٹرول اور انتظامی نظام",
      description: "LIFE.HELP کا سرکاری مرکزی نگرانی اور آپریشنز کا نظام۔",
    },
  },
  sw: {
    tagline: "Jukwaa la Huduma za Maisha kwa Lugha Nyingi",
    description: "Jukwaa la huduma za maisha kwa watu wote wanaoishi Korea. Pata ushauri kwa lugha yako na uunganishwe na mafundi waliothibitishwa.",
    chat: {
      title: "Kituo cha Msaada kwa Lugha ya Asili",
      description: "Omba msaada wa maisha nchini Korea kwa lugha yako mwenyewe. Zungumza 1:1 na msaidizi; ujumbe hutafsiriwa na mashine.",
    },
    tech: {
      title: "Lango la Mafundi Washirika",
      description: "Lango la kazi kwa washirika wasaidizi wa LIFE.HELP. Simamia upatikanaji wako na maombi uliyokabidhiwa.",
    },
    sys: {
      title: "Mfumo wa Udhibiti wa Makao Makuu",
      description: "Mfumo rasmi wa kati wa uendeshaji na udhibiti wa LIFE.HELP.",
    },
  },
  mr: {
    tagline: "बहुभाषिक जीवनावश्यक सेवा प्लॅटफॉर्म",
    description: "कोरियामधील सर्व नागरिकांसाठी जीवनावश्यक सेवा प्लॅटफॉर्म. तुमच्या मातृभाषेत सल्ला घ्या आणि सत्यापित स्थानिक तज्ज्ञांशी संपर्क साधा.",
    chat: {
      title: "मातृभाषेतील मदत केंद्र",
      description: "कोरियातील जीवनासाठी मदत तुमच्या स्वतःच्या भाषेत मागा. मदतनीसासोबत 1:1 चॅट करा; संदेशांचे भाषांतर मशीनद्वारे होते.",
    },
    tech: {
      title: "तज्ज्ञ हेल्पर भागीदार पोर्टल",
      description: "LIFE.HELP च्या मदतनीस भागीदारांसाठी कामाचे पोर्टल. तुमची उपलब्धता आणि तुम्हाला नेमून दिलेल्या विनंत्या व्यवस्थापित करा.",
    },
    sys: {
      title: "मुख्यालय एकात्मिक नियंत्रण प्रणाली",
      description: "LIFE.HELP ची अधिकृत केंद्रीकृत संचालन आणि नियंत्रण व्यवस्थापन प्रणाली.",
    },
  },
  gu: {
    tagline: "બહુભાષી જીવનજરૂરી સેવા પ્લેટફોર્મ",
    description: "કોરિયામાં રહેતા તમામ લોકો માટે જીવનજરૂરી સેવા પ્લેટફોર્મ. તમારી માતૃભાષામાં સલાહ લો અને ચકાસાયેલ સ્થાનિક નિષ્ણાતો સાથે જોડાઓ.",
    chat: {
      title: "માતૃભાષામાં સહાય કેન્દ્ર",
      description: "કોરિયામાં જીવન માટે મદદ તમારી પોતાની ભાષામાં માગો. મદદનીશ સાથે 1:1 ચેટ કરો; સંદેશાઓનો અનુવાદ મશીન દ્વારા થાય છે.",
    },
    tech: {
      title: "નિષ્ણાત હેલ્પર ભાગીદાર પોર્ટલ",
      description: "LIFE.HELP ના મદદનીશ ભાગીદારો માટે કાર્ય પોર્ટલ. તમારી ઉપલબ્ધતા અને તમને સોંપાયેલી વિનંતીઓનું સંચાલન કરો.",
    },
    sys: {
      title: "મુખ્યાલય સંકલિત નિયંત્રણ પ્રણાલી",
      description: "LIFE.HELP ની સત્તાવાર કેન્દ્રીકૃત કામગીરી અને નિયંત્રણ વ્યવસ્થાપન પ્રણાલી.",
    },
  },
  pa: {
    tagline: "ਬਹੁ-ਭਾਸ਼ਾਈ ਜੀਵਨ ਸੇਵਾਵਾਂ ਪਲੇਟਫਾਰਮ",
    description: "ਕੋਰੀਆ ਵਿੱਚ ਰਹਿਣ ਵਾਲੇ ਸਾਰੇ ਲੋਕਾਂ ਲਈ ਜੀਵਨ ਸੇਵਾਵਾਂ ਪਲੇਟਫਾਰਮ। ਆਪਣੀ ਮਾਂ-ਬੋਲੀ ਵਿੱਚ ਸਲਾਹ ਲਵੋ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਸਥਾਨਕ ਮਾਹਿਰਾਂ ਨਾਲ ਜੁੜੋ।",
    chat: {
      title: "ਮਾਤ-ਭਾਸ਼ਾ ਵਿੱਚ ਸਹਾਇਤਾ ਕੇਂਦਰ",
      description: "ਕੋਰੀਆ ਵਿੱਚ ਜ਼ਿੰਦਗੀ ਲਈ ਮਦਦ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਮੰਗੋ। ਮਦਦਗਾਰ ਨਾਲ 1:1 ਚੈਟ ਕਰੋ; ਸੁਨੇਹਿਆਂ ਦਾ ਅਨੁਵਾਦ ਮਸ਼ੀਨ ਰਾਹੀਂ ਹੁੰਦਾ ਹੈ।",
    },
    tech: {
      title: "ਮਾਹਿਰ ਹੈਲਪਰ ਭਾਈਵਾਲ ਪੋਰਟਲ",
      description: "LIFE.HELP ਦੇ ਮਦਦਗਾਰ ਭਾਈਵਾਲਾਂ ਲਈ ਕੰਮ ਪੋਰਟਲ। ਆਪਣੀ ਉਪਲਬਧਤਾ ਅਤੇ ਤੁਹਾਨੂੰ ਸੌਂਪੀਆਂ ਬੇਨਤੀਆਂ ਦਾ ਪ੍ਰਬੰਧ ਕਰੋ।",
    },
    sys: {
      title: "ਮੁੱਖ ਦਫ਼ਤਰ ਏਕੀਕ੍ਰਿਤ ਕੰਟਰੋਲ ਪ੍ਰਣਾਲੀ",
      description: "LIFE.HELP ਦੀ ਅਧਿਕਾਰਤ ਕੇਂਦਰੀਕ੍ਰਿਤ ਸੰਚਾਲਨ ਅਤੇ ਕੰਟਰੋਲ ਪ੍ਰਬੰਧਨ ਪ੍ਰਣਾਲੀ।",
    },
  },
  te: {
    tagline: "బహుభాషా జీవన సేవల ప్లాట్‌ఫారమ్",
    description: "కొరియాలో నివసిస్తున్న ప్రజలందరి కోసం జీవన సేవల ప్లాట్‌ఫారమ్. మీ మాతృభాషలో సంప్రదించండి మరియు ధృవీకరించబడిన స్థానిక నిపుణులతో కనెక్ట్ అవ్వండి.",
    chat: {
      title: "మాతృభాషలో సహాయ కేంద్రం",
      description: "కొరియాలో జీవనానికి సహాయాన్ని మీ స్వంత భాషలో అడగండి. సహాయకుడితో 1:1 చాట్ చేయండి; సందేశాలు యంత్రం ద్వారా అనువదించబడతాయి.",
    },
    tech: {
      title: "నిపుణ హెల్పర్ భాగస్వామి పోర్టల్",
      description: "LIFE.HELP సహాయక భాగస్వాముల కోసం వర్క్ పోర్టల్. మీ లభ్యతను మరియు మీకు కేటాయించిన అభ్యర్థనలను నిర్వహించండి.",
    },
    sys: {
      title: "ప్రధాన కార్యాలయ సమీకృత నియంత్రణ వ్యవస్థ",
      description: "LIFE.HELP యొక్క అధికారిక కేంద్రీకృత కార్యకలాపాలు మరియు నియంత్రణ నిర్వహణ వ్యవస్థ.",
    },
  },
  kn: {
    tagline: "ಬಹುಭಾಷಾ ಜೀವನ ಸೇವೆಗಳ ವೇದಿಕೆ",
    description: "ಕೊರಿಯಾದಲ್ಲಿ ವಾಸಿಸುವ ಪ್ರತಿಯೊಬ್ಬರಿಗಾಗಿ ಜೀವನ ಸೇವೆಗಳ ವೇದಿಕೆ. ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಸಮಾಲೋಚಿಸಿ ಮತ್ತು ಪರಿಶೀಲಿಸಿದ ಸ್ಥಳೀಯ ತಜ್ಞರೊಂದಿಗೆ ಸಂಪರ್ක ಸಾಧಿಸಿ.",
    chat: {
      title: "ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಸಹಾಯ ಕೇಂದ್ರ",
      description: "ಕೊರಿಯಾದಲ್ಲಿನ ಜೀವನಕ್ಕೆ ಸಹಾಯವನ್ನು ನಿಮ್ಮ ಸ್ವಂತ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಿ. ಸಹಾಯಕರೊಂದಿಗೆ 1:1 ಚಾಟ್ ಮಾಡಿ; ಸಂದೇಶಗಳನ್ನು ಯಂತ್ರದ ಮೂಲಕ ಅನುವಾದಿಸಲಾಗುತ್ತದೆ.",
    },
    tech: {
      title: "ತಜ್ಞ ಹೆಲ್ಪರ್ ಪಾಲುದಾರ ಪೋರ್ಟಲ್",
      description: "LIFE.HELP ಸಹಾಯಕ ಪಾಲುದಾರರಿಗಾಗಿ ಕೆಲಸದ ಪೋರ್ಟಲ್. ನಿಮ್ಮ ಲಭ್ಯತೆ ಮತ್ತು ನಿಮಗೆ ವಹಿಸಿದ ವಿನಂತಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ.",
    },
    sys: {
      title: "ಕೇಂದ್ರ ಕಚೇರಿ ಸಮಗ್ರ ನಿಯಂತ್ರಣ ವ್ಯವಸ್ಥೆ",
      description: "LIFE.HELP ನ ಅಧಿಕೃತ ಕೇಂದ್ರೀಕೃತ ಕಾರ್ಯಾಚರಣೆ ಮತ್ತು ನಿಯಂತ್ರಣ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ.",
    },
  },
  ml: {
    tagline: "ബഹുഭാഷാ ജീവിത സേവന പ്ലാറ്റ്‌ഫോം",
    description: "കൊറിയയിൽ താമസിക്കുന്ന എല്ലാവർക്കുമുള്ള ജീവിത സേവന പ്ലാറ്റ്‌ഫോം. നിങ്ങളുടെ മാതൃഭാഷയിൽ കൂടിയാലോചിക്കുകയും പരിശോധിച്ചുറപ്പിച്ച പ്രാദേശിക വിദഗ്ധരുമായി ബന്ധപ്പെടുകയും ചെയ്യുക.",
    chat: {
      title: "മാതൃഭാഷയിലെ സഹായ കേന്ദ്രം",
      description: "കൊറിയയിലെ ജീവിതത്തിനുള്ള സഹായം നിങ്ങളുടെ സ്വന്തം ഭാഷയിൽ ചോദിക്കൂ. സഹായിയുമായി 1:1 ചാറ്റ് ചെയ്യൂ; സന്ദേശങ്ങൾ യന്ത്രം വഴി വിവർത്തനം ചെയ്യപ്പെടുന്നു.",
    },
    tech: {
      title: "വിദഗ്ധ ഹെൽപ്പർ പങ്കാളി പോർട്ടൽ",
      description: "LIFE.HELP സഹായി പങ്കാളികൾക്കുള്ള വർക്ക് പോർട്ടൽ. നിങ്ങളുടെ ലഭ്യതയും നിങ്ങൾക്ക് ഏൽപ്പിച്ച അഭ്യർത്ഥനകളും നിയന്ത്രിക്കൂ.",
    },
    sys: {
      title: "ആസ്ഥാന സംയോജിത നിയന്ത്രണ സംവിധാനം",
      description: "LIFE.HELP-ന്റെ ഔദ്യോഗിക കേന്ദ്രീകൃത പ്രവർത്തന, നിയന്ത്രണ മാനേജ്മെന്റ് സംവിധാനം.",
    },
  },
  fa: {
    tagline: "پلتفرم خدمات زندگی چندزبانه",
    description: "پلتفرم خدمات زندگی برای همه ساکنان در کره. مشاوره به زبان مادری و ارتباط با متخصصان معتمد محلی.",
    chat: {
      title: "مرکز کمک به زبان مادری",
      description: "برای زندگی در کره به زبان خودتان درخواست کمک کنید. با یک کمک‌رسان ۱:۱ گفت‌وگو کنید؛ پیام‌ها با ترجمهٔ ماشینی ترجمه می‌شوند.",
    },
    tech: {
      title: "پورتال شرکا و متخصصان رسمی امداد",
      description: "پورتال کاری برای شرکای کمک‌رسان LIFE.HELP. دسترس‌پذیری خود و درخواست‌های واگذارشده به خود را مدیریت کنید.",
    },
    sys: {
      title: "سامانه کنترل و عملیات یکپارچه دفتر مرکزی",
      description: "سامانه رسمی هدایت و نظارت متمرکز خدمات LIFE.HELP.",
    },
  },
  he: {
    tagline: "פלטפורמת שירותי חיים רב-לשונית",
    description: "פלטפורמת שירותי חיים לכל האנשים החיים בקוריאה. ייעוץ בשפת האם וחיבור לבעלי מקצוע מקומיים מוסמכים.",
    chat: {
      title: "מרכז סיוע בשפת האם",
      description: "בקשו עזרה בחיים בקוריאה בשפה שלכם. שוחחו 1:1 עם עוזר; ההודעות מתורגמות במכונה.",
    },
    tech: {
      title: "פורטל שותפים ומומחים מוסמכים",
      description: "פורטל עבודה לשותפי העוזרים של LIFE.HELP. נהלו את הזמינות שלכם ואת הבקשות שהוקצו לכם.",
    },
    sys: {
      title: "מערכת שליטה ובקרה מרכזית של ההנהלה",
      description: "מערכת הניהול והתפעול המרכזית הרשמית של LIFE.HELP.",
    },
  },
  hi: {
    tagline: "बहुभाषी जीवन सेवा मंच",
    description: "कोरिया में रहने वाले सभी लोगों के लिए जीवन सेवा मंच। अपनी मातृभाषा में परामर्श करें और विश्वसनीय स्थानीय तकनीशियनों से जुड़ें।",
    chat: {
      title: "मातृभाषा सहायता केंद्र",
      description: "कोरिया में जीवन से जुड़ी मदद अपनी भाषा में माँगें। हेल्पर के साथ 1:1 चैट करें; संदेशों का मशीन द्वारा अनुवाद किया जाता है।",
    },
    tech: {
      title: "विशेषज्ञ हेल्पर पार्टनर पोर्टल",
      description: "LIFE.HELP हेल्पर पार्टनरों के लिए कार्य पोर्टल। अपनी उपलब्धता और आपको सौंपे गए अनुरोधों को प्रबंधित करें।",
    },
    sys: {
      title: "मुख्यालय एकीकृत नियंत्रण प्रणाली",
      description: "LIFE.HELP की आधिकारिक केंद्रीय परिचालन और नियंत्रण प्रबंधन प्रणाली।",
    },
  },
  bn: {
    tagline: "বহুভাষিক জীবন পরিষেবা প্ল্যাটফর্ম",
    description: "কোরিয়া-এ বসবাসকারী সকল মানুষের জন্য জীবন পরিষেবা প্ল্যাটফর্ম। নিজের মাতৃভাষায় পরামর্শ নিন এবং বিশ্বস্ত স্থানীয় টেকনিশিয়ানদের সাথে যুক্ত হন।",
    chat: {
      title: "মাতৃভাষায় সহায়তা কেন্দ্র",
      description: "কোরিয়ায় জীবনযাত্রার সাহায্য নিজের ভাষায় চান। হেল্পারের সাথে ১:১ চ্যাট করুন; বার্তাগুলো মেশিন অনুবাদে অনূদিত হয়।",
    },
    tech: {
      title: "বিশেষজ্ঞ হেল্পার পার্টনার পোর্টাল",
      description: "LIFE.HELP হেল্পার পার্টনারদের কাজের পোর্টাল। আপনার উপলভ্যতা এবং আপনাকে বরাদ্দ করা অনুরোধ পরিচালনা করুন।",
    },
    sys: {
      title: "হেডকোয়ার্টার সমন্বিত নিয়ন্ত্রণ ব্যবস্থা",
      description: "LIFE.HELP এর অফিসিয়াল কেন্দ্রীয় অপারেশন ও ব্যবস্থাপনা নিয়ন্ত্রণ ব্যবস্থা।",
    },
  },
  ta: {
    tagline: "பல்மொழி வாழ்க்கை சேவை தளம்",
    description: "கொரியாயில் வாழும் அனைவருக்கும் வாழ்க்கை சேவை தளம். உங்கள் தாய்மொழியில் ஆலோசனை பெற்று நம்பகமான உள்ளூர் வல்லுநர்களுடன் இணையுங்கள்.",
    chat: {
      title: "தாய்மொழி உதவி மையம்",
      description: "கொரியாவில் வாழ்க்கைக்கான உதவியை உங்கள் சொந்த மொழியில் கேளுங்கள். உதவியாளருடன் 1:1 அரட்டை செய்யுங்கள்; செய்திகள் இயந்திர மொழிபெயர்ப்பு செய்யப்படுகின்றன.",
    },
    tech: {
      title: "நிபுணத்துவ உதவியாளர் பார்ட்னர் போர்டல்",
      description: "LIFE.HELP உதவியாளர் கூட்டாளர்களுக்கான பணி போர்ட்டல். உங்கள் இருப்பு நிலையையும் உங்களுக்கு ஒதுக்கப்பட்ட கோரிக்கைகளையும் நிர்வகிக்கவும்.",
    },
    sys: {
      title: "தலைமையக ஒருங்கிணைந்த கட்டுப்பாட்டு அமைப்பு",
      description: "LIFE.HELP இன் அதிகாரப்பூர்வ மத்திய செயல்பாட்டு கட்டுப்பாட்டு அமைப்பு.",
    },
  },
  si: {
    tagline: "බහුභාෂා ජීවන සේවා වේදිකාව",
    description: "කොරියාවහි වෙසෙන සියලුම ජනතාව සඳහා වන ජීවන සේවා වේදිකාව. ඔබේ මව්බසින් උපදෙස් ලබාගෙන විශ්වාසදායක ප්‍රදේශයේ කාර්මික ශිල්පීන් සමඟ සම්බන්ධ වන්න.",
    chat: {
      title: "මව් භාෂා උපකාර මධ්‍යස්ථානය",
      description: "කොරියාවේ ජීවිතයට අදාළ උදව් ඔබේම භාෂාවෙන් ඉල්ලන්න. උදව්කරු සමඟ 1:1 චැට් කරන්න; පණිවිඩ යන්ත්‍රයෙන් පරිවර්තනය කෙරේ.",
    },
    tech: {
      title: "විශේෂඥ හෙල්පර් පාර්ශ්වකරුවන්ගේ ද්වාරය",
      description: "LIFE.HELP උදව්කරු හවුල්කරුවන් සඳහා වැඩ පෝටලය. ඔබේ ලබාගත හැකි බව සහ ඔබට පවරන ලද ඉල්ලීම් කළමනාකරණය කරන්න.",
    },
    sys: {
      title: "ප්‍රධාන කාර්යාල ඒකාබද්ධ පාලන පද්ධතිය",
      description: "LIFE.HELP නිල මෙහෙයුම් සහ පරිපාලන පාලන පද්ධතිය.",
    },
  },
  ne: {
    tagline: "बहुभाषी जीवन सेवा प्लेटफर्म",
    description: "कोरियामा बस्ने सबै मानिसहरूका लागि जीवन सेवा प्लेटफर्म। आफ्नै मातृभाषामा परामर्श लिनुहोस् र भरपर्दो स्थानीय प्राविधिकहरूसँग जोडिनुहोस्।",
    chat: {
      title: "मातृभाषामा सहायता केन्द्र",
      description: "कोरियामा बस्दा चाहिने सहयोग आफ्नै भाषामा माग्नुहोस्। सहयोगीसँग १:१ च्याट गर्नुहोस्; सन्देशहरू मेसिनद्वारा अनुवाद गरिन्छन्।",
    },
    tech: {
      title: "विशेषज्ञ हेल्पर पार्टनर पोर्टल",
      description: "LIFE.HELP का सहयोगी साझेदारहरूका लागि कार्य पोर्टल। आफ्नो उपलब्धता र तपाईंलाई तोकिएका अनुरोधहरू व्यवस्थापन गर्नुहोस्।",
    },
    sys: {
      title: "मुख्यालय एकीकृत नियन्त्रण प्रणाली",
      description: "LIFE.HELP को आधिकारिक केन्द्रीय सञ्चालन तथा नियन्त्रण प्रणाली।",
    },
  },
  my: {
    tagline: "ဘာသာစကားမျိုးစုံ လူနေမှုဘဝဝန်ဆောင်မှု ပလက်ဖောင်း",
    description: "ကိုရီးယားရှိ လူတိုင်းအတွက် လူနေမှုဘဝဝန်ဆောင်မှု ပလက်ဖောင်း။ မိခင်ဘာသာစကားဖြင့် ဆွေးနွေးတိုင်ပင်ပြီး စိတ်ချရသော ဒေသတွင်း ကျွမ်းကျင်ပညာရှင်များနှင့် တိုက်ရိုက်ချိတ်ဆက်ပါ။",
    chat: {
      title: "မိခင်ဘာသာစကား အကူအညီဌာန",
      description: "ကိုရီးယားရှိ နေထိုင်မှုဆိုင်ရာ အကူအညီကို သင့်ဘာသာစကားဖြင့် တောင်းဆိုပါ။ အကူအညီပေးသူနှင့် ၁:၁ ချက်တင်လုပ်ပါ၊ မက်ဆေ့ချ်များကို စက်ဖြင့် ဘာသာပြန်ပါသည်။",
    },
    tech: {
      title: "ကျွမ်းကျင်လက်ထောက် ပါတနာပေါ်တယ်",
      description: "LIFE.HELP အကူအညီပေးသူ မိတ်ဖက်များအတွက် လုပ်ငန်းပေါ်တယ်။ သင့်လုပ်ကိုင်နိုင်မှုနှင့် သင့်ထံ တာဝန်ပေးထားသော တောင်းဆိုမှုများကို စီမံပါ။",
    },
    sys: {
      title: "ရုံးချုပ် ပေါင်းစပ်ထိန်းချုပ်မှုစနစ်",
      description: "LIFE.HELP ၏ တရားဝင် ဗဟိုလည်ပတ်မှုနှင့် စီမံခန့်ခွဲမှု ထိန်းချုပ်ရေးစနစ်။",
    },
  },
  km: {
    tagline: "វេទិកាសេវាកម្មជីវិតពហុភាសា",
    description: "វេទិកាសេវាកម្មជីវិតសម្រាប់មនុស្សគ្រប់រូបដែលរស់នៅក្នុងកូរ៉េ។ ពិគ្រោះជាភាសាកំណើតរបស់អ្នក និងភ្ជាប់ទំនាក់ទំនងជាមួយជាងជំនាញในតំបន់ដែលគួរឱ្យទុកចិត្ត។",
    chat: {
      title: "មជ្ឈមណ្ឌលជំនួយជាភាសាកំណើត",
      description: "សុំជំនួយអំពីជីវិតនៅកូរ៉េជាភាសារបស់អ្នក។ ជជែក 1:1 ជាមួយអ្នកជំនួយ ហើយសារត្រូវបានបកប្រែដោយម៉ាស៊ីន។",
    },
    tech: {
      title: "ផតថលដៃគូជំនួយការជំនាញ",
      description: "ផតថលការងារសម្រាប់ដៃគូអ្នកជំនួយរបស់ LIFE.HELP។ គ្រប់គ្រងភាពអាចធ្វើការរបស់អ្នក និងសំណើដែលបានចាត់ឱ្យអ្នក។",
    },
    sys: {
      title: "ប្រព័ន្ធគ្រប់គ្រងរួមនៃការិយាល័យកណ្តាល",
      description: "ប្រព័ន្ធគ្រប់គ្រងប្រតិបត្តិការកណ្តាលផ្លូវការរបស់ LIFE.HELP។",
    },
  },
  mn: {
    tagline: "Олон хэлний ахуйн үйлчилгээний платформ",
    description: "Солонгос улсад оршин суугаа бүх хүнд зориулсан ахуйн үйлчилгээний платформ. Эх хэлээрээ зөвлөгөө авч, найдвартай мэргэжилтнүүдтэй шууд холбогдоорой.",
    chat: {
      title: "Төрөлх хэлээрх тусламжийн төв",
      description: "Солонгос дахь амьдралдаа тусламжийг төрөлх хэлээрээ хүс. Туслагчтай 1:1 чатлах бөгөөд мессежийг машин орчуулна.",
    },
    tech: {
      title: "Мэргэшсэн туслах (Хэлпэр) түншийн портал",
      description: "LIFE.HELP-ийн туслагч түншүүдийн ажлын портал. Ажиллах боломжоо болон танд оноосон хүсэлтүүдийг удирдаарай.",
    },
    sys: {
      title: "Төв оффисын нэгдсэн хяналтын систем",
      description: "LIFE.HELP үйлчилгээний албан ёсны төв удирдлага, үйл ажиллагааны хяналтын систем.",
    },
  },
  kk: {
    tagline: "Көптілді тұрмыстық қызметтер платформасы",
    description: "Корея еліндегі барлық тұрғындарға арналған тұрмыстық қызметтер платформасы. Өз ана тіліңізде кеңес алып, сенімді жергілікті шеберлермен байланысыңыз.",
    chat: {
      title: "Ана тіліндегі көмек орталығы",
      description: "Кореядағы өмірге қатысты көмекті өз тіліңізде сұраңыз. Көмекшімен 1:1 чатта сөйлесіңіз; хабарламалар машиналық аударылады.",
    },
    tech: {
      title: "Кәсіби шеберлердің серіктестік порталы",
      description: "LIFE.HELP көмекші серіктестеріне арналған жұмыс порталы. Жұмысқа қолжетімділігіңізді және сізге тағайындалған сұраныстарды басқарыңыз.",
    },
    sys: {
      title: "Бас кеңсенің бірыңғай басқару жүйесі",
      description: "LIFE.HELP ресми орталықтандырылған диспетчерлік және операциялық басқару жүйесі.",
    },
  },
  uz: {
    tagline: "Ko'p tilli turmush xizmatlari platformasi",
    description: "Koreyada yashovchi barcha aholi uchun turmush xizmatlari platformasi. O'z ona tilingizda maslahat oling va ishonchli mahalliy ustalar bilan bog'laning.",
    chat: {
      title: "Ona tilida yordam markazi",
      description: "Koreyadagi hayotingiz bo‘yicha yordamni ona tilingizda so‘rang. Yordamchi bilan 1:1 chatda yozishing; xabarlar mashina tarjimasi bilan tarjima qilinadi.",
    },
    tech: {
      title: "Mutaxassis ustalar hamkorlik portali",
      description: "LIFE.HELP yordamchi hamkorlari uchun ish portali. Ish imkoniyatingizni va sizga biriktirilgan so‘rovlarni boshqaring.",
    },
    sys: {
      title: "Bosh ofis yagona boshqaruv tizimi",
      description: "LIFE.HELP rasmiy markaziy nazorat va operatsiyalarni boshqarish tizimi.",
    },
  },
  tet: {
    tagline: "Plataforma servisu moris nian iha lian barak",
    description: "Plataforma servisu moris nian ba ema hotu ne'ebé hela iha Koreia. Konsulta ho ita-boot nia lian inan no liga ba tékniku profisionál lokál ne'ebé fiar-laek.",
    chat: {
      title: "Sentru Ajuda iha Lian Inan",
      description: "Husu ajuda ba moris iha Korea ho ita-nia lian rasik. Xat 1:1 ho helper; mensajen sira tradús ho makina.",
    },
    tech: {
      title: "Portál Parseiru Tékniku Profisionál",
      description: "Portál servisu ba parseiru helper LIFE.HELP nian. Jere ita-nia disponibilidade no pedidu sira ne'ebé atribui ba ita.",
    },
    sys: {
      title: "Sitema Kontrolu Sentrál Sede Nian",
      description: "Sistema operasionál no kontrolu sentralizadu ofisiál husi LIFE.HELP.",
    },
  },
  am: {
    tagline: "የብዙ ቋንቋ የዕለት ተዕለት ኑሮ አገልግሎት መድረክ",
    description: "በኮሪያ ለሚኖሩ ሰዎች ሁሉ የተዘጋጀ የዕለት ተዕለት ኑሮ አገልግሎት መድረክ። በአፍ መፍቻ ቋንቋዎ ይማከሩ እና ከታመኑ የአካባቢው ባለሙያዎች ጋር ይገናኙ。",
    chat: {
      title: "የአፍ መፍቻ ቋንቋ የእርዳታ ማዕከል",
      description: "በኮሪያ ለሚኖሩበት ሕይወት እርዳታን በራስዎ ቋንቋ ይጠይቁ። ከረዳት ጋር 1:1 ይወያዩ፤ መልዕክቶች በማሽን ይተረጎማሉ።",
    },
    tech: {
      title: "የሙያ ረዳት አጋሮች ፖርታል",
      description: "ለLIFE.HELP ረዳት አጋሮች የሥራ ፖርታል። ተገኝነትዎን እና የተመደቡልዎትን ጥያቄዎች ያስተዳድሩ።",
    },
    sys: {
      title: "የዋनाው መሥሪያ ቤት የተቀናጀ ቁጥጥር ሥርዓት",
      description: "የLIFE.HELP ይፋዊ ማዕከላዊ የቁጥጥር እና የአሠራር አስተዳደር ሥርዓት።",
    },
  },
  tl: {
    tagline: "Multilingual na Platform ng Serbisyo sa Pamumuhay",
    description: "Platform ng mga serbisyo sa pamumuhay para sa lahat ng naninirahan sa Korea. Kumonsulta sa iyong sariling wika at kumonekta sa mga pinagkakatiwalaang lokal na espesyalista.",
    chat: {
      title: "Multilingual Customer Support Center",
      description: "Humingi ng tulong sa pamumuhay sa iyong sariling wika. Makipag-chat nang 1:1 sa mga beripikadong lokal na espesyalista.",
    },
    tech: {
      title: "Portal ng Tekniko",
      description: "Portal sa trabaho para sa mga katulong at tekniko ng LIFE.HELP.",
    },
    sys: {
      title: "Sistemang Pinagsamang Pamamahala ng Punong Tanggapan",
      description: "Opisyal na pinagsamang kontrol at pamamahala ng pagpapatakbo ng LIFE.HELP.",
    },
  },
  ms: {
    tagline: "Platform Perkhidmatan Kehidupan Pelbagai Bahasa",
    description: "Platform perkhidmatan kehidupan untuk semua orang yang tinggal di Korea. Berunding dalam bahasa ibunda anda dan berhubung dengan pakar tempatan yang dipercayai.",
    chat: {
      title: "Pusat Sokongan Pelanggan Pelbagai Bahasa",
      description: "Minta bantuan tentang kehidupan dalam bahasa ibunda anda. Berbual 1:1 dengan pembantu tempatan yang dipercayai.",
    },
    tech: {
      title: "Portal Juruteknik",
      description: "Portal kerja untuk pembantu dan juruteknik LIFE.HELP.",
    },
    sys: {
      title: "Sistem Pengurusan Bersepadu Ibu Pejabat",
      description: "Sistem kawalan dan pengurusan operasi bersepadu rasmi LIFE.HELP.",
    },
  },
  pcm: {
    tagline: "Multilingual Living Service Platform",
    description: "Living service platform for all people wey dey stay for Korea. Make una chat with una mama tongue and connect with local specialists wey una fit trust.",
    chat: {
      title: "Customer Support Center for All Languages",
      description: "Ask for help about life inside your own language. Chat 1:1 with trusted local helpers.",
    },
    tech: {
      title: "Specialist Helper Portal",
      description: "Work portal for LIFE.HELP helpers and specialists.",
    },
    sys: {
      title: "Headquarters Integrated Management System",
      description: "Official integrated control and operations management system of LIFE.HELP.",
    },
  },
  ro: {
    tagline: "Platformă multilingvă de servicii de zi cu zi",
    description: "Platformă de servicii cotidiene pentru toți cei care locuiesc în Coreea. Consultați în limba maternă și conectați-vă cu specialiști locali de încredere.",
    chat: {
      title: "Centrul de asistență clienți multilingv",
      description: "Cereți ajutor pentru viața de zi cu zi în limba maternă. Discutați 1:1 cu meșteri locali de încredere.",
    },
    tech: {
      title: "Portalul Tehnicianului",
      description: "Portal de lucru pentru ajutoarele și tehnicienii LIFE.HELP.",
    },
    sys: {
      title: "Sistem integrat de management al sediului central",
      description: "Sistemul oficial integrat de control și gestionare a operațiunilor LIFE.HELP.",
    },
  },
  cs: {
    tagline: "Vícejazyčná platforma každodenních služeb",
    description: "Platforma životních služeb pro všechny lidi žijící v Koreji. Poraďte se ve svém rodném jazyce a spojte se s ověřenými místními specialisty.",
    chat: {
      title: "Vícejazyčné centrum zákaznické podpory",
      description: "Požádejte o pomoc v každodenním životě ve svém rodném jazyce. Chatujte 1:1 s ověřenými místními specialisty.",
    },
    tech: {
      title: "Portál pro techniky",
      description: "Pracovní portál pro pomocníky a techniky LIFE.HELP.",
    },
    sys: {
      title: "Integrovaný systém řízení centrály",
      description: "Oficiální integrovaný systém řízení a provozu centrály LIFE.HELP.",
    },
  },
  af: {
    tagline: "Veeltalige Lewensdienste-platform",
    description: "Lewensdienste-platform vir almal wat in Korea woon. Raadpleeg in jou moedertaal en skakel met betroubare plaaslike spesialiste.",
    chat: {
      title: "Veeltalige Kliëntedienssentrum",
      description: "Vra hulp vir die lewe in jou eie moedertaal. Gesels 1:1 met betroubare plaaslike spesialiste.",
    },
    tech: {
      title: "Tegnikusportaal",
      description: "Werkportaal vir helpers en tegnici van LIFE.HELP.",
    },
    sys: {
      title: "Hoofkantoor Geïntegreerde Bestuurstelsel",
      description: "Amptelike geïntegreerde beheer- en bedryfstelsel van LIFE.HELP.",
    },
  },
  hu: {
    tagline: "Többnyelvű mindennapi szolgáltatási platform",
    description: "Életviteli szolgáltatási platform mindenkinek, aki itt él: Koreában. Konzultáljon anyanyelvén, és vegye fel a kapcsolatot megbízható helyi szakemberekkel.",
    chat: {
      title: "Többnyelvű Ügyfélszolgálati Központ",
      description: "Kérjen segítséget a mindennapi élethez anyanyelvén. Csevegjen 1:1 arányban megbízható helyi szakemberekkel.",
    },
    tech: {
      title: "Szakember Portál",
      description: "Munkafelület a LIFE.HELP segítői és szakemberei számára.",
    },
    sys: {
      title: "Központi Integrált Irányítási Rendszer",
      description: "A LIFE.HELP hivatalos központi integrált felügyeleti és üzemeltetési rendszere.",
    },
  },
  fi: {
    tagline: "Monikielinen arjen palvelualusta",
    description: "Arjen palvelualusta kaikille maassa Koreassa asuville. Keskustele äidinkielelläsi ja ota yhteyttä luotettaviin paikallisiin asiantuntijoihin.",
    chat: {
      title: "Monikielinen asiakastukikeskus",
      description: "Pyydä apua arjen asioihin omalla äidinkielelläsi. Keskustele 1:1 luotettujen paikallisten asiantuntijoiden kanssa.",
    },
    tech: {
      title: "Teknikkoportaali",
      description: "Työportaali LIFE.HELP-avustajille ja ammattilaisille.",
    },
    sys: {
      title: "Päämajan integroitu hallintajärjestelmä",
      description: "LIFE.HELPin virallinen integroitu valvonta- ja toiminnanohjausjärjestelmä.",
    },
  },
  ka: {
    tagline: "მრავალენოვანი საყოფაცხოვრებო მომსახურების პლატფორმა",
    description: "საცხოვრებელი მომსახურების პლატფორმა მათთვის, ვინც ცხოვრობს კორეაში. გაიარეთ კონსულტაცია მშობლიურ ენაზე და დაუკავშირდით სანდო ადგილობრივ სპეციალისტებს.",
    chat: {
      title: "მრავალენოვანი მომხმარებელთა მხარდაჭერის ცენტრი",
      description: "მოითხოვეთ დახმარება ყოველდღიურ ცხოვრებაში თქვენს მშობლიურ ენაზე. ესაუბრეთ 1:1 სანდო ადგილობრივ სპეციალისტებს.",
    },
    tech: {
      title: "სპეციალისტთა პორტალი",
      description: "სამუშაო პორტალი LIFE.HELP-ის დამხმარეებისა და ტექნიკოსებისთვის.",
    },
    sys: {
      title: "სათაო ოფისის ინტეგრირებული მართვის სისტემა",
      description: "LIFE.HELP-ის ოფიციალური ინტეგრირებული კონტროლისა და მართვის სისტემა.",
    },
  },
  yue: {
    tagline: "多語言生活服務平臺",
    description: "專為在韓國所有居民打造嘅生活服務平臺。使用母語即時諮詢，快速媒合在地值得信賴嘅專業師傅。",
    chat: {
      title: "母語客戶支援中心",
      description: "用你嘅母語尋求生活協助。與值得信賴嘅在地專業師傅1對1對話。",
    },
    tech: {
      title: "師傅專用平臺",
      description: "LIFE.HELP 專業師傅專用工作平臺。管理你嘅工作時間與委託申請。",
    },
    sys: {
      title: "總部綜合管理系統",
      description: "LIFE.HELP 官方總部綜合運營及控制系統。",
    },
  },
  ca: {
    tagline: "Plataforma multilingüe de serveis per a la llar",
    description: "Plataforma de serveis del dia a dia per a tothom que viu a Corea. Consulta en la teva llengua materna i connecta amb especialistes locals de confiança.",
    chat: {
      title: "Centre d'atenció al client multilingüe",
      description: "Demana ajuda per al teu dia a dia en la teva pròpia llengua. Parla 1:1 amb especialistes locals de confiança.",
    },
    tech: {
      title: "Portal de Tècnics",
      description: "Portal de feina per als col·laboradors i especialistes de LIFE.HELP.",
    },
    sys: {
      title: "Sistema integrat de gestió de la seu central",
      description: "Sistema oficial integrat de control i gestió operativa de LIFE.HELP.",
    },
  },
  bg: {
    tagline: "Многоезична платформа за битови услуги",
    description: "Платформа за битови услуги за всички живеещи в Корея. Консултирайте се на родния си език и се свържете с надеждни местни специалисти.",
    chat: {
      title: "Многоезичен център за обслужване на клиенти",
      description: "Потърсете помощ за бита на родния си език. Разговаряйте 1:1 с надеждни местни специалисти.",
    },
    tech: {
      title: "Портал за техници",
      description: "Работен портал за помощници и техници на LIFE.HELP.",
    },
    sys: {
      title: "Интегрирана система за управление на централата",
      description: "Официална интегрирана система за контрол и оперативно управление на LIFE.HELP.",
    },
  },
  tg: {
    tagline: "Платформаи бисёрзабонаи хидматрасонии рӯзгор",
    description: "Платформаи хидматрасонии маишӣ барои ҳамаи сокинони Корея. Дар забони модарии худ маслиҳат гиред ва бо мутахассисони боэътимоди маҳаллӣ пайваст шавед.",
    chat: {
      title: "Маркази дастгирии муштариён бо забони модарӣ",
      description: "Барои кӯмак дар зиндагӣ бо забони модарии худ муроҷиат кунед. Бо мутахассисони маҳаллӣ 1:1 сӯҳбат кунед.",
    },
    tech: {
      title: "Портали мутахассисон",
      description: "Портали корӣ барои ёварон ва устоҳои LIFE.HELP.",
    },
    sys: {
      title: "Системаи ягонаи идоракунии марказӣ",
      description: "Системаи расмии ягонаи назорат ва идоракунии амалиёти LIFE.HELP.",
    },
  },
  as: {
    tagline: "বহুভাষিক জীৱন-যাপন সেৱা মঞ্চ",
    description: "কোৰিয়াত বাস কৰা সকলো লোকৰ বাবে জীৱন-যাপন সেৱা মঞ্চ। আপোনাৰ মাতৃভাষাত পৰামৰ্শ লওক আৰু বিশ্বস্ত স্থানীয় বিশেষজ্ঞসকলৰ সৈতে সংযোগ কৰক।",
    chat: {
      title: "মাতৃভাষা গ্ৰাহক সহায়ক কেন্দ্ৰ",
      description: "আপোনাৰ মাতৃভাষাত দৈনন্দিন জীৱনৰ বাবে সহায় বিচাৰক। বিশ্বস্ত স্থানীয় সহায়কসকলৰ সৈতে 1:1 কথা পাতক।",
    },
    tech: {
      title: "সহায়ক বিশেষজ্ঞ পৰ্টেল",
      description: "LIFE.HELPৰ সহায়ক আৰু কাৰিকৰসকলৰ বাবে কৰ্ম পৰ্টেল।",
    },
    sys: {
      title: "মুখ্য কাৰ্যালয় একত্ৰিত ব্যৱস্থাপনা প্ৰণালী",
      description: "LIFE.HELPৰ চৰকাৰী একত্ৰিত নিয়ন্ত্ৰণ আৰু পৰিচালনা ব্যৱস্থাপনা প্ৰণালী।",
    },
  },
  az: {
    tagline: "Çoxdilli Məişət Xidmətləri Platforması",
    description: "Koreya ərazisində yaşayan hər kəs üçün məişət xidmətləri platforması. Öz ana dilinizdə məsləhətləşin və etibarlı yerli mütəxəssislərlə əlaqə saxlayın.",
    chat: {
      title: "Ana Dilində Müştəri Dəstək Mərkəzi",
      description: "Gündəlik həyatınız üçün ana dilinizdə kömək istəyin. Etibarlı yerli ustalarla 1:1 söhbət edin.",
    },
    tech: {
      title: "Usta Portalı",
      description: "LIFE.HELP köməkçiləri və ustaları üçün iş portalı.",
    },
    sys: {
      title: "Baş Qərargahın Vahid İdarəetmə Sistemi",
      description: "LIFE.HELP-in rəsmi vahid nəzarət və əməliyyat idarəetmə sistemi.",
    },
  },
  ceb: {
    tagline: "Multilingual nga Plataporma sa Serbisyo sa Pagpuyo",
    description: "Plataporma sa serbisyo sa panginabuhi alang sa tanan nga nagpuyo sa Korea. Pagkonsulta sa imong lumad nga pinulongan ug pakigkita sa kasaligang lokal nga mga espesyalista.",
    chat: {
      title: "Sentro sa Suporta sa Kustomer sa Lumad nga Pinulongan",
      description: "Pangayo og tabang alang sa imong adlaw-adlaw nga kinabuhi sa imong kaugalingong pinulongan. Pakig-estorya 1:1 sa kasaligang lokal nga mga eksperto.",
    },
    tech: {
      title: "Portal sa Eksperto",
      description: "Portal sa trabaho alang sa mga katabang ug teknisyan sa LIFE.HELP.",
    },
    sys: {
      title: "Nahiusang Sistema sa Pagdumala sa Headquarters",
      description: "Opisyal nga nahiusang sistema sa pagkontrol ug pagdumala sa operasyon sa LIFE.HELP.",
    },
  },
  et: {
    tagline: "Mitmekeelne igapäevateenuste platvorm",
    description: "Igapäevateenuste platvorm kõigile, kes elavad riigis Koreas. Konsulteerige oma emakeeles ja võtke ühendust usaldusväärsete kohalike spetsialistidega.",
    chat: {
      title: "Mitmekeelne klienditoe keskus",
      description: "Küsige igapäevaeluks abi oma emakeeles. Vestelge 1:1 usaldusväärsete kohalike spetsialistidega.",
    },
    tech: {
      title: "Tehnikute portaal",
      description: "Tööportaal LIFE.HELP-i abistajatele ja spetsialistidele.",
    },
    sys: {
      title: "Peakorteri integreeritud juhtimissüsteem",
      description: "LIFE.HELP-i ametlik integreeritud juhtimis- ja operatsioonisüsteem.",
    },
  },
  eu: {
    tagline: "Hizkuntza anitzeko eguneroko zerbitzuen plataforma",
    description: "Korean herrialdean bizi diren guztientzako bizi-zerbitzuen plataforma. Kontsultatu zure ama-hizkuntzan eta konektatu tokiko espezialista fidagarriekin.",
    chat: {
      title: "Hizkuntza anitzeko bezeroarentzako arreta-zentroa",
      description: "Eskatu laguntza zure eguneroko bizitzarako zure ama-hizkuntzan. Hitz egin 1:1 tokiko espezialista fidagarriekin.",
    },
    tech: {
      title: "Teknikarien Portala",
      description: "LIFE.HELPeko laguntzaile eta teknikarien lan-ataria.",
    },
    sys: {
      title: "Egoitza Nagusiko Kudeaketa Sistema Integratua",
      description: "LIFE.HELP-en kontrol eta eragiketen kudeaketa-sistema ofiziala.",
    },
  },
  gl: {
    tagline: "Plataforma multilingüe de servizos para a vida cotiá",
    description: "Plataforma de servizos vitais para todas as persoas que viven en Corea. Consulta na túa lingua materna e conecta con especialistas locais de confianza.",
    chat: {
      title: "Centro de atención ao cliente multilingüe",
      description: "Pide axuda para o teu día a día no teu propio idioma. Chatea 1:1 con especialistas locais de confianza.",
    },
    tech: {
      title: "Portal de Técnicos",
      description: "Portal de traballo para axudantes e técnicos de LIFE.HELP.",
    },
    sys: {
      title: "Sistema Integrado de Xestión da Sede Central",
      description: "Sistema oficial integrado de control e xestión operativa de LIFE.HELP.",
    },
  },
  ha: {
    tagline: "Dandalin Sabis na Rayuwa na Harsuna da Dama",
    description: "Dandalin ayyukan yau da kullun ga duk mutanen da ke zaune a Koriya. Nemi shawara da yarenku na asali kuma ku haɗu da kwararrun masana na gida abin dogaro.",
    chat: {
      title: "Cibiyar Tallafin Abokan Ciniki ta Harshen Asali",
      description: "Nemi taimako game da rayuwa cikin yarenku na asali. Yi magana 1:1 tare da amintattun mataimaka na gida.",
    },
    tech: {
      title: "Dandalin Kwararru",
      description: "Dandalin aiki ga mataimaka da kwararrun LIFE.HELP.",
    },
    sys: {
      title: "Tsarin Gudanarwa na Haɗin Gwiwa na Hedikwata",
      description: "Tabbataccen tsarin sarrafawa da gudanar da ayyuka na LIFE.HELP.",
    },
  },
  hr: {
    tagline: "Višejezična platforma usluga za život",
    description: "Platforma svakodnevnih usluga za sve ljude koji žive u Koreji. Savjetujte se na svom materinjem jeziku i povežite se s provjerenim lokalnim stručnjacima.",
    chat: {
      title: "Višejezični centar za korisničku podršku",
      description: "Zatražite pomoć za svakodnevni život na svom materinjem jeziku. Razgovarajte 1:1 s provjerenim lokalnim stručnjacima.",
    },
    tech: {
      title: "Portal za stručnjake",
      description: "Radni portal za pomagače i tehničare LIFE.HELP-a.",
    },
    sys: {
      title: "Integrirani sustav upravljanja sjedišta",
      description: "Službeni integrirani sustav kontrole i upravljanja poslovanjem LIFE.HELP-a.",
    },
  },
  ig: {
    tagline: "Ikpo Okwu Ọrụ Ndụ Asụsụ Dị Iche Iche",
    description: "Usoro ọrụ ndụ maka mmadụ niile bi na Korea. Kpọtụrụ anyị n'asụsụ obodo gị ma jikọọ ndị ọkachamara obodo a pụrụ ịtụkwasị obi.",
    chat: {
      title: "Ebe Nkwado Ndị Ahịa n'Asụsụ Obodo",
      description: "Rịọ enyemaka maka ibi ndụ n'asụsụ obodo gị. Kparịta ụka 1:1 na ndị inyeaka obodo tụkwasịrị obi.",
    },
    tech: {
      title: "Ọnụ Ụzọ Ndị Ọrụ Pụrụ Iche",
      description: "Ọnụ ụzọ ọrụ maka ndị na-enyere aka na ndị nka na LIFE.HELP.",
    },
    sys: {
      title: "Usoro Nlekọta Ejikọtara Ọnụ nke Isi Ụlọ Ọrụ",
      description: "Usoro nchịkwa na njikwa ọrụ gọọmentị nke LIFE.HELP.",
    },
  },
  is: {
    tagline: "Fjöltyngdur þjónustuvettvangur fyrir daglegt líf",
    description: "Þjónustuvettvangur fyrir alla sem búa í Kóreu. Fáðu ráðgjöf á þínu móðurmáli og hafðu samband við trausta sérfræðinga á staðnum.",
    chat: {
      title: "Fjöltyngd þjónustumiðstöð fyrir viðskiptavini",
      description: "Óskaðu eftir aðstoð við daglegt líf á þínu eigin móðurmáli. Spjallaðu 1:1 við trausta sérfræðinga á staðnum.",
    },
    tech: {
      title: "Tæknimannagátt",
      description: "Vinnugátt fyrir aðstoðarfólk og sérfræðinga LIFE.HELP.",
    },
    sys: {
      title: "Samþætt stjórnkerfi höfuðstöðva",
      description: "Opinbert samþætt eftirlits- og rekstrarstjórnunarkerfi LIFE.HELP.",
    },
  },
  jv: {
    tagline: "Platform Layanan Urip Multibasa",
    description: "Platform layanan urip kanggo kabeh wong sing manggon ing Korea. Konsultasi nganggo basa ibu sampeyan lan sambung karo spesialis lokal sing dipercaya.",
    chat: {
      title: "Pusat Dhukungan Pelanggan Basa Ibu",
      description: "Nyuwun pitulung babagan urip nganggo basa ibu sampeyan. Ngobrol 1:1 karo spesialis lokal sing dipercaya.",
    },
    tech: {
      title: "Portal Teknisi",
      description: "Portal kerja kanggo asisten lan teknisi LIFE.HELP.",
    },
    sys: {
      title: "Sistem Manajemen Terpadu Kantor Pusat",
      description: "Sistem kontrol lan manajemen operasional resmi terpadu LIFE.HELP.",
    },
  },
  ku: {
    tagline: "Platforma Pirzimanî ya Xizmetên Jiyanê",
    description: "Platforma xizmetên jiyanê ji bo her kesê li Koreya dijî. Bi zimanê dayika xwe şêwir bikin û bi pisporên herêmî yên pêbawer re têkilî daynin.",
    chat: {
      title: "Navenda Piştgiriya Xerîdaran bi Zimanê Zikmakî",
      description: "Ji bo jiyanê bi zimanê dayika xwe alîkariyê bixwazin. Bi pisporên herêmî yên pêbawer re 1:1 bipeyivin.",
    },
    tech: {
      title: "Portala Pisporan",
      description: "Portala xebatê ji bo arîkar û pisporên LIFE.HELP.",
    },
    sys: {
      title: "Pergala Rêvebiriya Yekgirtî ya Navendê",
      description: "Pergala fermî ya kontrol û rêveberiya operasyonan a LIFE.HELP.",
    },
  },
  lt: {
    tagline: "Daugiakalbė kasdienių paslaugų platforma",
    description: "Gyvenimo paslaugų platforma visiems, gyvenantiems Korėjoje. Konsultuokitės gimtąja kalba ir susisiekite su patikimais vietos specialistais.",
    chat: {
      title: "Daugiakalbis klientų aptarnavimo centras",
      description: "Paprašykite pagalbos kasdieniam gyvenimui savo gimtąja kalba. Bendraukite 1:1 su patikimais vietos specialistais.",
    },
    tech: {
      title: "Specialistų portalas",
      description: "Darbo portalas LIFE.HELP padėjėjams ir meistrams.",
    },
    sys: {
      title: "Būstinės integruota valdymo sistema",
      description: "Oficiali LIFE.HELP integruota valdymo ir operacijų kontrolės sistema.",
    },
  },
  lv: {
    tagline: "Daudzvalodu sadzīves pakalpojumu platforma",
    description: "Sadzīves pakalpojumu platforma ikvienam, kas dzīvo Korejā. Konsultējieties dzimtajā valodā un sazinieties ar uzticamiem vietējiem speciālistiem.",
    chat: {
      title: "Daudzvalodu klientu atbalsta centrs",
      description: "Lūdziet palīdzību ikdienas dzīvē savā dzimtajā valodā. Sazinieties 1:1 ar uzticamiem vietējiem meistariem.",
    },
    tech: {
      title: "Meistaru portāls",
      description: "Darba portāls LIFE.HELP palīgiem un tehniķiem.",
    },
    sys: {
      title: "Galvenās mītnes integrētā vadības sistēma",
      description: "Oficiālā LIFE.HELP integrētā uzraudzības un operatīvās vadības sistēma.",
    },
  },
  mg: {
    tagline: "Sehatra Tolotra Fiainana Maro Fiteny",
    description: "Sehatra tolotra fiainana ho an'ny rehetra monina ao Korea. Manontania amin'ny fitenin-dreninao ary mifandraisa amin'ireo manampahaizana manokana azo itokisana.",
    chat: {
      title: "Foibe Fanohanana ny Mpanjifa amin'ny Fitenin-dreny",
      description: "Mangataha fanampiana amin'ny fiainana andavanandro amin'ny fiteninao. Miresaha 1:1 amin'ireo manampahaizana azo itokisana.",
    },
    tech: {
      title: "Vavahadin'ny Teknisiana",
      description: "Vavahadin'asa ho an'ireo mpanampy sy teknisianina ao amin'ny LIFE.HELP.",
    },
    sys: {
      title: "Rafitra Fitantanana Mitambatra ao amin'ny Foibe",
      description: "Rafitra ofisialy fanaraha-maso sy fitantanana ny asan'ny LIFE.HELP.",
    },
  },
  mk: {
    tagline: "Повеќејазична платформа за секојдневни животни услуги",
    description: "Платформа за животни услуги за сите луѓе што живеат во Кореја. Консултирајте се на вашиот мајчин јазик и поврзете се со доверливи локални специјалисти.",
    chat: {
      title: "Повеќејазичен центар за поддршка на корисници",
      description: "Побарајте помош за секојдневниот живот на вашиот мајчин јазик. Разговарајте 1:1 со доверливи локални специјалисти.",
    },
    tech: {
      title: "Портал за техничари",
      description: "Работен портал за помошници и техничари на LIFE.HELP.",
    },
    sys: {
      title: "Интегриран систем за управување на седиштето",
      description: "Официјален интегриран систем за контрола и оперативно управување на LIFE.HELP.",
    },
  },
  om: {
    tagline: "Wirtuu Tajaajila Jireenyaa Afaanota Hedduu",
    description: "Wirtuu tajaajila jireenyaa namoota Kooriyaa keessa jiraatan hundaaf. Afaan dhalootaa keessaniin mari'adhaa ogeeyyii naannoo amanamaa waliin walqunnamaa.",
    chat: {
      title: "Wiirtuu Deeggarsa Maamiltootaa Afaan Dhalootaa",
      description: "Jireenya guyyaa guyyaaf afaan keessaniin gargaarsa gaafadhaa. Ogeeyyii naannoo amanamaa waliin kallattiin haasa'aa.",
    },
    tech: {
      title: "Balbala Ogeeyyii",
      description: "Balbala hojii gargaartotaa fi ogeeyyii LIFE.HELP.",
    },
    sys: {
      title: "Sirna Bulchiinsa Qindaa'aa Waajjira Muummee",
      description: "Sirna to'annoo fi bulchiinsa hojii seera qabeessa LIFE.HELP.",
    },
  },
  ps: {
    tagline: "د څو ژبو د ژوند د خدمتونو پلیټفارم",
    description: "د هر هغه چا لپاره د ژوند د خدمتونو پلیټفارم چې په کوریا کې ژوند کوي. په خپله مورنۍ ژبه مشوره وکړئ او د باوري محلي متخصصینو سره اړیکه ونیسئ.",
    chat: {
      title: "په مورنۍ ژبه د پیرودونکو د ملاتړ مرکز",
      description: "د خپل ورځني ژوند لپاره په خپله ژبه مرسته وغواړئ. د باوري محلي مرستندویانو سره 1:1 خبرې وکړئ.",
    },
    tech: {
      title: "د مسلکي متخصصینو پورټل",
      description: "د LIFE.HELP د مرستندویانو او تخنیکانو لپاره د کار پورټل.",
    },
    sys: {
      title: "د مرکزي دفتر یوځای شوی مدیریت سیسټم",
      description: "د LIFE.HELP رسمي یوځای شوی د کنټرول او عملیاتي مدیریت سیسټم.",
    },
  },
  sd: {
    tagline: "گھڻ-ٻولي حياتياتي خدمتن جو پليٽ فارم",
    description: "ڪوريا ۾ رهندڙ سڀني ماڻهن لاءِ زندگي جي خدمتن جو پليٽ فارم. پنهنجي مادري زبان ۾ صلاح وٺو ۽ قابل اعتماد مقامي ماهرن سان رابطو ڪريو.",
    chat: {
      title: "مادري زبان ۾ صارفين جي مدد جو مرڪز",
      description: "زندگي بابت پنهنجي مادري ٻوليءَ ۾ مدد طلب ڪريو. بااعتماد مقامي ماهرن سان 1:1 ڳالھ ٻولھ ڪريو.",
    },
    tech: {
      title: "ٽيڪنيشن پورٽل",
      description: "LIFE.HELP جي مددگارن ۽ ماهرن لاءِ ڪم جو پورٽل.",
    },
    sys: {
      title: "هيڊ ڪوارٽر جو مربوط انتظامي نظام",
      description: "LIFE.HELP جو سرڪاري مربوط ڪنٽرول ۽ آپريشن مئنيجمينٽ سسٽم.",
    },
  },
  sg: {
    tagline: "Gbâ ti a-service ti gigi na a-yanga ti kodro mingi",
    description: "Gbâ ti a-service ti lâ oko oko ndali ti azo kue so ayeke na Korëe. Sâra tënë na yanga ti kodro ti mo na wara atongani ti ndo ni so a lingbi ti zia bê na ala.",
    chat: {
      title: "Ndohuku ti mungo mabôko na yanga ti kodro",
      description: "Hunda mabôko ndali ti gigi ti mo na yanga ti kodro ti mo. Sala lisoro 1:1 na awandara so mo lingbi ti zia bê na ala.",
    },
    tech: {
      title: "Portal ti Awandara",
      description: "Portal ti kua ndali ti azo ti mungo mabôko na a-technicien ti LIFE.HELP.",
    },
    sys: {
      title: "Kpengba Ndokua ti Batango Kua ti Kota Da",
      description: "Lêgë ti kpengba batango kua na bango ndo ti LIFE.HELP.",
    },
  },
  sk: {
    tagline: "Viacjazyčná platforma životných služieb",
    description: "Platforma každodenných služieb pre všetkých ľudí žijúcich v Kórei. Poraďte sa vo svojom rodnom jazyku a spojte sa s overenými miestnymi špecialistami.",
    chat: {
      title: "Viacjazyčné centrum zákazníckej podpory",
      description: "Požiadajte o pomoc v každodennom živote vo svojom rodnom jazyku. Komunikujte 1:1 s overenými miestnymi špecialistami.",
    },
    tech: {
      title: "Portál pre technikov",
      description: "Pracovný portál pre pomocníkov a technikov LIFE.HELP.",
    },
    sys: {
      title: "Integrovaný systém riadenia centrály",
      description: "Oficiálny integrovaný riadiaci a prevádzkový systém LIFE.HELP.",
    },
  },
  sl: {
    tagline: "Večjezična platforma vsakodnevnih storitev",
    description: "Platforma za vsakodnevne storitve za vse, ki živijo v Koreji. Posvetujte se v maternem jeziku in se povežite z zaupanja vrednimi lokalnimi strokovnjaki.",
    chat: {
      title: "Večjezični center za podporo uporabnikom",
      description: "Poiščite pomoč za vsakdanje življenje v svojem maternem jeziku. Klepetajte 1:1 z zaupanja vrednimi lokalnimi strokovnjaki.",
    },
    tech: {
      title: "Portal za strokovnjake",
      description: "Delovni portal za pomočnike in tehnike LIFE.HELP.",
    },
    sys: {
      title: "Integrirani sistem vodenja sedeža podjetja",
      description: "Uradni integrirani nadzorni in operativni sistem LIFE.HELP.",
    },
  },
  sn: {
    tagline: "Chikuva Chemabasa Eupenyu Chemitauro Yakawanda",
    description: "Nzvimbo yebasa reupenyu kune vanhu vose vanogara muKorea. Bvunzai nemutauro wenyu uye batana nenyanzvi dzenharaunda dzinovimbika.",
    chat: {
      title: "Nzvimbo Yokubatsira Vatengi Mumutauro Wamai",
      description: "Kumbirai rubatsiro rweupenyu nemutauro wenyu wemuno. Taura 1:1 nenyanzvi dzenharaunda dzinovimbika.",
    },
    tech: {
      title: "Gonhi Renyanzvi",
      description: "Nzvimbo yebasa yevabatsiri nenyanzvi dzeLIFE.HELP.",
    },
    sys: {
      title: "Mubatanidzwa Wemaitiro Ekutungamira Padzimbahwe",
      description: "Hurongwa hwepamutemo hwekutonga nekushanda hweLIFE.HELP.",
    },
  },
  so: {
    tagline: "Madal Adeegyada Nolosha ee Luuqadaha Badan",
    description: "Madal adeegyada nolosha oo loogu talagalay dhammaan dadka ku nool Kuuriyada Koonfureed. Kula tasho afkaaga hooyo oo la xiriir khubaro maxalli ah oo la aamini karo.",
    chat: {
      title: "Xarunta Taageerada Macmiilka ee Afka Hooyo",
      description: "Ka codso caawimaad nolosha afkaaga hooyo. Kula sheekayso 1:1 khubaro maxalli ah oo la aaminsan yahay.",
    },
    tech: {
      title: "Xariirka Farsamoyaqiinta",
      description: "Xariirka shaqada ee caawiyayaasha iyo farsamoyaqaannada LIFE.HELP.",
    },
    sys: {
      title: "Nidaamka Maareynta Isku-dhafan ee Xarunta Dhexe",
      description: "Nidaamka rasmiga ah ee xakamaynta iyo maareynta hawlgallada LIFE.HELP.",
    },
  },
  sq: {
    tagline: "Platformë shumëgjuhëshe e shërbimeve jetësore",
    description: "Platforma e shërbimeve të jetesës për të gjithë njerëzit që jetojnë në Kore. Konsultohuni në gjuhën tuaj amtare dhe lidhuni me specialistë vendorë të besueshëm.",
    chat: {
      title: "Qendra e mbështetjes së klientit në gjuhën amtare",
      description: "Kërkoni ndihmë për jetën e përditshme në gjuhën tuaj amtare. Bisedoni 1:1 me specialistë vendorë të besuar.",
    },
    tech: {
      title: "Portali i Teknikëve",
      description: "Portali i punës për ndihmësit dhe teknikët e LIFE.HELP.",
    },
    sys: {
      title: "Sistemi i Integruar i Menaxhimit të Selisë",
      description: "Sistemi zyrtar i integruar i kontrollit dhe menaxhimit operativ të LIFE.HELP.",
    },
  },
  sr: {
    tagline: "Вишејезична платформа услуга за живот",
    description: "Платформа за свакодневне услуге за све људе који живе у Кореји. Саветујте се на свом матерњем језику и повежите се са провереним локалним стручњацима.",
    chat: {
      title: "Вишејезични центар за корисничку подршку",
      description: "Затражите помоћ за свакодневни живот на свом матерњем језику. Разговарајте 1:1 са провереним локалним мајсторима.",
    },
    tech: {
      title: "Портал за стручњаке",
      description: "Радни портал за помагаче и техничаре LIFE.HELP-а.",
    },
    sys: {
      title: "Интегрисани систем управљања седишта",
      description: "Званични интегрисани систем контроле и управљања пословањем LIFE.HELP-а.",
    },
  },
  su: {
    tagline: "Platform Ladenan Kahirupan Sababaraha Basa",
    description: "Platform ladenan kahirupan pikeun sakumna jalma anu cicing di Koréa. Konsultasi dina basa indung anjeun sarta sambungkeun jeung ahli lokal anu tiasa dipercaya.",
    chat: {
      title: "Puseur Pangrojong Palanggan Basa Indung",
      description: "Pénta bantosan ngeunaan kahirupan dina basa indung anjeun. Ngobrol 1:1 sareng spesialis lokal anu tiasa dipercaya.",
    },
    tech: {
      title: "Portal Teknisi",
      description: "Portal damel pikeun réréncangan sareng teknisi LIFE.HELP.",
    },
    sys: {
      title: "Sistem Manajemen Terpadu Kantor Puseur",
      description: "Sistem kontrol sareng manajemen operasional resmi terpadu LIFE.HELP.",
    },
  },
  xh: {
    tagline: "Iqonga leeNkonzo zoBomi zeeLwimi eziNinzi",
    description: "Iqonga leenkonzo zobomi kumntu wonke ohlala eeKorea. Dlana indlebe ngolwimi lwakho lwenkobe kwaye uqhagamshelane neengcali zalapha ezithembekileyo.",
    chat: {
      title: "Iziko leNkxaso yabaXhasi ngoLwimi lweNkobe",
      description: "Cela uncedo ngobomi ngolwimi lwakho lwenkobe. Ncokola 1:1 neengcali zalapha ezithembekileyo.",
    },
    tech: {
      title: "Isango leeNgcali",
      description: "Isango lomsebenzi labancedisi neengcali ze-LIFE.HELP.",
    },
    sys: {
      title: "Inkqubo eDityanisiweyo yoLawulo lweKomkhulu",
      description: "Inkqubo esemthethweni yolawulo nokusebenza ye-LIFE.HELP.",
    },
  },
  yo: {
    tagline: "Pẹpẹ Awọn Iṣẹ Igbesi Aye Oniruuru Ede",
    description: "Pẹpẹ iṣẹ igbe aye fun gbogbo eniyan ti n gbe ni Koria. Kan si wa ni ede abinibi rẹ ki o sopọ mọ awọn alamọja agbegbe ti o ni igbẹkẹle.",
    chat: {
      title: "Ile-iṣẹ Atilẹyin Onibara Ede Abinibi",
      description: "Beere fun iranlọwọ nipa igbesi aye ni ede abinibi rẹ. Wiregbe 1:1 pẹlu awọn alamọja agbegbe ti o gbẹkẹle.",
    },
    tech: {
      title: "Ọna Abawọle Onimọ-ẹrọ",
      description: "Ọna abawọle iṣẹ fun awọn oluranlọwọ ati awọn onimọ-ẹrọ LIFE.HELP.",
    },
    sys: {
      title: "Eto Iṣakoso Ijọpọ Ile-iṣẹ",
      description: "Eto iṣakoso ati iṣẹ ṣiṣe iṣọkan osise ti LIFE.HELP.",
    },
  },
  zu: {
    tagline: "Inkundla Yezinsizakalo Zokuphila Yezilimi Eziningi",
    description: "Inkundla yezinsizakalo zokuphila yabo bonke abantu abahlala eeKorea. Xhumana ngolimi lwakho lwebele futhi uxhumane nochwepheshe bendawo abathembekile.",
    chat: {
      title: "Isikhungo Sokusekela Amakhasimende Ngolimi Lwebele",
      description: "Cela usizo mayelana nokuphila ngolimi lwakho lwebele. Xoxa 1:1 nochwepheshe bendawo abathembekile.",
    },
    tech: {
      title: "Ingosi Yochwepheshe",
      description: "Ingosi yomsebenzi yabasizi nochwepheshe be-LIFE.HELP.",
    },
    sys: {
      title: "Uhlelo Lokulawula Oludidiyelwe Lwekomkhulu",
      description: "Uhlelo olusemthethweni oludidiyelwe lokulawula nokusebenza lwe-LIFE.HELP.",
    },
  },
};

/**
 * Resolves the language code from request headers or host.
 */
export function resolveLanguageFromHeaders(headersList: Headers): string {
  // 1. Explicit x-life-language header (e.g. from /vi or proxy rewrite)
  const rawLangHeader = headersList.get("x-life-language");
  if (rawLangHeader) {
    const lower = rawLangHeader.toLowerCase();
    if (lower === "zt" || lower === "zh-hant") return "zh-Hant";
    if (lower === "zs" || lower === "zh" || lower === "zh-hans") return "zh-Hans";
    const match = locales.find((l) => l.toLowerCase() === lower);
    if (match) return match;
    const found = Object.keys(SITE_METADATA).find((k) => k.toLowerCase() === lower);
    if (found) return found;
  }

  // 2. Explicit x-life-country header (e.g. from vietnam.life.help)
  const countryHeader = headersList.get("x-life-country")?.toLowerCase();
  if (countryHeader && COUNTRY_TO_LANGUAGE_MAP[countryHeader]) {
    return COUNTRY_TO_LANGUAGE_MAP[countryHeader];
  }

  // 3. Detect country from Host header (e.g. vietnam.life.help or tech.vietnam.life.help)
  const host = (
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    ""
  )
    .split(":")[0]
    .toLowerCase();
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
 * Resolves the portal from request headers or host.
 */
export function resolvePortalFromHeaders(
  headersList: Headers
): "customer" | "tech" | "chat" | "sys" {
  const portalHeader = headersList.get("x-life-portal")?.toLowerCase();
  if (
    portalHeader === "chat" ||
    portalHeader === "tech" ||
    portalHeader === "sys"
  ) {
    return portalHeader;
  }

  const host = (
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    ""
  )
    .split(":")[0]
    .toLowerCase();
  if (host === "chat.life.help" || host.startsWith("chat.")) return "chat";
  if (host === "tech.life.help" || host.startsWith("tech.")) return "tech";
  if (host === "sys.life.help" || host.startsWith("sys.")) return "sys";

  return "customer";
}

/**
 * Resolves country key (e.g. "japan", "korea", "china", "indonesia") from request headers or host.
 */
export function resolveCountryFromHeaders(headersList: Headers): string | null {
  // 1. Explicit x-life-country header
  const countryHeader = headersList.get("x-life-country")?.toLowerCase();
  if (countryHeader && COUNTRY_TO_LANGUAGE_MAP[countryHeader]) {
    return countryHeader;
  }

  // 2. Host header
  const host = (
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    ""
  )
    .split(":")[0]
    .toLowerCase();
  const parts = host.split(".");

  if (parts.length >= 3 && parts[parts.length - 1] === "help") {
    const candidate =
      parts[0] === "tech" || parts[0] === "chat" || parts[0] === "sys"
        ? parts[1]
        : parts[0];
    if (candidate && COUNTRY_TO_LANGUAGE_MAP[candidate]) {
      return candidate;
    }
  }

  if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    const candidate = parts[0];
    if (candidate && COUNTRY_TO_LANGUAGE_MAP[candidate]) {
      return candidate;
    }
  }

  return null;
}

/**
 * Generates browser tab / address bar dynamic icons metadata for the specific country.
 */
export function getIconMetadata(country?: string | null, portal?: string | null): NonNullable<Metadata["icons"]> {
  const p = portal?.toLowerCase();
  if (p && ["tech", "chat", "sys"].includes(p)) {
    return {
      icon: [
        { url: `/logos/favicon-${p}.png`, sizes: "32x32", type: "image/png" },
        { url: `/logos/favicon-${p}.png`, sizes: "192x192", type: "image/png" },
        { url: `/logos/favicon-${p}.ico`, sizes: "any" },
      ],
      shortcut: [`/logos/favicon-${p}.png`],
      apple: [
        { url: `/logos/apple-touch-icon-${p}.png`, sizes: "180x180", type: "image/png" },
      ],
    };
  }

  const c = country?.toLowerCase();
  const slug = c && COUNTRY_TO_LANGUAGE_MAP[c] && !COUNTRIES_WITH_GENERIC_BRANDING.has(c) ? c : "default";

  return {
    icon: [
      { url: `/logos/favicon-${slug}.png`, sizes: "32x32", type: "image/png" },
      { url: `/logos/favicon-${slug}.png`, sizes: "192x192", type: "image/png" },
      { url: `/logos/favicon-${slug}.ico`, sizes: "any" },
    ],
    shortcut: [`/logos/favicon-${slug}.png`],
    apple: [
      { url: `/logos/apple-touch-icon-${slug}.png`, sizes: "180x180", type: "image/png" },
    ],
  };
}

/**
 * Returns dynamic Metadata with localized title and description for social link previews and browser titles.
 */
export function getSiteMetadata(lang: string, country?: string | null, secondaryLang?: string | null): Metadata {
  const meta = SITE_METADATA[lang] || SITE_METADATA["ko"];
  const countryUpper = countryBrandName(country);
  let title = countryUpper
    ? `LIFE.HELP ${countryUpper} · ${meta.tagline}`
    : `LIFE.HELP · ${meta.tagline}`;
  let description = getLocalizedSiteDescription(lang, country);

  // When secondary language is specified (e.g. /vi/ko), render bilingual metadata in both languages
  if (secondaryLang && secondaryLang !== lang) {
    const secMeta = SITE_METADATA[secondaryLang] || SITE_METADATA["ko"];
    const secTitle = secMeta.tagline;
    const secDescription = getLocalizedSiteDescription(secondaryLang, country);
    title = `${title} · ${secTitle}`;
    description = `${description}\n${secDescription}`;
  }

  const ogImageUrl = "/og.png?v=20261123";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: brandName(country),
      type: "website",
      locale: ogLocaleFor(lang, country),
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: "LIFE.HELP" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * Returns dynamic localized metadata for specific portals (chat, tech, sys).
 */
export function getPortalMetadata(
  portal: "chat" | "tech" | "sys" | "customer" | string,
  lang: string
): Metadata {
  const meta = SITE_METADATA[lang] || SITE_METADATA["ko"];

  if (portal === "chat") {
    const title = `LIFE.HELP CHAT | ${meta.chat.title}`;
    const description = meta.chat.description;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        siteName: "LIFE.HELP CHAT",
        type: "website",
        locale: ogLocaleFor(lang),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  }

  if (portal === "tech") {
    const title = `LIFE.HELP HELPER | ${meta.tech.title}`;
    const description = meta.tech.description;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        siteName: "LIFE.HELP HELPER",
        type: "website",
        locale: ogLocaleFor(lang),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: { index: false, follow: false },
    };
  }

  if (portal === "sys") {
    const title = `LIFE.HELP HQ | ${meta.sys.title}`;
    const description = meta.sys.description;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        siteName: "LIFE.HELP HQ",
        type: "website",
        locale: ogLocaleFor(lang),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: { index: false, follow: false },
    };
  }

  return getSiteMetadata(lang);
}
