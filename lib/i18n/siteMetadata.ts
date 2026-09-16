// lib/i18n/siteMetadata.ts
import type { Metadata } from "next";

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
};

export const SITE_METADATA: Record<string, SiteMetaTranslation> = {
  ko: {
    tagline: "다국어 생활서비스 플랫폼",
    description: "한국 거주 외국인을 위한 생활서비스 플랫폼. 모국어로 상담하고 신뢰할 수 있는 지역 전문 헬퍼와 연결됩니다.",
    chat: {
      title: "모국어 실시간 상담 센터",
      description: "한국 생활의 모든 고민을 모국어로 전문 상담원과 1:1 실시간 상담하세요.",
    },
    tech: {
      title: "헬퍼 포털",
      description: "LIFE.HELP 공식 헬퍼를 위한 업무 포털. 실시간 출동 상태 변경 및 맞춤 작업 일정을 관리하세요.",
    },
    sys: {
      title: "본사 통합 관리 시스템",
      description: "LIFE.HELP 공식 본사 통합 관제 및 운영 관리 시스템.",
    },
  },
  vi: {
    tagline: "Nền tảng dịch vụ đời sống đa ngôn ngữ",
    description: "Nền tảng dịch vụ đời sống dành cho người nước ngoài tại Hàn Quốc. Tư vấn bằng tiếng mẹ đẻ và kết nối với thợ chuyên nghiệp uy tín.",
    chat: {
      title: "Trung tâm tư vấn trực tiếp bằng tiếng mẹ đẻ",
      description: "Tư vấn trực tuyến 1:1 theo thời gian thực bằng tiếng mẹ đẻ với tư vấn viên chuyên nghiệp cho mọi khó khăn trong cuộc sống tại Hàn Quốc.",
    },
    tech: {
      title: "Cổng đối tác thợ chuyên nghiệp",
      description: "Cổng quản lý công việc dành cho thợ đối tác chính thức của LIFE.HELP. Quản lý trạng thái điều động và lịch làm việc theo thời gian thực.",
    },
    sys: {
      title: "Hệ thống quản trị tổng bộ",
      description: "Hệ thống kiểm soát và điều hành quản trị tập trung chính thức của LIFE.HELP.",
    },
  },
  en: {
    tagline: "Multilingual Living Services Platform",
    description: "Living services platform for foreign residents in Korea. Consult in your native language and connect with verified local specialists.",
    chat: {
      title: "Native Language Real-Time Consultation Center",
      description: "Get 1:1 real-time assistance in your native language with professional counselors for all your daily life needs in Korea.",
    },
    tech: {
      title: "Specialist Helper Partner Portal",
      description: "Operations portal for official LIFE.HELP helper partners. Manage your real-time dispatch availability and work schedules.",
    },
    sys: {
      title: "Headquarters Integrated Control System",
      description: "Official centralized operations and control management system for LIFE.HELP.",
    },
  },
  "zh-Hans": {
    tagline: "多语言生活服务平台",
    description: "面向在韩外国人的生活服务平台。使用母语即时咨询，直接连接值得信赖的本地专业师傅。",
    chat: {
      title: "母语在线即时咨询中心",
      description: "使用母语与专业咨询顾问一对一实时交流，轻松解决在韩工作与生活的各项难题。",
    },
    tech: {
      title: "专业师傅合作门户",
      description: "LIFE.HELP 官方认证师傅专属工作门户。实时管理出勤派单状态与日程安排。",
    },
    sys: {
      title: "总部统一运营管控系统",
      description: "LIFE.HELP 官方总部统一调度与运营指挥管控系统。",
    },
  },
  "zh-Hant": {
    tagline: "多語言生活服務平台",
    description: "專為在韓外籍居民打造的生活服務平台。使用母語即時諮詢，快速媒合在地值得信賴的專業師傅。",
    chat: {
      title: "母語在線即時諮詢中心",
      description: "使用母語與專業諮詢顧問一對一即時交流，輕鬆解決在韓生活與工作的各項疑難。",
    },
    tech: {
      title: "專業師傅合作門戶",
      description: "LIFE.HELP 官方認證師傅專屬工作門戶。即時管理出勤派工狀態與服務時程。",
    },
    sys: {
      title: "總部統一營運管控系統",
      description: "LIFE.HELP 官方總部統一調度與營運指揮管控系統。",
    },
  },
  ja: {
    tagline: "多言語生活サービスプラットフォーム",
    description: "在韓外国人向け生活支援プラットフォーム。母国語で相談でき、信頼できる地域専門スタッフとマッチングします。",
    chat: {
      title: "母国語リアルタイム相談センター",
      description: "韓国生活のあらゆるお困りごとを、母国語で専門カウンセラーと1対1でリアルタイム相談できます。",
    },
    tech: {
      title: "専門スタッフ(ヘルパー)ポータル",
      description: "LIFE.HELP 公式ヘルパーパートナー専用ポータル。出動ステータスや作業スケジュールの管理を行えます。",
    },
    sys: {
      title: "本部統合管理システム",
      description: "LIFE.HELP 公式本部統合オペレーション＆管理システム。",
    },
  },
  pl: {
    tagline: "Wielojęzyczna platforma usług codziennych",
    description: "Platforma usług codziennych dla obcokrajowców w Korei. Konsultacje w języku ojczystym i kontakt ze sprawdzonymi lokalnymi fachowcami.",
    chat: {
      title: "Centrum konsultacji w czasie rzeczywistym w języku ojczystym",
      description: "Konsultacje 1:1 w czasie rzeczywistym w języku ojczystym z profesjonalnymi doradcami w sprawach życia codziennego w Korei.",
    },
    tech: {
      title: "Portal oficjalnych partnerów i fachowców",
      description: "Portal pracy dla oficjalnych specjalistów LIFE.HELP. Zarządzaj dostępnością do zleceń i harmonogramem w czasie rzeczywistym.",
    },
    sys: {
      title: "Zintegrowany system zarządzania centrali",
      description: "Oficjalny centralny system nadzoru i zarządzania operacyjnego LIFE.HELP.",
    },
  },
  de: {
    tagline: "Mehrsprachige Plattform für Alltagsdienste",
    description: "Plattform für Alltagsdienste für ausländische Bewohner in Korea. Beratung in der Muttersprache und Vermittlung geprüfter Handwerker.",
    chat: {
      title: "Echtzeit-Beratungszentrum in Ihrer Muttersprache",
      description: "Erhalten Sie 1:1-Echtzeitberatung in Ihrer Muttersprache mit professionellen Beratern für alle Fragen des Lebens in Korea.",
    },
    tech: {
      title: "Partnerportal für zertifizierte Helfer",
      description: "Arbeitsportal für offizielle LIFE.HELP-Partner. Verwalten Sie Einsatzverfügbarkeiten und Arbeitszeiten in Echtzeit.",
    },
    sys: {
      title: "Zentrales Verwaltungssystem der Unternehmenszentrale",
      description: "Offizielles integriertes Leit- und Betriebsmanagementsystem von LIFE.HELP.",
    },
  },
  fr: {
    tagline: "Plateforme multilingue de services du quotidien",
    description: "Plateforme de services du quotidien pour les résidents étrangers en Corée. Conseils dans votre langue maternelle et mise en relation avec des artisans de confiance.",
    chat: {
      title: "Centre de consultation en temps réel dans votre langue maternelle",
      description: "Bénéficiez d'une assistance 1:1 en temps réel et dans votre langue avec des conseillers pour votre quotidien en Corée.",
    },
    tech: {
      title: "Portail des artisans et partenaires agréés",
      description: "Portail professionnel pour les helpers officiels de LIFE.HELP. Gérez vos disponibilités d'intervention et vos plannings.",
    },
    sys: {
      title: "Système de gestion intégrée du siège",
      description: "Système centralisé officiel de gestion et d'opérations de LIFE.HELP.",
    },
  },
  es: {
    tagline: "Plataforma multilingüe de servicios para el hogar",
    description: "Plataforma de servicios del hogar para extranjeros en Corea. Asesoramiento en su idioma materno y conexión con técnicos locales de confianza.",
    chat: {
      title: "Centro de Consulta en Tiempo Real en su Idioma Materno",
      description: "Consulte 1:1 en tiempo real en su idioma nativo con asesores profesionales para resolver cualquier duda sobre su vida en Corea.",
    },
    tech: {
      title: "Portal de Socios Especialistas (Helper)",
      description: "Portal de trabajo para especialistas oficiales de LIFE.HELP. Gestione su disponibilidad de despacho y horarios en tiempo real.",
    },
    sys: {
      title: "Sistema Integrado de Control de la Sede Central",
      description: "Sistema oficial de operaciones y control centralizado de LIFE.HELP.",
    },
  },
  pt: {
    tagline: "Plataforma multilíngue de serviços cotidianos",
    description: "Plataforma de serviços cotidianos para estrangeiros na Coreia. Atendimento no seu idioma nativo e conexão com especialistas confiáveis.",
    chat: {
      title: "Centro de Consulta em Tempo Real no seu Idioma Nativo",
      description: "Atendimento 1:1 em tempo real com consultores especializados para qualquer necessidade do seu cotidiano na Coreia.",
    },
    tech: {
      title: "Portal de Especialistas e Parceiros Oficiais",
      description: "Portal de trabalho para parceiros da LIFE.HELP. Gerencie sua disponibilidade de atendimento e agenda de trabalho em tempo real.",
    },
    sys: {
      title: "Sistema de Controle Integrado da Sede",
      description: "Sistema centralizado oficial de gerenciamento e operações da LIFE.HELP.",
    },
  },
  it: {
    tagline: "Piattaforma multilingue di servizi per la vita quotidiana",
    description: "Piattaforma multilingue di servizi per la vita quotidiana per residenti stranieri in Corea. Consulenza nella tua lingua madre e contatto con tecnici locali affidabili.",
    chat: {
      title: "Centro di consulenza in tempo reale nella tua lingua madre",
      description: "Consulenza 1:1 in tempo reale nella propria lingua madre con esperti per ogni necessità di vita quotidiana in Corea.",
    },
    tech: {
      title: "Portale dei tecnici e partner autorizzati",
      description: "Portale di lavoro per i tecnici ufficiali LIFE.HELP. Gestione in tempo reale di disponibilità e turni di lavoro.",
    },
    sys: {
      title: "Sistema di gestione integrata della sede centrale",
      description: "Sistema ufficiale di controllo operativo centralizzato di LIFE.HELP.",
    },
  },
  ru: {
    tagline: "Многоязычная платформа бытовых услуг",
    description: "Платформа бытовых услуг для иностранцев в Корее. Консультации на родном языке и связь с проверенными местными мастерами.",
    chat: {
      title: "Центр онлайн-консультаций на родном языке",
      description: "Индивидуальные консультации 1:1 на родном языке в реальном времени со специалистами по всем вопросам жизни в Корее.",
    },
    tech: {
      title: "Портал сертифицированных мастеров-партнеров",
      description: "Рабочий портаल для официальных мастеров LIFE.HELP. Управление статусом выезда и рабочим графиком в реальном времени.",
    },
    sys: {
      title: "Единая система управления штаб-квартиры",
      description: "Официальная централизованная система контроля и управления операциями LIFE.HELP.",
    },
  },
  uk: {
    tagline: "Багатомовна платформа побутових послуг",
    description: "Платформа побутових послуг для іноземців у Кореї. Консультації рідною мовою та прямий зв'язок із перевіреними місцевими майстрами.",
    chat: {
      title: "Центр онлайн-консультацій рідною мовою в реальному часі",
      description: "Індивідуальні онлайн-консультації 1:1 рідною мовою з фахівцями з усіх питань життя та побуту в Кореї.",
    },
    tech: {
      title: "Портал сертифікованих майстрів-партнерів",
      description: "Робочий портал для офіційних майстрів LIFE.HELP. Керування статусом викликів і розкладом робіт у реальному часі.",
    },
    sys: {
      title: "Єдина система управління головного офісу",
      description: "Офіційна централізована система оперативного контролю та адміністрування LIFE.HELP.",
    },
  },
  tr: {
    tagline: "Çok Dilli Yaşam Hizmetleri Platformu",
    description: "Kore'de yaşayan yabancılar için yaşam hizmetleri platformu. Kendi ana dilinizde danışın ve güvenilir yerel uzman ustalarla bağlantı kurun.",
    chat: {
      title: "Ana Dilinizde Gerçek Zamanlı Danışmanlık Merkezi",
      description: "Kore'deki tüm yaşam ihtiyaçlarınız için ana dilinizde uzman danışmanlarla 1:1 canlı görüşün.",
    },
    tech: {
      title: "Uzman Usta Partner Portalı",
      description: "LIFE.HELP resmi ustaları için çalışma portalı. Gerçek zamanlı görev durumu ve çalışma takvimini yönetin.",
    },
    sys: {
      title: "Genel Merkez Entegre Kontrol Sistemi",
      description: "LIFE.HELP resmi merkezi operasyon ve denetim yönetim sistemi.",
    },
  },
  id: {
    tagline: "Platform Layanan Kehidupan Multibahasa",
    description: "Platform layanan kehidupan untuk warga asing di Korea. Konsultasi dalam bahasa ibu dan terhubung langsung dengan teknisi ahli lokal tepercaya.",
    chat: {
      title: "Pusat Konsultasi Real-Time Bahasa Ibu",
      description: "Dapatkan konsultasi 1:1 langsung dalam bahasa ibu bersama konselor profesional untuk segala kebutuhan hidup di Korea.",
    },
    tech: {
      title: "Portal Mitra Teknisi Ahli",
      description: "Portal kerja untuk mitra resmi LIFE.HELP. Kelola status ketersediaan panggilan dan jadwal kerja secara real-time.",
    },
    sys: {
      title: "Sistem Kontrol Terpadu Kantor Pusat",
      description: "Sistem operasional dan kendali terpusat resmi LIFE.HELP.",
    },
  },
  th: {
    tagline: "แพลตฟอร์มบริการการใช้ชีวิตหลายภาษา",
    description: "แพลตฟอร์มบริการการใช้ชีวิตสำหรับชาวต่างชาติในเกาหลี ปรึกษาด้วยภาษาแม่ของคุณและเชื่อมต่อกับช่างผู้เชี่ยวชาญในท้องถิ่นที่เชื่อถือได้",
    chat: {
      title: "ศูนย์ให้คำปรึกษาแบบเรียลไทม์ด้วยภาษาแม่",
      description: "รับคำปรึกษา 1:1 แบบเรียลไทม์ในภาษาของคุณกับผู้เชี่ยวชาญสำหรับทุกปัญหาการใช้ชีวิตในเกาหลี",
    },
    tech: {
      title: "พอร์ทัลช่างผู้เชี่ยวชาญพาร์ทเนอร์",
      description: "พอร์ทัลการทำงานสำหรับช่างพาร์ทเนอร์อย่างเป็นทางการของ LIFE.HELP จัดการสถานะพร้อมให้บริการและตารางงานแบบเรียลไทม์",
    },
    sys: {
      title: "ระบบควบคุมแบบบูรณาการของสำนักงานใหญ่",
      description: "ระบบควบคุมการปฏิบัติการและการจัดการส่วนกลางอย่างเป็นทางการของ LIFE.HELP",
    },
  },
  nl: {
    tagline: "Meertalig platform voor levensdiensten",
    description: "Platform voor levensdiensten voor buitenlandse inwoners in Korea. Advies in uw moedertaal en direct contact met betrouwbare lokale vakmensen.",
    chat: {
      title: "Realtime adviescentrum in uw moedertaal",
      description: "Ontvang 1-op-1 realtime advies in uw eigen taal met professionele consulenten voor al uw dagelijkse vragen in Korea.",
    },
    tech: {
      title: "Partnerportaal voor gecertificeerde vakmensen",
      description: "Werkportaal voor officiële LIFE.HELP-partners. Beheer realtime beschikbaarheid en werkschema's.",
    },
    sys: {
      title: "Geïntegreerd controlesysteem hoofdkantoor",
      description: "Het officiële gecentraliseerde operationele beheersysteem van LIFE.HELP.",
    },
  },
  sv: {
    tagline: "Flerspråkig plattform för vardagstjänster",
    description: "Plattform för vardagstjänster för utländska invånare i Korea. Rådgivning på modersmålet och koppling till pålitliga lokala hantverkare.",
    chat: {
      title: "Realtidsrådgivningscenter på ditt modersmål",
      description: "Få individuell rådgivning 1:1 i realtid på ditt modersmål med professionella rådgivare för alla frågor om livet i Korea.",
    },
    tech: {
      title: "Partnerportal för certifierade hjälpare",
      description: "Arbetsportal för officiella LIFE.HELP-partners. Hantera tillgänglighet för utryckning och arbetsschema i realtid.",
    },
    sys: {
      title: "Huvudkontorets integrerade kontrollsystem",
      description: "Officiellt centraliserat drift- och administrationssystem för LIFE.HELP.",
    },
  },
  da: {
    tagline: "Flersproget platform for hverdagstjenester",
    description: "Platform for hverdagstjenester for udenlandske beboere i Korea. Rådgivning på dit modersmål og forbindelse til pålidelige lokale håndværkere.",
    chat: {
      title: "Rådgivningscenter i realtid på dit modersmål",
      description: "Få 1:1 realtidsrådgivning på dit modersmål med professionelle rådgivere til alle situationer i Korea.",
    },
    tech: {
      title: "Partnerportal for certificerede hjælpere",
      description: "Arbejdsportal for officielle LIFE.HELP-partnere. Administrer udrykningsstatus og arbejdsskema i realtid.",
    },
    sys: {
      title: "Hovedkvarterets integrerede kontrolsystem",
      description: "Det officielle centraliserede drifts- og kontrolsystem for LIFE.HELP.",
    },
  },
  no: {
    tagline: "Flerspråklig plattform for hverdagstjenester",
    description: "Plattform for hverdagstjenester for utenlandske innbyggere i Korea. Rådgivning på morsmålet og kontakt med pålitelige lokale fagfolk.",
    chat: {
      title: "Rådgivningssenter i sanntid på morsmålet",
      description: "Få 1:1 sanntidsrådgivning på ditt morsmål med fagpersoner for alle sider ved livet i Korea.",
    },
    tech: {
      title: "Partnerportal for sertifiserte hjelpere",
      description: "Arbeidsportal for offisielle LIFE.HELP-partnere. Administrer oppdragsstatus og vaktplaner i sanntid.",
    },
    sys: {
      title: "Hovedkvarterets integrerte kontrollsystem",
      description: "Det offisielle sentrale drifts- og kontrollsystemet for LIFE.HELP.",
    },
  },
  el: {
    tagline: "Πολυγλωσσική πλατφόρμα υπηρεσιών καθημερινής ζωής",
    description: "Πλατφόρμα υπηρεσιών καθημερινής ζωής για αλλοδαπούς κατοίκους στην Κορέα. Συμβουλευτείτε στη μητρική σας γλώσσα και συνδεθείτε με αξιόπιστους τοπικούς ειδικούς τεχνικούς.",
    chat: {
      title: "Κέντρο διαβούλευσης σε πραγματικό χρόνο στη μητρική σας γλώσσα",
      description: "Συμβουλευτείτε 1:1 ζωντανά στη μητρική σας γλώσσα ειδικούς για όλες τις ανάγκες διαβίωσης στην Κορέα.",
    },
    tech: {
      title: "Πύλη πιστοποιημένων συνεργατών τεχνικών",
      description: "Πύλη εργασίας για τους επίσημους συνεργάτες του LIFE.HELP. Διαχειριστείτε τη διαθεσιμότητα και το πρόγραμμά σας σε πραγματικό χρόνο.",
    },
    sys: {
      title: "Ενιαίο σύστημα ελέγχου κεντρικών γραφείων",
      description: "Επίσημο κεντρικό σύστημα επιχειρησιακής διαχείρισης και ελέγχου του LIFE.HELP.",
    },
  },
  ar: {
    tagline: "منصة الخدمات المعيشية متعددة اللغات",
    description: "منصة الخدمات المعيشية للمقيمين الأجانب في كوريا. استشارات بلغتك الأم وتواصل مباشر مع فنيين وخبراء محليين موثوقين.",
    chat: {
      title: "مركز الاستشارات الفورية بلغتك الأم",
      description: "استشارات مباشرة 1:1 في الوقت الفعلي بلغتك الأم مع مستشارين متخصصين لكل ما يخص المعيشة في كوريا.",
    },
    tech: {
      title: "بوابة شركاء المساعدة والحرفيين المعتمدين",
      description: "بوابة العمل الرسمية لشركاء LIFE.HELP. إدارة حالة الجاهزية للتدخل ومواعيد العمل في الوقت الفعلي.",
    },
    sys: {
      title: "نظام التحكم والإدارة الموحد للمقر الرئيسي",
      description: "نظام المراقبة والعمليات المركزي الرسمي لخدمات LIFE.HELP.",
    },
  },
  arz: {
    tagline: "منصة الخدمات المعيشية متعددة اللغات",
    description: "منصة الخدمات المعيشية للمقيمين الأجانب في كوريا. استشارات بلغتك الأم وتواصل مباشر مع فنيين وخبراء محليين موثوقين.",
    chat: {
      title: "مركز الاستشارات الفورية بلغتك الأم",
      description: "استشارات مباشرة 1:1 في الوقت الفعلي بلغتك الأم مع مستشارين متخصصين لكل ما يخص المعيشة في كوريا.",
    },
    tech: {
      title: "بوابة شركاء المساعدة والحرفيين المعتمدين",
      description: "بوابة العمل الرسمية لشركاء LIFE.HELP. إدارة حالة الجاهزية للتدخل ومواعيد العمل في الوقت الفعلي.",
    },
    sys: {
      title: "نظام التحكم والإدارة الموحد للمقر الرئيسي",
      description: "نظام المراقبة والعمليات المركزي الرسمي لخدمات LIFE.HELP.",
    },
  },
  fa: {
    tagline: "پلتفرم خدمات زندگی چندزبانه",
    description: "پلتفرم خدمات زندگی برای ساکنان خارجی در کره. مشاوره به زبان مادری و ارتباط با متخصصان معتمد محلی.",
    chat: {
      title: "مرکز مشاوره آنلاین و زنده به زبان مادری",
      description: "مشاوره اختصاصی 1:1 زنده به زبان مادری با مشاوران حرفه‌ای برای رسیدگی به تمام دغدغه‌های زندگی در کره.",
    },
    tech: {
      title: "پورتال شرکا و متخصصان رسمی امداد",
      description: "پورتال کاری ویژه متخصصان رسمی LIFE.HELP. مدیریت وضعیت آمادگی اعزام و ساعات کاری به صورت آنلاین.",
    },
    sys: {
      title: "سامانه کنترل و عملیات یکپارچه دفتر مرکزی",
      description: "سامانه رسمی هدایت و نظارت متمرکز خدمات LIFE.HELP.",
    },
  },
  he: {
    tagline: "פלטפורמת שירותי חיים רב-לשונית",
    description: "פלטפורמת שירותי חיים לתושבים זרים בקוריאה. ייעוץ בשפת האם וחיבור לבעלי מקצוע מקומיים מוסמכים.",
    chat: {
      title: "מרכז ייעוץ בזמן אמת בשפת האם",
      description: "קבלו ייעוץ אישי 1:1 בזמן אמת בשפת האם עם יועצים מומחים לכל עניין בחיי היומיום בקוריאה.",
    },
    tech: {
      title: "פורטל שותפים ומומחים מוסמכים",
      description: "פורטל עבודה למומחים הרשמיים של LIFE.HELP. ניהול זמינות לקריאות ולוחות זמנים בזמן אמת.",
    },
    sys: {
      title: "מערכת שליטה ובקרה מרכזית של ההנהלה",
      description: "מערכת הניהול והתפעול המרכזית הרשמית של LIFE.HELP.",
    },
  },
  hi: {
    tagline: "बहुभाषी जीवन सेवा मंच",
    description: "कोरिया में विदेशी निवासियों के लिए जीवन सेवा मंच। अपनी मातृभाषा में परामर्श करें और विश्वसनीय स्थानीय तकनीशियनों से जुड़ें।",
    chat: {
      title: "मातृभाषा में रीयल-टाइम परामर्श केंद्र",
      description: "कोरिया में जीवन से जुड़े सभी मुद्दों के लिए पेशेवर सलाहकारों से अपनी मातृभाषा में 1:1 लाइव परामर्श प्राप्त करें।",
    },
    tech: {
      title: "विशेषज्ञ हेल्पर पार्टनर पोर्टल",
      description: "LIFE.HELP के आधिकारिक हेल्पर पार्टनर्स के लिए कार्य पोर्टल। अपनी उपलब्धता और कार्य शेड्यूल प्रबंधित करें।",
    },
    sys: {
      title: "मुख्यालय एकीकृत नियंत्रण प्रणाली",
      description: "LIFE.HELP की आधिकारिक केंद्रीय परिचालन और नियंत्रण प्रबंधन प्रणाली।",
    },
  },
  bn: {
    tagline: "বহুভাষিক জীবন পরিষেবা প্ল্যাটফর্ম",
    description: "কোরিয়ায় বসবাসকারী বিদেশী নাগরিকদের জন্য জীবন পরিষেবা প্ল্যাটফর্ম। নিজের মাতৃভাষায় পরামর্শ নিন এবং বিশ্বস্ত স্থানীয় টেকনিশিয়ানদের সাথে যুক্ত হন।",
    chat: {
      title: "মাতৃভাষায় রিয়েল-টাইম পরামর্শ কেন্দ্র",
      description: "কোরিয়ায় জীবনযাপনের যেকোনো প্রয়োজনে পেশাদার উপদেষ্টাদের সাথে নিজের মাতৃভাষায় সরাসরি 1:1 পরামর্শ নিন।",
    },
    tech: {
      title: "বিশেষজ্ঞ হেল্পার পার্টনার পোর্টাল",
      description: "LIFE.HELP এর অফিসিয়াল পার্টনারদের কাজের পোর্টাল। রিয়েল-টাইমে কাজের উপস্থিতি ও সময়সূচি পরিচালনা করুন।",
    },
    sys: {
      title: "হেডকোয়ার্টার সমন্বিত নিয়ন্ত্রণ ব্যবস্থা",
      description: "LIFE.HELP এর অফিসিয়াল কেন্দ্রীয় অপারেশন ও ব্যবস্থাপনা নিয়ন্ত্রণ ব্যবস্থা।",
    },
  },
  ta: {
    tagline: "பல்மொழி வாழ்க்கை சேவை தளம்",
    description: "கொரியாவில் வாழும் வெளிநாட்டினருக்கான வாழ்க்கை சேவை தளம். உங்கள் தாய்மொழியில் ஆலோசனை பெற்று நம்பகமான உள்ளூர் வல்லுநர்களுடன் இணையுங்கள்.",
    chat: {
      title: "தாய்மொழியில் நிகழ்நேர ஆலோசனை மையம்",
      description: "கொரியாவில் அன்றாட தேவைகளுக்கு தொழில்முறை ஆலோசகர்களுடன் உங்கள் தாய்மொழியில் 1:1 நேரலை ஆலோசனை பெறுங்கள்।",
    },
    tech: {
      title: "நிபுணத்துவ உதவியாளர் பார்ட்னர் போர்டல்",
      description: "LIFE.HELP அதிகாரப்பூர்வ பார்ட்னர்களுக்கான பணி தளம். உங்கள் பணி நிலை மற்றும் அட்டவணையை நிர்வகியுங்கள்।",
    },
    sys: {
      title: "தலைமையக ஒருங்கிணைந்த கட்டுப்பாட்டு அமைப்பு",
      description: "LIFE.HELP இன் அதிகாரப்பூர்வ மத்திய செயல்பாட்டு கட்டுப்பாட்டு அமைப்பு.",
    },
  },
  si: {
    tagline: "බහුභාෂා ජීවන සේවා වේදිකාව",
    description: "කොරියාවේ වෙසෙන විදේශිකයන් සඳහා වන ජීවන සේවා වේදිකාව. ඔබේ මව්බසින් උපදෙස් ලබාගෙන විශ්වාසදායක ප්‍රදේශයේ කාර්මික ශිල්පීන් සමඟ සම්බන්ධ වන්න.",
    chat: {
      title: "මව්බසින් සජීවී උපදේශන මධ්‍යස්ථානය",
      description: "කොරියාවේ ජීවන ගැටළු සඳහා වෘත්තීය උපදේශකයන් සමඟ ඔබේ මව්බසින් 1:1 සජීවීව උපදෙස් ලබා ගන්න.",
    },
    tech: {
      title: "විශේෂඥ හෙල්පර් පාර්ශ්වකරුවන්ගේ ද්වාරය",
      description: "LIFE.HELP නිල හෙල්පර්වරුන් සඳහා වූ සේවා ද්වාරය. ඔබගේ සේවා ලබාදීමේ තත්ත්වය සහ කාලසටහන කළමනාකරණය කරන්න.",
    },
    sys: {
      title: "ප්‍රධාන කාර්යාල ඒකාබද්ධ පාලන පද්ධතිය",
      description: "LIFE.HELP නිල මෙහෙයුම් සහ පරිපාලන පාලන පද්ධතිය.",
    },
  },
  ne: {
    tagline: "बहुभाषी जीवन सेवा प्लेटफर्म",
    description: "कोरियामा बस्ने विदेशी बासिन्दाहरूका लागि जीवन सेवा प्लेटफर्म। आफ्नै मातृभाषामा परामर्श लिनुहोस् र भरपર્दो स्थानीय प्राविधिकहरूसँग जोडिनुहोस्।",
    chat: {
      title: "मातृभाषामा प्रत्यक्ष परामर्श केन्द्र",
      description: "कोरियाको दैनिक जीवनसम्बन्धी समस्याहरूका लागि आफ्नै मातृभाषामा विज्ञ परामर्शदाताहरूसँग १:१ प्रत्यक्ष सल्लाह लिनुहोस्।",
    },
    tech: {
      title: "विशेषज्ञ हेल्पर पार्टनर पोर्टल",
      description: "LIFE.HELP आधिकारिक हेल्परहरूका लागि कार्य पोर्टल। प्रत्यक्ष उपलब्धता र कार्य तालिका व्यवस्थापन गर्नुहोस्।",
    },
    sys: {
      title: "मुख्यालय एकीकृत नियन्त्रण प्रणाली",
      description: "LIFE.HELP को आधिकारिक केन्द्रीय सञ्चालन तथा नियन्त्रण प्रणाली।",
    },
  },
  my: {
    tagline: "ဘာသာစကားမျိုးစုံ လူနေမှုဘဝဝန်ဆောင်မှု ပလက်ဖောင်း",
    description: "ကိုရီးယားရှိ နိုင်ငံခြားသားများအတွက် လူနေမှုဘဝဝန်ဆောင်မှု ပလက်ဖောင်း။ မိခင်ဘာသာစကားဖြင့် ဆွေးနွေးတိုင်ပင်ပြီး စိတ်ချရသော ဒေသတွင်း ကျွမ်းကျင်ပညာရှင်များနှင့် တိုက်ရိုက်ချိတ်ဆက်ပါ။",
    chat: {
      title: "မိခင်ဘာသာစကားဖြင့် အချိန်နှင့်တပြေးညီ အကြံပေးစင်တာ",
      description: "ကိုရီးယားရှိ လူနေမှုဘဝအခက်အခဲများကို မိခင်ဘာသာစကားဖြင့် ကျွမ်းကျင်အကြံပေးများနှင့် ၁:၁ တိုက်ရိုက်ဆွေးနွေးပါ။",
    },
    tech: {
      title: "ကျွမ်းကျင်လက်ထောက် ပါတနာပေါ်တယ်",
      description: "LIFE.HELP တရားဝင်ပါတနာများအတွက် အလုပ်လုပ်ကိုင်မှုပေါ်တယ်ဖြစ်ပြီး ဝန်ဆောင်မှုအခြေအနေနှင့် အချိန်ဇယားများကို စီမံခန့်ခွဲနိုင်သည်။",
    },
    sys: {
      title: "ရုံးချုပ် ပေါင်းစပ်ထိန်းချုပ်မှုစနစ်",
      description: "LIFE.HELP ၏ တရားဝင် ဗဟိုလည်ပတ်မှုနှင့် စီမံခန့်ခွဲမှု ထိန်းချုပ်ရေးစနစ်။",
    },
  },
  km: {
    tagline: "វេទិកាសេវាកម្មជីវិតពហុភាសា",
    description: "វេទិកាសេវាកម្មជីវិតសម្រាប់ជនបរទេសដែលរស់នៅក្នុងប្រទេសកូរ៉េ។ ពិគ្រោះជាភាសាកំណើតរបស់អ្នក និងភ្ជាប់ទំនាក់ទំនងជាមួយជាងជំនាញក្នុងតំបន់ដែលគួរឱ្យទុកចិត្ត។",
    chat: {
      title: "មជ្ឈមណ្ឌលពិគ្រោះយោបល់ផ្ទាល់ជាភាសាកំណើត",
      description: "ទទួលបានការពិគ្រោះយោបល់ផ្ទាល់ ១:១ ជាភាសាកំណើតជាមួយអ្នកជំនាញ សម្រាប់រាល់បញ្ហាជីវិតនៅកូរ៉េ។",
    },
    tech: {
      title: "ផតថលដៃគូជំនួយការជំនាញ",
      description: "ផតថលការងារសម្រាប់ដៃគូផ្លូវការរបស់ LIFE.HELP។ គ្រប់គ្រងស្ថានភាពនៃការចេញបំពេញការងារ និងកាលវិភាគការងារ។",
    },
    sys: {
      title: "ប្រព័ន្ធគ្រប់គ្រងរួមនៃការិយាល័យកណ្តាល",
      description: "ប្រព័ន្ធគ្រប់គ្រងប្រតិបត្តិការកណ្តាលផ្លូវការរបស់ LIFE.HELP។",
    },
  },
  mn: {
    tagline: "Олон хэлний ахуйн үйлчилгээний платформ",
    description: "Солонгос улсад оршин суугаа гадаадын иргэдэд зориулсан ахуйн үйлчилгээний платформ. Эх хэлээрээ зөвлөгөө авч, найдвартай мэргэжилтнүүдтэй шууд холбогдоорой.",
    chat: {
      title: "Эх хэлний шууд зөвлөгөө өгөх төв",
      description: "Солонгос дахь амьдралын аливаа асуудлаар мэргэжлийн зөвлөхүүдтэй эх хэлээрээ 1:1 шууд холбогдож зөвлөгөө аваарай.",
    },
    tech: {
      title: "Мэргэшсэн туслах (Хэлпэр) түншийн портал",
      description: "LIFE.HELP албан ёсны хамтрагчдад зориулсан ажлын портал. Дуудлагын бэлэн байдал болон хуваариа бодит цагт удирдах боломжтой.",
    },
    sys: {
      title: "Төв оффисын нэгдсэн хяналтын систем",
      description: "LIFE.HELP үйлчилгээний албан ёсны төв удирдлага, үйл ажиллагааны хяналтын систем.",
    },
  },
  kk: {
    tagline: "Көптілді тұрмыстық қызметтер платформасы",
    description: "Кореядағы шетелдік азаматтарға арналған тұрмыстық қызметтер платформасы. Өз ана тіліңізде кеңес алып, сенімді жергілікті шеберлермен байланысыңыз.",
    chat: {
      title: "Ана тіліндегі нақты уақыттағы кеңес беру орталығы",
      description: "Кореядағы тұрмыстық мәселелер бойынша кәсіби кеңесшілерден өз ана тіліңізде 1:1 онлайн кеңес алыңыз.",
    },
    tech: {
      title: "Кәсіби шеберлердің серіктестік порталы",
      description: "LIFE.HELP ресми шеберлеріне арналған жұмыс порталы. Шұғыл шығу күйі мен жұмыс кестесін нақты уақытта басқарыңыз.",
    },
    sys: {
      title: "Бас кеңсенің бірыңғай басқару жүйесі",
      description: "LIFE.HELP ресми орталықтандырылған диспетчерлік және операциялық басқару жүйесі.",
    },
  },
  uz: {
    tagline: "Ko'p tilli turmush xizmatlari platformasi",
    description: "Koreyada yashovchi chet elliklar uchun turmush xizmatlari platformasi. O'z ona tilingizda maslahat oling va ishonchli mahalliy ustalar bilan bog'laning.",
    chat: {
      title: "Ona tilida jonli maslahat markazi",
      description: "Koreyadagi turmush masalalari bo'yicha mutaxassislar bilan o'z ona tilingizda 1:1 jonli muloqot qiling.",
    },
    tech: {
      title: "Mutaxassis ustalar hamkorlik portali",
      description: "LIFE.HELP rasmiy ustalari uchun ishchi portal. Chaqiruv holati va ish jadvalingizni real vaqt rejimida boshqaring.",
    },
    sys: {
      title: "Bosh ofis yagona boshqaruv tizimi",
      description: "LIFE.HELP rasmiy markaziy nazorat va operatsiyalarni boshqarish tizimi.",
    },
  },
  tet: {
    tagline: "Plataforma servisu moris nian iha lian barak",
    description: "Plataforma servisu moris nian ba ema estranjeiru sira ne'ebé hela iha Koreia. Konsulta ho ita-boot nia lian inan no liga ba tékniku profisionál lokál ne'ebé fiar-laek.",
    chat: {
      title: "Sentru Konsulta Diretamente ho Lian Inan",
      description: "Konsulta 1:1 ho lian inan ho konsulente profisionál sira kona-ba moris nian iha Koreia.",
    },
    tech: {
      title: "Portál Parseiru Tékniku Profisionál",
      description: "Portál servisu nian ba parseiru ofisiál LIFE.HELP. Jere disponibilidade no oráriu servisu iha tempu loloos.",
    },
    sys: {
      title: "Sitema Kontrolu Sentrál Sede Nian",
      description: "Sistema operasionál no kontrolu sentralizadu ofisiál husi LIFE.HELP.",
    },
  },
  am: {
    tagline: "የብዙ ቋንቋ የዕለት ተዕለት ኑሮ አገልግሎት መድረክ",
    description: "በኮሪያ ለሚኖሩ የውጭ ሀገር ዜጎች የተዘጋጀ የዕለት ተዕለት ኑሮ አገልግሎት መድረክ። በአፍ መፍቻ ቋንቋዎ ይማከሩ እና ከታመኑ የአካባቢው ባለሙያዎች ጋር ይገናኙ።",
    chat: {
      title: "የአፍ መፍቻ ቋንቋ የቀጥታ የምክር ማዕከል",
      description: "በኮሪያ ውስጥ ለሚገጥምዎት ማንኛውም የዕለት ተዕለት ችግር ከባለሙያዎች ጋር በአፍ መፍቻ ቋንቋዎ 1:1 በቀጥታ ይማከሩ።",
    },
    tech: {
      title: "የሙያ ረዳት አጋሮች ፖርታል",
      description: "የLIFE.HELP ይፋዊ አጋሮች የሥራ ፖርታል። የእርስዎን የስራ ዝግጁነት እና መርሃ ግብር በቀጥታ ያስተዳድሩ።",
    },
    sys: {
      title: "የዋनाው መሥሪያ ቤት የተቀናጀ ቁጥጥር ሥርዓት",
      description: "የLIFE.HELP ይፋዊ ማዕከላዊ የቁጥጥር እና የአሠራር አስተዳደር ሥርዓት።",
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
export function getIconMetadata(country?: string | null): NonNullable<Metadata["icons"]> {
  const c = country?.toLowerCase();
  const slug = c && COUNTRY_TO_LANGUAGE_MAP[c] ? c : "default";

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
        locale: lang === "ko" ? "ko_KR" : lang,
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
        locale: lang === "ko" ? "ko_KR" : lang,
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
        locale: lang === "ko" ? "ko_KR" : lang,
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
