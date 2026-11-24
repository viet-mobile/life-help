import areas from "./math-areas.json";
import langFields from "./lang-fields.json";
import type { ThinkLang } from "./lang";

/** The four areas of the math hub's field filter (2022 curriculum style). Assignment: scripts/think/classify-math-areas.py -> math-areas.json. */
export type MathArea = "number" | "relations" | "geometry" | "data";
export const MATH_AREAS: MathArea[] = ["number", "relations", "geometry", "data"];
export const AREA_LABELS: Record<MathArea, Record<string, string>> = {
  number: {
    ko: "수와 연산", en: "Numbers and operations", "zh-Hans": "数与运算", "zh-Hant": "數與運算", ja: "数と計算", vi: "Số và phép tính",
    ne: "संख्या र गणना", hi: "संख्या और संक्रियाएं", bn: "সংখ্যা ও গণনা", es: "Números y operaciones", fr: "Nombres et opérations",
    de: "Zahlen und Operationen", ru: "Числа и вычисления", ar: "الأعداد والعمليات", id: "Bilangan dan operasi", th: "จำนวนและการดำเนินการ",
    km: "ចំនួននិងប្រមាណវិធី", pt: "Números e operações", it: "Numeri e operazioni", tr: "Sayılar ve işlemler", ur: "اعداد اور عوامل"
  },
  relations: {
    ko: "변화와 관계", en: "Change and relationships", "zh-Hans": "变化与关系", "zh-Hant": "變化與關係", ja: "変化と関係", vi: "Biến đổi và quan hệ",
    ne: "परिवर्तन र सम्बन्ध", hi: "परिवर्तन और संबंध", bn: "পরিবর্তন ও সম্পর্ক", es: "Cambio y relaciones", fr: "Changement et relations",
    de: "Veränderung und Beziehungen", ru: "Изменения и зависимости", ar: "التغير والعلاقات", id: "Perubahan dan hubungan", th: "การเปลี่ยนแปลงและความสัมพันธ์",
    km: "បម្រែបម្រួលនិងទំនាក់ទំនង", pt: "Variação e relações", it: "Variazione e relazioni", tr: "Değişim ve ilişkiler", ur: "تبدیلی اور تعلقات"
  },
  geometry: {
    ko: "도형과 측정", en: "Shapes and measurement", "zh-Hans": "图形与测量", "zh-Hant": "圖形與測量", ja: "図形と測定", vi: "Hình học và đo lường",
    ne: "आकार र मापन", hi: "आकृतियां और मापन", bn: "জ্যামিতি ও পরিমাপ", es: "Figuras y medidas", fr: "Formes et mesures",
    de: "Formen und Messen", ru: "Фигуры и измерения", ar: "الأشكال والقياس", id: "Bentuk dan pengukuran", th: "รูปทรงและการวัด",
    km: "ធរណីមាត្រនិងរង្វាស់រង្វាល់", pt: "Formas e medidas", it: "Forme e misure", tr: "Şekiller ve ölçüm", ur: "اشکال اور پیمائش"
  },
  data: {
    ko: "자료와 가능성", en: "Data and chance", "zh-Hans": "数据与可能性", "zh-Hant": "資料與可能性", ja: "データと可能性", vi: "Dữ liệu và khả năng",
    ne: "तथ्याङ्क र सम्भावना", hi: "आंकड़े और संभावना", bn: "তথ্য ও সম্ভাবনা", es: "Datos y probabilidad", fr: "Données et probabilités",
    de: "Daten und Zufall", ru: "Данные и вероятность", ar: "البيانات والاحتمالات", id: "Data dan peluang", th: "ข้อมูลและความน่าจะเป็น",
    km: "ទិន្នន័យនិងប្រូបាប", pt: "Dados e probabilidades", it: "Dati e probabilità", tr: "Veri ve olasılık", ur: "اعداد و شمار اور امکانات"
  },
};
/** null = a task that fits none of the four areas: it is listed under "all fields" only. */
export const mathAreaOf = (taskId: string): MathArea | null => (areas as Record<string, MathArea | null>)[taskId] ?? null;

/** English- and Korean-subject tasks: six fields (English curriculum content areas). Assignment: scripts/think/classify-lang-fields.py -> lang-fields.json. */
export type LangField = "topic" | "function" | "context" | "strategy" | "language" | "text";
export const LANG_FIELDS: LangField[] = ["topic", "function", "context", "strategy", "language", "text"];
export const FIELD_LABELS: Record<LangField, Record<string, { short: string; full: string }>> = {
  topic: {
    ko: { short: "주제", full: "주제" }, en: { short: "Topic", full: "Topic" }, "zh-Hans": { short: "主题", full: "主题" }, "zh-Hant": { short: "主題", full: "主題" }, ja: { short: "テーマ", full: "テーマ" }, vi: { short: "Chủ đề", full: "Chủ đề" },
    ne: { short: "विषय", full: "मुख्य विषय" }, hi: { short: "विषय", full: "मुख्य विषय" }, es: { short: "Tema", full: "Tema principal" }, fr: { short: "Sujet", full: "Sujet principal" }, de: { short: "Thema", full: "Hauptthema" }, ru: { short: "Тема", full: "Основная тема" }, ar: { short: "الموضوع", full: "الموضوع الرئيسي" }
  },
  function: {
    ko: { short: "기능", full: "기능" }, en: { short: "Function", full: "Function" }, "zh-Hans": { short: "功能", full: "功能" }, "zh-Hant": { short: "功能", full: "功能" }, ja: { short: "機能", full: "機能" }, vi: { short: "Chức năng", full: "Chức năng" },
    ne: { short: "कार्य", full: "भाषिक कार्य" }, hi: { short: "कार्य", full: "भाषाई कार्य" }, es: { short: "Función", full: "Función lingüística" }, fr: { short: "Fonction", full: "Fonction communicative" }, de: { short: "Funktion", full: "Sprachfunktion" }, ru: { short: "Функция", full: "Речевая функция" }, ar: { short: "الوظيفة", full: "الوظيفة اللغوية" }
  },
  context: {
    ko: { short: "맥락", full: "맥락" }, en: { short: "Context", full: "Context" }, "zh-Hans": { short: "语境", full: "语境" }, "zh-Hant": { short: "語境", full: "語境" }, ja: { short: "文脈", full: "文脈" }, vi: { short: "Ngữ cảnh", full: "Ngữ cảnh" },
    ne: { short: "सन्दर्भ", full: "सांस्कृतिक तथा व्यावहारिक सन्दर्भ" }, hi: { short: "संदर्भ", full: "व्यावहारिक संदर्भ" }, es: { short: "Contexto", full: "Contexto situacional" }, fr: { short: "Contexte", full: "Contexte de communication" }, de: { short: "Kontext", full: "Situativer Kontext" }, ru: { short: "Контекст", full: "Речевой контекст" }, ar: { short: "السياق", full: "سياق التواصل" }
  },
  strategy: {
    ko: { short: "기술 및 전략", full: "기술 및 전략" }, en: { short: "Skills & strategies", full: "Skills & strategies" }, "zh-Hans": { short: "技能与策略", full: "技能与策略" }, "zh-Hant": { short: "技能與策略", full: "技能與策略" }, ja: { short: "技能と方略", full: "技能と方略" }, vi: { short: "Kỹ năng & chiến lược", full: "Kỹ năng & chiến lược" },
    ne: { short: "सीप र रणनीति", full: "सिकाइ सीप र रणनीतिहरू" }, hi: { short: "कौशल और रणनीतियां", full: "भाषा कौशल और रणनीतियां" }, es: { short: "Habilidades y estrategias", full: "Habilidades y estrategias" }, fr: { short: "Compétences et stratégies", full: "Compétences et stratégies" }, de: { short: "Fertigkeiten und Strategien", full: "Fertigkeiten und Strategien" }, ru: { short: "Навыки и стратегии", full: "Навыки и стратегии" }, ar: { short: "المهارات والاستراتيجيات", full: "المهارات والاستراتيجيات" }
  },
  language: {
    ko: { short: "언어지식", full: "언어지식 (발음, 어휘, 문법 등)" }, en: { short: "Language knowledge", full: "Language knowledge (pronunciation, vocabulary, grammar…)" }, "zh-Hans": { short: "语言知识", full: "语言知识（语音、词汇、语法等）" }, "zh-Hant": { short: "語言知識", full: "語言知識（語音、詞彙、語法等）" }, ja: { short: "言語知識", full: "言語知識（発音・語彙・文法など）" }, vi: { short: "Kiến thức ngôn ngữ", full: "Kiến thức ngôn ngữ (phát âm, từ vựng, ngữ pháp…)" },
    ne: { short: "भाषिक ज्ञान", full: "भाषिक ज्ञान (व्याकरण, शब्दभण्डार)" }, hi: { short: "भाषा ज्ञान", full: "भाषा ज्ञान (व्याकरण और शब्दावली)" }, es: { short: "Conocimiento lingüístico", full: "Conocimiento lingüístico" }, fr: { short: "Connaissances linguistiques", full: "Connaissances linguistiques" }, de: { short: "Sprachwissen", full: "Sprachwissen" }, ru: { short: "Языковые знания", full: "Языковые знания" }, ar: { short: "المعرفة اللغوية", full: "المعرفة اللغوية" }
  },
  text: {
    ko: { short: "텍스트", full: "텍스트" }, en: { short: "Text", full: "Text" }, "zh-Hans": { short: "语篇", full: "语篇" }, "zh-Hant": { short: "語篇", full: "語篇" }, ja: { short: "テキスト", full: "テキスト" }, vi: { short: "Văn bản", full: "Văn bản" },
    ne: { short: "पाठ", full: "पाठ संरचना" }, hi: { short: "पाठ", full: "पाठ संरचना" }, es: { short: "Texto", full: "Estructura del texto" }, fr: { short: "Texte", full: "Types de textes" }, de: { short: "Text", full: "Textstrukturen" }, ru: { short: "Текст", full: "Типы текстов" }, ar: { short: "النص", full: "بنية النصوص" }
  },
};
export const langFieldOf = (taskId: string): LangField | null => (langFields as Record<string, LangField | null>)[taskId] ?? null;

/** One field system for the hub: math = four areas, English / Korean = six fields. key = the filter value, short = card prefix, full = filter option. */
export type FieldInfo = { key: string; short: string; full: string };

/** Physics hub curriculum areas */
export type PhysicsArea = "mechanics" | "thermo" | "electromag" | "waves" | "modern";
export const PHYSICS_AREAS: PhysicsArea[] = ["mechanics", "thermo", "electromag", "waves", "modern"];
export const PHYSICS_AREA_LABELS: Record<PhysicsArea, Record<string, { short: string; full: string }>> = {
  mechanics: {
    ko: { short: "역학·운동", full: "역학 및 운동 에너지" }, en: { short: "Mechanics", full: "Mechanics & Motion" }, "zh-Hans": { short: "力学与运动", full: "力学与运动能量" }, "zh-Hant": { short: "力學與運動", full: "力學與運動能量" }, ja: { short: "力学・運動", full: "力学と運動エネルギー" }, vi: { short: "Cơ học & chuyển động", full: "Cơ học và năng lượng chuyển động" },
    ne: { short: "यान्त्रिकी", full: "यान्त्रिकी र गति ऊर्जा" }, hi: { short: "यांत्रिकी", full: "यांत्रिकी और गति ऊर्जा" }, es: { short: "Mecánica", full: "Mecánica y movimiento" }, fr: { short: "Mécanique", full: "Mécanique et mouvement" }, de: { short: "Mechanik", full: "Mechanik und Bewegung" }, ru: { short: "Механика", full: "Механика и движение" }, ar: { short: "الميكانيكا", full: "الميكانيكا والحركة" },
    id: { short: "Mekanika", full: "Mekanika & Gerak" }, th: { short: "กลศาสตร์", full: "กลศาสตร์และการเคลื่อนที่" }, km: { short: "មេកានិច", full: "មេកានិចនិងចលនា" }, pt: { short: "Mecânica", full: "Mecânica e movimento" }, tr: { short: "Mekanik", full: "Mekanik ve hareket" }
  },
  thermo: {
    ko: { short: "열·에너지", full: "열역학 및 에너지 보존" }, en: { short: "Thermodynamics", full: "Thermodynamics & Heat" }, "zh-Hans": { short: "热学与能量", full: "热力学与能量守恒" }, "zh-Hant": { short: "熱學與能量", full: "熱力學與能量守恆" }, ja: { short: "熱・エネルギー", full: "熱力学とエネルギー保存" }, vi: { short: "Nhiệt & năng lượng", full: "Nhiệt động học và bảo toàn năng lượng" },
    ne: { short: "ऊष्मागतिकी", full: "ऊष्मागतिकी र ऊर्जा संरक्षण" }, hi: { short: "ऊष्मागतिकी", full: "ऊष्मागतिकी और ऊर्जा संरक्षण" }, es: { short: "Termodinámica", full: "Termodinámica y calor" }, fr: { short: "Thermodynamique", full: "Thermodynamique et énergie" }, de: { short: "Thermodynamik", full: "Thermodynamik und Wärme" }, ru: { short: "Термодинамика", full: "Термодинамика и тепло" }, ar: { short: "الديناميكا الحرارية", full: "الديناميكا الحرارية والطاقة" },
    id: { short: "Termodinamika", full: "Termodinamika & Kalor" }, th: { short: "อุณหพลศาสตร์", full: "อุณหพลศาสตร์และความร้อน" }, km: { short: "ទែម៉ូឌីណាមិច", full: "ទែម៉ូឌីណាមិចនិងកម្ដៅ" }, pt: { short: "Termodinâmica", full: "Termodinâmica e calor" }, tr: { short: "Termodinamik", full: "Termodinamik ve ısı" }
  },
  electromag: {
    ko: { short: "전기·자기", full: "전자기장과 상호작용" }, en: { short: "Electromagnetism", full: "Electricity & Magnetism" }, "zh-Hans": { short: "电磁学", full: "电磁学与相互作用" }, "zh-Hant": { short: "電磁學", full: "電磁學與相互作用" }, ja: { short: "電磁気", full: "電磁場と相互作用" }, vi: { short: "Điện từ học", full: "Điện từ trường và tương tác" },
    ne: { short: "विद्युत चुम्बकत्व", full: "विद्युत चुम्बकीय क्षेत्र" }, hi: { short: "विद्युत चुंबकत्व", full: "विद्युत और चुंबकत्व" }, es: { short: "Electromagnetismo", full: "Electricidad y magnetismo" }, fr: { short: "Électromagnétisme", full: "Électricité et magnétisme" }, de: { short: "Elektromagnetismus", full: "Elektrizität und Magnetismus" }, ru: { short: "Электромагнетизм", full: "Электричество и магнетизм" }, ar: { short: "الكهرومغناطيسية", full: "الكهرباء والمغناطيسية" },
    id: { short: "Elektromagnetisme", full: "Listrik & Magnet" }, th: { short: "แม่เหล็กไฟฟ้า", full: "ไฟฟ้าและแม่เหล็ก" }, km: { short: "អេឡិចត្រូម៉ាញ៉េទិច", full: "អគ្គិសនីនិងម៉ាញ៉េទិច" }, pt: { short: "Eletromagnetismo", full: "Eletricidade e magnetismo" }, tr: { short: "Elektromanyetizma", full: "Elektrik ve manyetizma" }
  },
  waves: {
    ko: { short: "파동·빛", full: "파동과 광학" }, en: { short: "Waves & Optics", full: "Waves & Optics" }, "zh-Hans": { short: "波动与光学", full: "波动与光学" }, "zh-Hant": { short: "波動與光學", full: "波動與光學" }, ja: { short: "波動・光", full: "波動と光学" }, vi: { short: "Sóng & quang học", full: "Sóng và quang học" },
    ne: { short: "तरङ्ग र प्रकाश", full: "तरङ्ग तथा प्रकाशिकी" }, hi: { short: "तरंगें और प्रकाशिकी", full: "तरंग और प्रकाशिकी" }, es: { short: "Ondas y óptica", full: "Ondas y óptica" }, fr: { short: "Ondes et optique", full: "Ondes et optique" }, de: { short: "Wellen und Optik", full: "Wellen und Optik" }, ru: { short: "Волны и оптика", full: "Волны и оптика" }, ar: { short: "الموجات والبصريات", full: "الموجات والبصريات" },
    id: { short: "Gelombang & Optika", full: "Gelombang dan Optika" }, th: { short: "คลื่นและทัศนศาสตร์", full: "คลื่นและทัศนศาสตร์" }, km: { short: "រលកនិងអុបទិក", full: "រលកនិងអុបទិក" }, pt: { short: "Ondas e óptica", full: "Ondas e óptica" }, tr: { short: "Dalgalar ve optik", full: "Dalgalar ve optik" }
  },
  modern: {
    ko: { short: "현대물리", full: "현대 물리학과 미시세계" }, en: { short: "Modern Physics", full: "Modern Physics & Quantum" }, "zh-Hans": { short: "现代物理", full: "现代物理与量子" }, "zh-Hant": { short: "現代物理", full: "現代物理與量子" }, ja: { short: "現代物理", full: "現代物理学と量子" }, vi: { short: "Vật lý hiện đại", full: "Vật lý hiện đại và lượng tử" },
    ne: { short: "आधुनिक भौतिकी", full: "आधुनिक भौतिकशास्त्र र क्वान्टम" }, hi: { short: "आधुनिक भौतिकी", full: "आधुनिक भौतिकी और क्वांटम" }, es: { short: "Física moderna", full: "Física moderna y cuántica" }, fr: { short: "Physique moderne", full: "Physique moderne et quantique" }, de: { short: "Moderne Physik", full: "Moderne Physik und Quanten" }, ru: { short: "Современная физика", full: "Современная физика и кванты" }, ar: { short: "الفيزياء الحديثة", full: "الفيزياء الحديثة والكمية" },
    id: { short: "Fisika Modern", full: "Fisika Modern & Kuantum" }, th: { short: "ฟิสิกส์ยุคใหม่", full: "ฟิสิกส์ยุคใหม่และควอนตัม" }, km: { short: "រូបវិទ្យាទំនើប", full: "រូបវិទ្យាទំនើបនិងកង់ទិច" }, pt: { short: "Física moderna", full: "Física moderna e quântica" }, tr: { short: "Modern fizik", full: "Modern fizik ve kuantum" }
  },
};

/** Chemistry hub curriculum areas */
export type ChemistryArea = "matter" | "reaction" | "states" | "energy" | "carbon";
export const CHEMISTRY_AREAS: ChemistryArea[] = ["matter", "reaction", "states", "energy", "carbon"];
export const CHEMISTRY_AREA_LABELS: Record<ChemistryArea, Record<string, { short: string; full: string }>> = {
  matter: {
    ko: { short: "물질의 구조", full: "원자와 물질의 기본 구조" }, en: { short: "Structure of Matter", full: "Atomic & Molecular Structure" }, "zh-Hans": { short: "物质结构", full: "原子与物质结构" }, "zh-Hant": { short: "物質結構", full: "原子與物質結構" }, ja: { short: "物質の構造", full: "原子と物質の構造" }, vi: { short: "Cấu trúc vật chất", full: "Cấu trúc nguyên tử và phân tử" },
    ne: { short: "पदार्थको संरचना", full: "पारमाणविक तथा आणविक संरचना" }, hi: { short: "पदार्थ की संरचना", full: "परमाणु और आणविक संरचना" }, es: { short: "Estructura de la materia", full: "Estructura atómica y molecular" }, fr: { short: "Structure de la matière", full: "Structure atomique et moléculaire" }, de: { short: "Aufbau der Materie", full: "Atom- und Molekülstruktur" }, ru: { short: "Строение вещества", full: "Атомная и молекулярная структура" }, ar: { short: "بنية المادة", full: "البنية الذرية والجزيئية" },
    id: { short: "Struktur Materi", full: "Struktur Atom dan Molekul" }, th: { short: "โครงสร้างของสสาร", full: "โครงสร้างอะตอมและโมเลกุล" }, km: { short: "រចនាសម្ព័ន្ធរូបធាតុ", full: "រចនាសម្ព័ន្ធអាតូមនិងម៉ូលេគុល" }, pt: { short: "Estrutura da matéria", full: "Estrutura atômica e molecular" }, tr: { short: "Maddenin yapısı", full: "Atomik ve moleküler yapı" }
  },
  reaction: {
    ko: { short: "화학 반응", full: "화학 반응과 양적 관계" }, en: { short: "Reactions & Stoichiometry", full: "Chemical Reactions & Stoichiometry" }, "zh-Hans": { short: "化学反应", full: "化学反应与定量关系" }, "zh-Hant": { short: "化學反應", full: "化學反應與定量關係" }, ja: { short: "化学反応", full: "化学反応と量的関係" }, vi: { short: "Phản ứng hóa học", full: "Phản ứng hóa học và định lượng" },
    ne: { short: "रासायनिक प्रतिक्रिया", full: "रासायनिक प्रतिक्रिया र स्टोइकियोमेट्री" }, hi: { short: "रासायनिक अभिक्रियाएं", full: "रासायनिक अभिक्रियाएं और रससमीकरणमिति" }, es: { short: "Reacciones químicas", full: "Reacciones químicas y estequiometría" }, fr: { short: "Réactions chimiques", full: "Réactions chimiques et stœchiométrie" }, de: { short: "Chemische Reaktionen", full: "Chemische Reaktionen und Stöchiometrie" }, ru: { short: "Химические реакции", full: "Химические реакции и стехиометрия" }, ar: { short: "التفاعلات الكيميائية", full: "التفاعلات الكيميائية والحساب الكيميائي" },
    id: { short: "Reaksi Kimia", full: "Reaksi Kimia dan Stoikiometri" }, th: { short: "ปฏิกิริยาเคมี", full: "ปฏิกิริยาเคมีและปริมาณสารสัมพันธ์" }, km: { short: "ប្រតិកម្មគីមី", full: "ប្រតិកម្មគីមីនិងស្តូស្យូមេទ្រី" }, pt: { short: "Reações químicas", full: "Reações químicas e estequiometria" }, tr: { short: "Kimyasal tepkimeler", full: "Kimyasal tepkimeler ve stokiyometri" }
  },
  states: {
    ko: { short: "상태·용액", full: "물질의 세 가지 상태와 용액" }, en: { short: "States & Solutions", full: "States of Matter & Solutions" }, "zh-Hans": { short: "状态与溶液", full: "物质状态与溶液" }, "zh-Hant": { short: "狀態與溶液", full: "物質狀態與溶液" }, ja: { short: "状態・溶液", full: "物質の状態と溶液" }, vi: { short: "Trạng thái & dung dịch", full: "Trạng thái vật chất và dung dịch" },
    ne: { short: "पदार्थको अवस्था र घोल", full: "पदार्थको अवस्था तथा घोल" }, hi: { short: "अवस्थाएं और विलयन", full: "पदार्थ की अवस्थाएं और विलयन" }, es: { short: "Estados y disoluciones", full: "Estados de la materia y disoluciones" }, fr: { short: "États et solutions", full: "États de la matière et solutions" }, de: { short: "Zustände und Lösungen", full: "Aggregatzustände und Lösungen" }, ru: { short: "Состояния и растворы", full: "Агрегатные состояния и растворы" }, ar: { short: "الحالات والمحاليل", full: "حالات المادة والمحاليل" },
    id: { short: "Wujud & Larutan", full: "Wujud Zat dan Larutan" }, th: { short: "สถานะและสารละลาย", full: "สถานะของสสารและสารละลาย" }, km: { short: "សភាពនិងសូលុយស្យុង", full: "សភាពរូបធាតុនិងសូលុយស្យុង" }, pt: { short: "Estados e soluções", full: "Estados da matéria e soluções" }, tr: { short: "Haller ve çözeltiler", full: "Maddenin halleri ve çözeltiler" }
  },
  energy: {
    ko: { short: "화학 에너지", full: "반응 엔탈피와 에너지 변화" }, en: { short: "Chemical Energy", full: "Chemical Energy & Enthalpy" }, "zh-Hans": { short: "化学能量", full: "反应热与化学能量" }, "zh-Hant": { short: "化學能量", full: "反應熱與化學能量" }, ja: { short: "化学エネルギー", full: "反応熱とエネルギー変化" }, vi: { short: "Năng lượng hóa học", full: "Năng lượng và entanpi phản ứng" },
    ne: { short: "रासायनिक ऊर्जा", full: "रासायनिक ऊर्जा र एन्थाल्पी" }, hi: { short: "रासायनिक ऊर्जा", full: "रासायनिक ऊर्जा और एन्थैल्पी" }, es: { short: "Energía química", full: "Energía química y entalpía" }, fr: { short: "Énergie chimique", full: "Énergie chimique et enthalpie" }, de: { short: "Chemische Energie", full: "Chemische Energie und Enthalpie" }, ru: { short: "Химическая энергия", full: "Химическая энергия и энтальпия" }, ar: { short: "الطاقة الكيميائية", full: "الطاقة الكيميائية والمحتوى الحراري" },
    id: { short: "Energi Kimia", full: "Energi Kimia dan Entalpi" }, th: { short: "พลังงานเคมี", full: "พลังงานเคมีและเอนทาลปี" }, km: { short: "ថាមពលគីមី", full: "ថាមពលគីមីនិងអង់តាល់ពី" }, pt: { short: "Energia química", full: "Energia química e entalpia" }, tr: { short: "Kimyasal enerji", full: "Kimyasal enerji ve entalpi" }
  },
  carbon: {
    ko: { short: "탄소 화합물", full: "탄소 화합물과 생활 화학" }, en: { short: "Carbon & Everyday Chem", full: "Carbon Compounds & Everyday Chemistry" }, "zh-Hans": { short: "碳化合物", full: "碳化合物与生活化学" }, "zh-Hant": { short: "碳化合物", full: "碳化合物與生活化學" }, ja: { short: "炭素化合物", full: "炭素化合物と生活化学" }, vi: { short: "Hợp chất cacbon", full: "Hợp chất cacbon và hóa học đời sống" },
    ne: { short: "कार्बन यौगिकहरू", full: "कार्बन यौगिक र दैनिक रसायन" }, hi: { short: "कार्बनिक यौगिक", full: "कार्बन यौगिक और दैनिक रसायन" }, es: { short: "Compuestos de carbono", full: "Compuestos de carbono y química diaria" }, fr: { short: "Composés carbonés", full: "Composés carbonés et chimie du quotidien" }, de: { short: "Kohlenstoffverbindungen", full: "Kohlenstoffverbindungen im Alltag" }, ru: { short: "Углеродные соединения", full: "Соединения углерода и бытовая химия" }, ar: { short: "مركبات الكربون", full: "مركبات الكربون والكيمياء الحياتية" },
    id: { short: "Senyawa Karbon", full: "Senyawa Karbon & Kimia Sehari-hari" }, th: { short: "สารประกอบคาร์บอน", full: "สารประกอบคาร์บอนและเคมีในชีวิตประจำวัน" }, km: { short: "សមាសធាតុផ្សំកាបូន", full: "សមាសធាតុកាបូននិងគីមីប្រចាំថ្ងៃ" }, pt: { short: "Compostos de carbono", full: "Compostos de carbono no dia a dia" }, tr: { short: "Karbon bileşikleri", full: "Karbon bileşikleri ve günlük kimya" }
  },
};

export function fieldList(site: string): string[] {
  if (site === "math") return MATH_AREAS;
  if (site === "physics") return PHYSICS_AREAS;
  if (site === "chemistry") return CHEMISTRY_AREAS;
  if (site === "english" || site === "korean") return LANG_FIELDS;
  return [];
}

export function fieldKeyOf(site: string, taskId: string): string | null {
  if (site === "math") return mathAreaOf(taskId);
  if (site === "physics") {
    const lower = taskId.toLowerCase();
    if (/mechanic|motion|speed|gravity|force|newton|work|energy|mass|가속도|운동|마찰|속력|일과/.test(lower)) return "mechanics";
    if (/thermo|heat|temp|온도|열|단열|비열|기체/.test(lower)) return "thermo";
    if (/electr|magnet|current|voltage|전류|전압|자기|저항/.test(lower)) return "electromag";
    if (/wave|light|sound|optic|파동|빛|소리|반사|굴절/.test(lower)) return "waves";
    return "modern";
  }
  if (site === "chemistry") {
    const lower = taskId.toLowerCase();
    if (/reaction|stoichiometry|mol|몰|반응|계수|화학식/.test(lower)) return "reaction";
    if (/state|gas|liquid|solid|solution|상태|기체|액체|고체|용액|농도/.test(lower)) return "states";
    if (/energy|heat|enthalpy|발열|흡열|엔탈피/.test(lower)) return "energy";
    if (/carbon|organic|탄소|유기|중화/.test(lower)) return "carbon";
    return "matter";
  }
  if (site === "english" || site === "korean") return langFieldOf(taskId);
  return null;
}

export function fieldInfo(site: string, key: string, lang: string): FieldInfo {
  const normLang = lang.split("-")[0];
  if (site === "math") {
    const dict = AREA_LABELS[key as MathArea];
    const t = dict?.[lang] ?? dict?.[normLang] ?? dict?.en ?? key;
    return { key, short: t, full: t };
  }
  if (site === "physics") {
    const dict = PHYSICS_AREA_LABELS[key as PhysicsArea];
    const p = dict?.[lang] ?? dict?.[normLang] ?? dict?.en;
    return p ? { key, short: p.short, full: p.full } : { key, short: key, full: key };
  }
  if (site === "chemistry") {
    const dict = CHEMISTRY_AREA_LABELS[key as ChemistryArea];
    const c = dict?.[lang] ?? dict?.[normLang] ?? dict?.en;
    return c ? { key, short: c.short, full: c.full } : { key, short: key, full: key };
  }
  const dict = FIELD_LABELS[key as LangField];
  const l = dict?.[lang] ?? dict?.[normLang] ?? dict?.en;
  return l ? { key, short: l.short, full: l.full } : { key, short: key, full: key };
}
