import areas from "./math-areas.json";
import langFields from "./lang-fields.json";
import mathAreaLabels from "./math-areas-labels.json";
import langFieldLabels from "./lang-fields-labels.json";
import physicsAreas from "./physics-areas.json";
import chemistryAreas from "./chemistry-areas.json";
import type { ThinkLang } from "./lang";

/** The four areas of the math hub's field filter (2022 curriculum style). Assignment: scripts/think/classify-math-areas.py -> math-areas.json. */
export type MathArea = "number" | "relations" | "geometry" | "data";
export const MATH_AREAS: MathArea[] = ["number", "relations", "geometry", "data"];
export const AREA_LABELS: Record<MathArea, Record<string, string>> = mathAreaLabels as unknown as Record<MathArea, Record<string, string>>;

/** null = a task that fits none of the four areas: it is listed under "all fields" only. */
export const mathAreaOf = (taskId: string): MathArea | null => (areas as Record<string, MathArea | null>)[taskId] ?? null;

/** English- and Korean-subject tasks: six fields (English curriculum content areas). Assignment: scripts/think/classify-lang-fields.py -> lang-fields.json. */
export type LangField = "topic" | "function" | "context" | "strategy" | "language" | "text";
export const LANG_FIELDS: LangField[] = ["topic", "function", "context", "strategy", "language", "text"];
export const FIELD_LABELS: Record<LangField, Record<string, { short: string; full: string }>> = langFieldLabels as unknown as Record<LangField, Record<string, { short: string; full: string }>>;

export const langFieldOf = (taskId: string): LangField | null => (langFields as Record<string, LangField | null>)[taskId] ?? null;

/** One field system for the hub: math = four areas, English / Korean = six fields. key = the filter value, short = card prefix, full = filter option. */
export type FieldInfo = { key: string; short: string; full: string };

/** Physics hub curriculum areas */
export type PhysicsArea = "mechanics" | "thermo" | "electromag" | "waves" | "modern";
export const PHYSICS_AREAS: PhysicsArea[] = ["mechanics", "thermo", "electromag", "waves", "modern"];
export const PHYSICS_AREA_LABELS: Record<PhysicsArea, Record<string, { short: string; full: string }>> = physicsAreas as unknown as Record<PhysicsArea, Record<string, { short: string; full: string }>>;

/** Chemistry hub curriculum areas */
export type ChemistryArea = "matter" | "reaction" | "states" | "energy" | "carbon";
export const CHEMISTRY_AREAS: ChemistryArea[] = ["matter", "reaction", "states", "energy", "carbon"];
export const CHEMISTRY_AREA_LABELS: Record<ChemistryArea, Record<string, { short: string; full: string }>> = chemistryAreas as unknown as Record<ChemistryArea, Record<string, { short: string; full: string }>>;

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
