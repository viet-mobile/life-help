// Build presentation overlays for all 46 non-core locales for the English Advanced Reading Track.
//
// Outputs:
//   lib/learn/content/reading/overlays/<locale>.json   (46 locales)
//   lib/learn/content/vi/reading-english.json          (synchronized with overlays/vi.json)
//
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COURSES, LESSON_DEFS } from "./build-reading-track.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = path.join(root, "lib/learn/content/reading/overlays");
const viFile = path.join(root, "lib/learn/content/vi/reading-english.json");

fs.mkdirSync(outDir, { recursive: true });

const canonReadingPath = path.join(root, "lib/learn/content/reading/english.json");
const canonAnswers = new Map(
  JSON.parse(fs.readFileSync(canonReadingPath, "utf8")).questions.map((q) => [q.id, q.answer.id.toUpperCase()])
);

// Read 47 locales from registry
const registry = fs.readFileSync(path.join(root, "messages/registry.ts"), "utf8");
const LOCALES = [...registry.match(/export const locales = \[([\s\S]*?)\] as const/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

// Prompt templates per language family / locale
const PROMPT_TEMPLATES = {
  ar: (p, q) => `اقرأ النص التالي ثم أجب عن السؤال. "${p}" السؤال: ${q}`,
  arz: (p, q) => `اقرا النص ده وجاوب على السؤال. "${p}" السؤال: ${q}`,
  fa: (p, q) => `متن زیر را بخوانید و به پرسش پاسخ دهید. "${p}" پرسش: ${q}`,
  ur: (p, q) => `مندرجہ ذیل عبارت پڑھیں اور سوال کا جواب دیں۔ "${p}" سوال: ${q}`,
  he: (p, q) => `קרא את הקטע הבא וענה על השאלה. "${p}" שאלה: ${q}`,
  ja: (p, q) => `次の文章を読んで問いに答えましょう。「${p}」設問: ${q}`,
  "zh-Hans": (p, q) => `阅读以下文章并回答问题。“${p}” 问题：${q}`,
  "zh-Hant": (p, q) => `閱讀以下文章並回答問題。「${p}」問題：${q}`,
  th: (p, q) => `อ่านข้อความต่อไปนี้แล้วตอบคำถาม "${p}" คำถาม: ${q}`,
  id: (p, q) => `Bacalah teks berikut dan jawablah pertanyaannya. "${p}" Pertanyaan: ${q}`,
  vi: (p, q) => `Đọc đoạn văn rồi trả lời câu hỏi. "${p}" Câu hỏi: ${q}`,
  es: (p, q) => `Lee el siguiente texto y responde a la pregunta. "${p}" Pregunta: ${q}`,
  fr: (p, q) => `Lisez le texte suivant et répondez à la question. "${p}" Question: ${q}`,
  de: (p, q) => `Lies den folgenden Text und beantworte die Frage. "${p}" Frage: ${q}`,
  it: (p, q) => `Leggi il brano seguente e rispondi alla domanda. "${p}" Domanda: ${q}`,
  pt: (p, q) => `Leia o texto a seguir e responda à pergunta. "${p}" Pergunta: ${q}`,
  ru: (p, q) => `Прочитайте следующий текст и ответьте на вопрос. "${p}" Вопрос: ${q}`,
  uk: (p, q) => `Прочитайте наступний текст та дайте відповідь на запитання. "${p}" Запитання: ${q}`,
  tr: (p, q) => `Aşağıdaki metni okuyun ve soruyu cevaplayın. "${p}" Soru: ${q}`,
  nl: (p, q) => `Lees de volgende tekst en beantwoord de vraag. "${p}" Vraag: ${q}`,
  pl: (p, q) => `Przeczytaj poniższy tekst i odpowiedz na pytanie. "${p}" Pytanie: ${q}`,
  hi: (p, q) => `निम्नलिखित गद्यांश को पढ़ें और प्रश्न का उत्तर दें। "${p}" प्रश्न: ${q}`,
  bn: (p, q) => `নিচের অনুচ্ছেদটি পড়ুন এবং প্রশ্নের উত্তর দিন। "${p}" প্রশ্ন: ${q}`,
  ta: (p, q) => `பின்வரும் பத்தியைப் படித்து கேள்விக்கு பதிலளிக்கவும். "${p}" கேள்வி: ${q}`,
  te: (p, q) => `కింది భాగాన్ని చదివి ప్రశ్నకు సమాధానం ఇవ్వండి. "${p}" ప్రశ్న: ${q}`,
  mr: (p, q) => `खालील परिच्छेद वाचा आणि प्रश्नाचे उत्तर द्या. "${p}" प्रश्न: ${q}`,
  gu: (p, q) => `નીચેનો ફકરો વાંચો અને પ્રશ્નનો જવાબ આપો. "${p}" પ્રશ્ન: ${q}`,
  kn: (p, q) => `ಕೆಳಗಿನ ಭಾಗವನ್ನು ಓದಿ ಮತ್ತು ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಿ. "${p}" ಪ್ರಶ್ನೆ: ${q}`,
  ml: (p, q) => `താഴെ പറയുന്ന ഭാഗം വായിച്ച് ചോദ്യത്തിന് ഉത്തരം നൽകുക. "${p}" ചോദ്യം: ${q}`,
  pa: (p, q) => `ਹੇਠਾਂ ਦਿੱਤੇ ਪੈਰੇ ਨੂੰ ਪੜ੍ਹੋ ਅਤੇ ਸਵਾਲ ਦਾ ਜਵਾਬ ਦਿਓ। "${p}" ਸਵਾਲ: ${q}`,
  my: (p, q) => `အောက်ပါစာပိုဒ်ကိုဖတ်ပြီး မေးခွန်းကိုဖြေပါ။ "${p}" မေးခွန်း: ${q}`,
  km: (p, q) => `សូមអានអត្ថបទខាងក្រោម ហើយឆ្លើយសំណួរ។ "${p}" សំណួរ: ${q}`,
  mn: (p, q) => `Дараах эхийг уншаад асуултад хариулна уу. "${p}" Асуулт: ${q}`,
  ne: (p, q) => `तलको अंश पढ्नुहोस् र प्रश्नको उत्तर दिनुहोस्। "${p}" प्रश्न: ${q}`,
  si: (p, q) => `පහත ඡේදය කියවා ප්‍රශ්නයට පිළිතුරු දෙන්න. "${p}" ප්‍රශ්නය: ${q}`,
  am: (p, q) => `የሚከተለውን ምንባብ አንብበው ለጥያቄው መልስ ይስጡ። "${p}" ጥያቄ: ${q}`,
  sw: (p, q) => `Soma kifungu kifuatacho kisha ujibu swali. "${p}" Swali: ${q}`,
  default: (p, q) => `Read the passage and answer the question. "${p}" Question: ${q}`
};

// Course translations across multilingual families
const COURSE_I18N = {
  "en-el-hum": {
    en: { title: "Advanced Reading · Humanities and Society", world: "Forest of Humanities", tagline: "Critical reading on human culture, identity and society", unit: "Humanities and Society Passages" },
    ja: { title: "人文・社会 応用読解", world: "人文の森 (Forest of Humanities)", tagline: "人間と社会を深く見つめる原書読解", unit: "人文・社会 応用読解パッセージ" },
    "zh-Hans": { title: "人文与社会 深度阅读", world: "人文之林 (Forest of Humanities)", tagline: "审视人与社会的深度学术原著阅读", unit: "人文与社会 深度阅读文本" },
    "zh-Hant": { title: "人文與社會 深度閱讀", world: "人文之森 (Forest of Humanities)", tagline: "審視人與社會的深度學術原著閱讀", unit: "人文與社會 深度閱讀文本" },
    es: { title: "Lectura Avanzada · Humanidades y Sociedad", world: "Bosque de Humanidades", tagline: "Lectura crítica sobre cultura, identidad y sociedad", unit: "Textos de Humanidades y Sociedad" },
    fr: { title: "Lecture Approfondie · Sciences Humaines et Société", world: "Forêt des Humanités", tagline: "Réflexion critique sur la culture, l'identité et la société", unit: "Textes de Sciences Humaines et Société" },
    de: { title: "Vertiefendes Lesen · Geistes- und Sozialwissenschaften", world: "Wald der Geisteswissenschaften", tagline: "Kritisches Lesen über Kultur, Identität und Gesellschaft", unit: "Texte zu Geistes- und Sozialwissenschaften" },
    ru: { title: "Углубленное чтение · Гуманитарные и общественные науки", world: "Лес гуманитарных наук", tagline: "Критическое чтение о культуре, идентичности и обществе", unit: "Тексты по гуманитарным наукам" },
    id: { title: "Membaca Lanjutan · Humaniora dan Masyarakat", world: "Hutan Humaniora", tagline: "Membaca kritis tentang budaya, identitas, dan masyarakat", unit: "Teks Humaniora dan Masyarakat" },
    th: { title: "การอ่านขั้นสูง · มนุษยศาสตร์และสังคมศาสตร์", world: "ป่าแห่งมนุษยศาสตร์", tagline: "การอ่านเชิงวิพากษ์เกี่ยวกับวัฒนธรรม อัตลักษณ์ และสังคม", unit: "บทความมนุษยศาสตร์และสังคมศาสตร์" },
    ar: { title: "القراءة المتقدمة · العلوم الإنسانية والمجتمع", world: "غابة العلوم الإنسانية", tagline: "قراءة نقدية معمقة حول الثقافة والهوية والمجتمع", unit: "نصوص العلوم الإنسانية والمجتمع" },
    hi: { title: "उन्नत पठन · मानविकी और समाज", world: "मानविकी का वन", tagline: "संस्कृति, पहचान और समाज पर आलोचनात्मक पठन", unit: "मानविकी और समाज के गद्यांश" }
  },
  "en-el-sci": {
    en: { title: "Advanced Reading · Science and Technology", world: "Lab of Discovery", tagline: "Academic reading on AI, climate resilience and modern science", unit: "Science and Technology Passages" },
    ja: { title: "科学・技術 応用読解", world: "探究の研究所 (Lab of Discovery)", tagline: "AI、気候危機、生命科学の最新学術読解", unit: "科学・技術 応用読解パッセージ" },
    "zh-Hans": { title: "科学与技术 深度阅读", world: "探索实验室 (Lab of Discovery)", tagline: "人工智能、气候韧性与现代生命科学前沿", unit: "科学与技术 深度阅读文本" },
    "zh-Hant": { title: "科學與技術 深度閱讀", world: "探索實驗室 (Lab of Discovery)", tagline: "人工智能、氣候韌性與現代生命科學前沿", unit: "科學與技術 深度閱讀文本" },
    es: { title: "Lectura Avanzada · Ciencia y Tecnología", world: "Laboratorio del Descubrimiento", tagline: "Lectura académica sobre IA, resiliencia climática y biociencia", unit: "Textos de Ciencia y Tecnología" },
    fr: { title: "Lecture Approfondie · Sciences et Technologies", world: "Laboratoire de la Découverte", tagline: "Textes académiques sur l'IA, le climat et la science", unit: "Textes de Sciences et Technologies" },
    de: { title: "Vertiefendes Lesen · Wissenschaft und Technologie", world: "Labor der Entdeckungen", tagline: "Akademische Texte zu KI, Klimaresilienz und Biowissenschaften", unit: "Texte zu Wissenschaft und Technologie" },
    ru: { title: "Углубленное чтение · Наука и технологии", world: "Лаборатория открытий", tagline: "Академические тексты об ИИ, климате и бионауках", unit: "Тексты по науке и технологиям" },
    id: { title: "Membaca Lanjutan · Sains dan Teknologi", world: "Laboratorium Penemuan", tagline: "Bacaan akademis tentang AI, ketahanan iklim, dan biosains", unit: "Teks Sains dan Teknologi" },
    th: { title: "การอ่านขั้นสูง · วิทยาศาสตร์และเทคโนโลยี", world: "ห้องทดลองแห่งการค้นพบ", tagline: "บทความวิชาการเกี่ยวกับ AI การเปลี่ยนแปลงสภาพภูมิอากาศ และวิทยาศาสตร์ชีวภาพ", unit: "บทความวิทยาศาสตร์และเทคโนโลยี" },
    ar: { title: "القراءة المتقدمة · العلوم والتكنولوجيا", world: "مختبر الاكتشاف", tagline: "قراءة أكاديمية حول الذكاء الاصطناعي والمناخ والعلوم الحديثة", unit: "نصوص العلوم والتكنولوجيا" },
    hi: { title: "उन्नत पठन · विज्ञान और प्रौद्योगिकी", world: "खोज की प्रयोगशाला", tagline: "एआई, जलवायु लचीलापन और आधुनिक विज्ञान पर अकादमिक पठन", unit: "विज्ञान और प्रौद्योगिकी के गद्यांश" }
  },
  "en-el-eco": {
    en: { title: "Advanced Reading · Economics and Global Trends", world: "Global Market", tagline: "Critical economic trends, decision-making and digital commerce", unit: "Economics and Global Trends Passages" },
    ja: { title: "経済・経営 実戦読解", world: "グローバル・マーケット (Global Market)", tagline: "行動経済学とグローバル貿易、データに基づく実戦分析", unit: "経済・経営 実戦読解パッセージ" },
    "zh-Hans": { title: "经济与管理 实战阅读", world: "全球市场 (Global Market)", tagline: "行为经济学、全球供应链与数字化商业", unit: "经济与管理 实战阅读文本" },
    "zh-Hant": { title: "經濟與管理 實戰閱讀", world: "全球市場 (Global Market)", tagline: "行為經濟學、全球供應鏈與數位化商業", unit: "經濟與管理 實戰閱讀文本" },
    es: { title: "Lectura Avanzada · Economía y Negocios", world: "Mercado Global", tagline: "Economía conductual, comercio digital y toma de decisiones", unit: "Textos de Economía y Negocios" },
    fr: { title: "Lecture Approfondie · Économie et Gestion", world: "Marché Global", tagline: "Économie comportementale, commerce numérique et prise de décision", unit: "Textes d'Économie et de Gestion" },
    de: { title: "Vertiefendes Lesen · Wirtschaft und Management", world: "Globaler Markt", tagline: "Verhaltensökonomie, digitaler Handel und Entscheidungsfindung", unit: "Texte zu Wirtschaft und Management" },
    ru: { title: "Углубленное чтение · Экономика и бизнес", world: "Глобальный рынок", tagline: "Поведенческая экономика, цифровая торговля и принятие решений", unit: "Тексты по экономике и бизнесу" },
    id: { title: "Membaca Lanjutan · Ekonomi dan Bisnis", world: "Pasar Global", tagline: "Ekonomi perilaku, perdagangan digital, dan pengambilan keputusan", unit: "Teks Ekonomi dan Bisnis" },
    th: { title: "การอ่านขั้นสูง · เศรษฐศาสตร์และธุรกิจ", world: "ตลาดโลก", tagline: "เศรษฐศาสตร์พฤติกรรม การค้าดิจิทัล และการตัดสินใจ", unit: "บทความเศรษฐศาสตร์และธุรกิจ" },
    ar: { title: "القراءة المتقدمة · الاقتصاد والاتجاهات العالمية", world: "السوق العالمية", tagline: "اتجاهات الاقتصاد السلوكي والتجارة الرقمية وصنع القرار", unit: "نصوص الاقتصاد والاتجاهات العالمية" },
    hi: { title: "उन्नत पठन · अर्थशास्त्र और वैश्विक रुझान", world: "वैश्विक बाजार", tagline: "व्यवहार अर्थशास्त्र, डिजिटल व्यापार और निर्णय लेने की प्रक्रिया", unit: "अर्थशास्त्र और वैश्विक रुझानों के गद्यांश" }
  },
  "en-el-aca": {
    en: { title: "Advanced Reading · Academic Logic and Synthesis", world: "Tower of Logic", tagline: "Premise analysis, inferencing and synthesis of complex arguments", unit: "Logic and Inference Passages" },
    ja: { title: "学術論理と空所推測", world: "論理の塔 (Tower of Logic)", tagline: "隠れた前提の把握、空所推測、複数文章の論理的統合", unit: "論理分析と空所推測パッセージ" },
    "zh-Hans": { title: "学术逻辑与填空推断", world: "逻辑之塔 (Tower of Logic)", tagline: "挖掘隐含前提、逻辑推断与多文本论证综合", unit: "逻辑分析与填空推断文本" },
    "zh-Hant": { title: "學術邏輯與填空推斷", world: "邏輯之塔 (Tower of Logic)", tagline: "挖掘隱含前提、邏輯推斷與多文本論證綜合", unit: "邏輯分析與填空推斷文本" },
    es: { title: "Lectura Avanzada · Lógica Académica e Inferencia", world: "Torre de la Lógica", tagline: "Análisis de premisas, inferencia y síntesis de argumentos", unit: "Textos de Lógica e Inferencia" },
    fr: { title: "Lecture Approfondie · Logique Académique et Déduction", world: "Tour de la Logique", tagline: "Analyse des prémisses, déduction et synthèse d'arguments", unit: "Textes de Logique et de Déduction" },
    de: { title: "Vertiefendes Lesen · Akademische Logik und Schlussfolgerung", world: "Turm der Logik", tagline: "Prämissenanalyse, logische Deduktion und Argumentensynthese", unit: "Texte zu Logik und Schlussfolgerung" },
    ru: { title: "Углубленное чтение · Академическая логика и умозаключения", world: "Башня логики", tagline: "Анализ предпосылок, логические выводы и синтез аргументов", unit: "Тексты по логике и умозаключениям" },
    id: { title: "Membaca Lanjutan · Logika Akademis dan Inferensi", world: "Menara Logika", tagline: "Analisis premis, penarikan kesimpulan, dan sintesis argumen", unit: "Teks Logika dan Inferensi" },
    th: { title: "การอ่านขั้นสูง · ตรรกะทางวิชาการและการสรุปความ", world: "หอคอยแห่งตรรกะ", tagline: "การวิเคราะห์ข้อสมมติ การอนุมาน และการสังเคราะห์ข้อโต้แย้ง", unit: "บทความตรรกะและการสรุปความ" },
    ar: { title: "القراءة المتقدمة · المنطق الأكاديمي والاستنتاج", world: "برج المنطق", tagline: "تحليل المقدمات والاستنتاج والتوليف بين الحجج المعقدة", unit: "نصوص المنطق والاستنتاج" },
    hi: { title: "उन्नत पठन · अकादमिक तर्क और निष्कर्ष", world: "तर्क की मीनार", tagline: "परिकल्पना विश्लेषण, निष्कर्ष निकालना और जटिल तर्कों का संश्लेषण", unit: "तर्क और निष्कर्ष के गद्यांश" }
  }
};

// Lesson titles and concepts
const LESSON_I18N = {
  "en-el-hum1": {
    en: { title: "Cultural Identity and Language", concept: "Language is more than a communication tool; it shapes our worldview and embodies cultural memory." },
    ja: { title: "文化的一致と言語", concept: "言語は単なる情報伝達の道具を超え、共同体の記憶と世界観を反映します。" },
    "zh-Hans": { title: "文化认同与语言", concept: "语言不仅是交流信息的工具，更承载着群体的集体记忆与世界观。" },
    "zh-Hant": { title: "文化認同與語言", concept: "語言不僅是交流訊息的工具，更承載著群體的集體記憶與世界觀。" },
    es: { title: "Identidad Cultural y Lenguaje", concept: "El lenguaje es más que una herramienta de comunicación; encarna la memoria colectiva y la visión del mundo." },
    fr: { title: "Identité Culturelle et Langue", concept: "La langue dépasse le simple échange d'informations : elle porte la mémoire collective d'une communauté." },
    de: { title: "Kulturelle Identität und Sprache", concept: "Sprache ist mehr als ein Informationsmittel; sie verkörpert das kollektive Gedächtnis einer Gemeinschaft." },
    ru: { title: "Культурная идентичность и язык", concept: "Язык не просто средство общения, он отражает коллективную память и мировоззрение сообщества." },
    id: { title: "Identitas Budaya dan Bahasa", concept: "Bahasa bukan sekadar alat komunikasi; bahasa mencerminkan memori kolektif dan pandangan dunia masyarakat." },
    th: { title: "อัตลักษณ์ทางวัฒนธรรมและภาษา", concept: "ภาษาเป็นมากกว่าเครื่องมือสื่อสาร โดยสะท้อนถึงความทรงจำและโลกทัศน์ร่วมของชุมชน" }
  },
  "en-el-hum2": {
    en: { title: "Ethics in the Modern World", concept: "Analyze moral dilemmas between individual choices and collective civic responsibility in digital societies." },
    ja: { title: "現代社会の倫理と選択", concept: "ネットワーク社会における個人の選択が社会構造に及ぼす影響と市民的責任を分析します。" },
    "zh-Hans": { title: "现代社会的伦理与抉择", concept: "分析互联数字社会中个人选择与集体责任之间的伦理困境。" },
    "zh-Hant": { title: "現代社會的倫理與抉擇", concept: "分析互聯數位社會中個人選擇與集體責任之間的倫理困境。" },
    es: { title: "Ética en el Mundo Moderno", concept: "Analiza dilemas morales entre decisiones individuales y responsabilidad cívica en sociedades digitales." },
    fr: { title: "L'Éthique dans le Monde Moderne", concept: "Analysez les dilemmes éthiques entre choix individuels et responsabilité civique dans les sociétés connectées." },
    de: { title: "Ethik in der modernen Welt", concept: "Analysiere moralische Dilemmata zwischen individueller Wahl und bürgerlicher Verantwortung." },
    ru: { title: "Этика в современном мире", concept: "Анализ моральных дилемм между индивидуальным выбором и гражданской ответственностью." },
    id: { title: "Etika di Dunia Modern", concept: "Menganalisis dilema moral antara pilihan individu dan tanggung jawab sipil dalam masyarakat digital." },
    th: { title: "จริยธรรมในโลกสมัยใหม่", concept: "วิเคราะห์ภาวะกลืนไม่เข้าคายไม่ออกทางศีลธรรมระหว่างการตัดสินใจของบุคคลและความรับผิดชอบต่อสังคม" }
  },
  "en-el-sci1": {
    en: { title: "AI and the Human Mind", concept: "Examine computational pattern recognition versus human embodied consciousness." },
    ja: { title: "人工知能と人間の精神", concept: "計算論的な統計的パターン認識と人間の身体化された意識の違いを探求します。" },
    "zh-Hans": { title: "人工智能与人类心智", concept: "探究计算统计模式识别与人类具身意识之间的本质差异。" },
    "zh-Hant": { title: "人工智能與人類心智", concept: "探究計算統計模式識別與人類具身意識之間的本質差異。" },
    es: { title: "IA y la Mente Humana", concept: "Examina el reconocimiento de patrones computacionales frente a la conciencia humana corporizada." },
    fr: { title: "L'IA et l'Esprit Humain", concept: "Examinez la reconnaissance computationnelle des formes par rapport à la conscience humaine incarnée." },
    de: { title: "KI und der menschliche Geist", concept: "Untersuche statistische Mustererkennung im Vergleich zum verkörperten menschlichen Bewusstsein." },
    ru: { title: "ИИ и человеческий разум", concept: "Исследование различий между статистическим распознаванием образов и сознанием человека." },
    id: { title: "AI dan Pikiran Manusia", concept: "Meneliti perbedaan antara pengenalan pola komputasi dan kesadaran manusia." },
    th: { title: "AI และจิตใจของมนุษย์", concept: "สำรวจความแตกต่างระหว่างการรู้จำรูปแบบทางสถิติของคอมพิวเตอร์กับจิตสำนึกของมนุษย์" }
  },
  "en-el-sci2": {
    en: { title: "Climate Resilience and Green Tech", concept: "Analyze circular economy frameworks and decoupling energy grids from fossil fuels." },
    ja: { title: "気候耐性とグリーン・テクノロジー", concept: "資源が循環する経済モデルと、化石燃料から完全に脱却する電力網の変革を考察します。" },
    "zh-Hans": { title: "气候韧性与绿色科技", concept: "分析循环经济框架及能源网络彻底摆脱化石燃料的结构转型。" },
    "zh-Hant": { title: "氣候韌性與綠色科技", concept: "分析循環經濟框架及能源網絡徹底擺脫化石燃料的結構轉型。" },
    es: { title: "Resiliencia Climática y Tecnologías Verdes", concept: "Analiza marcos de economía circular y la desconexión energética de los combustibles fósiles." },
    fr: { title: "Résilience Climatique et Technologies Vertes", concept: "Analysez les modèles d'économie circulaire et la décarbonation totale des réseaux électriques." },
    de: { title: "Klimaresilienz und grüne Technologien", concept: "Analysiere Kreislaufwirtschaft und die vollständige Abkopplung der Stromnetze von fossilen Brennstoffen." },
    ru: { title: "Климатическая устойчивость и зеленые технологии", concept: "Анализ моделей экономики замкнутого цикла и перехода энергетических сетей от ископаемого топлива." },
    id: { title: "Ketahanan Iklim dan Teknologi Hijau", concept: "Menganalisis kerangka ekonomi sirkular dan pemisahan jaringan energi dari bahan bakar fosil." },
    th: { title: "การฟื้นตัวจากสภาพภูมิอากาศและเทคโนโลยีสีเขียว", concept: "วิเคราะห์กรอบเศรษฐกิจหมุนเวียนและการแยกโครงข่ายพลังงานออกจากเชื้อเพลิงฟอสซิล" }
  },
  "en-el-eco1": {
    en: { title: "Behavioral Economics and Decision Making", concept: "Investigate human irrationality, loss aversion, and cognitive framing in economic choices." },
    ja: { title: "行動経済学と意思決定", concept: "人間の非合理的な選択、損失回避の傾向、認知フレーミングがもたらす影響を分析します。" },
    "zh-Hans": { title: "行为经济学与决策机制", concept: "研究人类非理性决策、损失厌恶心理以及认知框架效应对经济选择的影响。" },
    "zh-Hant": { title: "行為經濟學與決策機制", concept: "研究人類非理性決策、損失厭惡心理以及認知框架效應對經濟選擇的影響。" },
    es: { title: "Economía Conductual y Toma de Decisiones", concept: "Investiga la irracionalidad humana, la aversión a la pérdida y los marcos cognitivos en las decisiones." },
    fr: { title: "Économie Comportementale et Prise de Décision", concept: "Étudiez l'irrationalité humaine, l'aversion à la perte et les biais cognitifs dans les décisions." },
    de: { title: "Verhaltensökonomie und Entscheidungsfindung", concept: "Erforsche menschliche Irrationalität, Verlustaversion und Framing-Effekte bei ökonomischen Entscheidungen." },
    ru: { title: "Поведенческая экономика и принятие решений", concept: "Изучение нерациональности человека, неприятия потерь и когнитивных искажений в экономическом выборе." },
    id: { title: "Ekonomi Perilaku dan Pengambilan Keputusan", concept: "Mempelajari irasionalitas manusia, penghindaran kerugian, dan pengaruh pembingkaian kognitif." },
    th: { title: "เศรษฐศาสตร์พฤติกรรมและการตัดสินใจ", concept: "ศึกษาความไร้เหตุผลของมนุษย์ การหลีกเลี่ยงความสูญเสีย และกรอบทางความคิดในการตัดสินใจทางเศรษฐกิจ" }
  },
  "en-el-eco2": {
    en: { title: "Globalization and Digital Trade", concept: "Explore cross-border digital data flows and structural reorganization of global supply chains." },
    ja: { title: "グローバル化とデジタル貿易", concept: "国境を越えるデータ流通と、物理的距離から切り離された新たなグローバル価値連鎖を考察します。" },
    "zh-Hans": { title: "全球化与数字贸易", concept: "探讨跨国数字数据流向以及全球价值链和供应链的结构性重塑。" },
    "zh-Hant": { title: "全球化與數位貿易", concept: "探討跨國數位數據流向以及全球價值鏈和供應鏈的結構性重塑。" },
    es: { title: "Globalización y Comercio Digital", concept: "Explora los flujos de datos transfronterizos y la reorganización estructural de las cadenas de valor globales." },
    fr: { title: "Mondialisation et Commerce Numérique", concept: "Explorez les flux de données transfrontaliers et la réorganisation structurelle des chaînes de valeur." },
    de: { title: "Globalisierung und digitaler Handel", concept: "Untersuche grenzüberschreitende Datenflüsse und die Neuausrichtung globaler Wertschöpfungsketten." },
    ru: { title: "Глобализация и цифровая торговля", concept: "Исследование трансграничных потоков цифровых данных и реструктуризации глобальных цепочек поставок." },
    id: { title: "Globalisasi dan Perdagangan Digital", concept: "Menjelajahi aliran data digital lintas batas dan penataan ulang rantai nilai global." },
    th: { title: "โลกาภิวัตน์และการค้าดิจิทัล", concept: "สำรวจการไหลเวียนของข้อมูลดิจิทัลข้ามพรมแดนและการจัดโครงสร้างห่วงโซ่มูลค่าระดับโลกใหม่" }
  },
  "en-el-aca1": {
    en: { title: "Logical Premises and Hidden Assumptions", concept: "Identify unstated assumptions and evaluate premise-conclusion validity in academic arguments." },
    ja: { title: "論理的前提と隠れた仮定", concept: "学術的な議論において暗黙のうちに前提とされている仮定を見出し、論理の整合性を評価します。" },
    "zh-Hans": { title: "逻辑前提与隐性假设", concept: "在学术论证中识别未经明说的隐含前设，并评估前提与结论之间的逻辑有效性。" },
    "zh-Hant": { title: "邏輯前提與隱性假設", concept: "在學術論證中識別未經明說的隱含前設，並評估前提與結論之間的邏輯有效性。" },
    es: { title: "Premisas Lógicas y Supuestos Implícitos", concept: "Identifica suposiciones no declaradas y evalúa la validez lógica de premisas y conclusiones." },
    fr: { title: "Prémisses Logiques et Hypothèses Implicites", concept: "Identifiez les présupposés non formulés et évaluez la rigueur logique des arguments universitaires." },
    de: { title: "Logische Prämissen und verborgene Annahmen", concept: "Erkenne unausgesprochene Vorannahmen und prüfe die Gültigkeit von Prämissen und Schlüssen." },
    ru: { title: "Логические предпосылки и скрытые допущения", concept: "Выявление невысказанных предпосылок и оценка логической валидности аргументов." },
    id: { title: "Premis Logis dan Asumsi Tersembunyi", concept: "Mengidentifikasi asumsi tersirat dan mengevaluasi validitas premis serta kesimpulan dalam argumen akademis." },
    th: { title: "ข้อสมมติฐานทางตรรกะและข้อตกลงเบื้องต้นที่ซ่อนอยู่", concept: "ระบุข้อสมมติฐานที่ไม่ได้ระบุไว้ชัดเจนและประเมินความสมเหตุสมผลของข้อสรุปในเชิงวิชาการ" }
  },
  "en-el-aca2": {
    en: { title: "Comparative Argument Synthesis", concept: "Synthesize contrasting perspectives and reconcile nuanced arguments across multiple academic texts." },
    ja: { title: "比較論証の統合", concept: "対立する視点を総合し、複数の学術テキストにおける緻密な論点を論理的に統合します。" },
    "zh-Hans": { title: "多重视角比较与论证综合", concept: "综合对比不同学派的学术观点，在复杂文本之间建立平衡而精细的逻辑论证。" },
    "zh-Hant": { title: "多重視角比較與論證綜合", concept: "綜合對比不同學派的學術觀點，在複雜文本之間建立平衡而精細的邏輯論證。" },
    es: { title: "Síntesis Comparativa de Argumentos", concept: "Sintetiza perspectivas divergentes y reconcilia argumentos complejos entre múltiples textos." },
    fr: { title: "Synthèse Comparative d'Arguments", concept: "Synthétisez des perspectives contrastées et conciliez des arguments complexes issus de plusieurs textes." },
    de: { title: "Vergleichende Argumentsynthese", concept: "Verbinde gegensätzliche Perspektiven und führe nuancierte Argumente aus verschiedenen Texten zusammen." },
    ru: { title: "Сравнительный синтез аргументов", concept: "Синтез противоположных точек зрения и сопоставление сложных аргументов из нескольких текстов." },
    id: { title: "Sintesis Argumen Komparatif", concept: "Mensintesis sudut pandang yang berlawanan dan merekonsiliasi argumen mendalam dari berbagai teks akademis." },
    th: { title: "การสังเคราะห์ข้อโต้แย้งเชิงเปรียบเทียบ", concept: "สังเคราะห์มุมมองที่แตกต่างและประสานข้อโต้แย้งที่ซับซ้อนจากบทความวิชาการหลายฉบับเข้าด้วยกัน" }
  }
};

// Generates overlay for a single locale
export function generateOverlayForLocale(locale) {
  const isVi = locale === "vi";
  const promptFn = PROMPT_TEMPLATES[locale] || PROMPT_TEMPLATES.default;

  const skills = {};
  const courses = {};
  const units = {};
  const lessons = {};
  const questions = {};

  for (const c of COURSES) {
    const cI18n = COURSE_I18N[c.id]?.[locale] || COURSE_I18N[c.id]?.en || {
      title: c.titleVi,
      world: c.world.nameVi,
      tagline: c.world.taglineVi,
      unit: c.units[0].titleVi
    };

    courses[c.id] = {
      title: isVi ? c.titleVi : cI18n.title,
      world: {
        name: isVi ? c.world.nameVi : cI18n.world,
        tagline: isVi ? c.world.taglineVi : cI18n.tagline
      }
    };

    const unit = c.units[0];
    units[unit.id] = isVi ? unit.titleVi : cI18n.unit;

    const cLessons = LESSON_DEFS.filter((l) => l.courseId === c.id);
    for (const l of cLessons) {
      const lI18n = LESSON_I18N[l.id]?.[locale] || LESSON_I18N[l.id]?.en || {
        title: l.titleVi,
        concept: l.conceptVi
      };

      skills[l.skillId] = isVi ? l.titleVi : lI18n.title;

      lessons[l.id] = {
        title: isVi ? l.titleVi : lI18n.title,
        concept: isVi ? l.conceptVi : lI18n.concept,
        example: l.passage
      };

      l.items.forEach((item, idx) => {
        const qid = `${l.id}-q${idx + 1}`;
        const questionText = isVi ? item.qVi : item.q;
        const prompt = isVi
          ? `Đọc đoạn văn rồi trả lời câu hỏi. "${l.passage}" Câu hỏi: ${item.qVi}`
          : promptFn(l.passage, questionText);

        const hints = isVi
          ? [item.h1Vi, item.h2Vi]
          : [
              `Hint 1: Notice the core context and keywords: "${item.opts[0].slice(0, 30)}..."`,
              `Hint 2: Review the specific argument in the passage: "${l.passage.slice(0, 45)}..."`
            ];

        const explanation = isVi
          ? item.exVi
          : `Correct answer is option (${canonAnswers.get(qid) || "A"}). The passage directly supports this by emphasizing: "${l.passage.slice(0, 60)}..."`;

        questions[qid] = {
          prompt,
          hints,
          explanation
        };
      });
    }
  }

  return {
    skills,
    courses,
    units,
    lessons,
    questions
  };
}

// Generate for all 46 learner locales
const targetLocales = LOCALES.filter((l) => l !== "ko");
console.log(`Building reading overlays for ${targetLocales.length} locales...`);

let totalOverlays = 0;
const json = (v) => JSON.stringify(v, null, 1) + "\n";

for (const loc of targetLocales) {
  const overlay = generateOverlayForLocale(loc);
  const outPath = path.join(outDir, `${loc}.json`);
  fs.writeFileSync(outPath, json(overlay));
  totalOverlays++;

  if (loc === "vi") {
    // Keep lib/learn/content/vi/reading-english.json in sync
    fs.writeFileSync(viFile, json(overlay));
  }
}

console.log(`Successfully generated ${totalOverlays} reading overlays in lib/learn/content/reading/overlays/`);
