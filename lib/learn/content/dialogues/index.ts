import type { Course, Grade, Lesson, Question, Site, Skill, Unit } from "@/lib/learn/types";
import {
  CATEGORY_INFO,
  SITUATION_CATEGORIES,
  type CategoryInfo,
  type SituationCategory,
  type SituationalDialogue,
} from "./types";
import { KOREAN_SITUATIONAL_DIALOGUES } from "./dialogues-ko";
import { ENGLISH_SITUATIONAL_DIALOGUES } from "./dialogues-en";

export * from "./types";
export { KOREAN_SITUATIONAL_DIALOGUES } from "./dialogues-ko";
export { ENGLISH_SITUATIONAL_DIALOGUES } from "./dialogues-en";

/** Returns all situational dialogues for the given site (english or korean). */
export function getAllSituationalDialogues(site: Site): readonly SituationalDialogue[] {
  if (site === "korean") return KOREAN_SITUATIONAL_DIALOGUES;
  if (site === "english") return ENGLISH_SITUATIONAL_DIALOGUES;
  return [];
}

/** Returns dialogues filtered by specific category (hospital, airport, store, etc.). */
export function getDialoguesByCategory(site: Site, category: SituationCategory): SituationalDialogue[] {
  return getAllSituationalDialogues(site).filter((d) => d.category === category);
}

/** Returns all category metadata. */
export function getCategoryList(): CategoryInfo[] {
  return Object.values(CATEGORY_INFO);
}

/**
 * Creates standardized Skill definitions for situational dialogues across all 19 real-world categories.
 */
export function getSituationalSkills(site: Site): Skill[] {
  const prefix = site === "korean" ? "dlg.ko" : "dlg.en";
  const nameLang = site === "korean" ? "한국어" : "영어";
  return [
    { id: `${prefix}.hosp`, title: `병원·약국 실전 회화 (${nameLang})` },
    { id: `${prefix}.airp`, title: `공항·출입국 실전 회화 (${nameLang})` },
    { id: `${prefix}.stor`, title: `상점·쇼핑 실전 회화 (${nameLang})` },
    { id: `${prefix}.cls`, title: `교실·학교생활 실전 회화 (${nameLang})` },
    { id: `${prefix}.park`, title: `놀이공원 실전 회화 (${nameLang})` },
    { id: `${prefix}.rest`, title: `식당·주문 실전 회화 (${nameLang})` },
    { id: `${prefix}.wed`, title: `결혼식·문화예절 실전 회화 (${nameLang})` },
    { id: `${prefix}.hot`, title: `호텔·숙박 실전 회화 (${nameLang})` },
    { id: `${prefix}.tr`, title: `대중교통·길찾기 실전 회화 (${nameLang})` },
    { id: `${prefix}.bnk`, title: `은행·금융 실전 회화 (${nameLang})` },
    { id: `${prefix}.post`, title: `우체국·택배 실전 회화 (${nameLang})` },
    { id: `${prefix}.hsg`, title: `부동산·주거생활 실전 회화 (${nameLang})` },
    { id: `${prefix}.pub`, title: `관공서·이민행정 실전 회화 (${nameLang})` },
    { id: `${prefix}.wrk`, title: `직장·비즈니스 실전 회화 (${nameLang})` },
    { id: `${prefix}.sal`, title: `미용실·헤어 실전 회화 (${nameLang})` },
    { id: `${prefix}.lost`, title: `분실물·도움요청 실전 회화 (${nameLang})` },
    { id: `${prefix}.fit`, title: `체육관·피트니스 실전 회화 (${nameLang})` },
    { id: `${prefix}.lib`, title: `도서관·박물관 실전 회화 (${nameLang})` },
    { id: `${prefix}.car`, title: `렌터카·주유소 실전 회화 (${nameLang})` },
  ];
}

/**
 * Converts a SituationalDialogue into a standard curriculum Lesson.
 */
function dialogueToLesson(dlg: SituationalDialogue): Lesson {
  const dialogSummary = dlg.turns.map((t) => `${t.speakerRole ?? t.speaker}: ${t.text}`).join("\n");
  const concept = `[${dlg.locationKo} / ${dlg.locationEn}]\n${dlg.titleKo} (${dlg.titleEn})\n\n주요 표현:\n${dlg.keyExpressions
    .map((k) => `• ${k.target}: ${k.meaning}`)
    .join("\n")}`;

  return {
    id: `lesson-${dlg.id}`,
    title: dlg.site === "korean" ? `${dlg.titleKo}` : `${dlg.titleEn}`,
    concept,
    example: dialogSummary,
    skillIds: [dlg.questions[0]?.skillId ?? `dlg.${dlg.site}.${dlg.category}`],
    questionIds: dlg.questions.map((q) => q.id),
  };
}

/**
 * Maps situational dialogues matching the student's grade/level into a natural curriculum Unit.
 * Level matching:
 * - Elementary / Early Korean: Level 1 & 2 dialogues
 * - Middle / Mid Korean: Level 3 & 4 dialogues
 * - High / Advanced Korean: Level 4 & 5 dialogues
 */
export function getSituationalUnitForGrade(site: Site, grade: Grade): Unit | null {
  const all = getAllSituationalDialogues(site);
  const matched = all.filter((d) => d.gradeScope === grade);

  if (matched.length === 0) return null;

  return {
    id: `unit-situational-${site}-${grade.toLowerCase()}`,
    title: site === "korean" ? "💬 상황별 실전 생활 회화" : "💬 Real-Life Situational Dialogues",
    lessons: matched.map(dialogueToLesson),
  };
}

/**
 * Collects all questions from all dialogues for a site.
 */
export function getAllSituationalQuestions(site: Site): Question[] {
  return getAllSituationalDialogues(site).flatMap((d) => d.questions);
}

/**
 * Builds the standalone Situational Dialogues Course (accessible by any grade as an elective or dedicated module).
 */
export function buildStandaloneSituationalCourse(site: Site): Course {
  const all = getAllSituationalDialogues(site);
  const categories: readonly SituationCategory[] = SITUATION_CATEGORIES;

  const units: Unit[] = categories.map((cat) => {
    const info = CATEGORY_INFO[cat];
    const catDialogues = all.filter((d) => d.category === cat);
    return {
      id: `unit-standalone-${site}-${cat}`,
      title: site === "korean" ? `${info.emoji} ${info.nameKo} 회화` : `${info.emoji} ${info.nameEn} Dialogues`,
      lessons: catDialogues.map(dialogueToLesson),
    };
  });

  return {
    id: `course-situational-${site}`,
    title: site === "korean" ? "🌟 19대 상황별 실전 한국어 회화" : "🌟 19 Comprehensive Situational English Dialogues",
    grade: (site === "korean" ? "K1" : "E1") as Grade,
    elective: true,
    world: {
      name: site === "korean" ? "실전 생활 회화 광장" : "Situational Dialogue Plaza",
      emoji: "🏙️",
      tagline:
        site === "korean"
          ? "병원, 공항, 상점, 호텔, 관공서, 직장 등 19대 필수 실생활 상황 완벽 마스터"
          : "Master real-life conversations across 19 essential everyday situations",
    },
    units,
  };
}

