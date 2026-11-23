import areas from "./math-areas.json";
import langFields from "./lang-fields.json";
import type { ThinkLang } from "./lang";

/** The four areas of the math hub's field filter (2022 curriculum style). Assignment: scripts/think/classify-math-areas.py -> math-areas.json. */
export type MathArea = "number" | "relations" | "geometry" | "data";
export const MATH_AREAS: MathArea[] = ["number", "relations", "geometry", "data"];
export const AREA_LABELS: Record<MathArea, Record<ThinkLang, string>> = {
  number: { ko: "수와 연산", en: "Numbers and operations", "zh-Hans": "数与运算", "zh-Hant": "數與運算", ja: "数と計算", vi: "Số và phép tính" },
  relations: { ko: "변화와 관계", en: "Change and relationships", "zh-Hans": "变化与关系", "zh-Hant": "變化與關係", ja: "変化と関係", vi: "Biến đổi và quan hệ" },
  geometry: { ko: "도형과 측정", en: "Shapes and measurement", "zh-Hans": "图形与测量", "zh-Hant": "圖形與測量", ja: "図形と測定", vi: "Hình học và đo lường" },
  data: { ko: "자료와 가능성", en: "Data and chance", "zh-Hans": "数据与可能性", "zh-Hant": "資料與可能性", ja: "データと可能性", vi: "Dữ liệu và khả năng" },
};
/** null = a task that fits none of the four areas: it is listed under "all fields" only. */
export const mathAreaOf = (taskId: string): MathArea | null => (areas as Record<string, MathArea | null>)[taskId] ?? null;

/** English- and Korean-subject tasks: six fields (English curriculum content areas). Assignment: scripts/think/classify-lang-fields.py -> lang-fields.json. */
export type LangField = "topic" | "function" | "context" | "strategy" | "language" | "text";
export const LANG_FIELDS: LangField[] = ["topic", "function", "context", "strategy", "language", "text"];
export const FIELD_LABELS: Record<LangField, Record<ThinkLang, { short: string; full: string }>> = {
  topic: { ko: { short: "주제", full: "주제" }, en: { short: "Topic", full: "Topic" }, "zh-Hans": { short: "主题", full: "主题" }, "zh-Hant": { short: "主題", full: "主題" }, ja: { short: "テーマ", full: "テーマ" }, vi: { short: "Chủ đề", full: "Chủ đề" } },
  function: { ko: { short: "기능", full: "기능" }, en: { short: "Function", full: "Function" }, "zh-Hans": { short: "功能", full: "功能" }, "zh-Hant": { short: "功能", full: "功能" }, ja: { short: "機能", full: "機能" }, vi: { short: "Chức năng", full: "Chức năng" } },
  context: { ko: { short: "맥락", full: "맥락" }, en: { short: "Context", full: "Context" }, "zh-Hans": { short: "语境", full: "语境" }, "zh-Hant": { short: "語境", full: "語境" }, ja: { short: "文脈", full: "文脈" }, vi: { short: "Ngữ cảnh", full: "Ngữ cảnh" } },
  strategy: { ko: { short: "기술 및 전략", full: "기술 및 전략" }, en: { short: "Skills & strategies", full: "Skills & strategies" }, "zh-Hans": { short: "技能与策略", full: "技能与策略" }, "zh-Hant": { short: "技能與策略", full: "技能與策略" }, ja: { short: "技能と方略", full: "技能と方略" }, vi: { short: "Kỹ năng & chiến lược", full: "Kỹ năng & chiến lược" } },
  language: { ko: { short: "언어지식", full: "언어지식 (발음, 어휘, 문법 등)" }, en: { short: "Language knowledge", full: "Language knowledge (pronunciation, vocabulary, grammar…)" }, "zh-Hans": { short: "语言知识", full: "语言知识（语音、词汇、语法等）" }, "zh-Hant": { short: "語言知識", full: "語言知識（語音、詞彙、語法等）" }, ja: { short: "言語知識", full: "言語知識（発音・語彙・文法など）" }, vi: { short: "Kiến thức ngôn ngữ", full: "Kiến thức ngôn ngữ (phát âm, từ vựng, ngữ pháp…)" } },
  text: { ko: { short: "텍스트", full: "텍스트" }, en: { short: "Text", full: "Text" }, "zh-Hans": { short: "语篇", full: "语篇" }, "zh-Hant": { short: "語篇", full: "語篇" }, ja: { short: "テキスト", full: "テキスト" }, vi: { short: "Văn bản", full: "Văn bản" } },
};
export const langFieldOf = (taskId: string): LangField | null => (langFields as Record<string, LangField | null>)[taskId] ?? null;

/** One field system for the hub: math = four areas, English / Korean = six fields. key = the filter value, short = card prefix, full = filter option. */
export type FieldInfo = { key: string; short: string; full: string };

/** Physics hub curriculum areas */
export type PhysicsArea = "mechanics" | "thermo" | "electromag" | "waves" | "modern";
export const PHYSICS_AREAS: PhysicsArea[] = ["mechanics", "thermo", "electromag", "waves", "modern"];
export const PHYSICS_AREA_LABELS: Record<PhysicsArea, Record<ThinkLang, { short: string; full: string }>> = {
  mechanics: { ko: { short: "역학·운동", full: "역학 및 운동 에너지" }, en: { short: "Mechanics", full: "Mechanics & Motion" }, "zh-Hans": { short: "力学与运动", full: "力学与运动能量" }, "zh-Hant": { short: "力學與運動", full: "力學與運動能量" }, ja: { short: "力学・運動", full: "力学と運動エネルギー" }, vi: { short: "Cơ học & chuyển động", full: "Cơ học và năng lượng chuyển động" } },
  thermo: { ko: { short: "열·에너지", full: "열역학 및 에너지 보존" }, en: { short: "Thermodynamics", full: "Thermodynamics & Heat" }, "zh-Hans": { short: "热学与能量", full: "热力学与能量守恒" }, "zh-Hant": { short: "熱學與能量", full: "熱力學與能量守恆" }, ja: { short: "熱・エネルギー", full: "熱力学とエネルギー保存" }, vi: { short: "Nhiệt & năng lượng", full: "Nhiệt động học và bảo toàn năng lượng" } },
  electromag: { ko: { short: "전기·자기", full: "전자기장과 상호작용" }, en: { short: "Electromagnetism", full: "Electricity & Magnetism" }, "zh-Hans": { short: "电磁学", full: "电磁学与相互作用" }, "zh-Hant": { short: "電磁學", full: "電磁學與相互作用" }, ja: { short: "電磁気", full: "電磁場と相互作用" }, vi: { short: "Điện từ học", full: "Điện từ trường và tương tác" } },
  waves: { ko: { short: "파동·빛", full: "파동과 광학" }, en: { short: "Waves & Optics", full: "Waves & Optics" }, "zh-Hans": { short: "波动与光学", full: "波动与光学" }, "zh-Hant": { short: "波動與光學", full: "波動與光學" }, ja: { short: "波動・光", full: "波動と光学" }, vi: { short: "Sóng & quang học", full: "Sóng và quang học" } },
  modern: { ko: { short: "현대물리", full: "현대 물리학과 미시세계" }, en: { short: "Modern Physics", full: "Modern Physics & Quantum" }, "zh-Hans": { short: "现代物理", full: "现代物理与量子" }, "zh-Hant": { short: "現代物理", full: "現代物理與量子" }, ja: { short: "現代物理", full: "現代物理学と量子" }, vi: { short: "Vật lý hiện đại", full: "Vật lý hiện đại và lượng tử" } },
};

/** Chemistry hub curriculum areas */
export type ChemistryArea = "matter" | "reaction" | "states" | "energy" | "carbon";
export const CHEMISTRY_AREAS: ChemistryArea[] = ["matter", "reaction", "states", "energy", "carbon"];
export const CHEMISTRY_AREA_LABELS: Record<ChemistryArea, Record<ThinkLang, { short: string; full: string }>> = {
  matter: { ko: { short: "물질의 구조", full: "원자와 물질의 기본 구조" }, en: { short: "Structure of Matter", full: "Atomic & Molecular Structure" }, "zh-Hans": { short: "物质结构", full: "原子与物质结构" }, "zh-Hant": { short: "物質結構", full: "原子與物質結構" }, ja: { short: "物質の構造", full: "原子と物質の構造" }, vi: { short: "Cấu trúc vật chất", full: "Cấu trúc nguyên tử và phân tử" } },
  reaction: { ko: { short: "화학 반응", full: "화학 반응과 양적 관계" }, en: { short: "Reactions & Stoichiometry", full: "Chemical Reactions & Stoichiometry" }, "zh-Hans": { short: "化学反应", full: "化学反应与定量关系" }, "zh-Hant": { short: "化學反應", full: "化學反應與定量關係" }, ja: { short: "化学反応", full: "化学反応と量的関係" }, vi: { short: "Phản ứng hóa học", full: "Phản ứng hóa học và định lượng" } },
  states: { ko: { short: "상태·용액", full: "물질의 세 가지 상태와 용액" }, en: { short: "States & Solutions", full: "States of Matter & Solutions" }, "zh-Hans": { short: "状态与溶液", full: "物质状态与溶液" }, "zh-Hant": { short: "狀態與溶液", full: "物質狀態與溶液" }, ja: { short: "状態・溶液", full: "物質の状態と溶液" }, vi: { short: "Trạng thái & dung dịch", full: "Trạng thái vật chất và dung dịch" } },
  energy: { ko: { short: "화학 에너지", full: "반응 엔탈피와 에너지 변화" }, en: { short: "Chemical Energy", full: "Chemical Energy & Enthalpy" }, "zh-Hans": { short: "化学能量", full: "反应热与化学能量" }, "zh-Hant": { short: "化學能量", full: "反應熱與化學能量" }, ja: { short: "化学エネルギー", full: "反応熱とエネルギー変化" }, vi: { short: "Năng lượng hóa học", full: "Năng lượng và entanpi phản ứng" } },
  carbon: { ko: { short: "탄소 화합물", full: "탄소 화합물과 생활 화학" }, en: { short: "Carbon & Everyday Chem", full: "Carbon Compounds & Everyday Chemistry" }, "zh-Hans": { short: "碳化合物", full: "碳化合物与生活化学" }, "zh-Hant": { short: "碳化合物", full: "碳化合物與生活化學" }, ja: { short: "炭素化合物", full: "炭素化合物と生活化学" }, vi: { short: "Hợp chất cacbon", full: "Hợp chất cacbon và hóa học đời sống" } },
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
    // Determine physics area from topic/id keywords
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

export function fieldInfo(site: string, key: string, lang: ThinkLang): FieldInfo {
  if (site === "math") {
    const t = AREA_LABELS[key as MathArea]?.[lang] ?? key;
    return { key, short: t, full: t };
  }
  if (site === "physics") {
    const p = PHYSICS_AREA_LABELS[key as PhysicsArea]?.[lang];
    return p ? { key, short: p.short, full: p.full } : { key, short: key, full: key };
  }
  if (site === "chemistry") {
    const c = CHEMISTRY_AREA_LABELS[key as ChemistryArea]?.[lang];
    return c ? { key, short: c.short, full: c.full } : { key, short: key, full: key };
  }
  const l = FIELD_LABELS[key as LangField]?.[lang];
  return l ? { key, short: l.short, full: l.full } : { key, short: key, full: key };
}
