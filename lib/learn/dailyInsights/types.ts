export type InsightCategory =
  | "wealth"   // 재산 증식
  | "saving"   // 비용 절약
  | "career"   // 경력 및 구직
  | "health"   // 건강 및 웰니스
  | "travel"   // 여행 및 이동
  | "problem"  // 생활 문제 해결
  | "shopping" // 쇼핑·소비
  | "energy";  // 에너지 절약

export interface DailyInsight {
  id: string;
  category: InsightCategory;
  categoryLabelKo?: string;
  categoryLabel?: string;
  categoryIcon?: string;
  title: string;
  summary: string;
  principle: string;
  example: string;
  actionItem: string;
  relatedServiceOrWorld?: string;
  relatedHref?: string;
  dayOfYear?: number;     // 1 ~ 366 (윤년 기준 366일 인덱스)
  month?: number;         // 1 ~ 12
  day?: number;           // 1 ~ 31
  publishedDate?: string; // 게시 또는 최신 갱신 일자 (YYYY-MM-DD)
  lastVerified?: string;  // 사실 및 규정 최신 검증 일자 (YYYY-MM-DD)
  isLatest?: boolean;     // 최신 검증 여부
  expiresAt?: string;     // 정책/규정 변경 시 만료 일자 (YYYY-MM-DD)
}

export type DomainType = "math" | "english" | "korean" | "life" | "physics" | "chemistry";
