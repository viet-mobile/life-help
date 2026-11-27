import type { KoreanPatternType } from "@/components/learn/KoreanTraditionalPattern";

export interface KoreanCourseTheme {
  id: string;
  koreanGrade: string;
  koreanTag: string;
  bg: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  titleColor: string;
  subColor: string;
  taglineColor: string;
  patternType: KoreanPatternType;
}

export const KOREAN_COURSE_THEMES: Record<string, KoreanCourseTheme> = {
  "korean-k1": {
    id: "korean-k1",
    koreanGrade: "1단계",
    koreanTag: "청자 비취 · 훈민정음",
    bg: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
    borderColor: "#059669",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#a7f3d0",
    taglineColor: "#ecfdf5",
    patternType: "giwa",
  },
  "korean-k2": {
    id: "korean-k2",
    koreanGrade: "2단계",
    koreanTag: "단청 홍색 · 첫인사",
    bg: "linear-gradient(135deg, #9a3412 0%, #c2410c 50%, #ea580c 100%)",
    borderColor: "#ea580c",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#fed7aa",
    taglineColor: "#fff7ed",
    patternType: "dancheong",
  },
  "korean-k3": {
    id: "korean-k3",
    koreanGrade: "3단계",
    koreanTag: "황토 감색 · 가족마을",
    bg: "linear-gradient(135deg, #854d0e 0%, #b45309 50%, #d97706 100%)",
    borderColor: "#d97706",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#fde68a",
    taglineColor: "#fefce8",
    patternType: "jogakbo",
  },
  "korean-k4": {
    id: "korean-k4",
    koreanGrade: "4단계",
    koreanTag: "솔잎 청록 · 일상마을",
    bg: "linear-gradient(135deg, #14532d 0%, #15803d 50%, #16a34a 100%)",
    borderColor: "#16a34a",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#bbf7d0",
    taglineColor: "#f0fdf4",
    patternType: "bitsal",
  },
  "korean-k5": {
    id: "korean-k5",
    koreanGrade: "5단계",
    koreanTag: "궁중 자주 · 시간정거장",
    bg: "linear-gradient(135deg, #581c87 0%, #7e22ce 50%, #9333ea 100%)",
    borderColor: "#9333ea",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#e9d5ff",
    taglineColor: "#faf5ff",
    patternType: "unmun",
  },
  "korean-k6": {
    id: "korean-k6",
    koreanGrade: "6단계",
    koreanTag: "남산 쪽빛 · 서울거리",
    bg: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
    borderColor: "#2563eb",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#bfdbfe",
    taglineColor: "#eff6ff",
    patternType: "changsal",
  },
  "korean-k7": {
    id: "korean-k7",
    koreanGrade: "7단계",
    koreanTag: "비단 청옥 · 화법정원",
    bg: "linear-gradient(135deg, #115e59 0%, #0f766e 50%, #14b8a6 100%)",
    borderColor: "#14b8a6",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#99f6e4",
    taglineColor: "#f0fdfa",
    patternType: "yeohwa",
  },
  "korean-k8": {
    id: "korean-k8",
    koreanGrade: "8단계",
    koreanTag: "한강 청람 · 예절의강",
    bg: "linear-gradient(135deg, #155e75 0%, #0e7490 50%, #0284c7 100%)",
    borderColor: "#0284c7",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#a5f3fc",
    taglineColor: "#ecfeff",
    patternType: "cheonghaepa",
  },
  "korean-k9": {
    id: "korean-k9",
    koreanGrade: "9단계",
    koreanTag: "수묵 먹빛 · 오피스타워",
    bg: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)",
    borderColor: "#475569",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#cbd5e1",
    taglineColor: "#f8fafc",
    patternType: "neunghwapan",
  },
  "korean-k10": {
    id: "korean-k10",
    koreanGrade: "10단계",
    koreanTag: "백두 송림 · 문화의숲",
    bg: "linear-gradient(135deg, #052e16 0%, #166534 50%, #15803d 100%)",
    borderColor: "#15803d",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#bbf7d0",
    taglineColor: "#f0fdf4",
    patternType: "dangcho",
  },
  "course-situational-korean": {
    id: "course-situational-korean",
    koreanGrade: "실전 회화",
    koreanTag: "심야 사파이어 · 19대 실전 상황",
    bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)",
    borderColor: "#3730a3",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#c7d2fe",
    taglineColor: "#f8fafc",
    patternType: "hanbok-silk",
  },
  "standards": {
    id: "standards",
    koreanGrade: "어문 규범",
    koreanTag: "국립국어원 공식 어문 규범",
    bg: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)",
    borderColor: "#4338ca",
    badgeBg: "rgba(255, 255, 255, 0.2)",
    badgeText: "#ffffff",
    titleColor: "#ffffff",
    subColor: "#c7d2fe",
    taglineColor: "#f8fafc",
    patternType: "hunminjeongeum",
  },
};

export function getKoreanCourseTheme(idOrGrade: string): KoreanCourseTheme | undefined {
  if (KOREAN_COURSE_THEMES[idOrGrade]) return KOREAN_COURSE_THEMES[idOrGrade];
  const lower = idOrGrade.toLowerCase();
  for (const [key, theme] of Object.entries(KOREAN_COURSE_THEMES)) {
    if (lower.includes(key) || key.includes(lower)) return theme;
  }
  const match = lower.match(/k(\d+)/);
  if (match) {
    const kKey = `korean-k${match[1]}`;
    if (KOREAN_COURSE_THEMES[kKey]) return KOREAN_COURSE_THEMES[kKey];
  }
  return undefined;
}
