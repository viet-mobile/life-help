// lib/i18n/siteMetadata.ts
import type { Metadata } from "next";
import expandedSiteMetadata from "./expandedSiteMetadata.json";

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
  centralafrica: "fr",
  venezuela: "es",
  kenya: "sw",
  argentina: "es",
  romania: "ro",
  finland: "fi",
  czechia: "cs",
  hungary: "hu",
  zambia: "en",
  uganda: "en",
  congo: "fr",

};

export const SITE_METADATA: Record<string, SiteMetaTranslation> = {
  ...expandedSiteMetadata,
  ko: {
    tagline: "다국어 생활서비스 플랫폼",
    description: "한국 거주 외국인을 위한 생활서비스 플랫폼. 모국어로 상담하고 신뢰할 수 있는 지역 전문 헬퍼와 연결됩니다.",
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
    description: "Nền tảng dịch vụ sinh hoạt đa ngôn ngữ",
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
    description: "Living services platform for foreign residents in Korea. Consult in your native language and connect with verified local specialists.",
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
    description: "面向在韩外国人的生活服务平台。使用母语即时咨询，直接连接值得信赖的本地专业师傅。",
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
    description: "專為在韓外籍居民打造的生活服務平臺。使用母語即時諮詢，快速媒合在地值得信賴的專業師傅。",
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
    description: "在韓外国人向け生活支援プラットフォーム。母国語で相談でき、信頼できる地域専門スタッフとマッチングします。",
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
    description: "Platforma usług codziennych dla obcokrajowców w Korei. Konsultacje w języku ojczystym i kontakt ze sprawdzonymi lokalnymi fachowcami.",
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
    description: "Plattform für Alltagsdienste für ausländische Bewohner in Korea. Beratung in der Muttersprache und Vermittlung geprüfter Handwerker.",
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
    description: "Plateforme de services du quotidien pour les résidents étrangers en Corée. Conseils dans votre langue maternelle et mise en relation avec des artisans de confiance.",
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
    description: "Plataforma de servicios del hogar para extranjeros en Corea. Asesoramiento en su idioma materno y conexión con técnicos locales de confianza.",
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
    description: "Plataforma de serviços cotidianos para estrangeiros na Coreia. Atendimento no seu idioma nativo e conexão com especialistas confiáveis.",
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
    description: "Piattaforma multilingue di servizi per la vita quotidiana per residenti stranieri in Corea. Consulenza nella tua lingua madre e contatto con tecnici locali affidabili.",
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
    description: "Платформа бытовых услуг для иностранцев в Корее. Консультации на родном языке и связь с проверенными местными мастерами.",
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
    description: "Платформа побутових послуг для іноземців у Кореї. Консультації рідною мовою та прямий зв'язок із перевіреними місцевими майстрами.",
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
    description: "Kore'de yaşayan yabancılar için yaşam hizmetleri platformu. Kendi ana dilinizde danışın ve güvenilir yerel uzman ustalarla bağlantı kurun.",
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
    description: "Platform layanan kehidupan untuk warga asing di Korea. Konsultasi dalam bahasa ibu dan terhubung langsung dengan teknisi ahli lokal tepercaya.",
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
    description: "แพลตฟอร์มบริการการใช้ชีวิตสำหรับชาวต่างชาติในเกาหลี ปรึกษาด้วยภาษาแม่ของคุณและเชื่อมต่อกับช่างผู้เชี่ยวชาญในท้องถิ่นที่เชื่อถือได้",
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
    description: "Platform voor levensdiensten voor buitenlandse inwoners in Korea. Advies in uw moedertaal en direct contact met betrouwbare lokale vakmensen.",
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
    description: "Plattform för vardagstjänster för utländska invånare i Korea. Rådgivning på modersmålet och koppling till pålitliga lokala hantverkare.",
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
    description: "Platform for hverdagstjenester for udenlandske beboere i Korea. Rådgivning på dit modersmål og forbindelse til pålidelige lokale håndværkere.",
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
    description: "Plattform for hverdagstjenester for utenlandske innbyggere i Korea. Rådgivning på morsmålet og kontakt med pålitelige lokale fagfolk.",
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
    description: "Πλατφόρμα υπηρεσιών καθημερινής ζωής για αλλοδαπούς κατοίκους στην Κορέα. Συμβουλευτείτε στη μητρική σας γλώσσα και συνδεθείτε με αξιόπιστους τοπικούς ειδικούς τεχνικούς.",
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
    description: "منصة الخدمات المعيشية للمقيمين الأجانب في كوريا. استشارات بلغتك الأم وتواصل مباشر مع فنيين وخبراء محليين موثوقين.",
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
    description: "منصة الخدمات المعيشية للمقيمين الأجانب في كوريا. استشارات بلغتك الأم وتواصل مباشر مع فنيين وخبراء محليين موثوقين.",
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
    description: "کوریا میں مقیم غیر ملکیوں کے لیے روزمرہ خدمات کا پلیٹ فارم۔ اپنی مادری زبان میں مشورہ اور قابلِ اعتماد مقامی ماہرین سے رابطہ۔",
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
    description: "Jukwaa la huduma za maisha kwa wakazi wa kigeni nchini Korea. Pata ushauri kwa lugha yako na uunganishwe na mafundi waliothibitishwa.",
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
    description: "कोरियातील परदेशी रहिवाशांसाठी जीवनावश्यक सेवा प्लॅटफॉर्म. तुमच्या मातृभाषेत सल्ला घ्या आणि सत्यापित स्थानिक तज्ज्ञांशी संपर्क साधा.",
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
    description: "કોરિયામાં રહેતા વિદેશી રહેવાસીઓ માટે જીવનજરૂરી સેવા પ્લેટફોર્મ. તમારી માતૃભાષામાં સલાહ લો અને ચકાસાયેલા સ્થાનિક નિષ્ણાતો સાથે જોડાઓ.",
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
    description: "ਕੋਰੀਆ ਵਿੱਚ ਰਹਿੰਦੇ ਵਿਦੇਸ਼ੀ ਨਿਵਾਸੀਆਂ ਲਈ ਜੀਵਨ ਸੇਵਾਵਾਂ ਪਲੇਟਫਾਰਮ। ਆਪਣੀ ਮਾਂ-ਬੋਲੀ ਵਿੱਚ ਸਲਾਹ ਲਓ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਸਥਾਨਕ ਮਾਹਿਰਾਂ ਨਾਲ ਜੁੜੋ।",
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
    description: "కొరియాలో నివసిస్తున్న విదేశీయుల కోసం జీవన సేవల ప్లాట్‌ఫారమ్. మీ మాతృభాషలో సంప్రదించండి మరియు ధృవీకరించబడిన స్థానిక నిపుణులతో కనెక్ట్ అవ్వండి.",
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
    description: "ಕೊರಿಯಾದಲ್ಲಿ ವಾಸಿಸುವ ವಿದೇಶಿ ನಿವಾಸಿಗಳಿಗಾಗಿ ಜೀವನ ಸೇವೆಗಳ ವೇದಿಕೆ. ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಸಮಾಲೋಚಿಸಿ ಮತ್ತು ಪರಿಶೀಲಿತ ಸ್ಥಳೀಯ ತಜ್ಞರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ.",
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
    description: "കൊറിയയിൽ താമസിക്കുന്ന വിദേശികൾക്കായുള്ള ജീവിത സേവന പ്ലാറ്റ്‌ഫോം. നിങ്ങളുടെ മാതൃഭാഷയിൽ കൂടിയാലോചിക്കുകയും പരിശോധിച്ചുറപ്പിച്ച പ്രാദേശിക വിദഗ്ധരുമായി ബന്ധപ്പെടുകയും ചെയ്യുക.",
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
    description: "پلتفرم خدمات زندگی برای ساکنان خارجی در کره. مشاوره به زبان مادری و ارتباط با متخصصان معتمد محلی.",
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
    description: "פלטפורמת שירותי חיים לתושבים זרים בקוריאה. ייעוץ בשפת האם וחיבור לבעלי מקצוע מקומיים מוסמכים.",
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
    description: "कोरिया में विदेशी निवासियों के लिए जीवन सेवा मंच। अपनी मातृभाषा में परामर्श करें और विश्वसनीय स्थानीय तकनीशियनों से जुड़ें।",
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
    description: "কোরিয়ায় বসবাসকারী বিদেশী নাগরিকদের জন্য জীবন পরিষেবা প্ল্যাটফর্ম। নিজের মাতৃভাষায় পরামর্শ নিন এবং বিশ্বস্ত স্থানীয় টেকনিশিয়ানদের সাথে যুক্ত হন।",
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
    description: "கொரியாவில் வாழும் வெளிநாட்டினருக்கான வாழ்க்கை சேவை தளம். உங்கள் தாய்மொழியில் ஆலோசனை பெற்று நம்பகமான உள்ளூர் வல்லுநர்களுடன் இணையுங்கள்.",
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
    description: "කොරියාවේ වෙසෙන විදේශිකයන් සඳහා වන ජීවන සේවා වේදිකාව. ඔබේ මව්බසින් උපදෙස් ලබාගෙන විශ්වාසදායක ප්‍රදේශයේ කාර්මික ශිල්පීන් සමඟ සම්බන්ධ වන්න.",
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
    description: "कोरियामा बस्ने विदेशी बासिन्दाहरूका लागि जीवन सेवा प्लेटफर्म। आफ्नै मातृभाषामा परामर्श लिनुहोस् र भरपર્दो स्थानीय प्राविधिकहरूसँग जोडिनुहोस्।",
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
    description: "ကိုရီးယားရှိ နိုင်ငံခြားသားများအတွက် လူနေမှုဘဝဝန်ဆောင်မှု ပလက်ဖောင်း။ မိခင်ဘာသာစကားဖြင့် ဆွေးနွေးတိုင်ပင်ပြီး စိတ်ချရသော ဒေသတွင်း ကျွမ်းကျင်ပညာရှင်များနှင့် တိုက်ရိုက်ချိတ်ဆက်ပါ။",
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
    description: "វេទិកាសេវាកម្មជីវិតសម្រាប់ជនបរទេសដែលរស់នៅក្នុងប្រទេសកូរ៉េ។ ពិគ្រោះជាភាសាកំណើតរបស់អ្នក និងភ្ជាប់ទំនាក់ទំនងជាមួយជាងជំនាញក្នុងតំបន់ដែលគួរឱ្យទុកចិត្ត។",
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
    description: "Солонгос улсад оршин суугаа гадаадын иргэдэд зориулсан ахуйн үйлчилгээний платформ. Эх хэлээрээ зөвлөгөө авч, найдвартай мэргэжилтнүүдтэй шууд холбогдоорой.",
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
    description: "Кореядағы шетелдік азаматтарға арналған тұрмыстық қызметтер платформасы. Өз ана тіліңізде кеңес алып, сенімді жергілікті шеберлермен байланысыңыз.",
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
    description: "Koreyada yashovchi chet elliklar uchun turmush xizmatlari platformasi. O'z ona tilingizda maslahat oling va ishonchli mahalliy ustalar bilan bog'laning.",
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
    description: "Plataforma servisu moris nian ba ema estranjeiru sira ne'ebé hela iha Koreia. Konsulta ho ita-boot nia lian inan no liga ba tékniku profisionál lokál ne'ebé fiar-laek.",
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
    description: "በኮሪያ ለሚኖሩ የውጭ ሀገር ዜጎች የተዘጋጀ የዕለት ተዕለት ኑሮ አገልግሎት መድረክ። በአፍ መፍቻ ቋንቋዎ ይማከሩ እና ከታመኑ የአካባቢው ባለሙያዎች ጋር ይገናኙ።",
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
};

/**
 * Resolves the language code from request headers or host.
 */
export function resolveLanguageFromHeaders(headersList: Headers): string {
  // 1. Explicit x-life-language header (e.g. from /vi or proxy rewrite)
  const rawLangHeader = headersList.get("x-life-language");
  if (rawLangHeader) {
    const lower = rawLangHeader.toLowerCase();
    if (lower === "sg") return "fr";
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
export function getSiteMetadata(lang: string, country?: string | null): Metadata {
  const meta = SITE_METADATA[lang === "sg" ? "fr" : lang] || SITE_METADATA["ko"];
  const countryUpper = country ? country.toUpperCase() : "";
  const title = countryUpper
    ? `LIFE.HELP ${countryUpper} · ${meta.tagline}`
    : `LIFE.HELP · ${meta.tagline}`;
  const description = meta.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: countryUpper ? `LIFE.HELP ${countryUpper}` : "LIFE.HELP",
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
  const meta = SITE_METADATA[lang === "sg" ? "fr" : lang] || SITE_METADATA["ko"];

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
